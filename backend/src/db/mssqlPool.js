const sql = require('mssql');

const mssqlConfig = {
  server: '10.1.11.36',
  database: 'prod_fremed',
  user: 'sa',
  password: 'Fremed@2020',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 5,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  requestTimeout: 30000,
};

let pool = null;

async function getMssqlPool() {
  if (!pool) {
    pool = await sql.connect(mssqlConfig);
    console.log('✅ Connected to SQL Server (prod_fremed)');
  }
  return pool;
}

module.exports = { getMssqlPool, sql };
