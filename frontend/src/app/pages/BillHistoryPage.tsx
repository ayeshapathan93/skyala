import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Download, FileText, Plus, Phone, MapPin } from "lucide-react";
import BillActionIcons from "../components/BillActionIcons";
import SearchBar from "../components/SearchBar";
import { motion } from "motion/react";
import { api, type Bill } from "../lib/api";
import { exportBillsToExcel } from "../lib/exportUtils";

const billStatus = (bill: Bill) => {
  if (bill.paymentStatus === "paid") return "paid";
  if ((bill.balanceAmount || 0) > 0) return "pending";
  return bill.paymentStatus;
};

export default function BillHistoryPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleExport = () => {
    exportBillsToExcel(bills);
  };

  useEffect(() => {
    api.bills({ limit: 100 })
      .then((result) => setBills(result.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load bills"))
      .finally(() => setLoading(false));
  }, []);

  const filteredBills = bills.filter((bill) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      bill.invoiceNumber.toLowerCase().includes(query) ||
      (bill.customerName || "").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || billStatus(bill) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-success/10 text-success";
      case "pending": return "bg-warning/10 text-warning";
      case "overdue": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Bill History
          </h1>
          <p className="text-muted-foreground mt-1">View and manage all invoices</p>
        </div>
        <Link to="/bills/create" className="btn-brand">
          <Plus className="w-5 h-5" />
          Create Bill
        </Link>
      </div>

      <div className="search-toolbar">
        <div className="flex flex-col md:flex-row gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by invoice ID or customer..."
            variant="inline"
          />

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-accent/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>

          <button className="px-4 py-2.5 border border-border rounded-xl hover:bg-accent transition-colors flex items-center gap-2" onClick={handleExport}>
            <Download className="w-5 h-5" />
            <span className="hidden md:inline">Export</span>
          </button>
        </div>
      </div>

      {error && <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Bills</p>
          <p className="text-2xl font-bold">{bills.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Paid</p>
          <p className="text-2xl font-bold text-success">{bills.filter((b) => billStatus(b) === "paid").length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-bold text-warning">{bills.filter((b) => billStatus(b) === "pending").length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
          <p className="text-2xl font-bold text-primary">Rs. {bills.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">Loading bills...</div>
      ) : filteredBills.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">No bills found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBills.map((bill, index) => {
            const status = billStatus(bill);
            return (
              <motion.div
                key={bill._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
              >
                <div className="bg-primary/10 p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Invoice</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>{status}</span>
                  </div>
                  <h3 className="text-2xl font-bold">{bill.invoiceNumber}</h3>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{bill.customerName || "Walk-in Customer"}</p>
                      <p className="text-sm text-muted-foreground">{new Date(bill.billDate).toLocaleDateString()}</p>
                      {bill.customerPhone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {bill.customerPhone}
                        </p>
                      )}
                      {bill.customerAddress && (
                        <p className="text-xs text-muted-foreground flex items-start gap-1 mt-0.5 line-clamp-1">
                          <MapPin className="w-3 h-3 shrink-0" /> {bill.customerAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-xl font-bold">Rs. {bill.totalAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Payment</span>
                    <span className="text-sm font-medium capitalize">{bill.paymentType}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 mt-2 border-t border-border">
                    <Link to={`/bills/${bill._id}`} className="text-sm text-primary font-medium hover:underline">
                      View Details
                    </Link>
                    <BillActionIcons
                      billId={bill._id}
                      invoiceNumber={bill.invoiceNumber}
                      customerPhone={bill.customerPhone}
                      totalAmount={bill.totalAmount}
                      balanceAmount={bill.balanceAmount}
                      billDate={bill.billDate}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
