import { useEffect, useMemo, useState, Fragment } from "react";
import { Link } from "react-router";
import { Download, Plus, Phone, MapPin, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import BillActionIcons from "../components/BillActionIcons";
import SearchBar from "../components/SearchBar";
import { api, type Bill } from "../lib/api";
import { exportBillsToExcel } from "../lib/exportUtils";

interface CustomerGroup {
  key: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  bills: Bill[];
  totalAmount: number;
  balanceAmount: number;
}

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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const handleExport = () => {
    exportBillsToExcel(bills);
  };

  const loadBills = () => {
    setLoading(true);
    api.bills({ limit: 100 })
      .then((result) => setBills(result.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load bills"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBills();
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

  const handleDeleteBill = async (billId: string, invoiceNumber: string) => {
    if (!window.confirm(`Delete bill "${invoiceNumber}"? This will restore product stock and cannot be undone.`)) {
      return;
    }
    setError("");
    try {
      await api.deleteBill(billId);
      // Reload bills
      const result = await api.bills({ limit: 100 });
      setBills(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete bill");
    }
  };

  const grouped = useMemo(() => {
    const groupsMap = new Map<string, CustomerGroup>();

    for (const bill of filteredBills) {
      let key = "";
      if (bill.customerId) {
        key = bill.customerId;
      } else {
        key = `walkin-${bill.customerName || "Walk-in Customer"}-${bill.customerPhone || ""}`;
      }

      const existing = groupsMap.get(key);
      if (existing) {
        existing.bills.push(bill);
        existing.totalAmount += bill.totalAmount;
        existing.balanceAmount += bill.balanceAmount || 0;
      } else {
        groupsMap.set(key, {
          key,
          customerId: bill.customerId || "",
          customerName: bill.customerName || "Walk-in Customer",
          customerPhone: bill.customerPhone || "",
          customerAddress: bill.customerAddress || "",
          bills: [bill],
          totalAmount: bill.totalAmount,
          balanceAmount: bill.balanceAmount || 0,
        });
      }
    }

    return Array.from(groupsMap.values());
  }, [filteredBills]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Bill History</h1>
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
      ) : grouped.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">No bills found</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-accent/40 border-b border-border text-sm font-semibold text-muted-foreground">
                <th className="p-4 w-12 text-center"></th>
                <th className="p-4 w-[240px] max-w-[240px]">Customer</th>
                <th className="p-4 w-[150px] max-w-[150px] hidden sm:table-cell">Phone</th>
                <th className="p-4 w-[100px] max-w-[100px] text-center">Bills</th>
                <th className="p-4 w-[150px] max-w-[150px] text-right">Total Billed</th>
                <th className="p-4 w-[150px] max-w-[150px] text-right text-warning font-semibold">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {grouped.map((group) => {
                const isExpanded = !!expandedGroups[group.key];
                return (
                  <Fragment key={group.key}>
                    <tr
                      className="hover:bg-accent/20 transition-all cursor-pointer select-none"
                      onClick={() => toggleGroup(group.key)}
                    >
                      <td className="p-4 text-center">
                        <button className="p-1 hover:bg-accent rounded-lg transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </td>
                      <td className="p-4 w-[240px] max-w-[240px] break-words whitespace-normal">
                        <div className="font-semibold text-foreground text-sm sm:text-base break-words whitespace-normal">{group.customerName}</div>
                        {group.customerAddress && (
                          <div className="text-xs text-muted-foreground flex items-start gap-1 mt-0.5 break-words whitespace-normal">
                            <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                            <span>{group.customerAddress}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 w-[150px] max-w-[150px] text-sm hidden sm:table-cell">
                        {group.customerPhone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {group.customerPhone}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </td>
                      <td className="p-4 w-[100px] max-w-[100px] text-center text-sm font-medium">
                        <span className="px-2.5 py-1 bg-accent rounded-full text-xs font-bold">{group.bills.length}</span>
                      </td>
                      <td className="p-4 w-[150px] max-w-[150px] text-right text-sm font-semibold">
                        Rs. {group.totalAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="p-4 w-[150px] max-w-[150px] text-right text-sm font-bold text-warning">
                        Rs. {group.balanceAmount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-accent/5">
                        <td colSpan={6} className="p-4 border-t border-border">
                          <div className="overflow-x-auto rounded-xl border border-border bg-card/60 p-2 shadow-inner">
                            <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                              <thead>
                                <tr className="border-b border-border/80 font-semibold text-muted-foreground">
                                  <th className="p-2.5">Date</th>
                                  <th className="p-2.5">Invoice Number</th>
                                  <th className="p-2.5 text-center">Type</th>
                                  <th className="p-2.5 text-center">Status</th>
                                  <th className="p-2.5 text-right">Amount</th>
                                  <th className="p-2.5 text-right">Balance</th>
                                  <th className="p-2.5 text-right pr-4">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/40">
                                {group.bills.map((bill) => {
                                  const status = billStatus(bill);
                                  return (
                                    <tr key={bill._id} className="hover:bg-accent/30 transition-colors">
                                      <td className="p-2.5 font-medium whitespace-nowrap">
                                        {new Date(bill.billDate).toLocaleDateString("en-IN")}
                                      </td>
                                      <td className="p-2.5">
                                        <Link
                                          to={`/bills/${bill._id}`}
                                          className="text-primary font-semibold hover:underline"
                                        >
                                          {bill.invoiceNumber}
                                        </Link>
                                      </td>
                                      <td className="p-2.5 text-center capitalize font-medium">{bill.paymentType}</td>
                                      <td className="p-2.5 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(status)}`}>
                                          {status}
                                        </span>
                                      </td>
                                      <td className="p-2.5 text-right font-semibold">
                                        Rs. {bill.totalAmount.toLocaleString("en-IN")}
                                      </td>
                                      <td className="p-2.5 text-right font-semibold text-warning">
                                        Rs. {(bill.balanceAmount || 0).toLocaleString("en-IN")}
                                      </td>
                                      <td className="p-2.5 text-right pr-4">
                                        <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                          <BillActionIcons
                                            billId={bill._id}
                                            invoiceNumber={bill.invoiceNumber}
                                            customerPhone={bill.customerPhone}
                                            totalAmount={bill.totalAmount}
                                            balanceAmount={bill.balanceAmount}
                                            billDate={bill.billDate}
                                          />
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleDeleteBill(bill._id, bill.invoiceNumber);
                                            }}
                                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors ml-1"
                                            title="Delete Bill"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
