import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from "recharts";

const COLORS = ["#667eea","#11998e","#eb3349","#f6a623","#9b59b6","#1abc9c","#e67e22","#e74c3c","#3498db"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Charts({ token }) {
  const API = "http://localhost:5000";
  const [monthlyData, setMonthlyData]     = useState([]);
  const [categoryData, setCategoryData]   = useState([]);
  const [trendData, setTrendData]         = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear());
  const [loading, setLoading]             = useState(false);
  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API}/report?month=${selectedMonth}&year=${selectedYear}`,
        { headers: { Authorization: token } }
      );
      const data = await res.json();

      const catMap = {};
      data.forEach(row => {
        if (!catMap[row.category]) catMap[row.category] = 0;
        catMap[row.category] += parseFloat(row.total);
      });
      setCategoryData(
        Object.entries(catMap).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      );

      const income  = data.filter(r => r.type === "income").reduce((a, b) => a + parseFloat(b.total), 0);
      const expense = data.filter(r => r.type === "expense").reduce((a, b) => a + parseFloat(b.total), 0);
      setMonthlyData([
        { name: MONTHS[selectedMonth - 1], income: parseFloat(income.toFixed(2)), expense: parseFloat(expense.toFixed(2)) }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };const fetchTrend = async () => {
    try {
      const promises = MONTHS.map((_, i) =>
        fetch(`${API}/report?month=${i + 1}&year=${selectedYear}`, {
          headers: { Authorization: token }
        }).then(r => r.json())
      );
      const results = await Promise.all(promises);
      const trend = results.map((data, i) => {
        const income  = data.filter(r => r.type === "income").reduce((a, b) => a + parseFloat(b.total), 0);
        const expense = data.filter(r => r.type === "expense").reduce((a, b) => a + parseFloat(b.total), 0);
        return { 
          month: MONTHS[i], 
          income: parseFloat(income.toFixed(2)), 
          expense: parseFloat(expense.toFixed(2)) 
        };
      });
      setTrendData(trend);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchReport();
      fetchTrend();
    }
  }, [selectedMonth, selectedYear, token]);
  const cardStyle = {
    background: "white", borderRadius: "14px", padding: "24px",
    marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)"
  };
  const titleStyle = { 
    fontSize: "16px", fontWeight: "600", 
    color: "#1a1a2e", marginBottom: "16px", marginTop: 0 
  };
  const selectStyle = {
    padding: "8px 12px", borderRadius: "8px", 
    border: "1.5px solid #e2e8f0", fontSize: "14px", 
    marginRight: "10px", color: "#1a1a2e", background: "white"
  };

  if (loading) return <p style={{ textAlign:"center", color:"#888", padding:"40px" }}>Loading charts...</p>;

  return (
    <div>

      {/* Filter Row */}
      <div style={{ ...cardStyle, display:"flex", alignItems:"center", gap:"12px" }}>
        <span style={{ fontWeight:600, color:"#1a1a2e" }}>Filter:</span>
        <select style={selectStyle} value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
        </select>
        <select style={selectStyle} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {/* Income vs Expense Bar Chart */}
      <div style={cardStyle}>
        <h3 style={titleStyle}>📊 Income vs Expense — {MONTHS[selectedMonth-1]} {selectedYear}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData} margin={{ top:10, right:30, left:0, bottom:0 }}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={v => `₹${v}`} />
            <Legend />
            <Bar dataKey="income" fill="#11998e" radius={[6,6,0,0]} />
            <Bar dataKey="expense" fill="#eb3349" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Category Pie Chart */}
      <div style={cardStyle}>
        <h3 style={titleStyle}>🥧 Spending by Category — {MONTHS[selectedMonth-1]} {selectedYear}</h3>
        {categoryData.length === 0
          ? <p style={{ color:"#aaa", textAlign:"center", padding:"20px" }}>No data for this month</p>
          : <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={categoryData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={100} 
                  label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => `₹${v}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
        }
      </div>
      {/* Monthly Trend Line Chart */}
      <div style={cardStyle}>
        <h3 style={titleStyle}>📈 Monthly Trend — {selectedYear}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData} margin={{ top:10, right:30, left:0, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={v => `₹${v}`} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#11998e" 
              strokeWidth={2} 
              dot={{ r:4 }} 
            />
            <Line 
              type="monotone" 
              dataKey="expense" 
              stroke="#eb3349" 
              strokeWidth={2} 
              dot={{ r:4 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}