const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/settings - Get all settings
router.get('/', (req, res) => {
    try {
        const settings = db.prepare('SELECT * FROM settings').all();
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        res.json({
            success: true,
            data: settingsMap
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/settings - Update a setting
router.post('/', (req, res) => {
    try {
        const { key, value } = req.body;

        if (!key) {
            return res.status(400).json({
                success: false,
                error: 'Key is required'
            });
        }

        const result = db.prepare(`
            INSERT INTO settings (key, value, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET 
            value = excluded.value, 
            updated_at = CURRENT_TIMESTAMP
        `).run(key, value);

        res.json({
            success: true,
            message: 'Setting updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
