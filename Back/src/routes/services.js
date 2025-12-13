import express from 'express';
import { Service } from '../models/Service.js';
import { ServiceRecord } from '../models/ServiceRecord.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/services - list services for user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const services = await Service.findAll({ where: { user_id: req.user.id }, order: [['name', 'ASC']] });
        res.json(services);
    } catch (err) {
        console.error('Error fetching services', err);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// POST /api/services - create service
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Missing name' });
        const svc = await Service.create({ name: name.toString().trim(), user_id: req.user.id });
        res.status(201).json(svc);
    } catch (err) {
        console.error('Error creating service', err);
        res.status(500).json({ error: 'Failed to create service' });
    }
});

// PUT /api/services/:id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const svc = await Service.findByPk(req.params.id);
        if (!svc || svc.user_id !== req.user.id) return res.status(404).json({ error: 'Service not found' });
        const { name } = req.body;
        if (name) svc.name = name.toString().trim();
        await svc.save();
        res.json(svc);
    } catch (err) {
        console.error('Error updating service', err);
        res.status(500).json({ error: 'Failed to update service' });
    }
});

// DELETE /api/services/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const svc = await Service.findByPk(req.params.id);
        if (!svc || svc.user_id !== req.user.id) return res.status(404).json({ error: 'Service not found' });
        await svc.destroy();
        res.json({ message: 'Service deleted' });
    } catch (err) {
        console.error('Error deleting service', err);
        res.status(500).json({ error: 'Failed to delete service' });
    }
});

// ---- Records ----

// GET /api/services/records?year=2025&month=1
router.get('/records', authMiddleware, async (req, res) => {
    try {
        const year = req.query.year ? parseInt(req.query.year, 10) : null;
        const month = req.query.month ? parseInt(req.query.month, 10) : null;
        const where = { user_id: req.user.id };
        if (year) where.year = year;
        if (month) where.month = month;
        const records = await ServiceRecord.findAll({ where, order: [['year', 'ASC'], ['month', 'ASC']] });
        res.json(records);
    } catch (err) {
        console.error('Error fetching service records', err);
        res.status(500).json({ error: 'Failed to fetch service records' });
    }
});

// POST /api/services/records
router.post('/records', authMiddleware, async (req, res) => {
    try {
        const { service_id, year, month, amount } = req.body;
        if (!service_id || !year || !month || amount === undefined) return res.status(400).json({ error: 'Missing fields' });
        // TODO: validate service belongs to user
        const rec = await ServiceRecord.create({ service_id, year: parseInt(year, 10), month: parseInt(month, 10), amount, user_id: req.user.id });
        res.status(201).json(rec);
    } catch (err) {
        console.error('Error creating service record', err);
        res.status(500).json({ error: 'Failed to create service record' });
    }
});

// PUT /api/services/records/:id
router.put('/records/:id', authMiddleware, async (req, res) => {
    try {
        const rec = await ServiceRecord.findByPk(req.params.id);
        if (!rec || rec.user_id !== req.user.id) return res.status(404).json({ error: 'Record not found' });
        const { service_id, year, month, amount } = req.body;
        if (service_id) rec.service_id = service_id;
        if (year) rec.year = parseInt(year, 10);
        if (month) rec.month = parseInt(month, 10);
        if (amount !== undefined) rec.amount = amount;
        await rec.save();
        res.json(rec);
    } catch (err) {
        console.error('Error updating service record', err);
        res.status(500).json({ error: 'Failed to update service record' });
    }
});

// DELETE /api/services/records/:id
router.delete('/records/:id', authMiddleware, async (req, res) => {
    try {
        const rec = await ServiceRecord.findByPk(req.params.id);
        if (!rec || rec.user_id !== req.user.id) return res.status(404).json({ error: 'Record not found' });
        await rec.destroy();
        res.json({ message: 'Record deleted' });
    } catch (err) {
        console.error('Error deleting service record', err);
        res.status(500).json({ error: 'Failed to delete service record' });
    }
});

export default router;
