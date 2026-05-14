const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();

const pool = require("./db");
const auth = require("./middleware/auth");

const app = express();

// ✅ CORS FIX
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://transcendent-jalebi-65024d.netlify.app"
  ],
  credentials: true
}));

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

// ✅ GOOGLE CLIENT ID
const GOOGLE_CLIENT_ID =
  "391774840730-khdjdtvg18ql8iaaekj7lbfk0dh7dsho.apps.googleusercontent.com";

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// ─────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("Expense Tracker API Running");
});

// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1,$2,$3)",
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: "User Registered Successfully" });

  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GOOGLE LOGIN
// ─────────────────────────────────────────
app.post("/google-login", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token missing" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    const name = payload.name;
    const email = payload.email;
    const googleId = payload.sub;

    let result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      result = await pool.query(
        "INSERT INTO users (name,email,password) VALUES ($1,$2,$3) RETURNING *",
        [name, email, "google_" + googleId]
      );
    }

    const user = result.rows[0];

    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("GOOGLE LOGIN ERROR:", err.message);
    res.status(500).json({
      error: "Google login failed"
    });
  }
});

// ─────────────────────────────────────────
// ADD TRANSACTION
// ─────────────────────────────────────────
app.post("/add", auth, async (req, res) => {
  try {
    const { title, amount, category, type } = req.body;
    const userId = req.user.id;

    const finalAmount =
      type === "income"
        ? Math.abs(Number(amount))
        : -Math.abs(Number(amount));

    const result = await pool.query(
      `INSERT INTO transactions
      (title,amount,category,type,user_id)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`,
      [title, finalAmount, category, type, userId]
    );

    res.json({
      message: "Transaction Added",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("ADD ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET ALL
// ─────────────────────────────────────────
app.get("/all", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT * FROM transactions WHERE user_id=$1 ORDER BY id DESC",
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("GET ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// BALANCE
// ─────────────────────────────────────────
app.get("/balance", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const balance = await pool.query(
      "SELECT COALESCE(SUM(amount),0) total FROM transactions WHERE user_id=$1",
      [userId]
    );

    const income = await pool.query(
      "SELECT COALESCE(SUM(amount),0) total FROM transactions WHERE user_id=$1 AND type='income'",
      [userId]
    );

    const expense = await pool.query(
      "SELECT COALESCE(SUM(amount),0) total FROM transactions WHERE user_id=$1 AND type='expense'",
      [userId]
    );

    res.json({
      balance: Number(balance.rows[0].total),
      income: Number(income.rows[0].total),
      expense: Math.abs(Number(expense.rows[0].total))
    });

  } catch (err) {
    console.error("BALANCE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────
app.delete("/delete/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;

    await pool.query(
      "DELETE FROM transactions WHERE id=$1 AND user_id=$2",
      [id, userId]
    );

    res.json({ message: "Deleted Successfully" });

  } catch (err) {
    console.error("DELETE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});