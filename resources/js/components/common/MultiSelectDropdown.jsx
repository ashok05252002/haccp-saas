import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

const MultiSelectDropdown = ({
  options = [],
  selectedIds = [],
  onChange,
  placeholder = 'Select options...',
  label = '',
  error = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const allIds = options.map((opt) => opt.id);
    onChange(allIds);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const filteredOptions = options.filter((opt) =>
    (opt.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedNames = options
    .filter((opt) => selectedIds.includes(opt.id))
    .map((opt) => opt.name);

  let summaryText = placeholder;
  if (selectedNames.length === 1) {
    summaryText = selectedNames[0];
  } else if (selectedNames.length > 1) {
    summaryText = `${selectedNames.length} selected (${selectedNames.join(', ')})`;
  }

  return (
    <div style={styles.container} ref={dropdownRef}>
      {label && <label style={styles.label}>{label}</label>}

      {/* Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...styles.triggerBtn,
          borderColor: error ? 'var(--color-danger, #EF4444)' : 'var(--color-border-light, #E5E7EB)',
        }}
      >
        <span
          style={{
            ...styles.summaryText,
            color: selectedNames.length > 0 ? 'var(--color-text-primary, #111827)' : 'var(--color-text-muted, #9CA3AF)',
          }}
        >
          {summaryText}
        </span>
        <ChevronDown size={16} color="var(--color-text-secondary, #6B7280)" />
      </button>

      {error && <span style={styles.errorText}>{error}</span>}

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={styles.dropdownPanel}>
          {/* Search & Actions Header */}
          <div style={styles.panelHeader}>
            <div style={styles.searchWrapper}>
              <Search size={14} color="#9CA3AF" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchInput}
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={styles.searchClearBtn}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div style={styles.actionsRow}>
              <button
                type="button"
                onClick={handleSelectAll}
                style={styles.actionBtn}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                style={styles.actionBtn}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Options List */}
          <div style={styles.optionsList}>
            {filteredOptions.length === 0 ? (
              <div style={styles.emptyOption}>No options match search.</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedIds.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleOption(opt.id);
                    }}
                    style={{
                      ...styles.optionRow,
                      backgroundColor: isSelected ? '#F3F4F6' : 'transparent',
                    }}
                  >
                    <div
                      style={{
                        ...styles.checkbox,
                        backgroundColor: isSelected ? 'var(--color-primary, #10B981)' : '#fff',
                        borderColor: isSelected ? 'var(--color-primary, #10B981)' : '#D1D5DB',
                      }}
                    >
                      {isSelected && <Check size={12} color="#fff" />}
                    </div>
                    <span style={styles.optionLabel}>{opt.name}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-text-primary, #374151)',
  },
  triggerBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #D1D5DB',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  },
  summaryText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginRight: '8px',
    fontSize: '14px',
  },
  errorText: {
    fontSize: '12px',
    color: '#EF4444',
  },
  dropdownPanel: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    backgroundColor: '#ffffff',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
    zIndex: 50,
    overflow: 'hidden',
  },
  panelHeader: {
    padding: '8px',
    borderBottom: '1px solid #F3F4F6',
    backgroundColor: '#F9FAFB',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 8px',
    backgroundColor: '#ffffff',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    fontFamily: 'inherit',
  },
  searchClearBtn: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#9CA3AF',
    padding: 0,
    display: 'flex',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
  },
  actionBtn: {
    border: 'none',
    background: 'none',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--color-primary, #10B981)',
    cursor: 'pointer',
    padding: '2px 4px',
  },
  optionsList: {
    maxHeight: '200px',
    overflowY: 'auto',
    padding: '4px',
  },
  emptyOption: {
    padding: '12px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#9CA3AF',
  },
  optionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 150ms ease',
    userSelect: 'none',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
    border: '1px solid #D1D5DB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 150ms ease',
  },
  optionLabel: {
    fontSize: '13px',
    color: '#111827',
  },
};

export default MultiSelectDropdown;
