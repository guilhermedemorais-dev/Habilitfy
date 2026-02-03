// Test MySQL connection and identify errors
// Run with: node test-db.cjs

const mysql = require('mysql2/promise');

async function testConnection() {
    console.log('🔍 Testing MySQL connection...\n');

    // Read from environment or use defaults
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'u540864618_guimp',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'u540864618_hbltfy',
    };

    console.log('📋 Connection config:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   Password: ${config.password ? '***SET***' : '***EMPTY***'}`);
    console.log('');

    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Connected to MySQL successfully!\n');

        // Test a simple query
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Query executed successfully:', rows);

        // Try to list tables
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('\n📋 Tables in database:');
        tables.forEach(t => console.log('   -', Object.values(t)[0]));

        await connection.end();
        console.log('\n✅ Connection closed successfully');

    } catch (error) {
        console.error('❌ Connection failed!');
        console.error('\n📋 Error details:');
        console.error('   Code:', error.code);
        console.error('   Message:', error.message);
        console.error('   Errno:', error.errno);

        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Fix: MySQL server is not running or not accepting connections on this host/port');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Fix: Wrong username or password');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('\n💡 Fix: Database does not exist');
        } else if (error.code === 'ENOTFOUND') {
            console.error('\n💡 Fix: Host not found - check DB_HOST');
        }
    }
}

testConnection();
