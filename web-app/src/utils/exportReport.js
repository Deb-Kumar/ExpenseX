import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Helper to format ISO date to readable string "DD MMM YYYY"
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
};

/**
 * Generate and download professional PDF financial report
 */
export const exportToPDF = ({
  transactions = [],
  filterInfo = {},
  summary = {},
  user = {},
  currency = '₹',
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  // Header Background bar
  doc.setFillColor(15, 23, 42); // #0f172a slate-900
  doc.rect(0, 0, pageWidth, 75, 'F');

  // Brand Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ExpenseX', margin, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Personal Financial Tracker & Analytics Report', margin, 48);

  // Right-aligned header metadata
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  const now = new Date();
  const dateString = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.text(`Generated: ${dateString} ${timeString}`, pageWidth - margin, 34, { align: 'right' });
  doc.text(`User: ${user?.name || 'Authorized User'} (${user?.email || 'N/A'})`, pageWidth - margin, 48, { align: 'right' });

  // Accent Line under header
  doc.setDrawColor(99, 102, 241); // indigo-500
  doc.setLineWidth(2);
  doc.line(0, 75, pageWidth, 75);

  let currentY = 92;

  // --- FILTER CONDITIONS APPLIED BLOCK ---
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, currentY, contentWidth, 48, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text('APPLIED FILTER CONDITIONS', margin + 10, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const col1X = margin + 10;
  const col2X = margin + 140;
  const col3X = margin + 270;
  const col4X = margin + 400;

  doc.text(`Date Range: ${filterInfo.dateRangeLabel || 'All Time'}`, col1X, currentY + 30);
  doc.text(`Type: ${filterInfo.typeLabel || 'All Types'}`, col2X, currentY + 30);
  doc.text(`Category: ${filterInfo.categoryLabel || 'All Categories'}`, col3X, currentY + 30);
  doc.text(`Method: ${filterInfo.paymentMethodLabel || 'All Methods'}`, col4X, currentY + 30);

  currentY += 56;

  // --- SUMMARY KPI METRICS BOXES ---
  const boxWidth = (contentWidth - 18) / 4;
  const boxHeight = 44;

  const totalInflow = summary.totalInflow || 0;
  const totalOutflow = summary.totalOutflow || 0;
  const netFlow = totalInflow - totalOutflow;
  const count = transactions.length;

  const metrics = [
    {
      title: 'TOTAL INFLOW',
      value: `+${currency} ${totalInflow.toLocaleString()}`,
      textColor: [16, 185, 129], // emerald-600
      bg: [240, 253, 244], // emerald-50
      border: [187, 247, 208],
    },
    {
      title: 'TOTAL OUTFLOW',
      value: `-${currency} ${totalOutflow.toLocaleString()}`,
      textColor: [225, 29, 72], // rose-600
      bg: [255, 241, 242], // rose-50
      border: [254, 205, 211],
    },
    {
      title: 'NET BALANCE FLOW',
      value: `${netFlow >= 0 ? '+' : ''}${currency} ${netFlow.toLocaleString()}`,
      textColor: netFlow >= 0 ? [16, 185, 129] : [225, 29, 72],
      bg: netFlow >= 0 ? [240, 253, 244] : [255, 241, 242],
      border: netFlow >= 0 ? [187, 247, 208] : [254, 205, 211],
    },
    {
      title: 'TRANSACTIONS',
      value: `${count} Records`,
      textColor: [30, 41, 59], // slate-800
      bg: [248, 250, 252], // slate-50
      border: [226, 232, 240],
    },
  ];

  metrics.forEach((m, idx) => {
    const x = margin + idx * (boxWidth + 6);
    doc.setFillColor(m.bg[0], m.bg[1], m.bg[2]);
    doc.setDrawColor(m.border[0], m.border[1], m.border[2]);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(m.title, x + 8, currentY + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(m.textColor[0], m.textColor[1], m.textColor[2]);
    doc.text(m.value, x + 8, currentY + 31);
  });

  currentY += boxHeight + 14;

  // --- TRANSACTIONS TABLE USING AUTOTABLE ---
  const tableHeaders = [
    ['Date', 'Description', 'Category', 'Method', 'Type', `Amount (${currency})`]
  ];

  const tableRows = transactions.map((t) => [
    formatDisplayDate(t.date),
    t.title || 'Untitled',
    t.category || 'General',
    t.paymentMethod || 'Cash',
    (t.type || 'expense').toUpperCase(),
    `${t.type === 'income' ? '+' : '-'}${Number(t.amount || 0).toLocaleString()}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: tableHeaders,
    body: tableRows,
    margin: { left: margin, right: margin, bottom: 40 },
    theme: 'plain',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 6,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 5.5,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50 zebra stripe
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 90 },
      3: { cellWidth: 75 },
      4: { cellWidth: 55, fontStyle: 'bold' },
      5: { cellWidth: 85, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const row = transactions[data.row.index];
        if (data.column.index === 4) {
          // Type column
          if (row?.type === 'income') {
            data.cell.styles.textColor = [16, 185, 129]; // green
          } else {
            data.cell.styles.textColor = [225, 29, 72]; // rose
          }
        } else if (data.column.index === 5) {
          // Amount column
          if (row?.type === 'income') {
            data.cell.styles.textColor = [16, 185, 129];
          } else {
            data.cell.styles.textColor = [225, 29, 72];
          }
        }
      }
    },
    didDrawPage: (data) => {
      // Footer on every page
      const pageStr = `Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('ExpenseX Financial Statement · Strictly Confidential', margin, pageHeight - 20);
      doc.text(pageStr, pageWidth - margin, pageHeight - 20, { align: 'right' });
    },
  });

  // Save the PDF
  const filename = `ExpenseX_Report_${dateString.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};

/**
 * Generate and download Excel (.xlsx) statement report
 */
export const exportToExcel = ({
  transactions = [],
  filterInfo = {},
  summary = {},
  user = {},
  currency = '₹',
}) => {
  const now = new Date();
  const dateString = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalInflow = summary.totalInflow || 0;
  const totalOutflow = summary.totalOutflow || 0;
  const netFlow = totalInflow - totalOutflow;

  // Build 2D array representing Excel cells
  const rows = [
    ['ExpenseX - Financial Statement & Transaction Report'],
    [`Generated: ${dateString} ${timeString}`],
    [`User: ${user?.name || 'User'} (${user?.email || 'N/A'})`],
    [`Currency: ${currency}`],
    [], // Blank line
    ['--- APPLIED FILTER CONDITIONS ---'],
    ['Date Range:', filterInfo.dateRangeLabel || 'All Time'],
    ['Transaction Type:', filterInfo.typeLabel || 'All Types'],
    ['Category:', filterInfo.categoryLabel || 'All Categories'],
    ['Payment Method:', filterInfo.paymentMethodLabel || 'All Methods'],
    [], // Blank line
    ['--- FINANCIAL SUMMARY ---'],
    ['Total Inflow (Income):', totalInflow],
    ['Total Outflow (Expense):', totalOutflow],
    ['Net Cash Flow:', netFlow],
    ['Total Records:', transactions.length],
    [], // Blank line
    [
      'Date',
      'Description / Title',
      'Type',
      'Category',
      'Payment Method',
      `Amount (${currency})`,
      'Balance Impact',
      'Notes',
    ],
  ];

  // Append transaction rows
  transactions.forEach((tx) => {
    const isIncome = tx.type === 'income';
    const amountVal = Number(tx.amount || 0);
    rows.push([
      formatDisplayDate(tx.date),
      tx.title || '',
      isIncome ? 'INCOME' : 'EXPENSE',
      tx.category || '',
      tx.paymentMethod || '',
      amountVal,
      isIncome ? `+${amountVal}` : `-${amountVal}`,
      tx.notes || '',
    ]);
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths for readability
  ws['!cols'] = [
    { wch: 15 }, // Date
    { wch: 28 }, // Title
    { wch: 12 }, // Type
    { wch: 20 }, // Category
    { wch: 18 }, // Payment Method
    { wch: 16 }, // Amount
    { wch: 16 }, // Balance Impact
    { wch: 30 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'ExpenseX Statement');

  const filename = `ExpenseX_Statement_${dateString.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
};
