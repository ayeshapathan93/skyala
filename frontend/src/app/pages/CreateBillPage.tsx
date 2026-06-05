import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Minus, Trash2, Save, User, UserPlus, Package } from "lucide-react";
import { motion } from "motion/react";
import { api, type Customer, type Product } from "../lib/api";
import SearchBar from "../components/SearchBar";

interface BillItem {
  id: string;
  product: Product;
  quantity: number;
  discount: number;
}

type CustomerMode = "walkin" | "saved";

const productPrice = (product: Product) => product.price ?? product.sellingPrice ?? 0;

export default function CreateBillPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerMode, setCustomerMode] = useState<CustomerMode>("walkin");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [walkIn, setWalkIn] = useState({ name: "", phone: "", address: "" });
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [paymentType, setPaymentType] = useState<"cash" | "online" | "credit">("cash");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gstPercent, setGstPercent] = useState(0);
  const [previewNumber, setPreviewNumber] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.customers({ limit: 100 }), api.products({ limit: 100 }), api.previewBillNumber()])
      .then(([customerResult, productResult, invoiceNumber]) => {
        setCustomers(customerResult.data);
        setProducts(productResult.data);
        setPreviewNumber(invoiceNumber);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load billing data"))
      .finally(() => setLoading(false));
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone || "").includes(customerSearch) ||
        (c.address || "").toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q));
  }, [products, productSearch]);

  const addProduct = (product: Product) => {
    const existing = billItems.find((item) => item.product._id === product._id);
    if (existing) {
      setBillItems(
        billItems.map((item) =>
          item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setBillItems([...billItems, { id: Date.now().toString(), product, quantity: 1, discount: 0 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setBillItems(
      billItems.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const updateDiscount = (id: string, discount: number) => {
    setBillItems(billItems.map((item) => (item.id === id ? { ...item, discount } : item)));
  };

  const subtotal = billItems.reduce((sum, item) => {
    const itemTotal = productPrice(item.product) * item.quantity;
    return sum + itemTotal - (itemTotal * item.discount) / 100;
  }, 0);

  const gstAmount = subtotal * (gstPercent / 100);
  const total = subtotal + gstAmount;
  const dueAmount = Math.max(0, total - receivedAmount);

  const billCustomerName =
    customerMode === "saved"
      ? selectedCustomer?.name || "Walk-in Customer"
      : walkIn.name.trim() || "Walk-in Customer";

  const billCustomerPhone = customerMode === "saved" ? selectedCustomer?.phone || "" : walkIn.phone.trim();
  const billCustomerAddress = customerMode === "saved" ? selectedCustomer?.address || "" : walkIn.address.trim();
  const billCustomerEmail = customerMode === "saved" ? selectedCustomer?.email || "" : "";
  const billCustomerGST = customerMode === "saved" ? selectedCustomer?.gstNumber || "" : "";

  const saveBill = async () => {
    if (!billItems.length) {
      setError("Add at least one product before saving the bill.");
      return;
    }
    if (customerMode === "saved" && !selectedCustomer) {
      setError("Select a customer from the list, or switch to Walk-in Customer.");
      return;
    }

    if (saving) return;

    setSaving(true);
    setError("");
    try {
      const bill = await api.createBill({
        customerId: customerMode === "saved" ? selectedCustomer?._id || null : null,
        customerName: billCustomerName,
        customerPhone: billCustomerPhone,
        customerEmail: billCustomerEmail,
        customerAddress: billCustomerAddress,
        customerGST: billCustomerGST,
        items: billItems.map((item) => ({
          productId: item.product._id,
          name: item.product.name,
          unit: item.product.unit || "pcs",
          quantity: item.quantity,
          rate: Number((productPrice(item.product) * (1 - item.discount / 100)).toFixed(2)),
        })),
        discountPercent: 0,
        gstPercent,
        receivedAmount,
        paymentType,
        billDate: new Date().toISOString().slice(0, 10),
        saveCustomer: false,
      });
      navigate(`/bills/${bill._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save bill");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="page-title">Create Bill</h1>
        <p className="page-subtitle">
          Generate a new invoice{previewNumber ? ` · Next: ${previewNumber}` : ""}
        </p>
      </div>

      {error && <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer section */}
          <div className="card-surface p-4 sm:p-6">
            <h3 className="font-bold mb-3">Customer Details</h3>

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setCustomerMode("walkin");
                  setSelectedCustomer(null);
                }}
                className={`px-3 py-2 rounded-xl text-sm font-medium min-h-[44px] flex items-center gap-2 ${
                  customerMode === "walkin" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Walk-in (not in list)
              </button>
              <button
                type="button"
                onClick={() => setCustomerMode("saved")}
                className={`px-3 py-2 rounded-xl text-sm font-medium min-h-[44px] flex items-center gap-2 ${
                  customerMode === "saved" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                }`}
              >
                <User className="w-4 h-4" />
                Saved Customer
              </button>
            </div>

            {customerMode === "walkin" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Bill for someone not in your customer list. They will <strong>not</strong> be saved automatically.
                </p>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">Name on bill</span>
                  <input
                    className="input-field"
                    placeholder="e.g. Unknown / Guest name"
                    value={walkIn.name}
                    onChange={(e) => setWalkIn({ ...walkIn, name: e.target.value })}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">Phone (optional — for WhatsApp)</span>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="10-digit mobile"
                    value={walkIn.phone}
                    onChange={(e) => setWalkIn({ ...walkIn, phone: e.target.value })}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">Address (optional)</span>
                  <textarea
                    className="input-field resize-none"
                    rows={2}
                    placeholder="Village / area on invoice"
                    value={walkIn.address}
                    onChange={(e) => setWalkIn({ ...walkIn, address: e.target.value })}
                  />
                </label>
              </div>
            ) : selectedCustomer ? (
              <div className="p-4 bg-accent/30 rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-lg">{selectedCustomer.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.phone || "No phone"}</p>
                    {selectedCustomer.address && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedCustomer.address}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-sm text-destructive hover:underline shrink-0"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <SearchBar
                  value={customerSearch}
                  onChange={setCustomerSearch}
                  placeholder="Search saved customers..."
                  variant="inline"
                  className="mb-2"
                />
                {loading ? (
                  <p className="text-muted-foreground text-sm p-2">Loading customers...</p>
                ) : filteredCustomers.length === 0 ? (
                  <p className="text-muted-foreground text-sm p-2">
                    No customers found. Use &quot;Walk-in (not in list)&quot; for unknown buyers.
                  </p>
                ) : (
                  <div className="max-h-56 overflow-y-auto border border-border rounded-xl divide-y divide-border">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer._id}
                        type="button"
                        onClick={() => setSelectedCustomer(customer)}
                        className="w-full p-3 hover:bg-accent/40 text-left flex items-center gap-3 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{customer.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {customer.phone || "No phone"}
                            {customer.address ? ` · ${customer.address}` : ""}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Products section */}
          <div className="card-surface p-4 sm:p-6">
            <h3 className="font-bold mb-3">Add Products</h3>
            <SearchBar
              value={productSearch}
              onChange={setProductSearch}
              placeholder="Search products..."
              variant="inline"
              className="mb-3"
            />
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading products...</p>
            ) : filteredProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No products found. Add products first.</p>
            ) : (
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="w-full min-w-[480px]">
                  <thead className="bg-accent/50 border-b border-border">
                    <tr>
                      <th className="text-left p-3 font-medium text-sm">Product</th>
                      <th className="text-right p-3 font-medium text-sm">Stock</th>
                      <th className="text-right p-3 font-medium text-sm">Rate</th>
                      <th className="text-center p-3 font-medium text-sm">Add</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product._id} className="border-b border-border last:border-0">
                        <td className="p-3 font-medium">{product.name}</td>
                        <td className="p-3 text-right text-sm text-muted-foreground">{product.stock}</td>
                        <td className="p-3 text-right text-sm font-medium">Rs. {productPrice(product)}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => addProduct(product)}
                            disabled={product.stock <= 0}
                            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 min-w-[40px] min-h-[40px] inline-flex items-center justify-center"
                            title="Add to bill"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {billItems.length > 0 && (
            <div className="card-surface overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-bold">Bill Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <thead className="bg-accent/50 border-b border-border">
                    <tr>
                      <th className="text-left p-3 font-medium text-sm">Item</th>
                      <th className="text-center p-3 font-medium text-sm">Qty</th>
                      <th className="text-center p-3 font-medium text-sm">Disc %</th>
                      <th className="text-right p-3 font-medium text-sm">Amount</th>
                      <th className="p-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((item, index) => {
                      const lineTotal =
                        productPrice(item.product) * item.quantity * (1 - item.discount / 100);
                      return (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-b border-border last:border-0"
                        >
                          <td className="p-3">
                            <p className="font-medium text-sm">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">Rs. {productPrice(item.product)}</p>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={item.discount}
                              onChange={(e) => updateDiscount(item.id, Number(e.target.value))}
                              className="w-16 px-2 py-1.5 bg-muted border border-border rounded-lg text-center text-sm"
                            />
                          </td>
                          <td className="p-3 text-right font-medium text-sm">Rs. {lineTotal.toFixed(2)}</td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => setBillItems(billItems.filter((row) => row.id !== item.id))}
                              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card-surface p-4 sm:p-6 lg:sticky lg:top-24">
            <h3 className="font-bold mb-4">Invoice Summary</h3>
            <div className="p-3 bg-accent/30 rounded-xl mb-4 text-sm">
              <p className="text-muted-foreground">Customer on bill</p>
              <p className="font-semibold">{billCustomerName}</p>
              {billCustomerPhone && <p className="text-muted-foreground text-xs mt-0.5">{billCustomerPhone}</p>}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST ({gstPercent}%)</span>
                <span className="font-medium">Rs. {gstAmount.toFixed(2)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-bold text-xl">Rs. {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">GST %</label>
                <input
                  type="number"
                  min={0}
                  max={28}
                  value={gstPercent}
                  onChange={(e) => setGstPercent(Number(e.target.value))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Payment Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["cash", "online", "credit"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPaymentType(type)}
                      className={`py-2 rounded-lg font-medium text-sm transition-all min-h-[44px] ${
                        paymentType === type ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Received Amount</label>
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(Number(e.target.value))}
                  className="input-field"
                />
              </div>
              <div className="p-4 bg-accent/30 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Due Amount</span>
                  <span className={`font-bold text-lg ${dueAmount > 0 ? "text-warning" : "text-success"}`}>
                    Rs. {dueAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={saveBill}
              disabled={saving || !billItems.length}
              className="w-full btn-brand mt-6 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? "Saving..." : "Save & View Invoice"}
            </button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Walk-in bills print & download same as saved customer bills.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
