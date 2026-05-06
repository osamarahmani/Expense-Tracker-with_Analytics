import { useState, useEffect } from "react";

function App() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [data, setData] = useState([]);
  const [balance, setBalance] = useState(0);

  const API = "http://localhost:5000";

  //  GET DATA
  const getData = async () => {
    const res = await fetch(`${API}/all`);
    const result = await res.json();
    setData(result);
  };

  //  GET BALANCE
  const getBalance = async () => {
    const res = await fetch(`${API}/balance`);
    const result = await res.json();
    setBalance(result.balance);
  };

  //  ADD
  const addExpense = async () => {
    await fetch(`${API}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, amount, category }),
    });

    setTitle("");
    setAmount("");
    setCategory("");

    getData();
    getBalance();
  };

  //  DELETE
  const deleteExpense = async (id) => {
    await fetch(`${API}/delete/${id}`, {
      method: "DELETE",
    });

    getData();
    getBalance();
  };

  useEffect(() => {
    getData();
    getBalance();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>💰 Expense Tracker</h2>

      <h3>Balance: {balance}</h3>

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

      <input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      <button onClick={addExpense}>Add</button>

      <ul>
        {data.map((item) => (
          <li key={item.id}>
            {item.title} - {item.amount} ({item.category})
            <button onClick={() => deleteExpense(item.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;