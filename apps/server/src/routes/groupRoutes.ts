import express from 'express';
import { prisma } from '../lib/clients';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// --- Get User's Groups ---
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        res.sendStatus(401);
        return;
    }

    try {
        const memberships = await prisma.membership.findMany({
            where: { userId: userId },
            include: {
                group: { select: { id: true, name: true } }
            }
        });
        const groups = memberships.map(m => m.group);
        res.json(groups);
    } catch (error) {
        console.error("Error fetching groups:", error);
        res.status(500).json({ message: "Error fetching groups" });
    }
});

 // --- Create New Group ---
 router.post('/', authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    const { name } = req.body;

    if (!userId) {
        res.sendStatus(401);
        return;
    }

    if (!name) {
        res.status(400).json({ message: 'Group name is required' });
        return;
    }

    try {

         const newGroup = await prisma.$transaction(async (tx) => {
            const group = await tx.studyGroup.create({ data: { name } });
            await tx.membership.create({
                data: { userId, groupId: group.id, role: 'OWNER' }, // Creator is owner
            });
            return group;
        });

        res.status(201).json(newGroup);
    } catch (error) {
        console.error("Error creating group:", error);
        res.status(500).json({ message: "Error creating group" });
    }
});

export default router;