const API =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://expense-tracker-with-analytics-6iox.onrender.com";

export default API;