const sql = require('mssql');

const config = {
  user: 'LAPTOP-758SIOHF\Anudhi',
  server: 'LAPTOP-758SIOHF',
  database: 'OrderDB',
  options: {
    trustedConnection: true, // Use Windows Authentication
  },
};

const pool = new sql.ConnectionPool(config);
pool
  .connect()
  .then(() => {
    console.log('Connected to the SQL Server database');
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err);
  });


module.exports = pool;
