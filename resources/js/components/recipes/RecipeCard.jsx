import React from 'react';
import { Clock } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const RecipeCard = ({ recipe, onClick }) => {
  return (
    <div
      style={styles.card}
      onClick={() => onClick && onClick(recipe)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
    >
      <div style={styles.header}>
        <StatusBadge label={recipe.category} type="category" />
        <div style={styles.time}>
          <Clock size={14} color="var(--color-text-muted)" />
          <span>{recipe.prepTime}</span>
        </div>
      </div>
      <h3 style={styles.title}>{recipe.name}</h3>
      <p style={styles.description}>{recipe.description}</p>
      <div style={styles.divider} />
      <div style={styles.ingredientCount}>
        {recipe.ingredients.length} ingredients per serving
      </div>
      <div style={styles.chips}>
        {recipe.ingredients.map((ing, i) => (
          <span key={i} style={styles.chip}>
            {ing.name} ({ing.quantity} {ing.unit})
          </span>
        ))}
      </div>
    </div>
  );
};

const styles = {
  card: {
    padding: '22px',
    backgroundColor: '#fff',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border-light)',
    boxShadow: 'var(--shadow-card)',
    cursor: 'pointer',
    transition: 'all 200ms ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  time: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
  },
  title: {
    fontSize: 'var(--font-size-md)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-text-primary)',
    marginBottom: '4px',
  },
  description: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    marginBottom: '14px',
  },
  divider: {
    height: 1,
    backgroundColor: 'var(--color-border-light)',
    marginBottom: '14px',
  },
  ingredientCount: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    fontWeight: 'var(--font-weight-medium)',
    marginBottom: '10px',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  chip: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-page-bg)',
    border: '1px solid var(--color-border-light)',
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-secondary)',
  },
};

export default RecipeCard;
