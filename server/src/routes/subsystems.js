import { Router } from 'express';
import Subsystem from '../models/Subsystem.js';
import TeamMember from '../models/TeamMember.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/subsystems (Public - List all subsystems with their team members)
router.get('/', async (req, res) => {
    try {
        const subsystems = await Subsystem.find().sort({ order: 1 }).lean();
        const allMembers = await TeamMember.find().sort({ order: 1, createdAt: 1 }).lean();

        const result = subsystems.map(sub => ({
            ...sub,
            teamMembers: allMembers.filter(m => m.subsystemId === sub.id)
        }));

        res.json(result);
    } catch (err) {
        console.error('Error fetching subsystems:', err);
        res.status(500).json({ error: 'Failed to fetch subsystems', details: err.message });
    }
});

// PUT /api/subsystems/:id (Protected - Update subsystem details)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const updated = await Subsystem.findOneAndUpdate(
            { id: req.params.id },
            { $set: req.body },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ error: 'Subsystem not found.' });
        }
        res.json(updated);
    } catch (err) {
        console.error('Error updating subsystem:', err);
        res.status(500).json({ error: 'Failed to update subsystem', details: err.message });
    }
});

export default router;
