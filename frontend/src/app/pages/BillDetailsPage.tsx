import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, AlertCircle, MapPin, Phone } from "lucide-react";
import { api, type Bill } from "../lib/api";
import BillActionIcons from "../components/BillActionIcons";

export default function BillDetailsPage() {
  const { id } = useParams();
  const [bill, setBill] = useState<Bill | null>(null);
  const [invoiceHtml, setInvoiceHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Bill not found");
      setLoading(false);
      return;
    }
    Promise.all([api.getBill(id), api.fetchBillHtml(id)])
      .then(([billData, html]) => {
        setBill(billData);
        setInvoiceHtml(html);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load invoice"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Link to="/bills" className="inline-flex items-center gap-2 text-muted-foreground min-h-[44px]">
          <ArrowLeft className="w-5 h-5" /> Back
        </Link>
        <div className="card-surface p-12 text-center text-muted-foreground">Loading invoice...</div>
      </div>
    );
  }

  if (error && !bill) {
    return (
      <div className="space-y-4">
        <Link to="/bills" className="inline-flex items-center gap-2 text-muted-foreground min-h-[44px]">
          <ArrowLeft className="w-5 h-5" /> Back
        </Link>
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 flex gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      </div>
    );
  }

  if (!bill || !id) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Link to="/bills" className="inline-flex items-center gap-2 text-muted-foreground min-h-[44px]">
        <ArrowLeft className="w-5 h-5" /> Back to Bills
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="page-title truncate">{bill.invoiceNumber}</h1>
          <p className="page-subtitle truncate font-medium">{bill.customerName || "Walk-in Customer"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(bill.billDate).toLocaleDateString("en-IN")}
            {bill.customerPhone ? (
              <span className="inline-flex items-center gap-1 ml-2">
                <Phone className="w-3 h-3" /> {bill.customerPhone}
              </span>
            ) : null}
          </p>
          {bill.customerAddress ? (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1">
              <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{bill.customerAddress}</span>
            </p>
          ) : null}
        </div>

        <BillActionIcons
          billId={id}
          invoiceNumber={bill.invoiceNumber}
          customerPhone={bill.customerPhone}
          totalAmount={bill.totalAmount}
          balanceAmount={bill.balanceAmount}
          billDate={bill.billDate}
        />
      </div>

      {error && <div className="bg-destructive/10 text-destructive rounded-xl p-3 text-sm">{error}</div>}

      <div className="card-surface overflow-hidden">
        {invoiceHtml ? (
          <iframe
            title="Invoice preview"
            srcDoc={invoiceHtml}
            className="w-full min-h-[70dvh] sm:min-h-[700px] border-0 bg-white"
          />
        ) : (
          <p className="p-12 text-center text-muted-foreground">Preview unavailable</p>
        )}
      </div>
    </div>
  );
}
