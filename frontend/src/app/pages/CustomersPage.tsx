import { type FormEvent, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { api, type Customer } from "../lib/api";
import RowActions from "../components/RowActions";
import SearchBar from "../components/SearchBar";
import { validateRequired, validatePhone, validateEmail } from "../lib/validation";

const empty = {
  name: "",
  phone: "",
  email: "",
  address: "",
  gstNumber: "",
  notes: "",
  type: "retailer" as "retailer" | "wholesale",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.customers({ limit: 100 });
      setCustomers(r.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone || "").includes(searchQuery) ||
      (c.address || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(empty);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingId(c._id);
    setForm({
      name: c.name,
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      gstNumber: c.gstNumber || "",
      notes: c.notes || "",
      type: (c.type as "retailer" | "wholesale") || "retailer",
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (c: Customer) => {
    if (!window.confirm(`Delete customer "${c.name}"? This cannot be undone.`)) return;
    setError("");
    try {
      await api.deleteCustomer(c._id);
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
    const p = validatePhone(form.phone, true);
    if (p) errs.phone = p;
    const em = validateEmail(form.email);
    if (em) errs.email = em;
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    setError("");
    const payload = { ...form, name: form.name.trim(), phone: form.phone.trim() };
    try {
      if (editingId) await api.updateCustomer(editingId, payload);
      else await api.createCustomer(payload);
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
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Buyers & credit accounts</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-brand w-full sm:w-auto">
          <Plus className="w-5 h-5" /> Add Customer
        </button>
      </div>

      <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, phone, email or address..." />

      {error && <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-sm">{error}</div>}

      <div className="card-surface overflow-hidden">
        {loading ? (
          <p className="text-center py-10 text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">No customers found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-accent/50 border-b border-border">
                <tr>
                  <th className="text-left p-3 sm:p-4 font-medium text-sm">Name</th>
                  <th className="text-left p-3 sm:p-4 font-medium text-sm">Phone</th>
                  <th className="text-left p-3 sm:p-4 font-medium text-sm hidden md:table-cell">Address</th>
                  <th className="text-left p-3 sm:p-4 font-medium text-sm">Type</th>
                  <th className="text-center p-3 sm:p-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c._id} className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
                    <td className="p-3 sm:p-4 font-medium">{c.name}</td>
                    <td className="p-3 sm:p-4 text-sm text-muted-foreground">{c.phone || "—"}</td>
                    <td className="p-3 sm:p-4 text-sm text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                      {c.address || "—"}
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary capitalize">{c.type || "retailer"}</span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <RowActions
                        viewTo={`/customers/${c._id}`}
                        onEdit={() => openEdit(c)}
                        onDelete={() => handleDelete(c)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-card">
              <h2 className="font-bold">{editingId ? "Edit Customer" : "Add Customer"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submit} className="p-4 space-y-4">
              <label className="block space-y-1">
                <span className="text-sm font-medium">Name *</span>
                <input className={`input-field ${formErrors.name ? "border-destructive" : ""}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                {formErrors.name && <span className="text-xs text-destructive">{formErrors.name}</span>}
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Phone *</span>
                <input type="tel" className={`input-field ${formErrors.phone ? "border-destructive" : ""}`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                {formErrors.phone && <span className="text-xs text-destructive">{formErrors.phone}</span>}
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Email</span>
                <input type="email" className={`input-field ${formErrors.email ? "border-destructive" : ""}`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                {formErrors.email && <span className="text-xs text-destructive">{formErrors.email}</span>}
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Type</span>
                <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "retailer" | "wholesale" })}>
                  <option value="retailer">Retailer</option>
                  <option value="wholesale">Wholesale</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Address</span>
                <textarea className="input-field resize-none" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </label>
              <div className="flex gap-3">
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
