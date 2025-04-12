import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config(); // Load .env variables

export const prisma = new PrismaClient();

if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
}
export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
export const generativeModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro-002" }); // Or other suitable model