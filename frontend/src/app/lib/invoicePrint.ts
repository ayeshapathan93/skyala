/** Print invoice HTML in a new window (mobile-friendly). */
export function openInvoicePrintWindow(html: string) {
  const doc = html.includes("<head>")
    ? html.replace("<head>", '<head><meta charset="utf-8"><meta name="viewport" content="width=794">')
    : `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;

  const win = window.open("", "_blank");
  if (!win) throw new Error("Pop-up blocked. Allow pop-ups to print the invoice.");
  win.document.open();
  win.document.write(doc);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 600);
}

export async function isPdfBlob(blob: Blob): Promise<boolean> {
  if (!blob || blob.size < 100) return false;
  const header = await blob.slice(0, 5).text();
  return header.startsWith("%PDF");
}

export function downloadBlob(blob: Blob, filename: string) {
  const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Open PDF in a new browser tab for viewing (mobile + desktop). */
export function openPdfBlob(blob: Blob) {
  const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
  const url = URL.createObjectURL(pdfBlob);
  const win = window.open(url, "_blank");
  if (!win) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

function waitForIframeLoad(iframe: HTMLIFrameElement): Promise<void> {
  return new Promise((resolve) => {
    const done = () => resolve();
    iframe.onload = done;
    setTimeout(done, 800);
  });
}

/** Client-side PDF from full invoice HTML using hidden iframe + html2pdf. */
export async function generateInvoicePdfBlob(html: string): Promise<Blob | null> {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "794px";
  iframe.style.height = "1123px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return null;
  }

  const fullHtml = html.includes("<!DOCTYPE") || html.includes("<html")
    ? html
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:0;background:#fff}</style></head><body>${html}</body></html>`;

  doc.open();
  doc.write(fullHtml);
  doc.close();
  await waitForIframeLoad(iframe);
  await new Promise((r) => setTimeout(r, 300));

  try {
    const mod = await import("html2pdf.js");
    const html2pdf = mod.default;
    const target = doc.querySelector(".invoice-wrap") || doc.body;
    const blob: Blob = await html2pdf()
      .set({
        margin: [4, 4, 4, 4],
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          backgroundColor: "#ffffff",
          width: 794,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait", compress: true },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      })
      .from(target as HTMLElement)
      .outputPdf("blob");

    if (await isPdfBlob(blob)) {
      return blob;
    }
    return null;
  } catch {
    return null;
  } finally {
    document.body.removeChild(iframe);
  }
}

export async function downloadInvoicePdfFromHtml(html: string, filename: string): Promise<boolean> {
  const blob = await generateInvoicePdfBlob(html);
  if (!blob) return false;
  downloadBlob(blob, filename);
  return true;
}
