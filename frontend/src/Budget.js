import { useState, useEffect } from "react";

const categories = [
  "Food", "Transport", "Shopping", "Entertainment",
  "Health", "Education", "Salary", "Business", "Other"
];

export default function Budget({ token }) {
  const API = "http://localhost:5000";
  const [budgets, setBudgets] = useState({});
  const [spending, setSpending] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("Food");
  const [limitAmount, setLimitAmount] = useState("");
  const [alerts, setAlerts] = useState([]);
  const loadBudgets = () => {
    const saved = localStorage.getItem("budgets");
    if (saved) setBudgets(JSON.parse(saved));
  };

  const fetchSpending = async () => {
    try {
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      const res = await fetch(
        `${API}/report?month=${month}&year=${year}`,
        { headers: { Authorization: token } }
      );
      const data = await res.json();

      const spendMap = {};
      data.filter(r => r.type === "expense").forEach(row => {
        spendMap[row.category] = parseFloat(row.total);
      });
      setSpending(spendMap);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadBudgets();
    fetchSpending();
  }, [token]);
  useEffect(() => {
    const newAlerts = [];
    categories.forEach(cat => {
      const limit = budgets[cat];
      const spent = spending[cat] || 0;
      if (limit && spent >= limit * 0.8) {
        newAlerts.push({
          category: cat,
          spent,
          limit,
          exceeded: spent >= limit
        });
      }
    });
    setAlerts(newAlerts);
  }, [budgets, spending]);

  const saveBudget = () => {
    if (!limitAmount || isNaN(limitAmount) || Number(limitAmount) <= 0) {
      alert("Enter a valid amount");
      return;
    }
    const updated = { ...budgets, [selectedCategory]: parseFloat(limitAmount) };
    setBudgets(updated);
    localStorage.setItem("budgets", JSON.stringify(updated));
    setLimitAmount("");
    alert(`Budget set for ${selectedCategory}: ₹${limitAmount}`);
  };

  const removeBudget = (cat) => {
    const updated = { ...budgets };
    delete updated[cat];
    setBudgets(updated);
    localStorage.setItem("budgets", JSON.stringify(updated));
  }; 
  const cardStyle = {
    background: "white", borderRadius: "14px", padding: "24px",
    marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)"
  };
  const titleStyle = {
    fontSize: "16px", fontWeight: "600",
    color: "#1a1a2e", marginBottom: "16px", marginTop: 0
  };
  const inputStyle = {
    padding: "10px 14px", borderRadius: "8px",
    border: "1.5px solid #e2e8f0", fontSize: "14px",
    outline: "none", color: "#1a1a2e", background: "white"
  };
  const selectStyle = {
    padding: "10px 14px", borderRadius: "8px",
    border: "1.5px solid #e2e8f0", fontSize: "14px",
    outline: "none", color: "#1a1a2e", background: "white"
  };
  const btnStyle = (bg) => ({
    padding: "10px 20px", background: bg, color: "white",
    border: "none", borderRadius: "8px", cursor: "pointer",
    fontWeight: "600", fontSize: "14px"
  });
  return (
    <div>

      {/* SET BUDGET */}
      <div style={cardStyle}>
        <h3 style={titleStyle}>🎯 Set Budget Limit</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select
            style={selectStyle}
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input
            style={inputStyle}
            type="number"
            placeholder="Enter limit (e.g. 5000)"
            value={limitAmount}
            onChange={e => setLimitAmount(e.target.value)}
          />
          <button style={btnStyle("#667eea")} onClick={saveBudget}>
            Set Budget
          </button>
        </div>
      </div>

      {/* ALERTS */}
      {alerts.length > 0 && (
        <div style={cardStyle}>
          <h3 style={titleStyle}> Budget Alerts</h3>
          {alerts.map(alert => (
            <div key={alert.category} style={{
              padding: "14px 16px", borderRadius: "10px",
              marginBottom: "10px",
              background: alert.exceeded ? "#fff5f5" : "#fffbea",
              border: `1px solid ${alert.exceeded ? "#feb2b2" : "#f6e05e"}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "600", color: "#1a1a2e" }}>
                  {alert.exceeded ? "🔴" : "🟡"} {alert.category}
                </span>
                <span style={{ fontWeight: "600", color: alert.exceeded ? "#eb3349" : "#d69e2e" }}>
                  ₹{alert.spent} / ₹{alert.limit}
                </span>
              </div>
              <div style={{ marginTop: "8px", background: "#e2e8f0", borderRadius: "4px", height: "6px" }}>
                <div style={{
                  width: `${Math.min((alert.spent / alert.limit) * 100, 100)}%`,
                  background: alert.exceeded ? "#eb3349" : "#f6ad55",
                  height: "6px", borderRadius: "4px"
                }} />
              </div>
              <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                {alert.exceeded
                  ? ` Budget exceeded by ₹${(alert.spent - alert.limit).toFixed(2)}`
                  : ` ${((alert.spent / alert.limit) * 100).toFixed(0)}% of budget used`
                }
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BUDGET LIST */}
      <div style={cardStyle}>
        <h3 style={titleStyle}>📋 Your Budgets — This Month</h3>
        {Object.keys(budgets).length === 0 && (
          <p style={{ color: "#aaa", textAlign: "center", padding: "20px" }}>
            No budgets set yet!
          </p>
        )}
        {Object.entries(budgets).map(([cat, limit]) => {
          const spent = spending[cat] || 0;
          const percent = Math.min((spent / limit) * 100, 100);
          return (
            <div key={cat} style={{
              padding: "14px 16px", borderRadius: "10px",
              marginBottom: "10px", background: "#f8fafc",
              border: "1px solid #e2e8f0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontWeight: "600", color: "#1a1a2e" }}>{cat}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "14px", color: "#888" }}>
                    ₹{spent} / ₹{limit}
                  </span>
                  <button
                    style={{ ...btnStyle("#eb3349"), padding: "4px 10px", fontSize: "12px" }}
                    onClick={() => removeBudget(cat)}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div style={{ background: "#e2e8f0", borderRadius: "4px", height: "6px" }}>
                <div style={{
                  width: `${percent}%`,
                  background: percent >= 100 ? "#eb3349" : percent >= 80 ? "#f6ad55" : "#11998e",
                  height: "6px", borderRadius: "4px"
                }} />
              </div>
              <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                {percent.toFixed(0)}% used
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}