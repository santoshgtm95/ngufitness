const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Create connection without database first
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    multipleStatements: true
});

connection.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL:', err.message);
        console.log('\n💡 If you have a MySQL root password, please update the .env file:');
        console.log('   DB_USER=root');
        console.log('   DB_PASSWORD=your_password_here');
        process.exit(1);
    }

    console.log('✅ Connected to MySQL');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    connection.query(schema, (err, results) => {
        if (err) {
            console.error('❌ Error creating database:', err.message);
            connection.end();
            process.exit(1);
        }

        console.log('✅ Database and tables created successfully!');
        console.log('\n🎉 Setup complete! You can now start the server with: npm start');

        connection.end();
    });
});
