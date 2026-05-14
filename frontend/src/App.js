import API from "./config";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useState, useEffect } from "react";
import Charts from "./Charts";
import Budget from "./Budget";

function App() {
 

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedUser, setLoggedUser] = useState("");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("expense");
  const [editId, setEditId] = useState(null);

  const [data, setData] = useState([]);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const categories = [
    "Food", "Transport", "Shopping", "Entertainment",
    "Health", "Education", "Salary", "Business", "Other"
  ];

  const register = async () => {
    try {
      if (!name || !email || !password) { alert("Please fill all fields"); return; }
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const result = await res.json();
      alert(result.message || result.error);
    } catch (err) {
      alert("Register Failed. Is the server running?");
    }
  };

  const login = async () => {
    try {
      if (!email || !password) { alert("Please enter email and password"); return; }
      localStorage.removeItem("token");
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (result.token) {
        localStorage.setItem("token", result.token);
        setIsLoggedIn(true);
        setLoggedUser(result.user?.name || email);
        getData();
        getBalance();
      } else {
        alert(result.message || result.error || "Login failed");
      }
    } catch (err) {
      alert("Login Failed. Is the server running?");
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const res = await fetch(`${API}/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const result = await res.json();
      if (result.token) {
        localStorage.setItem("token", result.token);
        setIsLoggedIn(true);
        setLoggedUser(result.user?.name);
        getData();
        getBalance();
      } else {
        alert(result.error || "Google Login Failed");
      }
    } catch (err) {
      alert("Google Login Failed. Is the server running?");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setLoggedUser("");
    setData([]);
    setBalance(0);
    setIncome(0);
    setExpense(0);
    setName("");
    setEmail("");
    setPassword("");
  };

  const getData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/all`, {
        headers: { Authorization: localStorage.getItem("token") },
      });
      const result = await res.json();
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBalance = async () => {
    try {
      const res = await fetch(`${API}/balance`, {
        headers: { Authorization: localStorage.getItem("token") },
      });
      const result = await res.json();
      setBalance(result.balance || 0);
      setIncome(result.income || 0);
      setExpense(result.expense || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const addTransaction = async () => {
    try {
      if (!title || !amount || !category || !type) { alert("Please fill all fields"); return; }
      if (isNaN(amount) || Number(amount) <= 0) { alert("Amount must be a valid positive number"); return; }
      const url = editId ? `${API}/update/${editId}` : `${API}/add`;
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({ title, amount: parseFloat(amount), category, type }),
      });
      const result = await res.json();
      alert(result.message || result.error);
      setTitle(""); setAmount(""); setCategory(""); setType("expense"); setEditId(null);
      getData();
      getBalance();
    } catch (err) {
      alert("Request Failed.");
    }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      const res = await fetch(`${API}/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: localStorage.getItem("token") },
      });
      const result = await res.json();
      alert(result.message || result.error);
      getData();
      getBalance();
    } catch (err) {
      alert("Delete Failed");
    }
  };

  const editTransaction = (item) => {
    setTitle(item.title);
    setAmount(Math.abs(item.amount));
    setCategory(item.category);
    setType(item.type || "expense");
    setEditId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setTitle(""); setAmount(""); setCategory(""); setType("expense"); setEditId(null);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      getData();
      getBalance();
    }
  }, []);

  const filteredData = data.filter((item) => {
    if (activeTab === "all" || activeTab === "analytics" || activeTab === "budget") return true;
    return item.type === activeTab;
  });

  const s = {
    page: { fontFamily: "'Segoe UI', sans-serif", background: "#f0f2f5", minHeight: "100vh", padding: "20px" },
    container: { maxWidth: "800px", margin: "0 auto" },
    header: { background: "linear-gradient(135deg, #1a1a2e, #16213e)", borderRadius: "16px", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", color: "white" },
    headerTitle: { fontSize: "22px", fontWeight: "700", margin: 0, color: "white" },
    cardsRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" },
    balanceCard: { background: "linear-gradient(135deg, #667eea, #764ba2)", borderRadius: "14px", padding: "20px", color: "white", textAlign: "center" },
    incomeCard: { background: "linear-gradient(135deg, #11998e, #38ef7d)", borderRadius: "14px", padding: "20px", color: "white", textAlign: "center" },
    expenseCard: { background: "linear-gradient(135deg, #eb3349, #f45c43)", borderRadius: "14px", padding: "20px", color: "white", textAlign: "center" },
    cardLabel: { fontSize: "12px", opacity: 0.85, marginBottom: "6px" },
    cardAmount: { fontSize: "24px", fontWeight: "700" },
    card: { background: "white", borderRadius: "14px", padding: "24px", marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
    cardTitle: { fontSize: "16px", fontWeight: "600", color: "#1a1a2e", marginBottom: "16px", marginTop: 0 },
    inputRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" },
    input: { padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", color: "#1a1a2e" },
    select: { padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box", color: "#1a1a2e", background: "white" },
    typeRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" },
    typeBtn: (selected, color) => ({ padding: "10px", borderRadius: "8px", border: `2px solid ${color}`, background: selected ? color : "white", color: selected ? "white" : color, fontWeight: "600", cursor: "pointer", fontSize: "14px", transition: "all 0.2s" }),
    btn: (bg) => ({ padding: "11px 20px", background: bg, color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", marginRight: "10px" }),
    tabs: { display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" },
    tab: (active) => ({ padding: "8px 20px", borderRadius: "20px", border: "none", background: active ? "#667eea" : "#f0f2f5", color: active ? "white" : "#666", fontWeight: "600", cursor: "pointer", fontSize: "13px" }),
    txItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: "10px", marginBottom: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" },
    txLeft: { display: "flex", alignItems: "center", gap: "12px" },
    txIcon: (type) => ({ width: "40px", height: "40px", borderRadius: "10px", background: type === "income" ? "#d4edda" : "#fde8e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }),
    txTitle: { fontWeight: "600", color: "#1a1a2e", fontSize: "14px", marginBottom: "3px" },
    txCategory: { fontSize: "12px", color: "#888" },
    txAmount: (type) => ({ fontWeight: "700", fontSize: "16px", color: type === "income" ? "#11998e" : "#eb3349" }),
    txActions: { display: "flex", gap: "8px", marginLeft: "12px" },
    smallBtn: (bg) => ({ padding: "6px 12px", background: bg, color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }),
    logoutBtn: { padding: "8px 16px", background: "rgba(255,255,255,0.2)", color: "white", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
  };

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* HEADER */}
        <div style={s.header}>
          <div>
            <h1 style={s.headerTitle}> Expense Tracker</h1>
            {isLoggedIn && (
              <div style={{ fontSize: "13px", opacity: 0.75, marginTop: "4px" }}>
                Welcome back, {loggedUser}!
              </div>
            )}
          </div>
          {isLoggedIn && (
            <button style={s.logoutBtn} onClick={logout}>Logout</button>
          )}
        </div>

        {/* BALANCE CARDS */}
        <div style={s.cardsRow}>
          <div style={s.balanceCard}>
            <div style={s.cardLabel}>Total Balance</div>
            <div style={s.cardAmount}>₹{balance}</div>
          </div>
          <div style={s.incomeCard}>
            <div style={s.cardLabel}>Total Income</div>
            <div style={s.cardAmount}>₹{income}</div>
          </div>
          <div style={s.expenseCard}>
            <div style={s.cardLabel}>Total Expense</div>
            <div style={s.cardAmount}>₹{expense}</div>
          </div>
        </div>

        {/* AUTH SECTION */}
        {!isLoggedIn && (
          <div style={s.card}>
            <h3 style={s.cardTitle}>🔐 Register / Login</h3>
            <div style={s.inputRow}>
              <input style={s.input} placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input style={s.input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <input style={s.input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button style={s.btn("#38a169")} onClick={register}>Register</button>
            <button style={s.btn("#667eea")} onClick={login}>Login</button>

            {/* ✅ GOOGLE LOGIN - இங்க ADD பண்ணினோம் */}
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <p style={{ color: "#888", marginBottom: "12px", fontSize: "14px" }}>--- OR ---</p>
              <GoogleOAuthProvider clientId="391774840730-khdjdtvg18ql8iaaekj7lbfk0dh7dsho.apps.googleusercontent.com">
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() => alert("Google Login Failed")}
                />
              </GoogleOAuthProvider>
            </div>

          </div>
        )}

        {/* TRANSACTION FORM */}
        {isLoggedIn && (
          <div style={s.card}>
            <h3 style={s.cardTitle}>{editId ? "✏️ Update Transaction" : "➕ Add Transaction"}</h3>
            <div style={s.typeRow}>
              <button style={s.typeBtn(type === "income", "#11998e")} onClick={() => setType("income")}>⬆️ Income</button>
              <button style={s.typeBtn(type === "expense", "#eb3349")} onClick={() => setType("expense")}>⬇️ Expense</button>
            </div>
            <div style={s.inputRow}>
              <input style={s.input} placeholder="Title (e.g. Lunch)" value={title} onChange={(e) => setTitle(e.target.value)} />
              <input style={s.input} placeholder="Amount (e.g. 500)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <select style={s.select} value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select Category</option>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <button style={s.btn(editId ? "#d69e2e" : type === "income" ? "#11998e" : "#eb3349")} onClick={addTransaction}>
              {editId ? "Update Transaction" : `Add ${type === "income" ? "Income" : "Expense"}`}
            </button>
            {editId && <button style={s.btn("#718096")} onClick={cancelEdit}>Cancel</button>}
          </div>
        )}

        {/* TRANSACTIONS LIST + ANALYTICS + BUDGET */}
        {isLoggedIn && (
          <div style={s.card}>
            <h3 style={s.cardTitle}>📋 Transactions</h3>
            <div style={s.tabs}>
              <button style={s.tab(activeTab === "all")} onClick={() => setActiveTab("all")}>All ({data.length})</button>
              <button style={s.tab(activeTab === "income")} onClick={() => setActiveTab("income")}>Income ({data.filter(d => d.type === "income").length})</button>
              <button style={s.tab(activeTab === "expense")} onClick={() => setActiveTab("expense")}>Expense ({data.filter(d => d.type === "expense").length})</button>
              <button style={s.tab(activeTab === "analytics")} onClick={() => setActiveTab("analytics")}>📊 Analytics</button>
              <button style={s.tab(activeTab === "budget")} onClick={() => setActiveTab("budget")}>🎯 Budget</button>
            </div>
            {activeTab === "analytics" && <Charts token={localStorage.getItem("token")} />}
            {activeTab === "budget" && <Budget token={localStorage.getItem("token")} />}
            {activeTab !== "analytics" && activeTab !== "budget" && (
              <>
                {loading && <p style={{ color: "#888", textAlign: "center" }}>Loading...</p>}
                {!loading && filteredData.length === 0 && (
                  <p style={{ color: "#aaa", textAlign: "center", padding: "20px" }}>No transactions found!</p>
                )}
                {filteredData.map((item) => (
                  <div key={item.id} style={s.txItem}>
                    <div style={s.txLeft}>
                      <div style={s.txIcon(item.type)}>
                        {item.type === "income" ? "⬆" : "⬇"}
                      </div>
                      <div>
                        <div style={s.txTitle}>{item.title}</div>
                        <div style={s.txCategory}>
                          {item.category} •{" "}
                          {item.created_at ? new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={s.txAmount(item.type)}>
                        {item.type === "income" ? "+" : "-"}₹{Math.abs(item.amount)}
                      </span>
                      <div style={s.txActions}>
                        <button style={s.smallBtn("#d69e2e")} onClick={() => editTransaction(item)}>Edit</button>
                        <button style={s.smallBtn("#eb3349")} onClick={() => deleteTransaction(item.id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;