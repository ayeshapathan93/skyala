import { useEffect, useState } from "react";
import { Building2, Save, Phone, MapPin, FileText } from "lucide-react";
import { api, type BusinessProfile } from "../lib/api";

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    businessName: "",
    phone: "",
    phone2: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstNumber: "",
    termsAndConditions: "",
    thankYouMessage: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.getBusiness()
      .then((business: BusinessProfile) => {
        setFormData({
          businessName: business.businessName || "",
          phone: business.phone || "",
          phone2: business.phone2 || "",
          address: business.address || "",
          city: business.city || "",
          state: business.state || "",
          pincode: business.pincode || "",
          gstNumber: business.gstNumber || "",
          termsAndConditions: business.termsAndConditions || "",
          thankYouMessage: business.thankYouMessage || "",
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.updateBusiness(formData);
      setMessage("Settings saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your business profile — shown on every invoice</p>
      </div>

      {error && <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4">{error}</div>}
      {message && <div className="bg-success/10 text-success border border-success/20 rounded-xl p-4">{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Business Profile</h3>
              <p className="text-sm text-muted-foreground">Owner and shop details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium mb-2">Business Name</label>
              <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} required className="w-full px-4 py-2.5 bg-accent/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block font-medium mb-2">Phone</label>
              <div className="relative">
                <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-accent/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div>
              <label className="block font-medium mb-2">Alternate Phone</label>
              <input type="tel" name="phone2" value={formData.phone2} onChange={handleChange} className="w-full px-4 py-2.5 bg-accent/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block font-medium mb-2">City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2.5 bg-accent/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block font-medium mb-2">State</label>
              <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-2.5 bg-accent/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block font-medium mb-2">Pincode</label>
              <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="w-full px-4 py-2.5 bg-accent/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium mb-2">Address</label>
              <div className="relative">
                <MapPin className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
                <textarea name="address" value={formData.address} onChange={handleChange} rows={3} className="w-full pl-10 pr-4 py-2.5 bg-accent/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Tax & Invoice</h3>
              <p className="text-sm text-muted-foreground">GST and invoice footer text</p>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block font-medium mb-2">GST Number</label>
              <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="w-full px-4 py-2.5 bg-accent/50 border border-border rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block font-medium mb-2">Terms & Conditions</label>
              <textarea name="termsAndConditions" value={formData.termsAndConditions} onChange={handleChange} rows={4} className="w-full px-4 py-2.5 bg-accent/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
            <div>
              <label className="block font-medium mb-2">Thank You Message</label>
              <textarea name="thankYouMessage" value={formData.thankYouMessage} onChange={handleChange} rows={3} className="w-full px-4 py-2.5 bg-accent/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-brand disabled:opacity-50">
            <Save className="w-5 h-5" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
