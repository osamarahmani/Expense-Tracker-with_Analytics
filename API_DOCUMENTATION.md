# Expense Tracker API Documentation

Base URL: `http://localhost:5000`

---

## 1. Register User
- **Method:** POST
- **URL:** `/register`
- **Request Body:**
```json
{
  "name": "Ram",
  "email": "ram@gmail.com",
  "password": "123456"
}
```
- **Success Response:**
```json
{
  "message": "User Registered Successfully"
}
```
- **Error Response:**
```json
{
  "error": "Email already registered"
}
```

---

## 2. Login User
- **Method:** POST
- **URL:** `/login`
- **Request Body:**
```json
{
  "email": "ram@gmail.com",
  "password": "123456"
}
```
- **Success Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "name": "Ram", "email": "ram@gmail.com" }
}
```

---

## 3. Add Transaction
- **Method:** POST
- **URL:** `/add`
- **Headers:** `Authorization: <token>`
- **Request Body:**
```json
{
  "title": "Lunch",
  "amount": 500,
  "category": "Food",
  "type": "expense"
}
```
- **Success Response:**
```json
{
  "message": "Transaction Added"
}
```

---

## 4. Get All Transactions
- **Method:** GET
- **URL:** `/all`
- **Headers:** `Authorization: <token>`
- **Success Response:**
```json
[
  {
    "id": 1,
    "title": "Lunch",
    "amount": -500,
    "category": "Food",
    "type": "expense",
    "created_at": "2024-01-15"
  }
]
```

---

## 5. Update Transaction
- **Method:** PUT
- **URL:** `/update/:id`
- **Headers:** `Authorization: <token>`
- **Request Body:**
```json
{
  "title": "Dinner",
  "amount": 800,
  "category": "Food",
  "type": "expense"
}
```
- **Success Response:**
```json
{
  "message": "Transaction Updated"
}
```

---

## 6. Delete Transaction
- **Method:** DELETE
- **URL:** `/delete/:id`
- **Headers:** `Authorization: <token>`
- **Success Response:**
```json
{
  "message": "Transaction Deleted"
}
```

---

## 7. Get Balance
- **Method:** GET
- **URL:** `/balance`
- **Headers:** `Authorization: <token>`
- **Success Response:**
```json
{
  "balance": "5000.00",
  "income": "10000.00",
  "expense": "5000.00"
}
```

---

## 8. Monthly Report
- **Method:** GET
- **URL:** `/report?month=1&year=2024`
- **Headers:** `Authorization: <token>`
- **Success Response:**
```json
[
  {
    "category": "Food",
    "type": "expense",
    "total": "3000"
  }
]
```