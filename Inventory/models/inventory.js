import mysql from "mysql";

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  port: 3306, // Default MySQL port is 3306
  password: "",
  connectionLimit: 10000,
});

connection.connect((error) => {
  if (!!error) {
    console.log(error);
  } else {
    console.log("MySQL Server Connected Successfully..!!");
    createDatabase();
  }
});

function createDatabase() {
  // Create the 'inventory' database if it doesn't exist
  connection.query("CREATE DATABASE IF NOT EXISTS inventory", (error) => {
    if (error) {
      console.log("Error creating database:", error);
      connection.end(); // Close the connection if there's an error
    } else {
      console.log("Database 'inventory' created successfully.");
      useDatabase();
    }
  });
}

function useDatabase() {
  // Use the 'inventory' database
  connection.query("USE inventory", (error) => {
    if (error) {
      console.log("Error selecting database:", error);
      connection.end(); // Close the connection if there's an error
    } else {
      console.log("Using database 'inventory'.");
      createTable();
    }
  });
}

function createTable() {
  // Create the 'products' table if it doesn't exist
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_name VARCHAR(255) NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      supplier VARCHAR(255) NOT NULL,
      added_date DATE NOT NULL
    )
  `;

  connection.query(createTableQuery, (error) => {
    if (error) {
      console.log("Error creating table:", error);
    } else {
      console.log("Table 'products' created successfully.");
    }
  });
}

export default connection;
