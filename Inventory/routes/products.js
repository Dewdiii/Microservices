import express from "express";
const router = express.Router();
import connection from "../models/inventory.js";
import e from "method-override";

// Display all products
router.get("/", (req, res, next) => {
  connection.query("SELECT * FROM products ORDER BY id DESC", (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      console.log("Products fetched successfully!");
      res.json(rows);
    }
  });
});

// Add a new product or update quantity if name and price match
router.post("/add", (req, res, next) => {
  const product_name = req.body.product_name;
  const quantity = req.body.quantity;
  const price = req.body.price;
  const supplier = req.body.supplier;

  // Validate the request data
  if (!product_name || !quantity || !price || !supplier) {
    res.status(400).json({ error: "Bad Request" });
    return;
  }

  // Construct the form data, including the added_date
  const form_data = {
    product_name: product_name,
    quantity: quantity,
    price: price,
    supplier: supplier,
    added_date: new Date(), // Set the current date and time
  };

  // Check if a product with the same name and price already exists
  connection.query(
    "SELECT * FROM products WHERE product_name = ? AND price = ?",
    [product_name, price],
    (err, rows) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        if (rows.length > 0) {
          // A product with the same name and price already exists
          // Add quantity to the existing product
          const existingProduct = rows[0];
          const newQuantity = existingProduct.quantity + quantity;

          // Update the quantity of the existing product
          connection.query(
            "UPDATE products SET quantity = ?, added_date = ? WHERE product_name = ? AND price = ?",
            [newQuantity, form_data.added_date, product_name, price],
            (updateErr, updateResult) => {
              if (updateErr) {
                console.error(updateErr);
                res.status(500).json({ error: "Internal Server Error" });
              } else {
                console.log("Quantity updated for existing product!");
                res.status(200).json({
                  message: "Quantity updated for existing product",
                });
              }
            }
          );
        } else {
          // Insert query for a new product
          connection.query(
            "INSERT INTO products SET ?",
            form_data,
            (insertErr, result) => {
              if (insertErr) {
                console.error(insertErr);
                res.status(500).json({ error: "Internal Server Error" });
              } else {
                console.log("Product Added successfully!");
                res
                  .status(201)
                  .json({
                    message: "Product added successfully",
                    product: form_data,
                  });
              }
            }
          );
        }
      }
    }
  );
});

// Update product data, keeping existing data if not sent
router.put("/update/:id", (req, res, next) => {
  const id = req.params.id;
  const product_name = req.body.product_name;
  const quantity = req.body.quantity;
  const price = req.body.price;
  const supplier = req.body.supplier;

  // Fetch the existing data from the database
  connection.query(
    "SELECT * FROM products WHERE id = ?",
    [id],
    (selectErr, rows) => {
      if (selectErr) {
        console.error(selectErr);
        res.status(500).json({ error: "Internal Server Error" });
      } else if (rows.length === 0) {
        res.status(404).json({ error: "Product not found" });
      } else {
        const existingData = rows[0];

        // Construct the form data with existing data as defaults
        const form_data = {
          product_name: product_name || existingData.product_name,
          quantity: quantity || existingData.quantity,
          price: price || existingData.price,
          supplier: supplier || existingData.supplier,
          added_date: existingData.added_date, // Keep the existing added_date
        };

        // Update query
        connection.query(
          "UPDATE products SET ? WHERE id = ?",
          [form_data, id],
          (updateErr, result) => {
            if (updateErr) {
              console.error(updateErr);
              res.status(500).json({ error: "Internal Server Error" });
            } else {
              // Send a JSON response indicating success
              res
                .status(200)
                .json({
                  message: "Product updated successfully",
                  updatedData: form_data,
                });
            }
          }
        );
      }
    }
  );
});

// Delete product if it exists
router.delete("/delete/:id", (req, res, next) => {
  const id = req.params.id;

  // Check if the product with the specified ID exists
  connection.query(
    "SELECT * FROM products WHERE id = ?",
    [id],
    (selectErr, rows) => {
      if (selectErr) {
        console.error(selectErr);
        res.status(500).json({ error: "Internal Server Error" });
      } else if (rows.length === 0) {
        res.status(404).json({ error: "Product not found" });
      } else {
        // Product with the specified ID exists, proceed with deletion
        connection.query(
          "DELETE FROM products WHERE id = ?",
          [id],
          (deleteErr, result) => {
            if (deleteErr) {
              console.error(deleteErr);
              res.status(500).json({ error: "Internal Server Error" });
            } else {
              console.log("Product deleted successfully");
              res.status(200).json({ message: "Product deleted successfully" });
            }
          }
        );
      }
    }
  );
});

router.post("/add-order", async (req, res) => {
  const { productId, quantity } = req.query;

  connection.query(
    "SELECT * FROM products WHERE id = ?",
    [productId],
    (selectErr, rows) => {
      if (selectErr) {
        console.error(selectErr);
        return res.status(500).json({ error: "Internal Server Error" });
      } else if (rows.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      } else {
        const existingData = rows[0];
        const newQuantity = existingData.quantity - quantity;

        if (newQuantity < 0) {
          return res
            .status(400)
            .send({ error: "Insufficient quantity available" });
        }

        const form_data = {
          product_name: existingData.product_name,
          quantity: newQuantity,
          price: existingData.price,
          supplier: existingData.supplier,
          added_date: existingData.added_date,
        };

        // Update the product in the database
        connection.query(
          "UPDATE products SET ? WHERE id = ?",
          [form_data, productId],
          (updateErr, result) => {
            if (updateErr) {
              console.error(updateErr);
              return res.status(500).json({ error: "Internal Server Error" });
            } else {
              // Calculate the amount
              res.json({ existingData: existingData });
            }
          }
        );
      }
    }
  );
});

router.post("/update-order", async (req, res) => {
  const { productId, data, exData } = req.query;
  const newData = JSON.parse(data);
  const existingData = JSON.parse(exData);

  connection.query(
    "SELECT * FROM products WHERE id = ?",
    [productId],
    async (selectErr, rows) => {
      if (selectErr) {
        console.error(selectErr);
        return res.status(500).json({ error: "Internal Server Error" });
      } else if (rows.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      } else {
        const existingProductData = rows[0];
        const existingProductQuantity = existingProductData.quantity;

        // Calculate the difference between the new quantity and the old quantity
        const checkQuantity =
          existingProductQuantity + existingData.quantity - newData.quantity;

        // Check if the new quantity is valid based on product availability
        if (checkQuantity < 0) {
          return res
            .status(400)
            .json({ error: "Insufficient quantity available" });
        }

        // Update the product quantity in the database
        const updatedProductQuantity =
          existingProductQuantity + existingData.quantity - newData.quantity;

        // Calculate the fullAmount based on the new quantity and unit price
        newData.fullAmount = existingData.unitPrice * newData.quantity;

        connection.query(
          "UPDATE products SET quantity = ? WHERE id = ?",
          [updatedProductQuantity, productId],
          (updateErr, result) => {
            if (updateErr) {
              console.error(updateErr);
              return res.status(500).json({ error: "Internal Server Error" });
            } else {
              // Merge the existing data with the new data
              const updatedData = { ...existingData, ...newData };
              res.json({ updatedData: updatedData });
            }
          }
        );
      }
    }
  );
});

router.post("/delete-order", async (req, res) => {
  const { productId, quantityToAdd } = req.query;
  connection.query(
    "UPDATE products SET quantity = quantity + ? WHERE id = ?",
    [quantityToAdd, productId],
    (updateErr, result) => {
      if (updateErr) {
        console.error(updateErr);
        return res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.json({ status: "true" });
      }
    }
  );
});

export default router;
