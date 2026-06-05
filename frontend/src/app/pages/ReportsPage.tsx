import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, DollarSign, Users, Package } from "lucide-react";
import KPICard from "../components/KPICard";
import { api, type DashboardData } from "../lib/api";

const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function ReportsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.dashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load reports"))
      .finally(() => setLoading(false));
  }, []);

  const revenueChart = useMemo(
    () =>
      (data?.revenueTrend || []).map((row) => ({
        date: new Date(row._id).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        revenue: row.revenue,
        orders: row.orders,
      })),
    [data]
  );

  const paymentBreakdown = useMemo(() => {
    if (!data?.recentBills?.length) return [];
    const counts = { cash: 0, online: 0, credit: 0 };
    data.recentBills.forEach((bill) => {
      if (bill.paymentType in counts) counts[bill.paymentType as keyof typeof counts] += 1;
    });
    const total = counts.cash + counts.online + counts.credit || 1;
    return [
      { name: "Cash", value: Math.round((counts.cash / total) * 100), color: "#6366F1" },
      { name: "Online", value: Math.round((counts.online / total) * 100), color: "#8B5CF6" },
      { name: "Credit", value: Math.round((counts.credit / total) * 100), color: "#06B6D4" },
    ];
  }, [data]);

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">Loading reports...</div>;
  }

  if (error || !data) {
    return (
      <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4">
        {error || "Reports unavailable"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Live data from your bills, products, and customers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Revenue" value={formatCurrency(data.totalSales.total)} icon={DollarSign} gradient="indigo" />
        <KPICard title="Monthly Revenue" value={formatCurrency(data.monthlySales.total)} icon={TrendingUp} gradient="emerald" />
        <KPICard title="Total Customers" value={data.totalCustomers} icon={Users} gradient="cyan" />
        <KPICard title="Total Bills" value={data.totalSales.count} icon={Package} gradient="violet" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-6">Revenue Trend (Last 7 Days)</h3>
        {revenueChart.length === 0 ? (
          <p className="text-muted-foreground text-sm py-12 text-center">Create bills to see revenue trends.</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={3} name="Revenue (₹)" />
              <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={3} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-6">Top Products (This Month)</h3>
          {data.topProducts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No product sales data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" stroke="#64748B" />
                <YAxis dataKey="name" type="category" stroke="#64748B" width={120} />
                <Tooltip />
                <Bar dataKey="totalRevenue" fill="#6366F1" radius={[0, 8, 8, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-6">Recent Payment Mix</h3>
          <div className="space-y-3">
            {paymentBreakdown.map((segment) => (
              <div key={segment.name} className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span className="font-medium">{segment.name}</span>
                </div>
                <span className="font-bold">{segment.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-bold text-lg">Top Selling Products</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent/50 border-b border-border">
              <tr>
                <th className="text-left p-4 font-medium">Product</th>
                <th className="text-right p-4 font-medium">Units Sold</th>
                <th className="text-right p-4 font-medium">Revenue</th>
                <th className="text-right p-4 font-medium">Avg Price</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">No sales data yet</td>
                </tr>
              ) : (
                data.topProducts.map((product, index) => (
                  <tr key={product._id} className="border-b border-border last:border-0 hover:bg-accent/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{index + 1}</span>
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-medium">{product.totalQuantity}</td>
                    <td className="p-4 text-right font-medium">{formatCurrency(product.totalRevenue)}</td>
                    <td className="p-4 text-right font-medium">
                      {formatCurrency(Math.round(product.totalRevenue / (product.totalQuantity || 1)))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
