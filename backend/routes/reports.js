const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /api/reports/daily
 * Returns daily aggregated data for the current month
 */
router.get('/daily', (req, res) => {
    try {
        const { year, month } = req.query;
        const currentDate = new Date();
        const targetYear = year || currentDate.getFullYear();
        const targetMonth = month || (currentDate.getMonth() + 1);

        // Get daily membership registrations
        const membershipData = db.prepare(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count,
                SUM(payment) as total_payment
            FROM memberships
            WHERE strftime('%Y', created_at) = ? 
            AND strftime('%m', created_at) = ?
            GROUP BY DATE(created_at)
            ORDER BY date
        `).all(targetYear.toString(), targetMonth.toString().padStart(2, '0'));

        // Get daily customer registrations
        const customerData = db.prepare(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM customers
            WHERE strftime('%Y', created_at) = ? 
            AND strftime('%m', created_at) = ?
            GROUP BY DATE(created_at)
            ORDER BY date
        `).all(targetYear.toString(), targetMonth.toString().padStart(2, '0'));

        // Get daily service revenue
        const serviceData = db.prepare(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count,
                SUM(price) as total_payment
            FROM services
            WHERE strftime('%Y', created_at) = ? 
            AND strftime('%m', created_at) = ?
            GROUP BY DATE(created_at)
            ORDER BY date
        `).all(targetYear.toString(), targetMonth.toString().padStart(2, '0'));

        // Get total statistics for the month
        const totals = db.prepare(`
            SELECT 
                (SELECT COUNT(*) FROM memberships 
                 WHERE strftime('%Y', created_at) = ? 
                 AND strftime('%m', created_at) = ?) as total_memberships,
                (SELECT COUNT(*) FROM customers 
                 WHERE strftime('%Y', created_at) = ? 
                 AND strftime('%m', created_at) = ?) as total_customers,
                (SELECT COALESCE(SUM(payment), 0) FROM memberships 
                 WHERE strftime('%Y', created_at) = ? 
                 AND strftime('%m', created_at) = ?) +
                (SELECT COALESCE(SUM(price), 0) FROM services 
                 WHERE strftime('%Y', created_at) = ? 
                 AND strftime('%m', created_at) = ?) as total_revenue
        `).get(
            targetYear.toString(), targetMonth.toString().padStart(2, '0'),
            targetYear.toString(), targetMonth.toString().padStart(2, '0'),
            targetYear.toString(), targetMonth.toString().padStart(2, '0'),
            targetYear.toString(), targetMonth.toString().padStart(2, '0')
        );

        res.json({
            success: true,
            period: 'daily',
            year: targetYear,
            month: targetMonth,
            data: {
                memberships: membershipData,
                customers: customerData,
                services: serviceData,
                totals: totals
            }
        });
    } catch (error) {
        console.error('Error fetching daily reports:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/reports/monthly
 * Returns monthly aggregated data for the current year
 */
router.get('/monthly', (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = year || new Date().getFullYear();

        // Get monthly membership registrations
        const membershipData = db.prepare(`
            SELECT 
                strftime('%m', created_at) as month,
                COUNT(*) as count,
                SUM(payment) as total_payment
            FROM memberships
            WHERE strftime('%Y', created_at) = ?
            GROUP BY strftime('%m', created_at)
            ORDER BY month
        `).all(targetYear.toString());

        // Get monthly customer registrations
        const customerData = db.prepare(`
            SELECT 
                strftime('%m', created_at) as month,
                COUNT(*) as count
            FROM customers
            WHERE strftime('%Y', created_at) = ?
            GROUP BY strftime('%m', created_at)
            ORDER BY month
        `).all(targetYear.toString());

        // Get monthly service revenue
        const serviceData = db.prepare(`
            SELECT 
                strftime('%m', created_at) as month,
                COUNT(*) as count,
                SUM(price) as total_payment
            FROM services
            WHERE strftime('%Y', created_at) = ?
            GROUP BY strftime('%m', created_at)
            ORDER BY month
        `).all(targetYear.toString());

        // Get total statistics for the year
        const totals = db.prepare(`
            SELECT 
                (SELECT COUNT(*) FROM memberships 
                 WHERE strftime('%Y', created_at) = ?) as total_memberships,
                (SELECT COUNT(*) FROM customers 
                 WHERE strftime('%Y', created_at) = ?) as total_customers,
                (SELECT COALESCE(SUM(payment), 0) FROM memberships 
                 WHERE strftime('%Y', created_at) = ?) +
                (SELECT COALESCE(SUM(price), 0) FROM services 
                 WHERE strftime('%Y', created_at) = ?) as total_revenue
        `).get(targetYear.toString(), targetYear.toString(), targetYear.toString(), targetYear.toString());

        res.json({
            success: true,
            period: 'monthly',
            year: targetYear,
            data: {
                memberships: membershipData,
                customers: customerData,
                services: serviceData,
                totals: totals
            }
        });
    } catch (error) {
        console.error('Error fetching monthly reports:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/reports/yearly
 * Returns yearly aggregated data for all available years
 */
router.get('/yearly', (req, res) => {
    try {
        // Get yearly membership registrations
        const membershipData = db.prepare(`
            SELECT 
                strftime('%Y', created_at) as year,
                COUNT(*) as count,
                SUM(payment) as total_payment
            FROM memberships
            GROUP BY strftime('%Y', created_at)
            ORDER BY year
        `).all();

        // Get yearly customer registrations
        const customerData = db.prepare(`
            SELECT 
                strftime('%Y', created_at) as year,
                COUNT(*) as count
            FROM customers
            GROUP BY strftime('%Y', created_at)
            ORDER BY year
        `).all();

        // Get yearly service revenue
        const serviceData = db.prepare(`
            SELECT 
                strftime('%Y', created_at) as year,
                COUNT(*) as count,
                SUM(price) as total_payment
            FROM services
            GROUP BY strftime('%Y', created_at)
            ORDER BY year
        `).all();

        // Get overall totals
        const totals = db.prepare(`
            SELECT 
                (SELECT COUNT(*) FROM memberships) as total_memberships,
                (SELECT COUNT(*) FROM customers) as total_customers,
                (SELECT COALESCE(SUM(payment), 0) FROM memberships) +
                (SELECT COALESCE(SUM(price), 0) FROM services) as total_revenue
        `).get();

        res.json({
            success: true,
            period: 'yearly',
            data: {
                memberships: membershipData,
                customers: customerData,
                services: serviceData,
                totals: totals
            }
        });
    } catch (error) {
        console.error('Error fetching yearly reports:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
