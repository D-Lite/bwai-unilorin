import express, {  Request, Response } from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import groupRoutes from './routes/groupRoutes';
import documentRoutes from './routes/documentRoutes';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api', documentRoutes); // Mount document/Q&A routes at /api/groups/:groupId/...

// Basic health check
app.get('/', (req, res) => {
    res.send('StudySphere Backend is running!');
});

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
