const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'resources', 'js', 'Pages');

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace common style properties with classNames
  content = content.replace(/style=\{styles\.backBtn\}/g, 'className="back-btn"');
  content = content.replace(/style=\{styles\.panelHeaderRow\}/g, 'className="panel-header-row"');
  content = content.replace(/style=\{styles\.actionIconBtn\}/g, 'className="action-icon-btn"');
  content = content.replace(/style=\{styles\.alertSuccess\}/g, 'className="alert-success"');
  content = content.replace(/style=\{styles\.alertError\}/g, 'className="alert-error"');
  content = content.replace(/style=\{styles\.searchBarWrapper\}/g, 'className="search-bar-wrapper"');
  content = content.replace(/style=\{styles\.searchInput\}/g, 'className="search-bar-input"');
  content = content.replace(/style=\{styles\.searchClearBtn\}/g, 'className="search-clear-btn"');
  
  // Table
  content = content.replace(/<table style=\{styles\.table\}>/g, '<table className="data-table">');
  // Drop styles.th and styles.td since CSS handles them via .data-table th
  content = content.replace(/style=\{styles\.th\}/g, '');
  content = content.replace(/style=\{\{ \.\.\.styles\.th,\s*(.*?)\s*\}\}/g, 'style={{ $1 }}');
  content = content.replace(/style=\{styles\.td\}/g, '');
  content = content.replace(/style=\{\{ \.\.\.styles\.td,\s*(.*?)\s*\}\}/g, 'style={{ $1 }}');

  // Removed the block that deletes the styles object so we don't break un-migrated styles
  // Handle edge cases like style={{ ...styles.alertError, margin: 0 }}
  content = content.replace(/style=\{\{\s*\.\.\.styles\.alertError,\s*(.*?)\s*\}\}/g, 'className="alert-error" style={{ $1 }}');
  content = content.replace(/style=\{\{\s*\.\.\.styles\.alertSuccess,\s*(.*?)\s*\}\}/g, 'className="alert-success" style={{ $1 }}');


  // Handle any stray styles.sectionHeader etc if they existed
  content = content.replace(/style=\{styles\.sectionHeader\}/g, 'className="panel-header-row" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "14px", marginBottom: "20px" }}');
  content = content.replace(/style=\{styles\.sectionHeaderRow\}/g, 'className="panel-header-row" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "14px", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}');
  content = content.replace(/style=\{styles\.sectionTitle\}/g, 'style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}');

  // Specific buttons
  content = content.replace(/style=\{styles\.quickActionBtn\}/g, 'className="btn btn-sm btn-outline"');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Refactored ${path.basename(filePath)}`);
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      refactorFile(fullPath);
    }
  }
}

walkDir(pagesDir);
console.log('Refactoring complete.');
