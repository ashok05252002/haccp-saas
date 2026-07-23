import React from 'react';

const Card = ({ children, className = '', padded = true, onClick, style = {} }) => {
  const classNames = ['card', padded ? 'card-padded' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', ...style }}
    >
      {children}
    </div>
  );
};

export default Card;
