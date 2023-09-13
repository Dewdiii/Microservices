import express from "express";
import {
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  setDoc,
} from "firebase/firestore"; // Import addDoc from Firestore

import orderCollection from "../config.js"; // Import Firestore functions accordingly
import userDB from "../models/user.js";
import connection from "../models/inventory.js";

const router = express.Router();

router.get("/all", async (req, res) => {
  try {
    // Use the getDocs function directly with the collection reference
    const querySnapshot = await getDocs(orderCollection);

    const data = [];
    querySnapshot.forEach((doc) => {
      // Extract the data from each document
      const documentData = doc.data();
      data.push(documentData);
    });

    res.send({ data });

    console.log("Orders data Fetched successfully!!");
  } catch (error) {
    console.error("Error retrieving documents: ", error);
    res
      .status(500)
      .send({ error: "An error occurred while retrieving documents" });
  }
});

router.post("/create", async (req, res) => {
  const email = req.body.email;
  const productId = req.body.productId;
  const quantity = req.body.quantity;

  try {
    const user = await userDB.findOne({ email });

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    if (quantity <= 0) {
      return res.status(400).send({ error: "Please provide a valid quantity" });
    }

    // Check if the product exists and retrieve its data
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
                const amount = existingData.price * quantity;

                // Find the next available orderId
                let orderId = 1; // Start with 1 and increment until a unique orderId is found
                (async () => {
                  while (true) {
                    const querySnapshot = await getDocs(
                      query(orderCollection, where("orderId", "==", orderId))
                    );
                    if (querySnapshot.empty) {
                      break;
                    }
                    orderId++;
                  }

                  const customerId = user._id.toString();

                  const orderData = {
                    customerName: user.name,
                    customerId: customerId,
                    productId,
                    productName: existingData.product_name,
                    quantity,
                    orderId,
                    orderNumber: orderId.toString(),
                    active: true,
                    unitPrice: existingData.price,
                    fullAmount: amount,
                    customerEmail: email,
                  };

                  // Add the order to the Firestore collection
                  addDoc(orderCollection, orderData)
                    .then(() => {
                      res
                        .status(200)
                        .json({ message: "Order added successfully" });
                      console.log("Order added successfully!!");
                    })
                    .catch((firestoreErr) => {
                      console.error("Error adding document: ", firestoreErr);
                      res.status(500).send({
                        error: "An error occurred while adding order",
                      });
                    });
                })();
              }
            }
          );
        }
      }
    );
  } catch (error) {
    console.error("Error adding document: ", error);
    res.status(500).send({ error: "An error occurred while adding order" });
  }
});

router.get("/read/:customerId", async (req, res) => {
  const _id = req.params.customerId;

  const user = await userDB.findOne({ _id });
  // Check if the user exists in the users collection
  if (!user) {
    responseSent = true;
    return res.status(404).send({ error: "User not found" });
  }

  try {
    // Query the Firestore collection to filter documents by customer ID
    const querySnapshot = await getDocs(
      query(orderCollection, where("customerName", "==", user.name.toString()))
    );

    const data = [];
    querySnapshot.forEach((doc) => {
      // Extract the data from each document
      const documentData = doc.data();
      data.push(documentData);
    });

    res.send({ data });
    console.log("Customer order fetched!");
  } catch (error) {
    console.error("Error retrieving documents: ", error);
    res
      .status(500)
      .send({ error: "An error occurred while retrieving documents" });
  }
});

router.put("/update/:orderNumber", async (req, res) => {
  const orderNumber = req.params.orderNumber;
  const newData = req.body;

  try {
    // Retrieve the document by orderNumber
    const querySnapshot = await getDocs(
      query(orderCollection, where("orderNumber", "==", orderNumber))
    );

    // Check if a document with the specified orderNumber exists
    if (!querySnapshot.empty) {
      // Get the first document (assuming orderNumber is unique)
      const docRef = querySnapshot.docs[0].ref;

      // Get the existing data from the order
      const existingData = (await getDoc(docRef)).data();

      // Get the product ID from the existing data
      const productId = existingData.productId;

      if (!newData.quantity) {
        newData.quantity = existingData.quantity;
      }

      // Query the database to get the product details
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
              existingProductQuantity +
              existingData.quantity -
              newData.quantity;

            // Check if the new quantity is valid based on product availability
            if (checkQuantity < 0) {
              return res
                .status(400)
                .send({ error: "Insufficient quantity available" });
            }

            // Update the product quantity in the database
            const updatedProductQuantity =
              existingProductQuantity +
              existingData.quantity -
              newData.quantity;

            // Calculate the fullAmount based on the new quantity and unit price
            newData.fullAmount = existingData.unitPrice * newData.quantity;

            connection.query(
              "UPDATE products SET quantity = ? WHERE id = ?",
              [updatedProductQuantity, productId],
              (updateErr, result) => {
                if (updateErr) {
                  console.error(updateErr);
                  return res
                    .status(500)
                    .json({ error: "Internal Server Error" });
                } else {
                  // Merge the existing data with the new data
                  const updatedData = { ...existingData, ...newData };

                  // Update the document with the merged data
                  setDoc(docRef, updatedData)
                    .then(() => {
                      res.send({ msg: "Order updated successfully" });
                      console.log("Order updated successfully");
                    })
                    .catch((firestoreErr) => {
                      console.error("Error updating document: ", firestoreErr);
                      res.status(500).send({
                        error: "An error occurred while updating the order",
                      });
                    });
                }
              }
            );
          }
        }
      );
    } else {
      res.status(404).send({ error: "Order not found" });
    }
  } catch (error) {
    console.error("Error updating order: ", error);
    res
      .status(500)
      .send({ error: "An error occurred while updating the order" });
  }
});

router.delete("/delete/:orderNumber", async (req, res) => {
  const orderNumber = req.params.orderNumber;

  try {
    // Retrieve the document by orderNumber
    const querySnapshot = await getDocs(
      query(orderCollection, where("orderNumber", "==", orderNumber))
    );

    // Check if a document with the specified orderNumber exists
    if (!querySnapshot.empty) {
      // Get the first document (assuming orderNumber is unique)
      const docRef = querySnapshot.docs[0].ref;
      const orderData = (await getDoc(docRef)).data();

      // Delete the document

      // Add the quantity of the deleted order back to the product database
      const productId = orderData.productId;
      const quantityToAdd = orderData.quantity;
      const active = orderData.active;

      if (orderData.active === false) {
        return res.status(400).json({ error: "Order is Over!!" });
      }
      await deleteDoc(docRef);

      connection.query(
        "UPDATE products SET quantity = quantity + ? WHERE id = ?",
        [quantityToAdd, productId],
        (updateErr, result) => {
          if (updateErr) {
            console.error(updateErr);
            return res.status(500).json({ error: "Internal Server Error" });
          } else {
            res.send({ msg: "Order deleted successfully" });
            console.log("Order deleted successfully!!");
          }
        }
      );
    } else {
      res.status(404).send({ error: "Order not found" });
    }
  } catch (error) {
    console.error("Error deleting order: ", error);
    res
      .status(500)
      .send({ error: "An error occurred while deleting the order" });
  }
});

export default router;
