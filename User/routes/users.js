import express from "express";
import {
  signin,
  signup,
  fetchUsers,
  deleteUser,
  updateUser,
  checkEmail,
  checkId,
} from "../controllers/user.js";

import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/signin", signin);
router.post("/signup", signup);
router.get("/all", fetchUsers);
router.put("/update/:id", updateUser);
router.post("/delete/:id", deleteUser);

router.get("/check-email", checkEmail);
router.get("/check-id", checkId);

export default router;
