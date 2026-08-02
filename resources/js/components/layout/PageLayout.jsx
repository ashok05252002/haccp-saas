import React from 'react';
import Sidebar from './Sidebar';

const PageLayout = ({ children }) => {
  return (
    <div style={styles.layout}>
      <Sidebar />
      <main style={styles.main} className="page-main">
        <div style={styles.content}>{children}</div>
      </main>
    </div>
  );
};

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
  },
  main: {
    flex: 1,
    marginLeft: 'var(--sidebar-width)',
    backgroundColor: 'var(--color-page-bg)',
    minHeight: '100vh',
    transition: 'margin-left 200ms ease',
  },
  content: {
    maxWidth: 'var(--content-max-width)',
    padding: '32px 40px',
  },
};

export default PageLayout;
