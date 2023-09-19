import express from "express";
import { addDoc, getDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"; // Import addDoc from Firestore
import orderCollection from "./config.js";
import orderRouter from "./routes/orders.js"

const app = express();
app.use(express.json());

app.use("/orders", orderRouter);

const PORT = process.env.PORT || 4000;

app.listen(PORT, (err) => {
  if (err) {
    console.error(`Error starting the server: ${err}`);
  } else {
    console.log(`Listening on port ${PORT}`);
  }
});
