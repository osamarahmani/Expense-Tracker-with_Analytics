const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token) {
      return res.status(401).json({
        message: "Access Denied. No token provided.",
      });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({
      message: "Invalid or expired token.",
    });
  }
};
