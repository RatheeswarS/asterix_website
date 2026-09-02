import { Router } from 'express';
import TeamMember from '../models/TeamMember.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/members (Public - List all team members or filter by subsystemId)
router.get('/', async (req, res) => {
    try {
        const query = req.query.subsystemId ? { subsystemId: req.query.subsystemId } : {};
        const members = await TeamMember.find(query).sort({ order: 1, createdAt: 1 }).lean();
        res.json(members);
    } catch (err) {
        console.error('Error fetching team members:', err);
        res.status(500).json({ error: 'Failed to fetch team members', details: err.message });
    }
});

// POST /api/members (Protected - Create new team member)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { subsystemId, name, role, initials, badge, status, bio, photo, photoFit, photoPosition, order } = req.body;
        if (!name || !subsystemId) {
            return res.status(400).json({ error: 'Name and subsystemId are required.' });
        }

        const id = req.body.id || `mem-${Date.now()}`;
        const newMember = await TeamMember.create({
            id,
            subsystemId,
            name,
            role: role || '',
            initials: initials || (name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'TM'),
            badge: badge || 'SPECIALIST',
            status: status || 'Active Member',
            bio: bio || '',
            photo: photo || '',
            photoFit: photoFit || 'cover',
            photoPosition: photoPosition || '50% 50%',
            order: order !== undefined ? order : 0
        });

        res.status(201).json(newMember);
    } catch (err) {
        console.error('Error creating team member:', err);
        res.status(500).json({ error: 'Failed to create team member', details: err.message });
    }
});

// PUT /api/members/:id (Protected - Update team member)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const updated = await TeamMember.findOneAndUpdate(
            { id: req.params.id },
            { $set: req.body },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ error: 'Team member not found.' });
        }
        res.json(updated);
    } catch (err) {
        console.error('Error updating team member:', err);
        res.status(500).json({ error: 'Failed to update team member', details: err.message });
    }
});

// DELETE /api/members/:id (Protected - Delete team member)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deleted = await TeamMember.findOneAndDelete({ id: req.params.id });
        if (!deleted) {
            return res.status(404).json({ error: 'Team member not found.' });
        }
        res.json({ success: true, message: 'Team member deleted successfully.' });
    } catch (err) {
        console.error('Error deleting team member:', err);
        res.status(500).json({ error: 'Failed to delete team member', details: err.message });
    }
});

export default router;
