import React from 'react';

const DataTable = ({ columns, data, children, className = '' }) => {
  if (children) {
    return (
      <table className={`data-table ${className}`}>
        {children}
      </table>
    );
  }

  if (!columns || !data) {
    return (
      <table className={`data-table ${className}`} />
    );
  }

  return (
    <table className={`data-table ${className}`}>
      <thead>
        <tr>
          {columns.map((col, idx) => (
            <th key={col.key || idx} style={{ textAlign: col.align || 'left' }}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rIdx) => (
          <tr key={row.id || rIdx}>
            {columns.map((col, cIdx) => (
              <td key={col.key || cIdx} style={{ textAlign: col.align || 'left' }}>
                {col.render ? col.render(row, rIdx) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DataTable;
