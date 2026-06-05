import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Mail, Phone, MapPin, FileText, DollarSign, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import BillActionIcons from "../components/BillActionIcons";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api, type Bill, type Customer } from "../lib/api";

const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [outstanding, setOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [settling, setSettling] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Customer not found");
      setLoading(false);
      return;
    }

    api.customerHistory(id, 1, 50)
      .then((history) => {
        setCustomer(history.customer);
        setBills(history.bills);
        setOutstanding(history.outstandingBalance);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load customer"))
      .finally(() => setLoading(false));
  }, [id]);

  const totalPurchases = useMemo(
    () => bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0),
    [bills]
  );

  const purchaseTrend = useMemo(() => {
    const byMonth: Record<string, number> = {};
    bills.forEach((bill) => {
      const date = bill.billDate ? new Date(bill.billDate) : new Date();
      const key = date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      byMonth[key] = (byMonth[key] || 0) + (bill.totalAmount || 0);
    });
    return Object.entries(byMonth).map(([month, amount]) => ({ month, amount }));
  }, [bills]);

  const handleSettle = async () => {
    if (!id || !settleAmount) return;
    const amount = Number(settleAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setError("Enter a valid payment amount");
      return;
    }
    if (amount > outstanding) {
      setError(`Amount cannot exceed outstanding balance (₹${outstanding.toLocaleString("en-IN")})`);
      return;
    }
    setSettling(true);
    setError("");
    setSuccessMsg("");
    try {
      await api.settleCredit(id, { amount, note: "Payment received" });
      const history = await api.customerHistory(id, 1, 50);
      setBills(history.bills);
      setOutstanding(history.outstandingBalance);
      setSettleAmount("");
      setSuccessMsg(`Payment of ₹${amount.toLocaleString("en-IN")} recorded successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Settlement failed");
    } finally {
      setSettling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link to="/customers" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Customers
        </Link>
        <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-2xl">Loading customer...</div>
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="space-y-6">
        <Link to="/customers" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Customers
        </Link>
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="space-y-6">
      <Link to="/customers" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-5 h-5" />
        Back to Customers
      </Link>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4">{error}</div>
      )}
      {successMsg && (
        <div className="bg-secondary text-secondary-foreground border border-primary/20 rounded-xl p-4">{successMsg}</div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl font-bold">{customer.name.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{customer.name}</h1>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 bg-success/10 text-success capitalize">
                {customer.type || "retailer"}
              </span>
            </div>
          </div>
          {outstanding > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Amount"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                className="w-32 px-3 py-2 bg-accent/50 border border-border rounded-xl"
              />
              <button
                onClick={handleSettle}
                disabled={settling || !settleAmount}
                className="btn-brand py-2 px-4 text-sm disabled:opacity-50"
              >
                {settling ? "Settling..." : "Settle Payment"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Purchases</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPurchases)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold text-warning">{formatCurrency(outstanding)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Bills</p>
              <p className="text-2xl font-bold">{bills.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-4">Contact Information</h3>
            <div className="space-y-3">
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium">{customer.address}</p>
                  </div>
                </div>
              )}
              {customer.createdAt && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Customer Since</p>
                    <p className="font-medium">{new Date(customer.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          {customer.gstNumber && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold mb-4">GST Information</h3>
              <p className="font-mono font-bold">{customer.gstNumber}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {purchaseTrend.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold mb-4">Purchase Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={purchaseTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="#6366F1" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-4">Bill History</h3>
            {bills.length === 0 ? (
              <p className="text-muted-foreground text-sm">No bills yet for this customer.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-accent/50 border-b border-border">
                    <tr>
                      <th className="text-left p-4 font-medium">Invoice #</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-right p-4 font-medium">Amount</th>
                      <th className="text-center p-4 font-medium">Status</th>
                      <th className="text-center p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill) => (
                      <tr key={bill._id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                        <td className="p-4 font-medium">{bill.invoiceNumber}</td>
                        <td className="p-4 text-sm">
                          {bill.billDate ? new Date(bill.billDate).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="p-4 text-right font-bold">{formatCurrency(bill.totalAmount)}</td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            bill.paymentStatus === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                          }`}>
                            {bill.paymentStatus}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col items-center gap-2">
                            <BillActionIcons
                              billId={bill._id}
                              invoiceNumber={bill.invoiceNumber}
                              customerPhone={bill.customerPhone || customer.phone}
                              totalAmount={bill.totalAmount}
                              balanceAmount={bill.balanceAmount}
                              billDate={bill.billDate}
                            />
                            <Link to={`/bills/${bill._id}`} className="text-primary hover:underline text-xs font-medium">
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
