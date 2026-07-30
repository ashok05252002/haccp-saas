import React from 'react';

const DataTable = ({ children, className = '' }) => {
  return (
    <table className={`data-table ${className}`}>
      {children}
    </table>
  );
};

export default DataTable;
