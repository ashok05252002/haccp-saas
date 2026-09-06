/**
 * Service helper for exporting Vendor Purchase Orders (POs) as CSV files
 */

const formatCsvCell = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

const triggerCsvDownload = (csvContent, fileName) => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export a single vendor's Purchase Order to CSV
 */
export const exportSingleVendorPoCsv = (group, plan) => {
  if (!group || !group.items || group.items.length === 0) return;

  const planName = plan ? plan.name : 'Bulk Production Plan';
  const planDate = plan ? (plan.planned_date || plan.weekLabel || 'N/A') : 'N/A';
  const supplierName = group.supplierName || 'Vendor';

  const lines = [];

  // Header metadata
  lines.push([formatCsvCell('PURCHASE ORDER'), formatCsvCell(supplierName)].join(','));
  lines.push([formatCsvCell('Production Plan'), formatCsvCell(planName)].join(','));
  lines.push([formatCsvCell('Planned Date'), formatCsvCell(planDate)].join(','));
  lines.push([formatCsvCell('Supplier Phone'), formatCsvCell(group.supplierPhone || 'N/A')].join(','));
  lines.push([formatCsvCell('Supplier Email'), formatCsvCell(group.supplierEmail || 'N/A')].join(','));
  lines.push([formatCsvCell('Exported On'), formatCsvCell(new Date().toLocaleDateString('en-GB'))].join(','));
  lines.push(''); // Empty line divider

  // Column Headers
  lines.push([
    formatCsvCell('#'),
    formatCsvCell('Product / Ingredient Name'),
    formatCsvCell('Required Quantity'),
    formatCsvCell('Unit'),
    formatCsvCell('Est. Unit Cost ($)'),
    formatCsvCell('Est. Total Cost ($)'),
    formatCsvCell('Referenced Dishes')
  ].join(','));

  // Items
  let vendorTotal = 0;
  group.items.forEach((item, index) => {
    const qty = item.quantity || 0;
    const unitCost = item.unitCost !== undefined && item.unitCost !== null ? item.unitCost : 0;
    const lineTotal = item.lineTotal !== undefined && item.lineTotal !== null ? item.lineTotal : (qty * unitCost);
    vendorTotal += lineTotal;

    lines.push([
      formatCsvCell(index + 1),
      formatCsvCell(item.name),
      formatCsvCell(qty),
      formatCsvCell(item.unit || ''),
      formatCsvCell(unitCost > 0 ? unitCost.toFixed(2) : '-'),
      formatCsvCell(lineTotal > 0 ? lineTotal.toFixed(2) : '-'),
      formatCsvCell(item.dishesText || '')
    ].join(','));
  });

  // Footer Total
  lines.push('');
  lines.push([
    formatCsvCell(''),
    formatCsvCell('TOTAL ESTIMATED PO COST'),
    formatCsvCell(''),
    formatCsvCell(''),
    formatCsvCell(''),
    formatCsvCell(`$${vendorTotal.toFixed(2)}`),
    formatCsvCell('')
  ].join(','));

  const csvString = lines.join('\r\n');
  const safeSupplierName = supplierName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `PO_${safeSupplierName}_${new Date().toISOString().slice(0, 10)}.csv`;

  triggerCsvDownload(csvString, fileName);
};

/**
 * Export all vendor Purchase Orders combined into a single CSV
 */
export const exportAllVendorPosCsv = (supplierGroups, plan) => {
  if (!supplierGroups || supplierGroups.length === 0) return;

  const planName = plan ? plan.name : 'Bulk Production Plan';
  const planDate = plan ? (plan.planned_date || plan.weekLabel || 'N/A') : 'N/A';

  const lines = [];

  // Header metadata
  lines.push([formatCsvCell('CONSOLIDATED VENDOR PURCHASE ORDERS'), formatCsvCell('')].join(','));
  lines.push([formatCsvCell('Production Plan'), formatCsvCell(planName)].join(','));
  lines.push([formatCsvCell('Planned Date'), formatCsvCell(planDate)].join(','));
  lines.push([formatCsvCell('Exported On'), formatCsvCell(new Date().toLocaleDateString('en-GB'))].join(','));
  lines.push('');

  let grandTotal = 0;

  supplierGroups.forEach((group) => {
    lines.push([formatCsvCell(`VENDOR: ${group.supplierName}`), formatCsvCell(`Contact: ${group.supplierPhone || 'N/A'} | ${group.supplierEmail || 'N/A'}`)].join(','));
    lines.push([
      formatCsvCell('#'),
      formatCsvCell('Product / Ingredient Name'),
      formatCsvCell('Required Quantity'),
      formatCsvCell('Unit'),
      formatCsvCell('Est. Unit Cost ($)'),
      formatCsvCell('Est. Total Cost ($)'),
      formatCsvCell('Referenced Dishes')
    ].join(','));

    let vendorTotal = 0;
    group.items.forEach((item, index) => {
      const qty = item.quantity || 0;
      const unitCost = item.unitCost !== undefined && item.unitCost !== null ? item.unitCost : 0;
      const lineTotal = item.lineTotal !== undefined && item.lineTotal !== null ? item.lineTotal : (qty * unitCost);
      vendorTotal += lineTotal;

      lines.push([
        formatCsvCell(index + 1),
        formatCsvCell(item.name),
        formatCsvCell(qty),
        formatCsvCell(item.unit || ''),
        formatCsvCell(unitCost > 0 ? unitCost.toFixed(2) : '-'),
        formatCsvCell(lineTotal > 0 ? lineTotal.toFixed(2) : '-'),
        formatCsvCell(item.dishesText || '')
      ].join(','));
    });

    grandTotal += vendorTotal;
    lines.push([
      formatCsvCell(''),
      formatCsvCell(`SUBTOTAL (${group.supplierName})`),
      formatCsvCell(''),
      formatCsvCell(''),
      formatCsvCell(''),
      formatCsvCell(`$${vendorTotal.toFixed(2)}`),
      formatCsvCell('')
    ].join(','));
    lines.push(''); // Blank line separator
  });

  lines.push([
    formatCsvCell(''),
    formatCsvCell('GRAND TOTAL PROCUREMENT COST'),
    formatCsvCell(''),
    formatCsvCell(''),
    formatCsvCell(''),
    formatCsvCell(`$${grandTotal.toFixed(2)}`),
    formatCsvCell('')
  ].join(','));

  const csvString = lines.join('\r\n');
  const safePlanName = planName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `All_POs_${safePlanName}_${new Date().toISOString().slice(0, 10)}.csv`;

  triggerCsvDownload(csvString, fileName);
};
