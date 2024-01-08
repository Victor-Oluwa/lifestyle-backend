const express = require("express");
const User = require("../models/user");
const authRouter = express.Router();
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleweres/auth");

// Sign Up
authRouter.post("/api/signup", async (req, res) => {

  try {

    const { name, email, password, address, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(404).json(`User already exists`);
    }
    const hashedPassword = await bcryptjs.hash(password, 8);

    let user = new User({
      name,
      email,
      password: hashedPassword,
      address,
      phone,
    });
    user = await user.save();


    const token = jwt.sign({ id: user._id }, "passwordKey");
    res.status(200).json({ token, ...user._doc });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
//---------------------------------------------------------------
// ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
//   Sign In|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
authRouter.post("/api/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Signing in`);
    const user = await findUserByEmail(email);
    await matchPassword(password, user)

    const token = jwt.sign({ id: user._id }, "passwordKey");
    res.status(200).json({ token, ...user._doc });

  } catch (e) {
    const wrongPasswordMessage = Error("Incorrect Password");
    const wrongEmailMessage = Error("Incorrect Email");
    if (e = wrongPasswordMessage) {
      res.status(123).json(e.message);
    } else if (e = wrongEmailMessage) {
      res.status(246).json(e.message);
    } else {
      res.status(500).json(e.message);

    }
    console.log(`Could not signIn: ${e}`);
  }

  async function findUserByEmail(email) {
    let user = await User.findOne({ email });
    if (!user) {
      throw new Error("Incorrect Email");
    }
    return user;
  }

  async function matchPassword(password, user) {
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Incorrect Password");
    }
    return isMatch;
  }
});



authRouter.post("/tokenIsValid", async (req, res) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return res.status(404).json(false);
    const verified = jwt.verify(token, "passwordKey");
    if (!verified) return res.status(404).json(false);
    const user = await User.findById(verified.id);
    if (!user) return res.status(404).json(false);
    res.status(200).json(true);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

authRouter.get("/", auth, async (req, res) => {
  const user = await User.findById(req.user);
  res.status(200).json({ ...user._doc, token: req.token });
});

module.exports = authRouter;
