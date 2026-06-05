# Business Billing & Inventory Management — Backend

Node.js + Express + MongoDB REST API with MVC architecture.

---

## 📁 Project Structure

```
server/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── productController.js
│   ├── customerController.js
│   └── billController.js
├── middleware/
│   ├── asyncHandler.js        # Wraps async routes
│   ├── errorHandler.js        # Centralized error handler
│   └── notFound.js            # 404 handler
├── models/
│   ├── Product.js
│   ├── Customer.js
│   ├── Bill.js
│   └── Counter.js             # Auto-increment bill numbers
├── routes/
│   ├── productRoutes.js
│   ├── customerRoutes.js
│   └── billRoutes.js
├── services/
│   ├── productService.js      # Business logic
│   ├── customerService.js
│   └── billService.js         # Atomic stock deduction + bill calc
├── app.js                     # Express app config
├── server.js                  # Entry point
├── .env.example
└── package.json
```

---

## ⚙️ Installation & Setup

```bash
# 1. Clone / enter the server directory
cd server

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
# Edit .env with your MongoDB URI

# 4. Start development server
npm run dev

# 5. Start production server
npm start
```

---

## 🔐 Environment Variables (.env)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/billing_db
NODE_ENV=development
```

> For MongoDB Atlas: `MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/billing_db`

---

## 📡 API Endpoints

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | /api/health                     | Health check             |
| POST   | /api/products                   | Create product           |
| GET    | /api/products                   | Get all products         |
| GET    | /api/products/:id               | Get single product       |
| PUT    | /api/products/:id               | Update product           |
| DELETE | /api/products/:id               | Delete product           |
| PATCH  | /api/products/:id/add-stock     | Add stock to product     |
| POST   | /api/customers                  | Create customer          |
| GET    | /api/customers                  | Get all customers        |
| GET    | /api/customers/:id              | Get single customer      |
| PUT    | /api/customers/:id              | Update customer          |
| POST   | /api/bills                      | Create bill (deducts stock) |
| GET    | /api/bills                      | Get all bills            |
| GET    | /api/bills/:id                  | Get single bill          |

---

## 🧪 Postman Test Examples

### ✅ Health Check
```
GET http://localhost:5000/api/health
```

---

### 📦 PRODUCTS

**Create Product**
```
POST http://localhost:5000/api/products
Content-Type: application/json

{
  "name": "Wireless Mouse",
  "price": 499,
  "stock": 100,
  "gstPercentage": 18
}
```

**Get All Products**
```
GET http://localhost:5000/api/products
```

**Update Product**
```
PUT http://localhost:5000/api/products/<productId>
Content-Type: application/json

{
  "name": "Wireless Mouse Pro",
  "price": 599,
  "gstPercentage": 18
}
```

**Add Stock**
```
PATCH http://localhost:5000/api/products/<productId>/add-stock
Content-Type: application/json

{
  "quantity": 50
}
```

**Delete Product**
```
DELETE http://localhost:5000/api/products/<productId>
```

---

### 👤 CUSTOMERS

**Create Customer**
```
POST http://localhost:5000/api/customers
Content-Type: application/json

{
  "name": "Rahul Sharma",
  "phone": "9876543210",
  "address": "123 MG Road, Mumbai"
}
```

**Get All Customers**
```
GET http://localhost:5000/api/customers
```

**Update Customer**
```
PUT http://localhost:5000/api/customers/<customerId>
Content-Type: application/json

{
  "phone": "9999988888",
  "address": "456 Park Street, Delhi"
}
```

---

### 🧾 BILLS

**Create Bill**
```
POST http://localhost:5000/api/bills
Content-Type: application/json

{
  "customerId": "<customerId>",
  "items": [
    {
      "productId": "<productId1>",
      "quantity": 2
    },
    {
      "productId": "<productId2>",
      "quantity": 1
    }
  ],
  "discount": 50,
  "receivedAmount": 1000,
  "date": "2024-01-15T10:00:00.000Z"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "billNumber": 1,
    "customer": {
      "_id": "...",
      "name": "Rahul Sharma",
      "phone": "9876543210",
      "address": "123 MG Road, Mumbai"
    },
    "items": [
      {
        "product": { "_id": "...", "name": "Wireless Mouse", "price": 499 },
        "quantity": 2,
        "rate": 499,
        "total": 998
      }
    ],
    "totalQty": 2,
    "subtotal": 998,
    "discount": 50,
    "gst": 179.64,
    "totalAmount": 1127.64,
    "receivedAmount": 1000,
    "balance": 127.64,
    "date": "2024-01-15T10:00:00.000Z"
  }
}
```

**Insufficient Stock — Error Response:**
```json
{
  "success": false,
  "message": "Insufficient stock for \"Wireless Mouse\". Available: 1, Requested: 5"
}
```

**Get All Bills**
```
GET http://localhost:5000/api/bills
```

**Get Bill by ID**
```
GET http://localhost:5000/api/bills/<billId>
```

---

## ⚙️ Bill Calculation Logic

```
Line Total   = rate × quantity
Subtotal     = sum of all line totals
GST Amount   = sum of (lineTotal × product.gstPercentage / 100)
Total Amount = Subtotal − Discount + GST
Balance      = Total Amount − Received Amount
```

All calculations are done **server-side**. The frontend only needs to send `customerId`, `items[]`, `discount`, and `receivedAmount`.

---

## 🔒 Stock Safety

- Stock is deducted **atomically** using MongoDB transactions.
- The update query uses `{ stock: { $gte: quantity } }` — this means the deduction **only happens if stock is sufficient**.
- If any item fails, the **entire transaction is rolled back**, preventing partial deductions.
- Stock can **never go negative** — enforced at both schema and query level.

---

## 🌐 React Frontend Integration

All responses follow a consistent shape:

```json
// Success
{ "success": true, "data": { ... } }
{ "success": true, "count": 10, "data": [ ... ] }

// Error
{ "success": false, "message": "Human-readable error message" }
```

Example `fetch` from React:

```js
// Create a bill
const res = await fetch('http://localhost:5000/api/bills', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId,
    items: cartItems.map(i => ({ productId: i._id, quantity: i.qty })),
    discount,
    receivedAmount,
  }),
});
const data = await res.json();
if (!data.success) throw new Error(data.message);
```

CORS is enabled for all origins by default. Lock it down in production:

```js
// app.js
app.use(cors({ origin: 'https://your-frontend.com' }));
```
