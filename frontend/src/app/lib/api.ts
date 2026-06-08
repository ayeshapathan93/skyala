const API_ROOT = import.meta.env.VITE_API_URL || "https://skyala.onrender.com";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${API_ROOT}/api`;

export type Product = {
  _id: string;
  name: string;
  sku?: string;
  category?: string;
  purchasePrice?: number;
  sellingPrice: number;
  price?: number;
  mrp?: number;
  gstRate?: number;
  hsnCode?: string;
  unit?: string;
  stock: number;
  minimumStockLevel?: number;
  lowStockThreshold?: number;
  barcode?: string;
  supplier?: string;
};

export type Customer = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
  type?: "retailer" | "wholesale";
  createdAt?: string;
};

export type BillItem = {
  _id?: string;
  productId: string;
  name: string;
  unit?: string;
  quantity: number;
  rate: number;
  total: number;
};

export type Bill = {
  _id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items?: BillItem[];
  subtotal?: number;
  totalQty?: number;
  discountPercent?: number;
  discountAmount?: number;
  gstPercent?: number;
  gstAmount?: number;
  totalAmount: number;
  receivedAmount?: number;
  balanceAmount?: number;
  paymentType: "cash" | "online" | "credit";
  paymentStatus: "paid" | "partial" | "unpaid";
  billDate: string;
  dueDate?: string;
  notes?: string;
};

export type StockMovement = {
  _id: string;
  change: number;
  quantityBefore: number;
  quantityAfter: number;
  type: string;
  note?: string;
  createdAt: string;
  billId?: { invoiceNumber: string; billDate: string };
};

export type BusinessProfile = {
  _id: string;
  businessName: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  phone?: string;
  phone2?: string;
  termsAndConditions?: string;
  thankYouMessage?: string;
};

export type Notification = {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type DashboardData = {
  totalCustomers: number;
  totalProducts: number;
  dailySales: { total: number; count: number };
  weeklySales: { total: number; count: number };
  monthlySales: { total: number; count: number };
  totalSales: { total: number; count: number };
  revenueTrend: Array<{ _id: string; revenue: number; orders: number }>;
  topProducts: Array<{ _id: string; name: string; totalQuantity: number; totalRevenue: number }>;
  lowStockProducts: Product[];
  creditOutstanding: Array<{
    _id: string;
    customerName: string;
    customerPhone?: string;
    totalOutstanding: number;
    billCount: number;
    oldestDue?: string;
  }>;
  recentBills: Bill[];
  notifications: Notification[];
};

export type CustomerHistory = {
  customer: Customer;
  bills: Bill[];
  outstandingBalance: number;
  total: number;
  page: number;
  totalPages: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: { code: string; message: string; details?: Array<{ field: string; message: string }> };
  total?: number;
  page?: number;
  totalPages?: number;
};

export type ListResponse<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
};

export const authStore = {
  getToken() {
    return localStorage.getItem("skyla_token");
  },
  setSession(data: { token: string; refreshToken?: string; user?: unknown; business?: unknown }) {
    localStorage.setItem("skyla_token", data.token);
    if (data.refreshToken) localStorage.setItem("skyla_refresh_token", data.refreshToken);
    if (data.user) localStorage.setItem("skyla_user", JSON.stringify(data.user));
    if (data.business) localStorage.setItem("skyla_business", JSON.stringify(data.business));
  },
  clear() {
    localStorage.removeItem("skyla_token");
    localStorage.removeItem("skyla_refresh_token");
    localStorage.removeItem("skyla_user");
    localStorage.removeItem("skyla_business");
  },
};

const buildUrl = (path: string, query?: Record<string, string | number | boolean | undefined>) => {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  });
  return url.toString();
};

function parseError(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const p = payload as ApiResponse<unknown>;
    if (p.error?.message) return p.error.message;
    if ("message" in p && typeof (p as { message?: string }).message === "string") {
      return (p as { message: string }).message;
    }
  }
  return "Request failed";
}

async function request<T>(path: string, options: RequestInit = {}, query?: Record<string, string | number | boolean | undefined>) {
  const token = authStore.getToken();
  const response = await fetch(buildUrl(path, query), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(parseError(payload));
  }

  return payload as ApiResponse<T>;
}

async function requestBlob(path: string): Promise<{ blob: Blob; filename: string }> {
  const token = authStore.getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    if (contentType.includes("application/json")) {
      const payload = await response.json();
      throw new Error(parseError(payload));
    }
    throw new Error("Failed to download file");
  }

  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer], {
    type: contentType.includes("pdf") ? "application/pdf" : contentType || "application/octet-stream",
  });

  if (path.includes("/pdf")) {
    const header = new TextDecoder().decode(arrayBuffer.slice(0, 5));
    if (!header.startsWith("%PDF")) {
      throw new Error("Server returned an invalid PDF. Using client generation.");
    }
  }
  
  // Extract filename from content-disposition header
  const cd = response.headers.get("content-disposition") || "";
  let filename = "download";
  
  // Try RFC 5987 format first: filename*=UTF-8''filename
  const match5987 = cd.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
  if (match5987) {
    filename = decodeURIComponent(match5987[1].replace(/"/g, "").trim());
  } else {
    // Fallback to RFC 2183 format: filename="filename"
    const match2183 = cd.match(/filename=(?:"([^"]*)"|([^;]+))/i);
    if (match2183) {
      filename = (match2183[1] || match2183[2] || "download").trim();
    }
  }
  
  // Ensure proper extension
  if (!filename.includes(".")) {
    if (contentType.includes("pdf")) filename += ".pdf";
    else if (contentType.includes("csv") || contentType.includes("spreadsheet")) filename += ".csv";
    else filename += ".bin";
  }
  
  return { blob, filename };
}

export const api = {
  async login(email: string, password: string) {
    const response = await request<{ token: string; refreshToken: string; user: unknown; business: BusinessProfile }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    );
    authStore.setSession(response.data);
    return response.data;
  },

  async me() {
    return (await request<{ user: { name: string; email: string; role: string }; businessId: string }>("/auth/me")).data;
  },

  async getBusiness() {
    return (await request<BusinessProfile>("/auth/business")).data;
  },

  async updateBusiness(payload: Partial<BusinessProfile>) {
    return (await request<BusinessProfile>("/auth/business", { method: "PUT", body: JSON.stringify(payload) })).data;
  },

  async dashboard() {
    return (await request<DashboardData>("/dashboard")).data;
  },

  async products(query?: { search?: string; category?: string; status?: string; page?: number; limit?: number; sort?: string }) {
    const response = await request<Product[]>("/products", {}, query);
    return { data: response.data, total: response.total ?? 0, page: response.page ?? 1, totalPages: response.totalPages ?? 1 };
  },

  async getProduct(id: string) {
    return (await request<Product>(`/products/${id}`)).data;
  },

  async createProduct(product: Record<string, unknown>) {
    return (await request<Product>("/products", { method: "POST", body: JSON.stringify(product) })).data;
  },

  async updateProduct(id: string, product: Record<string, unknown>) {
    return (await request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(product) })).data;
  },

  async deleteProduct(id: string) {
    await request(`/products/${id}`, { method: "DELETE" });
  },

  async productHistory(id: string) {
    return (await request<StockMovement[]>(`/products/${id}/history`)).data;
  },

  async stockUpdate(payload: { productId: string; change: number; type?: string; note?: string }) {
    return (await request<Product>("/stock/update", { method: "POST", body: JSON.stringify(payload) })).data;
  },

  async stockActivity(days = 30) {
    return (await request<Array<{ date: string; change: number }>>("/stock/activity", {}, { days })).data;
  },

  async customers(query?: { q?: string; page?: number; limit?: number }) {
    const response = await request<Customer[]>("/customers", {}, query);
    return { data: response.data, total: response.total ?? 0, page: response.page ?? 1, totalPages: response.totalPages ?? 1 };
  },

  async searchCustomers(q: string) {
    return (await request<Customer[]>("/customers/search", {}, { q })).data;
  },

  async getCustomer(id: string) {
    return (await request<Customer>(`/customers/${id}`)).data;
  },

  async createCustomer(customer: Record<string, unknown>) {
    return (await request<Customer>("/customers", { method: "POST", body: JSON.stringify(customer) })).data;
  },

  async updateCustomer(id: string, customer: Record<string, unknown>) {
    return (await request<Customer>(`/customers/${id}`, { method: "PUT", body: JSON.stringify(customer) })).data;
  },

  async deleteCustomer(id: string) {
    await request(`/customers/${id}`, { method: "DELETE" });
  },

  async customerHistory(id: string, page = 1, limit = 20) {
    return (await request<CustomerHistory>(`/customers/${id}/history`, {}, { page, limit })).data;
  },

  async settleCredit(customerId: string, payload: { amount: number; note?: string; billId?: string }) {
    return (await request<{ settled: number; remainingCredit: number }>(`/customers/${customerId}/settle`, {
      method: "POST",
      body: JSON.stringify(payload),
    })).data;
  },

  async bills(query?: { q?: string; paymentType?: string; from?: string; to?: string; page?: number; limit?: number }) {
    const response = await request<Bill[]>("/bills", {}, query);
    return { data: response.data, total: response.total ?? 0, page: response.page ?? 1, totalPages: response.totalPages ?? 1 };
  },

  async getBill(id: string) {
    return (await request<Bill>(`/bills/${id}`)).data;
  },

  async previewBillNumber() {
    return (await request<{ invoiceNumber: string }>("/bills/preview-number")).data.invoiceNumber;
  },

  async createBill(payload: Record<string, unknown>) {
    return (await request<Bill>("/bills", { method: "POST", body: JSON.stringify(payload) })).data;
  },

  async creditOutstanding() {
    return (await request<DashboardData["creditOutstanding"]>("/bills/credit/outstanding")).data;
  },

  async downloadBillPdf(id: string) {
    return requestBlob(`/bills/${id}/pdf`);
  },

  async deleteBill(id: string) {
    await request(`/bills/${id}`, { method: "DELETE" });
  },

  async fetchBillHtml(id: string): Promise<string> {
    const token = authStore.getToken();
    const response = await fetch(`${API_BASE_URL}/bills/${id}/html`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(parseError(payload));
    }
    return response.text();
  },

  getBillHtmlUrl(id: string) {
    const token = authStore.getToken();
    return `${API_BASE_URL}/bills/${id}/html${token ? `?token=${token}` : ""}`;
  },

  async notifications(query?: { unreadOnly?: boolean; page?: number; limit?: number }) {
    const response = await request<Notification[]>("/dashboard/notifications", {}, query);
    return { data: response.data, total: response.total ?? 0, page: response.page ?? 1, totalPages: response.totalPages ?? 1 };
  },

  async markNotificationRead(id: string) {
    await request(`/dashboard/notifications/${id}/read`, { method: "PATCH" });
  },

  async markAllNotificationsRead() {
    await request("/dashboard/notifications/read-all", { method: "PATCH" });
  },

  shareWhatsApp(phone: string, message: string) {
    const digits = phone.replace(/\D/g, "");
    const normalized = digits.length === 10 ? `91${digits}` : digits;
    window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  },
};
