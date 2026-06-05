import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Package, TrendingUp, DollarSign, Warehouse, AlertCircle } from "lucide-react";
import { api, type Product } from "../lib/api";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError("Product ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await api.getProduct(id);
        setProduct(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load product details");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Link to="/products" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Products
        </Link>
        <div className="flex items-center justify-center p-12 bg-card border border-border rounded-2xl">
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <Link to="/products" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Products
        </Link>
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error || "Product not found"}
        </div>
      </div>
    );
  }

  const getStatus = () => {
    if (product.stock <= 0) return "out-of-stock";
    if (product.stock <= (product.minimumStockLevel || 10)) return "low-stock";
    return "in-stock";
  };

  const status = getStatus();

  return (
    <div className="space-y-6">
      <Link to="/products" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-5 h-5" />
        Back to Products
      </Link>

      {/* Product Header */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === 'in-stock' ? 'bg-success/10 text-success' :
            status === 'low-stock' ? 'bg-warning/10 text-warning' :
            'bg-destructive/10 text-destructive'
          }`}>
            {status.replace(/-/g, ' ')}
          </span>
        </div>
        <p className="text-muted-foreground mb-6">Quality product in {product.category || "Uncategorized"} category</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Category</p>
            <p className="font-medium">{product.category || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Stock</p>
            <p className="font-medium">{product.stock} {product.unit || "pcs"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Selling Price</p>
            <p className="text-xl font-bold text-success">Rs. {(product.sellingPrice || product.price || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Purchase Price</p>
            <p className="font-medium">Rs. {(product.purchasePrice || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Min. Stock Level</p>
            <p className="font-medium">{product.minimumStockLevel || 10} {product.unit || "pcs"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">GST Rate</p>
            <p className="font-medium">{product.gstRate || 0}%</p>
          </div>
          {product.hsnCode && (
            <div>
              <p className="text-sm text-muted-foreground">HSN Code</p>
              <p className="font-mono text-sm">{product.hsnCode}</p>
            </div>
          )}
          {product.supplier && (
            <div>
              <p className="text-sm text-muted-foreground">Supplier</p>
              <p className="font-medium text-sm">{product.supplier}</p>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stock</p>
              <p className="text-2xl font-bold">{product.stock}</p>
              <p className="text-xs text-muted-foreground">{product.unit || "pcs"}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Selling Price</p>
              <p className="text-2xl font-bold">Rs. {(product.sellingPrice || product.price || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-brand-green">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cost Price</p>
              <p className="text-2xl font-bold">Rs. {(product.purchasePrice || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
              <Warehouse className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profit Margin</p>
              <p className="text-2xl font-bold">
                {((((product.sellingPrice || product.price || 0) - (product.purchasePrice || 0)) / (product.purchasePrice || 1)) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Information
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between pb-4 border-b border-border">
              <span className="text-muted-foreground">Product Name</span>
              <span className="font-medium">{product.name}</span>
            </div>
            <div className="flex justify-between pb-4 border-b border-border">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">{product.category || "Uncategorized"}</span>
            </div>
            <div className="flex justify-between pb-4 border-b border-border">
              <span className="text-muted-foreground">Unit</span>
              <span className="font-medium">{product.unit || "pcs"}</span>
            </div>
            {product.barcode && (
              <div className="flex justify-between pb-4 border-b border-border">
                <span className="text-muted-foreground">Barcode</span>
                <span className="font-mono text-sm">{product.barcode}</span>
              </div>
            )}
            {product.hsnCode && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">HSN Code</span>
                <span className="font-mono">{product.hsnCode}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Pricing & Stock
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between pb-4 border-b border-border">
              <span className="text-muted-foreground">Purchase Price</span>
              <span className="font-medium">Rs. {(product.purchasePrice || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between pb-4 border-b border-border">
              <span className="text-muted-foreground">Selling Price</span>
              <span className="font-bold text-success">Rs. {(product.sellingPrice || product.price || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between pb-4 border-b border-border">
              <span className="text-muted-foreground">MRP</span>
              <span className="font-medium">Rs. {(product.mrp || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between pb-4 border-b border-border">
              <span className="text-muted-foreground">Current Stock</span>
              <span className="font-medium">{product.stock} {product.unit || "pcs"}</span>
            </div>
            <div className="flex justify-between pb-4 border-b border-border">
              <span className="text-muted-foreground">Minimum Level</span>
              <span className="font-medium">{product.minimumStockLevel || 10} {product.unit || "pcs"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST Rate</span>
              <span className="font-medium">{product.gstRate || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {product.supplier && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold mb-4">Supplier Information</h3>
          <p className="text-muted-foreground">{product.supplier}</p>
        </div>
      )}
    </div>
  );
}
