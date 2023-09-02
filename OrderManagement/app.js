const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const pool = require('./db');

// Middleware
app.use(bodyParser.json());

// Routes
app.get('/orders', async (req, res) => {
  try {
    const pool = await pool.connect();
    const result = await pool.query('SELECT * FROM Orders');
    console.log(result.recordset);
    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Add more routes for creating, updating, and deleting orders as needed.

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});