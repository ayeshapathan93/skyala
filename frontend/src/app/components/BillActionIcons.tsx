import { useState } from "react";
import { Download, Printer, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import {
  openInvoicePrintWindow,
  downloadBlob,
  openPdfBlob,
  isPdfBlob,
  generateInvoicePdfBlob,
  downloadInvoicePdfFromHtml,
} from "../lib/invoicePrint";

type BillActionIconsProps = {
  billId: string;
  invoiceNumber?: string;
  customerPhone?: string;
  totalAmount?: number;
  balanceAmount?: number;
  billDate?: string;
  className?: string;
};

const iconBtn =
  "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-40";

const htmlCache = new Map<string, string>();

export default function BillActionIcons({
  billId,
  invoiceNumber = "invoice",
  customerPhone,
  totalAmount = 0,
  balanceAmount = 0,
  billDate,
  className = "",
}: BillActionIconsProps) {
  const [busy, setBusy] = useState<"print" | "pdf" | null>(null);
  const [error, setError] = useState("");

  const loadHtml = async () => {
    if (htmlCache.has(billId)) return htmlCache.get(billId)!;
    const html = await api.fetchBillHtml(billId);
    htmlCache.set(billId, html);
    return html;
  };

  const resolvePdf = async (html: string) => {
    try {
      const { blob } = await api.downloadBillPdf(billId);
      if (await isPdfBlob(blob)) return blob;
    } catch {
      /* client fallback */
    }
    return generateInvoicePdfBlob(html);
  };

  const printBill = async () => {
    setBusy("print");
    setError("");
    try {
      const html = await loadHtml();
      openInvoicePrintWindow(html);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Print failed");
    } finally {
      setBusy(null);
    }
  };

  const downloadPdf = async () => {
    setBusy("pdf");
    setError("");
    try {
      const html = await loadHtml();
      const blob = await resolvePdf(html);
      const filename = `${invoiceNumber}.pdf`;
      if (blob && (await isPdfBlob(blob))) {
        downloadBlob(blob, filename);
        openPdfBlob(blob);
        return;
      }
      const ok = await downloadInvoicePdfFromHtml(html, filename);
      if (!ok) setError("PDF failed. Use Print.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={printBill}
          disabled={busy !== null}
          title="Print"
          aria-label="Print invoice"
          className={`${iconBtn} border border-border bg-card text-foreground hover:bg-accent`}
        >
          {busy === "print" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={downloadPdf}
          disabled={busy !== null}
          title="Download PDF"
          aria-label="Download PDF"
          className={`${iconBtn} bg-primary text-primary-foreground hover:opacity-90`}
        >
          {busy === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive mt-1 max-w-[200px]">{error}</p>}
    </div>
  );
}
