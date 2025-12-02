const http = require('http');

function request(options) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.on('error', reject);
        req.end();
    });
}

async function test() {
    try {
        console.log('Fetching customers...');
        const customersRes = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/customers',
            method: 'GET'
        });

        if (!customersRes.body.success) {
            console.error('Failed to fetch customers:', customersRes.body.error);
            return;
        }

        const customers = customersRes.body.data;
        const customerWithMembership = customers.find(c => c.membership);

        if (customerWithMembership) {
            console.log('Found customer with membership:', customerWithMembership.name);
            console.log('Membership details:', JSON.stringify(customerWithMembership.membership, null, 2));

            if (customerWithMembership.membership.payment !== undefined) {
                console.log('✅ Payment field is present:', customerWithMembership.membership.payment);
            } else {
                console.error('❌ Payment field is MISSING!');
            }
        } else {
            console.log('No customers with membership found to verify.');
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
