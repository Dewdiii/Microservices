import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/users.js";
// import createError from "http-errors";
import path from "path";
import flash from "express-flash";
import session from "express-session";
import mysql from "mysql";
import connection from "./models/inventory.js";
import productRoutes from "./routes/products.js";

const app = express();
dotenv.config();

// Your existing code from the second snippet
//app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    cookie: { maxAge: 60000 },
    store: new session.MemoryStore(),
    saveUninitialized: true,
    resave: "true",
    secret: "secret",
  })
);

app.use(flash());

// Your existing code for handling 404 errors
// app.use(function (req, res, next) {
//   next(createError(404));
// });

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

app.use("/users", userRoutes);
app.use("/products", productRoutes);

// Database connection
const CONNECTION_URL = process.env.CONNECTION_URL;
const PORT = process.env.PORT;

mongoose
  .connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() =>
    app.listen(PORT, () =>
      console.log(
        `User Database Connected Successfully..!! ~Server Running on Port: ${PORT}`
      )
    )
  )
  .catch((error) => console.log(error.message));

// Listen on port 3000 for your other part of the code
//app.listen(3000);
