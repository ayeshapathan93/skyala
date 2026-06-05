import { useEffect, useState, useMemo } from "react";
import { Package, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import SearchBar from "../components/SearchBar";
import { api, type Product } from "../lib/api";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.products({ limit: 100, sort: "stock" });
      setProducts(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const getStockStatus = (product: Product) => {
    const threshold = product.lowStockThreshold ?? product.minimumStockLevel ?? 10;
    if (product.stock <= 0) return "out-of-stock";
    if (product.stock <= threshold) return "low-stock";
    return "in-stock";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return "bg-success/10 text-success";
      case "low-stock":
        return "bg-warning/10 text-warning";
      case "out-of-stock":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(query);
      
      if (stockFilter === "all") return matchesSearch;
      const status = getStockStatus(product);
      return matchesSearch && status === stockFilter;
    });
  }, [products, searchQuery, stockFilter]);

  const stats = useMemo(() => {
    return {
      total: products.length,
      inStock: products.filter((p) => getStockStatus(p) === "in-stock").length,
      lowStock: products.filter((p) => getStockStatus(p) === "low-stock").length,
      outOfStock: products.filter((p) => getStockStatus(p) === "out-of-stock").length,
    };
  }, [products]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">
          Inventory Management
        </h1>
        <p className="text-muted-foreground mt-1">Track all product stock levels and manage inventory</p>
      </div>

      <div className="search-toolbar">
        <div className="flex flex-col md:flex-row gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by product name..."
            variant="inline"
          />

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2.5 bg-accent/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="all">All Stock Levels</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {error && <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Products</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">In Stock</p>
          <p className="text-2xl font-bold text-success">{stats.inStock}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Low Stock</p>
          <p className="text-2xl font-bold text-warning">{stats.lowStock}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-destructive">{stats.outOfStock}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent/50 border-b border-border">
              <tr>
                <th className="text-left p-4 font-medium">Product</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-right p-4 font-medium">Current Stock</th>
                <th className="text-right p-4 font-medium">Min. Level</th>
                <th className="text-center p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading inventory...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No products found</td></tr>
              ) : filteredProducts.map((product, index) => {
                const status = getStockStatus(product);
                const minLevel = product.lowStockThreshold ?? product.minimumStockLevel ?? 10;
                const isLow = product.stock <= minLevel;

                return (
                  <motion.tr
                    key={product._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border-b border-border last:border-0 hover:bg-accent/30 transition-colors ${isLow ? "bg-warning/5" : ""}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">ID: {product._id?.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{product.category || "Uncategorized"}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <span className="font-bold">{product.stock}</span>
                        <span className="text-muted-foreground text-sm">{product.unit || "pcs"}</span>
                        {isLow && status !== "out-of-stock" && (
                          <AlertCircle className="w-4 h-4 text-warning" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm text-muted-foreground">{minLevel}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {status.replace(/-/g, " ")}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
