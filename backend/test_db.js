const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'gym_membership.db');
const db = new Database(dbPath);

const targetYear = '2026';
const targetMonth = '03';

console.log('Testing membershipData query...');
try {
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
    console.log('membershipData success');
} catch (e) {
    console.error('membershipData failed:', e.message);
}

console.log('Testing detailsQuery...');
try {
    let detailsQuery = `
        SELECT 
            m.id, 
            m.created_at, 
            m.payment as amount, 
            m.package_type as item, 
            m.payment_status as status,
            'Membership' as type,
            c.name as customer_name
        FROM memberships m
        LEFT JOIN customers c ON m.customer_id = c.id
        WHERE strftime('%Y', m.created_at) = ?
        UNION ALL
        SELECT 
            s.id, 
            s.created_at, 
            s.price as amount, 
            s.service_name as item, 
            'paid' as status,
            'Service' as type,
            c.name as customer_name
        FROM services s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE strftime('%Y', s.created_at) = ?
        ORDER BY 2 DESC
    `;
    const details = db.prepare(detailsQuery).all(targetYear.toString(), targetYear.toString());
    console.log('detailsQuery success');
} catch (e) {
    console.error('detailsQuery failed:', e.message);
}
db.close();
