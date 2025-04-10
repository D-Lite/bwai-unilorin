import express, {  Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json())

if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in the environment variables');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Server is running' });
  });


  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
