import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (!existingUser)
      return res.status(404).jason({ message: "User doesn't exist!" });

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordCorrect)
      return res.status(400).jason({ message: "Invalid Credentials!" });

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      "test",
      { expiresIn: "1h" }
    );

    res.status(200).json({ result: existingUser, token });
  } catch (error) {
    res.status(500).json({ message: " Something is WRONG!" });
  }
};

export const signup = async (req, res) => {
  const { email, password, confirmPassword, firstName, lastName } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser)
      return res.status(400).json({ message: "USER ALREADY EXISTS!" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Password don't match!" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await User.create({
      email,
      password: hashedPassword,
      name: `${firstName} ${lastName}`,
    });

    const token = jwt.sign({ email: result.email, id: result._id }, "test", {
      expiresIn: "1h",
    });

    res.status(200).json({ result, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const fetchUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
    console.log("Users Fetched...");
  } catch (error) {
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await User.findOneAndDelete({ _id: id });

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("User deleted", deletedUser);
    res.status(200).json({ message: "User deleted successfully", deleteUser: deletedUser });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, password, name } = req.body;

  try {
    const existingUser = await User.findById(id);

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    existingUser.email = email || existingUser.email;
    existingUser.name = name || existingUser.name;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      existingUser.password = hashedPassword;
    }

    const updatedUser = await existingUser.save();
    console.log("Updated user", updatedUser);
    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const checkEmail = async (req, res) => {
  const { email } = req.query;
  const existingUser = await User.findOne({ email });

  if (!existingUser) {
    res.json({ exist: false });
  } else {
    console.log("Email found");
    res.json({ exist: true, user: existingUser });
  }
};

export const checkId = async (req, res) => {
  const { _id } = req.query;
  const existingUser = await User.findOne({ _id });

  if (!existingUser) {
    res.json({ exist: false });
  } else {
    res.json({ exist: true, user: existingUser });
  }
};
