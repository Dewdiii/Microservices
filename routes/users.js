import express from "express";
import { signin, signup, fetchUsers, deleteUser, updateUser } from "../controllers/user.js";

import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/signin", signin);
router.post("/signup", signup);
router.get("/all", fetchUsers);
router.put("/update/:id", updateUser);
router.post("/delete/:id", deleteUser);

export default router;