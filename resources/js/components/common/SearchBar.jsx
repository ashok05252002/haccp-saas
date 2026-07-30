import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = 'Search...', className = '' }) => {
  return (
    <div className={`search-bar-wrapper ${className}`}>
      <Search size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="search-bar-input"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} className="search-clear-btn">
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
