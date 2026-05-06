const pool = require("./db");

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.log(" DB Error:", err);
  } else {
    console.log(" DB Connected:", res.rows);
  }
});