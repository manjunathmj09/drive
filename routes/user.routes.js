const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const userModel = require("../models/user.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.get("/register", (req, res) => {
  res.render("register");
});

router.post(
  "/register",
  body("email").trim().isEmail().isLength({ min: 13 }),
  body("password").trim().isLength({ min: 5 }),
  body("username").trim().isLength({ min: 3 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ errors: errors.array(), message: "Invalid data" });
    }

    const { email, username, password } = req.body;

    const existingUser = await userModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User with this email or username already exists" });
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await userModel.create({
      email,
      username,
      password: hashPassword,
    });

    res.redirect("/user/login");
  }
);

router.get("/login", (req, res) => {
  res.render("login");
});

router.post(
  "/login",
  body("username").trim().isLength({ min: 3 }),
  body("password").trim().isLength({ min: 5 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ error: errors.array(), message: "Invalid data" });
    }

    const { username, password } = req.body;
    const user = await userModel.findOne({ username });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Username or password is incorrect" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Username or password is incorrect" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, username: user.username },
      process.env.SUPABASE_JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, { httpOnly: true, secure: true });
    res.redirect("/");
  }
);

module.exports = router;
