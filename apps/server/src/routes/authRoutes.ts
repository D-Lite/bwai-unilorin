import express from 'express';
import { prisma } from '../lib/clients';
import { hashPassword, comparePassword, generateToken } from '../services/auth.service';

const router = express.Router();

router.post('/signup', async (req, res) => {
    const { email, password, groupName } = req.body;

    if (!email || !password || !groupName) {
        res.status(400).json({ error: 'Email, password and initial group name are required' });
        return;
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            res.status(409).json({ error: 'User already exists' });
            return;
        }


        const passwordHash = await hashPassword(password);
        const newUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: { email, passwordHash },
            });

            const group = await tx.studyGroup.create({
                data: { name: groupName },
            });

            await tx.membership.create({
                data: {
                    userId: user.id,
                    groupId: group.id,
                    role: 'OWNER', // First user is the owner
                },
            });
            return user;
        });


        const token = generateToken(newUser.id);
        res.status(201).json({ token, user: { id: newUser.id, email: newUser.email
        } });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                memberships: { // Include memberships to potentially send group info later
                    select: {
                        group: { select: { id: true, name: true } }
                    }
                }
            }
        });

        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const isValid = await comparePassword(password, user.passwordHash);
        if (!isValid) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const token = generateToken(user.id);
        const groups = user.memberships.map(m => m.group);

        res.json({ token, user: { id: user.id, email: user.email }, groups });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

export default router;