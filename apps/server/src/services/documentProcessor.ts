import fs from 'fs/promises';
import path from 'path';
import { prisma, embeddingModel } from '../lib/clients';
import pdf from 'pdf-parse'; 
import { v4 as uuidv4 } from 'uuid';

const MAX_CHUNK_SIZE = 1000; // Characters per chunk (tune as needed)
const CHUNK_OVERLAP = 100; // Overlap between chunks (tune as needed)

async function getTextContent(filepath: string, mimetype: string): Promise<string> {
    if (mimetype === 'application/pdf') {
        try {
            const dataBuffer = await fs.readFile(filepath);
            const data = await pdf(dataBuffer);
            return data.text;
        } catch (error) {
            console.error(`Error parsing PDF ${filepath}:`, error);
            throw new Error("Failed to parse PDF");
        }
    } else if (mimetype === 'text/plain') {
        try {
            return await fs.readFile(filepath, 'utf-8');
        } catch (error) {
            console.error(`Error reading TXT ${filepath}:`, error);
            throw new Error("Failed to read text file");
        }
    } else {
        console.warn(`Unsupported mimetype for text extraction: ${mimetype}`);
        throw new Error(`Unsupported file type: ${mimetype}`);
    }
}

function chunkText(text: string): string[] {
    const chunks: string[] = [];
    let startIndex = 0;
    while (startIndex < text.length) {
        const endIndex = Math.min(startIndex + MAX_CHUNK_SIZE, text.length);
        chunks.push(text.substring(startIndex, endIndex));
        startIndex += MAX_CHUNK_SIZE - CHUNK_OVERLAP;
        if (startIndex >= text.length - CHUNK_OVERLAP && endIndex < text.length) {
             // Ensure last part is captured if overlap logic skips it
             chunks.push(text.substring(endIndex - CHUNK_OVERLAP));
             break;
        }
         if (startIndex >= endIndex) break; // Prevent infinite loop on tiny overlaps
    }
    // A simpler approach (less efficient for overlap):
    // const chunks = [];
    // for (let i = 0; i < text.length; i += MAX_CHUNK_SIZE) {
    //   chunks.push(text.substring(i, i + MAX_CHUNK_SIZE));
    // }
    return chunks.filter(chunk => chunk.trim().length > 0); // Remove empty chunks
}

export async function processDocument(documentId: string, filepath: string, mimetype: string): Promise<void> {
    console.log(`Processing document ${documentId} (${mimetype}) at ${filepath}`);
    try {
        const text = await getTextContent(filepath, mimetype);
        const chunks = chunkText(text);
        console.log(`Document ${documentId} split into ${chunks.length} chunks.`);

        for (let i = 0; i < chunks.length; i++) {
            const chunkText = chunks[i];
            try {
                // 1. Embed the chunk
                const embeddingResult = await embeddingModel.embedContent(chunkText);
                const embedding = embeddingResult.embedding;

                if (!embedding || !embedding.values) {
                     console.warn(`Could not generate embedding for chunk ${i} of doc ${documentId}`);
                     continue; // Skip this chunk
                }

                // 2. Store chunk text and metadata
                const chunkRecord = await prisma.docChunk.create({
                    data: {
                        // id: uuidv4(), // Prisma generates ID automatically
                        documentId: documentId,
                        chunkIndex: i,
                        text: chunkText,
                        // embedding field is managed via raw SQL update below
                    }
                });

                // 3. Store the vector using raw SQL
                const vectorString = `[${embedding.values.join(',')}]`;
                await prisma.$executeRawUnsafe(
                    `UPDATE "DocChunk" SET embedding = $1::vector(${embedding.values.length}) WHERE id = $2`,
                    vectorString,
                    chunkRecord.id
                );
                console.log(`Stored chunk ${i} for doc ${documentId}`);

            } catch (error) {
                console.error(`Error processing chunk ${i} for doc ${documentId}:`, error);
                // Decide if you want to stop processing or continue with next chunk
            }
        }
        console.log(`Finished processing document ${documentId}`);
    } catch (error) {
        console.error(`Failed to process document ${documentId}:`, error);
        // Optionally update document status in DB to 'failed'
    }
}