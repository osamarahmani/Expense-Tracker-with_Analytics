import API from "./config";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
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

  const GOOGLE_CLIENT_ID =
    "391774840730-khdjdtvg18ql8iaaekj7lbfk0dh7dsho.apps.googleusercontent.com";

  const categories = [
    "Food",
    "Transport",
    "Shopping",
    "Entertainment",
    "Health",
    "Education",
    "Salary",
    "Business",
    "Other",
  ];

  // =============================
  // REGISTER
  // =============================
  const register = async () => {
    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const result = await res.json();
      alert(result.message || result.error);
    } catch (err) {
      alert("Register Failed");
    }
  };

  // =============================
  // LOGIN
  // =============================
  const login = async () => {
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await res.json();

      if (result.token) {
        localStorage.setItem("token", result.token);
        setIsLoggedIn(true);
        setLoggedUser(result.user.name);
        getData();
        getBalance();
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert("Login Failed");
    }
  };

  // =============================
  // GOOGLE LOGIN
  // =============================
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const res = await fetch(`${API}/google-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: credentialResponse.credential,
        }),
      });

      const result = await res.json();

      if (result.token) {
        localStorage.setItem("token", result.token);
        setIsLoggedIn(true);
        setLoggedUser(result.user.name);
        getData();
        getBalance();
      } else {
        alert("Google Login Failed");
      }
    } catch (err) {
      alert("Google Login Failed");
    }
  };

  // =============================
  // LOGOUT
  // =============================
  const logout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setLoggedUser("");
    setData([]);
  };

  // =============================
  // GET TRANSACTIONS
  // =============================
  const getData = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/all`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });

      const result = await res.json();
      setData(result);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  // =============================
  // GET BALANCE
  // =============================
  const getBalance = async () => {
    try {
      const res = await fetch(`${API}/balance`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });

      const result = await res.json();

      setBalance(result.balance);
      setIncome(result.income);
      setExpense(result.expense);
    } catch (err) {}
  };

  // =============================
  // ADD / UPDATE
  // =============================
  const addTransaction = async () => {
    try {
      const url = editId ? `${API}/update/${editId}` : `${API}/add`;

      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({
          title,
          amount,
          category,
          type,
        }),
      });

      const result = await res.json();

      alert(result.message);

      setTitle("");
      setAmount("");
      setCategory("");
      setType("expense");
      setEditId(null);

      getData();
      getBalance();
    } catch (err) {
      alert("Failed");
    }
  };

  // =============================
  // DELETE
  // =============================
  const deleteTransaction = async (id) => {
    try {
      const res = await fetch(`${API}/delete/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });

      const result = await res.json();
      alert(result.message);

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
    setType(item.type);
    setEditId(item.id);
  };

  // =============================
  // AUTO LOGIN
  // =============================
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      setIsLoggedIn(true);
      getData();
      getBalance();
    }
  }, []);

  const filteredData = data.filter((item) => {
    if (activeTab === "all") return true;
    return item.type === activeTab;
  });

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div style={{ padding: "30px", maxWidth: "900px", margin: "auto" }}>
        <h1>Expense Tracker</h1>

        {/* BALANCE */}
        <h3>Balance ₹{balance}</h3>
        <h4>Income ₹{income}</h4>
        <h4>Expense ₹{expense}</h4>

        {/* LOGIN */}
        {!isLoggedIn && (
          <div>
            <h2>Register / Login</h2>

            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <br />
            <br />

            <button onClick={register}>Register</button>
            <button onClick={login}>Login</button>

            <br />
            <br />

            {/* GOOGLE BUTTON */}
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => alert("Google Login Failed")}
            />
          </div>
        )}

        {/* AFTER LOGIN */}
        {isLoggedIn && (
          <div>
            <h3>Welcome {loggedUser}</h3>
            <button onClick={logout}>Logout</button>

            <hr />

            <h2>Add Transaction</h2>

            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select</option>

              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>

            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>

            <button onClick={addTransaction}>
              {editId ? "Update" : "Add"}
            </button>

            <hr />

            <button onClick={() => setActiveTab("all")}>All</button>
            <button onClick={() => setActiveTab("income")}>Income</button>
            <button onClick={() => setActiveTab("expense")}>Expense</button>
            <button onClick={() => setActiveTab("analytics")}>Analytics</button>
            <button onClick={() => setActiveTab("budget")}>Budget</button>

            <hr />

            {activeTab === "analytics" && (
              <Charts token={localStorage.getItem("token")} />
            )}

            {activeTab === "budget" && (
              <Budget token={localStorage.getItem("token")} />
            )}

            {activeTab !== "analytics" &&
              activeTab !== "budget" &&
              filteredData.map((item) => (
                <div key={item.id}>
                  <b>{item.title}</b> | ₹{Math.abs(item.amount)} |{" "}
                  {item.category} | {item.type}

                  <button onClick={() => editTransaction(item)}>Edit</button>

                  <button onClick={() => deleteTransaction(item.id)}>
                    Delete
                  </button>
                </div>
              ))}

            {loading && <p>Loading...</p>}
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;