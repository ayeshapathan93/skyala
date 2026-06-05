# SKYLA API Documentation

**Base URL:** `http://localhost:5000`  
**Auth:** `Authorization: Bearer <JWT_TOKEN>` (except login/refresh/health)  
**Content-Type:** `application/json`

---

## Response format

**Success:**
```json
{ "success": true, "data": { ... } }
```

**List (paginated):**
```json
{ "success": true, "data": [], "total": 100, "page": 1, "totalPages": 5 }
```

**Error:**
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

---

## Auth

### POST `/api/auth/login` (public)
```json
{ "email": "admin@skyla.local", "password": "Skyala@123" }
```
**Response data:**
```json
{
  "token": "jwt...",
  "refreshToken": "jwt...",
  "user": { "id": "...", "name": "Shop Owner", "email": "...", "role": "admin" },
  "business": { "_id": "...", "businessName": "Skyla Organic & Herbal", "phone": "9970603386", ... }
}
```

### POST `/api/auth/refresh` (public)
```json
{ "refreshToken": "jwt..." }
```
**Response:** `{ "token": "new_jwt..." }`

### GET `/api/auth/me` (protected)
**Response:** `{ "user": { "id", "name", "email", "role" }, "businessId": "..." }`

### GET `/api/auth/business` (protected)
**Response:** Full Business document.

### PUT `/api/auth/business` (protected)
```json
{
  "businessName": "Skyla Organic & Herbal",
  "address": "At Bhoisamudraga, Post Harangul Bk",
  "city": "Latur",
  "state": "Maharashtra",
  "pincode": "413531",
  "gstNumber": "",
  "phone": "9970603386",
  "phone2": "9970338001",
  "termsAndConditions": "Add Your Terms and Conditions Here",
  "thankYouMessage": "Thank you for your business!"
}
```

> **Note:** There is no `/api/auth/register`. Admin is seeded from `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).

---

## Dashboard

### GET `/api/dashboard` (protected)
**Response data:**
```json
{
  "totalCustomers": 48,
  "totalProducts": 156,
  "totalSales": { "total": 420000, "count": 120 },
  "dailySales": { "total": 12450, "count": 5 },
  "weeklySales": { "total": 89000, "count": 32 },
  "monthlySales": { "total": 320000, "count": 95 },
  "revenueTrend": [{ "_id": "2026-05-25", "revenue": 12000, "orders": 4 }],
  "topProducts": [{ "_id": "...", "name": "Agroshine", "totalQuantity": 31, "totalRevenue": 9920 }],
  "lowStockProducts": [{ "_id": "...", "name": "...", "stock": 3, "minimumStockLevel": 5 }],
  "creditOutstanding": [{ "_id": "customerId", "customerName": "...", "totalOutstanding": 19180, "billCount": 2 }],
  "recentBills": [{ "_id": "...", "invoiceNumber": "SKYLA-2026-000001", "customerName": "...", "totalAmount": 19180 }],
  "notifications": []
}
```

### GET `/api/dashboard/notifications?unreadOnly=true&page=1&limit=20`
### PATCH `/api/dashboard/notifications/:id/read`
### PATCH `/api/dashboard/notifications/read-all`

---

## Products

### GET `/api/products?search=&category=&status=all|low|out&page=1&limit=20&sort=createdAt_desc`

### GET `/api/products/search?q=agro`

### GET `/api/products/:id`

### POST `/api/products`
```json
{
  "name": "Agroshine (250gm)",
  "sku": "AGR-250",
  "category": "Fertilizer",
  "purchasePrice": 2800,
  "sellingPrice": 3200,
  "mrp": 3200,
  "gstRate": 0,
  "hsnCode": "",
  "unit": "250gm",
  "stock": 25,
  "minimumStockLevel": 5,
  "barcode": "",
  "supplier": ""
}
```

### PUT `/api/products/:id` — partial update (same fields)

### DELETE `/api/products/:id`

### GET `/api/products/:id/history` — stock movement history

---

## Stock

### POST `/api/stock/update`
```json
{
  "productId": "64abc...",
  "change": 10,
  "type": "purchase",
  "note": "Restocked from supplier"
}
```
`type`: `purchase` | `sale` | `adjustment` | `return`

### GET `/api/stock/activity?days=30`

---

## Customers

### GET `/api/customers?q=&page=1&limit=20`

### GET `/api/customers/search?q=rabbani`

### GET `/api/customers/:id`

### POST `/api/customers`
```json
{
  "name": "Rabbani Ghdusab Masuldar",
  "phone": "8432646964",
  "email": "",
  "address": "At Post Nanand",
  "gstNumber": "",
  "notes": "",
  "type": "retailer"
}
```

### PUT `/api/customers/:id`

### DELETE `/api/customers/:id`

### GET `/api/customers/:id/history?page=1&limit=20`
**Response data:**
```json
{
  "customer": { ... },
  "bills": [ ... ],
  "outstandingBalance": 19180,
  "total": 5,
  "page": 1,
  "totalPages": 1
}
```

### POST `/api/customers/:id/settle`
```json
{ "amount": 5000, "note": "Partial payment", "billId": "optional_bill_id" }
```

---

## Bills

### GET `/api/bills/preview-number`
**Response:** `{ "invoiceNumber": "SKYLA-2026-000057" }`

### POST `/api/bills`
```json
{
  "customerId": "64abc..." ,
  "customerName": "Rabbani Ghdusab Masuldar",
  "customerPhone": "8432646964",
  "customerAddress": "At Post Nanand",
  "items": [
    {
      "productId": "64def...",
      "name": "Agroshine (250gm)",
      "unit": "250gm",
      "quantity": 1,
      "rate": 3200
    }
  ],
  "discountPercent": 0,
  "gstPercent": 0,
  "receivedAmount": 0,
  "paymentType": "credit",
  "dueDate": "2026-07-01",
  "billDate": "2026-05-31",
  "notes": "",
  "saveCustomer": false
}
```
`paymentType`: `cash` | `online` | `credit`

### GET `/api/bills?q=&paymentType=all|cash|online|credit&from=&to=&page=1&limit=20`

### GET `/api/bills/:id` — bill with items[]

### GET `/api/bills/:id/html` — printable invoice HTML (Bearer or `?token=`)

### GET `/api/bills/:id/pdf` — PDF download

### GET `/api/bills/credit/outstanding`

---

## Health

### GET `/api/health` (public)
### GET `/api/docs` — Swagger UI
