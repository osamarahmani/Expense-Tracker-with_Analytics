const express = require("express");
const cors = require("cors");
const pool = require("./db");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());


//  ROOT
app.get("/", (req, res) => {
  res.send("Expense Tracker API Running with DB");
});


//  REGISTER (AUTH START HERE)
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );

    res.json({ message: "User Registered", user: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id },
      "secretkey",
      { expiresIn: "1d" }
    );

    res.json({ message: "Login success", token });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  ADD TRANSACTION
app.post("/add", async (req, res) => {
  try {
    const { title, amount, category } = req.body;

    const result = await pool.query(
      "INSERT INTO transactions (title, amount, category) VALUES ($1, $2, $3) RETURNING *",
      [title, amount, category]
    );

    res.json({ message: "Added", data: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  GET ALL
app.get("/all", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM transactions ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  DELETE
app.delete("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;

    await pool.query(
      "DELETE FROM transactions WHERE id=$1",
      [id]
    );

    res.json({ message: "Deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  UPDATE
app.put("/update/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { title, amount, category } = req.body;

    const result = await pool.query(
      "UPDATE transactions SET title=$1, amount=$2, category=$3 WHERE id=$4 RETURNING *",
      [title, amount, category, id]
    );

    res.json({ message: "Updated", data: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  SERVER START
app.listen(5000, () => {
  console.log("Server running on port 5000");
});