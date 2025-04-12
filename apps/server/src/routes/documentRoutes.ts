import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { prisma, generativeModel, embeddingModel } from '../lib/clients';
import { authenticateToken } from '../middleware/authMiddleware';
import { processDocument } from '../services/documentProcessor';

const router = express.Router();

// --- Multer Setup ---
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads'); // Store uploads outside src

// Ensure upload directory exists
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        // Store in a subfolder per group for organization
        const groupId = req.params.groupId;
        const groupUploadDir = path.join(UPLOAD_DIR, groupId);
        try {
            await fs.mkdir(groupUploadDir, { recursive: true });
            cb(null, groupUploadDir);
        } catch (err: any) {
            cb(err, groupUploadDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4();
        const extension = path.extname(file.originalname);
        cb(null, `${path.basename(file.originalname, extension)}-${uniqueSuffix}${extension}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // Limit file size (e.g., 20MB)
    fileFilter: (req, file, cb) => {
        // Accept only specific file types
        const allowedTypes = /pdf|txt/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error(`File upload only supports the following filetypes - ${allowedTypes}`));
    }
});


const checkGroupMembership = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = req.user?.id;
    const groupId = req.params.groupId;

    if (!userId || !groupId) {
        res.sendStatus(400);
        return;
    }

    try {
        const membership = await prisma.membership.findUnique({
            where: { userId_groupId: { userId, groupId } }
        });
        if (!membership) {
            res.status(403).json({ message: "User is not a member of this group" });
            return;
        }
        next(); // User is a member, proceed
    } catch (error) {
        console.error("Membership check error:", error);
        res.status(500).json({ message: "Error checking group membership" });
    }
};
// --- Upload Document ---
router.post(
    '/groups/:groupId/documents',
    authenticateToken,
    checkGroupMembership, // Ensure user is part of the group they're uploading to
    upload.single('document'), // 'document' is the field name in the form data
    async (req, res) => {
        const userId = req.user?.id;
        const groupId = req.params.groupId;

        if (!req.file || !userId || !groupId) {
            res.status(400).json({ message: 'File and authentication required.' });
            return;
        }

        try {
            const relativePath = path.relative(path.resolve(__dirname, '../..'), req.file.path);

            const document = await prisma.document.create({
                data: {
                    filename: req.file.originalname,
                    filepath: relativePath, // Store relative path
                    mimetype: req.file.mimetype,
                    groupId: groupId,
                    uploaderId: userId,
                }
            });

            // Trigger processing asynchronously (fire-and-forget for demo)
            // In production, use a proper job queue (BullMQ, etc.)
            processDocument(document.id, req.file.path, document.mimetype).catch(err => {
                console.error(`Background processing failed for doc ${document.id}:`, err);
                // Optionally update document status to 'failed' here
            });

            res.status(201).json({
                message: 'File uploaded successfully, processing started.',
                documentId: document.id,
                filename: document.filename
            });

        } catch (error) {
            console.error("File Upload Error:", error);
            // Clean up uploaded file if DB insert fails?
            try { await fs.unlink(req.file.path); } catch (e) { console.error("Error deleting failed upload:", e) }
            res.status(500).json({ message: 'Error saving document metadata' });
        }
    }
);

// --- Get Documents for a Group ---
router.get('/groups/:groupId/documents', authenticateToken, checkGroupMembership, async (req, res) => {
    const groupId = req.params.groupId;
    try {
        const documents = await prisma.document.findMany({
            where: { groupId: groupId },
            select: { id: true, filename: true, createdAt: true, mimetype: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ message: "Error fetching documents" });
    }
});


// --- Ask Question within a Group ---
router.post('/groups/:groupId/ask', authenticateToken, checkGroupMembership, async (req, res) => {
    const groupId = req.params.groupId;
    const { question } = req.body;
    const userId = req.user?.id;

    if (!question) {
        res.status(400).json({ message: 'Question is required' });
        return;
    }

    try {
        // 1. Embed the question
        const embeddingResult = await embeddingModel.embedContent(question);
        const questionEmbedding = embeddingResult.embedding.values;
        if (!questionEmbedding) {
            res.status(500).json({ message: 'Could not embed question' });
            return;
        }
        const questionVectorString = `[${questionEmbedding.join(',')}]`;

        // 2. Find relevant chunks using vector search (adjust k as needed)
        const k = 5; // Number of chunks to retrieve
        // IMPORTANT: Ensure you created the vector index manually in postgres!
        // e.g., CREATE INDEX ON "DocChunk" USING HNSW (embedding vector_cosine_ops);
        const relevantChunks = await prisma.$queryRaw<Array<{ text: string }>>`
            SELECT dc.text
            FROM "DocChunk" dc
            JOIN "Document" d ON dc."documentId" = d.id
            WHERE d."groupId" = ${groupId} -- Filter by the correct group!
            -- Cast the input string to vector, WITHOUT specifying dimension here
            ORDER BY dc.embedding <=> ${questionVectorString}::vector
            LIMIT ${k};
        `;
        // If using L2 distance (vector_l2_ops index): ORDER BY dc.embedding <-> ${questionVectorString}::vector(...)
        // If using Inner Product (vector_ip_ops index): ORDER BY dc.embedding <#> ${questionVectorString}::vector(...) DESC (note DESC)


        if (!relevantChunks || relevantChunks.length === 0) {
            res.json({ answer: "Sorry, I couldn't find any relevant information in the uploaded documents for this group." });
            return;
        }

        // 3. Construct the prompt for the generative model
        const context = relevantChunks.map(c => c.text).join('\n---\n'); // Join chunks with separator
        const prompt = `Based *only* on the following context extracted from uploaded documents, answer the user's question. If the context doesn't contain the answer, state that clearly. Do not use any prior knowledge. Context: ${context} Question: ${question} Answer:`;

        // 4. Call Gemini to generate the answer
        const result = await generativeModel.generateContent(prompt);
        const response = result.response;
        const answer = response.text();

        res.json({ answer });

    } catch (error: any) {
        console.error("Q&A Error:", error);
        if (error.message?.includes('vector')) {
            res.status(500).json({ message: `Q&A Error: Vector search failed. Did you create the vector index in PostgreSQL? (e.g., CREATE INDEX ON "DocChunk" USING HNSW (embedding vector_cosine_ops);) Details: ${error.message}` });
        } else {
            res.status(500).json({ message: `Error processing question: ${error.message}` });
        }
    }
});


export default router;