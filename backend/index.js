const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();

const pool = require("./db");
const auth = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
const client = new OAuth2Client("391774840730-khdjdtvg18ql8iaaekj7lbfk0dh7dsho.apps.googleusercontent.com");

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
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
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

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
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

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: "391774840730-khdjdtvg18ql8iaaekj7lbfk0dh7dsho.apps.googleusercontent.com",
    });

    const { name, email, sub: googleId } = ticket.getPayload();

    let result = await pool.query(
      "SELECT * FROM users WHERE email = $1", [email]
    );

    if (result.rows.length === 0) {
      result = await pool.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
        [name, email, `google_${googleId}`]
      );
    }

    const user = result.rows[0];

    const token2 = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token: token2,
      user: { id: user.id, name: user.name, email: user.email },
    });

  } catch (err) {
    console.error("GOOGLE LOGIN ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// ADD TRANSACTION
// ─────────────────────────────────────────
app.post("/add", auth, async (req, res) => {
  try {
    const { title, amount, category, type } = req.body;
    const userId = req.user.id;

    if (!title || !amount || !category || !type) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (isNaN(amount)) {
      return res.status(400).json({ error: "Amount must be a number" });
    }

    if (type !== "income" && type !== "expense") {
      return res.status(400).json({ error: "Type must be income or expense" });
    }

    const finalAmount = type === "income"
      ? Math.abs(parseFloat(amount))
      : -Math.abs(parseFloat(amount));

    const result = await pool.query(
      `INSERT INTO transactions (title, amount, category, type, user_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, finalAmount, category, type, userId]
    );

    res.status(201).json({ message: "Transaction Added", data: result.rows[0] });
  } catch (err) {
    console.error("ADD ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET ALL TRANSACTIONS
// ─────────────────────────────────────────
app.get("/all", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT * FROM transactions WHERE user_id = $1 ORDER BY id DESC",
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET ALL ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET BALANCE
// ─────────────────────────────────────────
app.get("/balance", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const balanceResult = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS balance FROM transactions WHERE user_id = $1",
      [userId]
    );

    const incomeResult = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE user_id = $1 AND type = 'income'",
      [userId]
    );

    const expenseResult = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE user_id = $1 AND type = 'expense'",
      [userId]
    );

    res.json({
      balance: parseFloat(balanceResult.rows[0].balance).toFixed(2),
      income: parseFloat(incomeResult.rows[0].total).toFixed(2),
      expense: Math.abs(parseFloat(expenseResult.rows[0].total)).toFixed(2),
    });
  } catch (err) {
    console.error("BALANCE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// UPDATE TRANSACTION
// ─────────────────────────────────────────
app.put("/update/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const { title, amount, category, type } = req.body;

    if (!title || !amount || !category || !type) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (type !== "income" && type !== "expense") {
      return res.status(400).json({ error: "Type must be income or expense" });
    }

    const check = await pool.query(
      "SELECT id FROM transactions WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const finalAmount = type === "income"
      ? Math.abs(parseFloat(amount))
      : -Math.abs(parseFloat(amount));

    const result = await pool.query(
      `UPDATE transactions
       SET title = $1, amount = $2, category = $3, type = $4
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [title, finalAmount, category, type, id, userId]
    );

    res.json({ message: "Transaction Updated", data: result.rows[0] });
  } catch (err) {
    console.error("UPDATE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// DELETE TRANSACTION
// ─────────────────────────────────────────
app.delete("/delete/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;

    const check = await pool.query(
      "SELECT id FROM transactions WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    await pool.query(
      "DELETE FROM transactions WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    res.json({ message: "Transaction Deleted" });
  } catch (err) {
    console.error("DELETE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// MONTHLY REPORT
// ─────────────────────────────────────────
app.get("/report", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    const result = await pool.query(
      `SELECT category, type, SUM(ABS(amount)) AS total
       FROM transactions
       WHERE user_id = $1
         AND EXTRACT(MONTH FROM created_at) = $2
         AND EXTRACT(YEAR FROM created_at) = $3
       GROUP BY category, type
       ORDER BY total DESC`,
      [userId, month, year]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("REPORT ERROR:", err.message);
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