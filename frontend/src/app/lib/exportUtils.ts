/**
 * Utility functions for exporting data to Excel/CSV format
 */

interface ExportOptions {
  filename?: string;
  sheetName?: string;
}

/**
 * Convert array of objects to CSV format and trigger download
 */
export const exportToExcel = (
  data: Record<string, any>[],
  options: ExportOptions = {}
) => {
  const {
    filename = "export.csv",
    sheetName = "Data"
  } = options;

  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    // Add headers
    headers.map(escapeCSV).join(","),
    // Add data rows
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          return escapeCSV(formatValue(value));
        })
        .join(",")
    )
  ].join("\n");

  // Create blob and download
  downloadFile(csvContent, filename, "text/csv;charset=UTF-8");
};

/**
 * Export customers data to Excel
 */
export const exportCustomersToExcel = (customers: any[]) => {
  const data = customers.map(customer => ({
    "Customer Name": customer.name,
    "Email": customer.email || "-",
    "Phone": customer.phone || "-",
    "Address": customer.address || "-",
    "Type": customer.type || "-",
    "GST Number": customer.gstNumber || "-",
    "Created Date": customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-IN") : "-"
  }));

  exportToExcel(data, {
    filename: `customers_${new Date().toISOString().split('T')[0]}.csv`,
    sheetName: "Customers"
  });
};

/**
 * Export products data to Excel
 */
export const exportProductsToExcel = (products: any[]) => {
  const data = products.map(product => ({
    "Product Name": product.name,
    "SKU": product.sku || "-",
    "Category": product.category || "-",
    "Stock": product.stock || 0,
    "Unit": product.unit || "pcs",
    "Purchase Price": product.purchasePrice || 0,
    "Selling Price": product.sellingPrice || product.price || 0,
    "MRP": product.mrp || 0,
    "GST Rate": `${product.gstRate || 0}%`,
    "Minimum Stock": product.minimumStockLevel || 0,
    "Barcode": product.barcode || "-"
  }));

  exportToExcel(data, {
    filename: `products_${new Date().toISOString().split('T')[0]}.csv`,
    sheetName: "Products"
  });
};

/**
 * Export bills data to Excel
 */
export const exportBillsToExcel = (bills: any[]) => {
  const data = bills.map(bill => ({
    "Invoice Number": bill.invoiceNumber,
    "Customer Name": bill.customerName || "-",
    "Bill Date": bill.billDate ? new Date(bill.billDate).toLocaleDateString("en-IN") : "-",
    "Total Amount": bill.totalAmount || 0,
    "Payment Type": bill.paymentType || "-",
    "Payment Status": bill.paymentStatus || "-",
    "Balance Amount": bill.balanceAmount || 0,
    "Notes": bill.notes || "-"
  }));

  exportToExcel(data, {
    filename: `bills_${new Date().toISOString().split('T')[0]}.csv`,
    sheetName: "Bills"
  });
};

/**
 * Escape CSV special characters
 */
function escapeCSV(str: string): string {
  if (str === null || str === undefined) {
    return "";
  }

  str = String(str);

  // If the field contains comma, quotes, or newline, wrap it in quotes and escape quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Format value for export (handle dates, numbers, etc.)
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toLocaleDateString("en-IN");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Download file to user's computer with mobile compatibility
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const BOM = "\uFEFF"; // UTF-8 BOM
  const blob = new Blob([BOM + content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  
  // Try to use the Share API on mobile if available for CSV
  if (navigator.canShare && mimeType.includes("csv")) {
    try {
      const file = new File([blob], filename, { type: mimeType });
      navigator.share({
        files: [file],
        title: filename,
      }).catch(() => {
        // If share fails, fall back to traditional download
        triggerDownload(url, filename);
      });
      return;
    } catch (e) {
      // Fall through to traditional download
    }
  }
  
  triggerDownload(url, filename);
}

/**
 * Trigger file download with improved browser compatibility
 */
function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  link.setAttribute("target", "_blank");
  
  // Append to body for compatibility
  document.body.appendChild(link);
  
  // Trigger click
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
}
