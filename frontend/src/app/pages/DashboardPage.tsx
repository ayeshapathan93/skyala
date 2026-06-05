import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import KPICard from "../components/KPICard";
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  Warehouse,
  ArrowUpRight,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api, type DashboardData } from "../lib/api";

const formatCurrency = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const creditTotal = useMemo(
    () => (data?.creditOutstanding || []).reduce((sum, row) => sum + row.totalOutstanding, 0),
    [data]
  );

  const revenueChart = useMemo(
    () =>
      (data?.revenueTrend || []).map((row) => ({
        name: new Date(row._id).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
        revenue: row.revenue,
        orders: row.orders,
      })),
    [data]
  );

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  if (error || !data) {
    return (
      <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4">
        {error || "Dashboard unavailable"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Today's Revenue" value={formatCurrency(data.dailySales.total)} icon={DollarSign} gradient="indigo" />
        <KPICard title="Monthly Revenue" value={formatCurrency(data.monthlySales.total)} icon={TrendingUp} gradient="violet" />
        <KPICard title="Total Customers" value={data.totalCustomers} icon={Users} gradient="cyan" />
        <KPICard title="Total Products" value={data.totalProducts} icon={Package} gradient="emerald" />
        <KPICard title="Outstanding Credit" value={formatCurrency(creditTotal)} icon={AlertTriangle} gradient="amber" />
        <KPICard title="Low Stock Items" value={data.lowStockProducts.length} icon={Warehouse} gradient="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg">Revenue Trend</h3>
              <p className="text-sm text-muted-foreground">Last 7 days</p>
            </div>
            <Link to="/reports" className="text-sm text-primary hover:underline flex items-center gap-1">
              View Details <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          {revenueChart.length === 0 ? (
            <p className="text-muted-foreground text-sm py-16 text-center">No sales data yet. Create your first bill!</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#2471A3" strokeWidth={3} dot={{ fill: "#2471A3", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg">Daily Orders</h3>
              <p className="text-sm text-muted-foreground">This week</p>
            </div>
          </div>
          {revenueChart.length === 0 ? (
            <p className="text-muted-foreground text-sm py-16 text-center">No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip />
                <Bar dataKey="orders" fill="#27AE60" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Low Stock Alerts</h3>
            <Link to="/inventory" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          {data.lowStockProducts.length === 0 ? (
            <p className="text-muted-foreground text-sm">All products are adequately stocked.</p>
          ) : (
            <div className="space-y-4">
              {data.lowStockProducts.map((item) => {
                const threshold = item.minimumStockLevel || 10;
                const pct = Math.min(100, Math.round((item.stock / threshold) * 100));
                return (
                  <div key={item._id} className="flex items-center justify-between p-4 bg-accent/30 rounded-xl">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Current: {item.stock} | Min: {threshold}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-destructive">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Top Products (This Month)</h3>
          {data.topProducts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No product sales yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((product) => (
                <div key={product._id} className="flex justify-between p-3 bg-accent/30 rounded-xl">
                  <span className="font-medium text-sm truncate">{product.name}</span>
                  <span className="text-sm">{formatCurrency(product.totalRevenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Recent Bills</h3>
            <Link to="/bills" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          {data.recentBills.length === 0 ? (
            <p className="text-muted-foreground text-sm">No bills created yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentBills.map((bill) => (
                <Link
                  key={bill._id}
                  to={`/bills/${bill._id}`}
                  className="flex items-center justify-between p-4 bg-accent/30 rounded-xl hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{bill.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">{bill.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(bill.totalAmount)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      bill.paymentStatus === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>
                      {bill.paymentStatus}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Credit Outstanding</h3>
            <Link to="/customers" className="text-sm text-primary hover:underline flex items-center gap-1">
              View Customers <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          {data.creditOutstanding.length === 0 ? (
            <p className="text-muted-foreground text-sm">No outstanding credit.</p>
          ) : (
            <div className="space-y-3">
              {data.creditOutstanding.map((row) => (
                <Link
                  key={row._id}
                  to={`/customers/${row._id}`}
                  className="flex items-center justify-between p-4 bg-accent/30 rounded-xl hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{row.customerName}</p>
                    <p className="text-sm text-muted-foreground">{row.billCount} bill(s)</p>
                  </div>
                  <p className="font-medium text-warning">{formatCurrency(row.totalOutstanding)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
