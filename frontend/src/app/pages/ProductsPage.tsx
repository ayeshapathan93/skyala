import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { api, type Product } from "../lib/api";
import RowActions from "../components/RowActions";
import SearchBar from "../components/SearchBar";
import { validateRequired, validatePositiveNumber, validateSellingPrice } from "../lib/validation";

type ProductForm = {
  name: string;
  category: string;
  purchasePrice: string;
  sellingPrice: string;
  mrp: string;
  gstRate: string;
  stock: string;
  minimumStockLevel: string;
};

const emptyForm: ProductForm = {
  name: "",
  category: "",
  purchasePrice: "0",
  sellingPrice: "",
  mrp: "0",
  gstRate: "0",
  stock: "0",
  minimumStockLevel: "10",
};

const productId = (p: Product) => p._id || "";
const productPrice = (p: Product) => p.price ?? p.sellingPrice ?? 0;

const getStatus = (p: Product) => {
  const min = p.minimumStockLevel ?? 10;
  if (p.stock <= 0) return "out-of-stock";
  if (p.stock <= min) return "low-stock";
  return "in-stock";
};

const statusClass = (st: string) => {
  if (st === "in-stock") return "bg-success/10 text-success";
  if (st === "low-stock") return "bg-warning/10 text-warning";
  return "bg-destructive/10 text-destructive";
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.products({ limit: 100 });
      setProducts(r.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(productId(p));
    setForm({
      name: p.name,
      category: p.category || "",
      purchasePrice: String(p.purchasePrice ?? 0),
      sellingPrice: String(p.sellingPrice ?? p.price ?? ""),
      mrp: String(p.mrp ?? 0),
      gstRate: String(p.gstRate ?? 0),
      stock: String(p.stock ?? 0),
      minimumStockLevel: String(p.minimumStockLevel ?? 10),
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Delete product "${p.name}"? This cannot be undone.`)) return;
    setError("");
    try {
      await api.deleteProduct(productId(p));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const n = validateRequired(form.name, "Name");
    if (n) errs.name = n;
    const s = validateSellingPrice(form.sellingPrice, form.purchasePrice);
    if (s) errs.sellingPrice = s;
    const st = validatePositiveNumber(form.stock, "Stock", false);
    if (st) errs.stock = st;
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      purchasePrice: Number(form.purchasePrice || 0),
      sellingPrice: Number(form.sellingPrice),
      mrp: Number(form.mrp || 0),
      gstRate: Number(form.gstRate || 0),
      unit: "pcs",
      stock: Number(form.stock || 0),
      minimumStockLevel: Number(form.minimumStockLevel || 10),
    };
    try {
      if (editingId) await api.updateProduct(editingId, payload);
      else await api.createProduct(payload);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Inventory & pricing</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-brand w-full sm:w-auto">
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name or category..." />

      {error && <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-sm">{error}</div>}

      <div className="card-surface overflow-hidden">
        {loading ? (
          <p className="text-center py-10 text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">No products found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead className="bg-accent/50 border-b border-border">
                <tr>
                  <th className="text-left p-3 sm:p-4 font-medium text-sm">Product</th>
                  <th className="text-left p-3 sm:p-4 font-medium text-sm hidden sm:table-cell">Category</th>
                  <th className="text-right p-3 sm:p-4 font-medium text-sm">Stock</th>
                  <th className="text-right p-3 sm:p-4 font-medium text-sm">Price</th>
                  <th className="text-center p-3 sm:p-4 font-medium text-sm">Status</th>
                  <th className="text-center p-3 sm:p-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const id = productId(p);
                  const st = getStatus(p);
                  return (
                    <tr key={id} className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
                      <td className="p-3 sm:p-4 font-medium">{p.name}</td>
                      <td className="p-3 sm:p-4 text-sm text-muted-foreground hidden sm:table-cell">{p.category || "General"}</td>
                      <td className="p-3 sm:p-4 text-right text-sm">{p.stock}</td>
                      <td className="p-3 sm:p-4 text-right text-sm font-medium">Rs. {productPrice(p).toLocaleString("en-IN")}</td>
                      <td className="p-3 sm:p-4 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusClass(st)}`}>
                          {st.replace(/-/g, " ")}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4">
                        <RowActions viewTo={`/products/${id}`} onEdit={() => openEdit(p)} onDelete={() => handleDelete(p)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-card">
              <h2 className="font-bold">{editingId ? "Edit Product" : "Add Product"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submit} className="p-4 space-y-4">
              <label className="block space-y-1">
                <span className="text-sm font-medium">Product Name *</span>
                <input className={`input-field ${formErrors.name ? "border-destructive" : ""}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                {formErrors.name && <span className="text-xs text-destructive">{formErrors.name}</span>}
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Category</span>
                <input className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-sm font-medium">Purchase Price</span>
                  <input type="number" min="0" className="input-field" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">Selling Price *</span>
                  <input type="number" min="0" className={`input-field ${formErrors.sellingPrice ? "border-destructive" : ""}`} value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
                  {formErrors.sellingPrice && <span className="text-xs text-destructive">{formErrors.sellingPrice}</span>}
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">MRP</span>
                  <input type="number" min="0" className="input-field" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium">GST %</span>
                  <input type="number" min="0" max="28" className="input-field" value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: e.target.value })} />
                </label>
                {!editingId && (
                  <label className="block space-y-1 col-span-2">
                    <span className="text-sm font-medium">Opening Stock</span>
                    <input type="number" min="0" className="input-field" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                  </label>
                )}
                <label className="block space-y-1 col-span-2">
                  <span className="text-sm font-medium">Minimum Stock Alert</span>
                  <input type="number" min="0" className="input-field" value={form.minimumStockLevel} onChange={(e) => setForm({ ...form, minimumStockLevel: e.target.value })} />
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 border border-border rounded-xl min-h-[48px]">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 btn-brand min-h-[48px] disabled:opacity-50">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
