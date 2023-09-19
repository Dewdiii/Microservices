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
} from "firebase/firestore";

import orderCollection from "../config.js";

import axios from "axios";

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
    const userResponse = await axios.get(
      `http://localhost:8000/users/check-email?email=${email}`
    );
    const { exist, user } = userResponse.data;

    if (!exist) {
      return res.status(404).send({ error: "User not found" });
    }

    if (quantity <= 0) {
      return res.status(400).send({ error: "Please provide a valid quantity" });
    }

    const productResponse = await axios.post(
      `http://localhost:8080/products/add-order?productId=${productId}&quantity=${quantity}`
    );

    const { existingData } = productResponse.data;

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
          res.status(200).json({
            message: "Order added successfully",
            orderData: orderData,
          });
          console.log("Order added successfully!!");
        })
        .catch((firestoreErr) => {
          console.error("Error adding document: ", firestoreErr);
          res.status(500).send({
            error: "An error occurred while adding order",
          });
        });
    })();
  } catch (error) {
    console.error("Error adding document: ", error);
    res.status(500).send({ error: "An error occurred while adding order" });
  }
});

router.get("/read/:customerId", async (req, res) => {
  const _id = req.params.customerId;

  const userResponse = await axios.get(
    `http://localhost:8000/users/check-id?_id=${_id}`
  );
  const { exist, user } = userResponse.data;

  if (!exist) {
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
      const docRef = querySnapshot.docs[0].ref;

      // Get the existing data from the order
      const existingData = (await getDoc(docRef)).data();

      // Get the product ID from the existing data
      const productId = existingData.productId;

      if (!newData.quantity) {
        newData.quantity = existingData.quantity;
      }

      //console.log(newData, existingData);
      const serializedData = JSON.stringify(newData);
      const serializedExistingData = JSON.stringify(existingData);

      // Query the database to get the product details
      let productResponse;

      try {
        productResponse = await axios.post(
          `http://localhost:8080/products/update-order?productId=${productId}&data=${encodeURIComponent(
            serializedData
          )}&exData=${encodeURIComponent(serializedExistingData)}`
        );
      } catch (productError) {
        // Handle the error from the axios.post call
        console.error("Error in product update:", productError);

        if (productError.response && productError.response.data) {
          const { error } = productError.response.data;
          return res.status(400).json({ error });
        }

        return res
          .status(500)
          .json({ error: "An error occurred while updating the order" });
      }

      const { updatedData } = productResponse.data;

      // If there is no error, update the Firestore document
      setDoc(docRef, updatedData)
        .then(() => {
          res.send({
            message: "Product updated successfully",
            updatedData: updatedData,
          });
          console.log("Product updated successfully");
        })
        .catch((firestoreErr) => {
          console.error("Error updating document: ", firestoreErr);
          res.status(500).json({
            error: "An error occurred while updating the order",
          });
        });
    } else {
      // Handle the case where no document with the specified orderNumber exists
      res.status(404).json({ error: "Order not found" });
    }
  } catch (error) {
    console.error("Error updating order");
    res.status(500).json({ message: "Insufficient Stock!!" });
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
      const docRef = querySnapshot.docs[0].ref;
      const orderData = (await getDoc(docRef)).data();
      const productId = orderData.productId;
      const quantityToAdd = orderData.quantity;

      if (orderData.active === false) {
        console.log("Order Can't be Deleted, Order is closed!");
        return res.status(400).json({ error: "Order is Over!!" });
      }
      await deleteDoc(docRef);

      try {
        const productResponse = await axios.post(
          `http://localhost:8080/products/delete-order?productId=${productId}&quantityToAdd=${quantityToAdd}`
        );
        const { status } = productResponse.data;

        if (status === "true") {
          res.send({
            msg: "Order deleted successfully",
            deletedOrder: orderData,
          });
          console.log("Order deleted successfully!!");
        }
      } catch (productError) {
        console.error("Error in product update:", productError);

        if (productError.response && productError.response.data) {
          const { error } = productError.response.data;
          return res.status(400).json({ error });
        }

        return res
          .status(500)
          .json({ error: "An error occurred while updating the order" });
      }
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
