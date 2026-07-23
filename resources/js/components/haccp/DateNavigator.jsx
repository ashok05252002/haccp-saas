import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getDayName, formatDateShort } from '../../utils/dateUtils';

const DateNavigator = ({ date, onPrev, onNext }) => {
  const dayName = getDayName(date);
  const dateStr = formatDateShort(date);

  return (
    <div style={styles.container}>
      <button style={styles.arrow} onClick={onPrev}>
        <ChevronLeft size={20} color="var(--color-text-secondary)" />
      </button>
      <div style={styles.dateContent}>
        <Calendar size={18} color="var(--color-text-secondary)" />
        <div>
          <div style={styles.day}>{dayName}</div>
          <div style={styles.date}>{dateStr}</div>
        </div>
      </div>
      <button style={styles.arrow} onClick={onNext}>
        <ChevronRight size={20} color="var(--color-text-secondary)" />
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 24px',
    backgroundColor: '#fff',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border-light)',
    boxShadow: 'var(--shadow-card)',
    flex: 1,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 150ms',
    flexShrink: 0,
  },
  dateContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    justifyContent: 'center',
  },
  day: {
    fontSize: 'var(--font-size-md)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-text-primary)',
  },
  date: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
  },
};

export default DateNavigator;
