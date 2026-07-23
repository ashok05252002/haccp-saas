import React, { useState, useEffect } from 'react';
import { Download, ShieldCheck, ClipboardList, BookOpen } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import DateNavigator from '../components/haccp/DateNavigator';
import HaccpModuleCard from '../components/haccp/HaccpModuleCard';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { getHaccpModules, createHaccpLog, getHaccpStats } from '../services/haccpService';
import { formatDateISO, addDays } from '../utils/dateUtils';
import HaccpFormModal from '../components/haccp/HaccpFormModal';
import { haccpModuleMeta } from '../data/haccpModuleMeta';

const HaccpLogsPage = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState({ completedModules: 0, totalModules: 13, failedChecks: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedModuleMeta, setSelectedModuleMeta] = useState(null);

  const dateStr = formatDateISO(selectedDate);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [modulesData, statsData] = await Promise.all([
          getHaccpModules(),
          getHaccpStats(dateStr),
        ]);
        setModules(modulesData);
        setStats(statsData);

        // Check query parameters to auto-open modal
        const moduleParam = searchParams.get('module');
        if (moduleParam && haccpModuleMeta[moduleParam]) {
          setSelectedModuleMeta(haccpModuleMeta[moduleParam]);
          setModalOpen(true);
          // Optional: Clear the param after opening so it doesn't reopen on refresh
          // setSearchParams({}); 
        }

      } catch (err) {
        console.error('Failed to load HACCP data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateStr, searchParams]); // searchParams added to dependencies

  const handleModuleClick = (module) => {
    // Map the module slug to the detailed meta
    const meta = haccpModuleMeta[module.slug];
    if (meta) {
      setSelectedModuleMeta(meta);
      setModalOpen(true);
    } else {
      console.warn('No schema defined for module:', module.slug);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedModuleMeta(null);
    if (searchParams.get('module')) {
      setSearchParams({});
    }
  };

  const handleSaveLog = async (formData) => {
    try {
      await createHaccpLog({
        moduleId: selectedModuleMeta.id,
        moduleName: selectedModuleMeta.title,
        date: dateStr,
        ...formData, // Schema-driven data
      });
      // Refresh stats
      const newStats = await getHaccpStats(dateStr);
      setStats(newStats);
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save log:', err);
      throw err; // Let the modal handle the error state
    }
  };

  return (
    <PageLayout>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">HACCP Logs</h1>
          <p className="page-subtitle">
            <BookOpen size={16} />
            Codex Alimentarius · EC 852/2004 · ISO 22000:2018
          </p>
        </div>
        <Button variant="outline" icon={Download}>
          Export Report
        </Button>
      </div>

      {loading ? (
        <Loader message="Loading HACCP modules..." />
      ) : (
        <>
          {/* Date + Stats Row */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '24px',
              marginBottom: '24px',
              flexWrap: 'wrap',
            }}
          >
            <DateNavigator
              date={selectedDate}
              onPrev={() => setSelectedDate(addDays(selectedDate, -1))}
              onNext={() => setSelectedDate(addDays(selectedDate, 1))}
            />
            <div style={styles.statCard}>
              <ShieldCheck size={22} color="var(--color-primary)" />
              <div style={styles.statValue}>{stats.completedModules}</div>
              <div style={styles.statLabel}>of {stats.totalModules} modules</div>
            </div>
            <div style={styles.statCard}>
              <ClipboardList size={22} color="var(--color-text-secondary)" />
              <div style={styles.statValue}>{stats.failedChecks}</div>
              <div style={styles.statLabel}>failed checks</div>
            </div>
          </div>

          {/* Module Cards */}
          <div>
            {modules.map((mod) => (
              <HaccpModuleCard key={mod.id} module={mod} onClick={handleModuleClick} />
            ))}
          </div>
        </>
      )}

      {/* Schema-driven Log Entry Modal */}
      <HaccpFormModal 
        isOpen={modalOpen} 
        onClose={handleCloseModal} 
        moduleMeta={selectedModuleMeta} 
        onSave={handleSaveLog} 
      />
    </PageLayout>
  );
};

const styles = {
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 28px',
    backgroundColor: '#fff',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border-light)',
    boxShadow: 'var(--shadow-card)',
    minWidth: '120px',
  },
  statValue: {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-bold)',
    color: 'var(--color-primary)',
    margin: '4px 0',
  },
  statLabel: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
  },
};

export default HaccpLogsPage;
