import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { 
  Calendar, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, 
  Clock, ShieldCheck, History, Download, RefreshCw, ClipboardCheck, Sparkles, FileText, Check, Square, CheckSquare
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import SignaturePad from '../components/common/SignaturePad';
import axios from 'axios';

const SupervisionReviewPage = () => {
  const { auth } = usePage().props;
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [reviewMode, setReviewMode] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [alert, setAlert] = useState(null);
  const [togglingAreaId, setTogglingAreaId] = useState(null);

  const { data, setData, post, processing, errors, reset } = useForm({
    review_date: selectedDate,
    review_mode: reviewMode,
    reviewer_name: auth?.user?.name || '',
    reviewer_role: auth?.user?.assigned_role?.name || 'Head Chef / Safety Manager',
    haccp_completed_count: 0,
    haccp_total_count: 14,
    cleaning_completed_count: 0,
    cleaning_total_count: 8,
    flagged_items_count: 0,
    compliance_status: 'passed',
    supervisor_comments: '',
    corrective_actions_taken: '',
    signature: null,
  });

  const fetchSummary = async (dateVal, modeVal) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/supervision-reviews/summary?date=${dateVal}&mode=${modeVal}`);
      const summary = res.data;
      setSummaryData(summary);

      // Auto-fill form values from summary data
      setData(prev => ({
        ...prev,
        review_date: dateVal,
        review_mode: modeVal,
        haccp_completed_count: summary.haccpStats?.completedCount || 0,
        haccp_total_count: summary.haccpStats?.totalCount || 14,
        cleaning_completed_count: summary.cleaningStats?.completedCount || 0,
        cleaning_total_count: summary.cleaningStats?.totalCount || 8,
        flagged_items_count: summary.flaggedLogs?.length || 0,
        compliance_status: summary.existingReview?.compliance_status || (summary.flaggedLogs?.length > 0 ? 'passed_with_action' : 'passed'),
        reviewer_name: summary.existingReview?.reviewer_name || prev.reviewer_name || auth?.user?.name || '',
        reviewer_role: summary.existingReview?.reviewer_role || prev.reviewer_role || 'Head Chef / Manager',
        supervisor_comments: summary.existingReview?.supervisor_comments || '',
        corrective_actions_taken: summary.existingReview?.corrective_actions_taken || '',
        signature: summary.existingReview?.signature || null,
      }));
    } catch (err) {
      console.error('Failed to load supervision review summary', err);
      setAlert({ type: 'danger', message: 'Failed to fetch daily supervision review summary.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(selectedDate, reviewMode);
  }, [selectedDate, reviewMode]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(todayStr);
  };

  const handleToggleCleaningArea = async (areaId) => {
    setTogglingAreaId(areaId);
    try {
      const res = await axios.post('/api/supervision-reviews/toggle-cleaning-log', {
        cleaning_area_id: areaId,
        review_date: selectedDate,
        staff_name: auth?.user?.name || 'Supervisor',
      });
      setAlert({ type: 'success', message: res.data.message });
      await fetchSummary(selectedDate, reviewMode);
    } catch (err) {
      console.error('Failed to toggle cleaning area', err);
      setAlert({ type: 'danger', message: 'Failed to update cleaning area status.' });
    } finally {
      setTogglingAreaId(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!data.signature) {
      setAlert({ type: 'danger', message: 'Please provide a Digital Supervisor Signature before submitting.' });
      return;
    }

    post('/api/supervision-reviews', {
      onSuccess: () => {
        setAlert({ type: 'success', message: 'Supervisory review and verification sign-off recorded successfully!' });
        fetchSummary(selectedDate, reviewMode);
      },
      onError: (errs) => {
        setAlert({ type: 'danger', message: 'Failed to submit supervision review. Please check all fields.' });
      }
    });
  };

  const handleExportCsv = () => {
    window.open('/api/supervision-reviews/export-csv', '_blank');
  };

  const haccpPercent = summaryData?.haccpStats?.totalCount 
    ? Math.round((summaryData.haccpStats.completedCount / summaryData.haccpStats.totalCount) * 100)
    : 0;

  const cleaningPercent = summaryData?.cleaningStats?.totalCount 
    ? Math.round((summaryData.cleaningStats.completedCount / summaryData.cleaningStats.totalCount) * 100)
    : 0;

  return (
    <PageLayout>
      <Head title="Supervision Review Module" />

      <div>
        {/* Page Header */}
        <div className="panel-header-row" style={{ marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="page-title">Supervision Review & Manager Sign-Off</h1>
              <span className="badge badge-standard" style={{ backgroundColor: '#10B981', color: '#fff', fontWeight: 700 }}>
                EHO Audit Ready
              </span>
            </div>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Verify operational log ratios, inspect non-compliances, and complete manager sign-offs for daily & weekly HACCP logs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button variant="secondary" icon={History} onClick={() => router.visit('/supervision-review/history')}>
              Review History
            </Button>
            <Button variant="secondary" icon={Download} onClick={handleExportCsv}>
              Export CSV Audit
            </Button>
          </div>
        </div>

        {alert && (
          <div style={{ marginBottom: '16px' }}>
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}

        {/* CARD 1: TOP DATE SELECTION CARD */}
        <Card style={{ padding: '16px 20px', marginBottom: '24px', backgroundColor: '#fff', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={22} color="var(--color-primary)" />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Supervision Audit Date
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Date Navigator Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                type="button" 
                onClick={handlePrevDay} 
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <ChevronLeft size={16} /> Prev Day
              </button>

              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="form-input"
                style={{ width: '150px', padding: '6px 10px', fontSize: '13px' }}
              />

              <button 
                type="button" 
                onClick={handleNextDay} 
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Next Day <ChevronRight size={16} />
              </button>

              {selectedDate !== todayStr && (
                <button 
                  type="button" 
                  onClick={handleToday}
                  className="btn btn-primary-pale"
                  style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600 }}
                >
                  Today
                </button>
              )}
            </div>

            {/* Mode Switcher */}
            <div style={{ display: 'flex', backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '3px' }}>
              <button
                type="button"
                onClick={() => setReviewMode('daily')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: reviewMode === 'daily' ? '#fff' : 'transparent',
                  color: reviewMode === 'daily' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  boxShadow: reviewMode === 'daily' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Daily Review
              </button>
              <button
                type="button"
                onClick={() => setReviewMode('weekly')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: reviewMode === 'weekly' ? '#fff' : 'transparent',
                  color: reviewMode === 'weekly' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  boxShadow: reviewMode === 'weekly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Weekly Summary
              </button>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <RefreshCw size={24} className="spin-animation" style={{ marginBottom: '8px' }} />
            <div>Fetching Supervision Review details...</div>
          </Card>
        ) : (
          <>
            {/* CARDS 2 & 3: DUAL AGGREGATION CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              
              {/* CARD 2: HACCP OPERATIONAL LOGS PROGRESS */}
              <Card style={{ padding: '20px', borderRadius: '16px', border: '1.5px solid var(--color-border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ClipboardCheck size={20} color="var(--color-primary)" />
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>HACCP Operational Logs</h3>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px', margin: 0 }}>
                      14 Core Monitoring Categories
                    </p>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {summaryData?.haccpStats?.ratioString || '0 / 14'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#E5E7EB', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '14px' }}>
                  <div 
                    style={{ 
                      width: `${haccpPercent}%`, 
                      backgroundColor: haccpPercent === 100 ? '#10B981' : (haccpPercent > 50 ? '#3B82F6' : '#F59E0B'), 
                      height: '100%', 
                      transition: 'width 300ms ease' 
                    }} 
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>✓ {summaryData?.haccpStats?.completedCount || 0} Logged</span>
                    {summaryData?.flaggedLogs?.length > 0 && (
                      <span style={{ color: '#EF4444', fontWeight: 600 }}>⚠ {summaryData.flaggedLogs.length} Flagged</span>
                    )}
                  </div>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '11.5px', fontWeight: 600 }}>
                    {haccpPercent}% Complete
                  </span>
                </div>

                <div style={{ marginTop: '14px', padding: '10px 12px', backgroundColor: '#F9FAFB', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  <Clock size={14} color="var(--color-primary)" />
                  <span>
                    {summaryData?.haccpStats?.lastLoggedAt ? (
                      <strong>HACCP Logs Status: Recorded {summaryData.haccpStats.lastLoggedAt}</strong>
                    ) : (
                      <span>No HACCP operational entries logged for this date yet.</span>
                    )}
                  </span>
                </div>
              </Card>

              {/* CARD 3: CLEANING & SANITATION PROGRESS */}
              <Card style={{ padding: '20px', borderRadius: '16px', border: '1.5px solid var(--color-border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={20} color="#059669" />
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Cleaning & Sanitation</h3>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px', margin: 0 }}>
                      Cleaning Area Master Frequencies
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669' }}>
                      {summaryData?.cleaningStats?.ratioString || '0 / 0'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      Overall Cleaned
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {summaryData?.cleaningStats?.totalDailyAreasCount > 0 && (
                    <div style={{ padding: '6px 10px', backgroundColor: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0', fontSize: '12px' }}>
                      <span style={{ color: '#047857', fontWeight: 700 }}>Daily Areas:</span> {summaryData?.cleaningStats?.dailyRatioString}
                    </div>
                  )}
                  {summaryData?.cleaningStats?.totalWeeklyAreasCount > 0 && (
                    <div style={{ padding: '6px 10px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE', fontSize: '12px' }}>
                      <span style={{ color: '#1D4ED8', fontWeight: 700 }}>Weekly Areas:</span> {summaryData?.cleaningStats?.weeklyRatioString}
                    </div>
                  )}
                </div>

                <div style={{ backgroundColor: '#E5E7EB', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '14px' }}>
                  <div 
                    style={{ 
                      width: `${cleaningPercent}%`, 
                      backgroundColor: cleaningPercent === 100 ? '#10B981' : '#3B82F6', 
                      height: '100%', 
                      transition: 'width 300ms ease' 
                    }} 
                  />
                </div>

                <div style={{ padding: '10px 12px', backgroundColor: summaryData?.cleaningStats?.isWeeklyCompleted ? '#ECFDF5' : '#F9FAFB', border: summaryData?.cleaningStats?.isWeeklyCompleted ? '1px solid #A7F3D0' : '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}>
                  {summaryData?.cleaningStats?.isWeeklyCompleted ? (
                    <div style={{ color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={15} />
                      <span>🎉 Weekly Cleaning Completed for this Week on {summaryData.cleaningStats.weeklyCompletedAt}</span>
                    </div>
                  ) : summaryData?.cleaningStats?.completedDailyCount >= summaryData?.cleaningStats?.totalDailyAreasCount ? (
                    <div style={{ color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={15} />
                      <span>✅ Daily Cleaning Areas fully completed for {selectedDate}</span>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} />
                      <span>Daily cleaning in progress ({summaryData?.cleaningStats?.completedDailyCount} of {summaryData?.cleaningStats?.totalDailyAreasCount} daily areas completed)</span>
                    </div>
                  )}
                </div>
              </Card>

            </div>

            {/* FLAGGED ALERTS */}
            {summaryData?.flaggedLogs?.length > 0 && (
              <Card style={{ padding: '20px', marginBottom: '24px', backgroundColor: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <AlertTriangle size={20} color="#DC2626" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#991B1B', margin: 0 }}>
                    Flagged Non-Compliances & Out-of-Spec Items ({summaryData.flaggedLogs.length})
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: '#7F1D1D', marginBottom: '14px' }}>
                  The following log entries for {selectedDate} were flagged as out of specification or failed. Manager review and corrective action note is required.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {summaryData.flaggedLogs.map((item, idx) => (
                    <div key={idx} style={{ padding: '12px 14px', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #FCA5A5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <strong style={{ fontSize: '13.5px', color: 'var(--color-text-primary)' }}>{item.module_name}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          Logged by <strong>{item.staff_name}</strong> at {item.time} • Reason: {item.reason}
                        </div>
                      </div>
                      <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: 700, fontSize: '11px' }}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* TWO-COLUMN AUDIT VERIFICATION LIST (HACCP LOGS LEFT, CLEANING AREAS RIGHT WITH CHECKBOXES) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '24px' }}>
              
              {/* LEFT COLUMN: HACCP OPERATIONAL CATEGORIES LIST */}
              <Card style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--color-border-light)' }}>
                <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ClipboardCheck size={20} color="var(--color-primary)" />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-primary)' }}>
                      HACCP Logs Checklist
                    </h3>
                  </div>
                  <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                    {summaryData?.haccpStats?.completedCount} / {summaryData?.haccpStats?.totalCount}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {summaryData?.moduleBreakdown?.map((mod) => (
                    <div 
                      key={mod.id} 
                      style={{ 
                        padding: '12px 14px', 
                        borderRadius: '10px', 
                        border: mod.status === 'Completed' ? '1px solid #A7F3D0' : (mod.status === 'Flagged' ? '1px solid #FCA5A5' : '1px solid #E5E7EB'),
                        backgroundColor: mod.status === 'Completed' ? '#F0FDF4' : (mod.status === 'Flagged' ? '#FEF2F2' : '#FAFAFA'),
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '13.5px', color: 'var(--color-text-primary)' }}>{mod.name}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          Entries Logged: <strong>{mod.entries_count}</strong> {mod.latest_time ? `• Last at ${mod.latest_time}` : ''}
                        </div>
                      </div>

                      <span 
                        style={{ 
                          fontSize: '11px', 
                          fontWeight: 700, 
                          padding: '3px 9px', 
                          borderRadius: '6px',
                          backgroundColor: mod.status === 'Completed' ? '#DCFCE7' : (mod.status === 'Flagged' ? '#FEE2E2' : '#F3F4F6'),
                          color: mod.status === 'Completed' ? '#166534' : (mod.status === 'Flagged' ? '#991B1B' : '#6B7280')
                        }}
                      >
                        {mod.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* RIGHT COLUMN: CLEANING AREAS LIST WITH INTERACTIVE CHECKBOXES */}
              <Card style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--color-border-light)' }}>
                <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={20} color="#059669" />
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#059669' }}>
                      Cleaning Areas Verification
                    </h3>
                  </div>
                  <span className="badge" style={{ backgroundColor: '#ECFDF5', color: '#047857', fontWeight: 700 }}>
                    {summaryData?.cleaningStats?.ratioString} Cleaned
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Daily Areas Section */}
                  {summaryData?.cleaningStats?.dailyAreaDetails?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#047857', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Daily Cleaning Areas ({summaryData?.cleaningStats?.dailyRatioString})
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {summaryData?.cleaningStats?.dailyAreaDetails?.map((area) => (
                          <div 
                            key={area.id} 
                            onClick={() => handleToggleCleaningArea(area.id)}
                            style={{ 
                              padding: '12px 14px', 
                              borderRadius: '10px', 
                              border: area.completed ? '1px solid #A7F3D0' : '1px solid #E5E7EB', 
                              backgroundColor: area.completed ? '#F0FDF4' : '#FAFAFA', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '12px',
                              cursor: 'pointer',
                              transition: 'all 150ms ease'
                            }}
                          >
                            <div style={{ flexShrink: 0 }}>
                              {area.completed ? (
                                <CheckSquare size={22} color="#10B981" />
                              ) : (
                                <Square size={22} color="#9CA3AF" />
                              )}
                            </div>

                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ fontSize: '13.5px', color: 'var(--color-text-primary)', textDecoration: area.completed ? 'line-through' : 'none' }}>
                                  {area.name}
                                </strong>
                                <span className="badge badge-neutral" style={{ fontSize: '10px', padding: '1px 6px' }}>Daily</span>
                              </div>
                              {area.completed ? (
                                <div style={{ fontSize: '11.5px', color: '#047857', marginTop: '2px' }}>
                                  Cleaned by <strong>{area.staff_name || 'Staff'}</strong> at {area.logged_at}
                                </div>
                              ) : (
                                <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '2px' }}>
                                  Pending daily check — Click to verify & check off
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weekly Areas Section */}
                  {summaryData?.cleaningStats?.weeklyAreaDetails?.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Weekly Cleaning Areas ({summaryData?.cleaningStats?.weeklyRatioString})
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {summaryData?.cleaningStats?.weeklyAreaDetails?.map((area) => (
                          <div 
                            key={area.id} 
                            onClick={() => handleToggleCleaningArea(area.id)}
                            style={{ 
                              padding: '12px 14px', 
                              borderRadius: '10px', 
                              border: area.completed ? '1px solid #BFDBFE' : '1px solid #E5E7EB', 
                              backgroundColor: area.completed ? '#EFF6FF' : '#FAFAFA', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '12px',
                              cursor: 'pointer',
                              transition: 'all 150ms ease'
                            }}
                          >
                            <div style={{ flexShrink: 0 }}>
                              {area.completed ? (
                                <CheckSquare size={22} color="#2563EB" />
                              ) : (
                                <Square size={22} color="#9CA3AF" />
                              )}
                            </div>

                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ fontSize: '13.5px', color: 'var(--color-text-primary)', textDecoration: area.completed ? 'line-through' : 'none' }}>
                                  {area.name}
                                </strong>
                                <span className="badge" style={{ fontSize: '10px', padding: '1px 6px', backgroundColor: '#DBEAFE', color: '#1E40AF' }}>Weekly</span>
                              </div>
                              {area.completed ? (
                                <div style={{ fontSize: '11.5px', color: '#1D4ED8', marginTop: '2px' }}>
                                  Completed for Week on <strong>{area.logged_at}</strong> by {area.staff_name || 'Staff'}
                                </div>
                              ) : (
                                <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '2px' }}>
                                  Pending weekly check — Click to verify & check off for this week
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!summaryData?.cleaningStats?.dailyAreaDetails?.length && !summaryData?.cleaningStats?.weeklyAreaDetails?.length) && (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                      No active cleaning areas configured in Manager Hub yet.
                    </div>
                  )}

                </div>
              </Card>

            </div>

            {/* CARD 6: DIGITAL SUPERVISOR REVIEW & SIGN-OFF FORM */}
            <Card style={{ padding: '24px', borderRadius: '16px', border: '2px solid var(--color-primary)' }}>
              <div style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={24} color="var(--color-primary)" />
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                      Supervisory Verification & Digital Sign-Off
                    </h2>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px', margin: 0 }}>
                      Official HACCP Manager sign-off record for environmental health officer (EHO) inspection.
                    </p>
                  </div>
                </div>

                {summaryData?.existingReview && (
                  <span className="badge" style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #6EE7B7', fontWeight: 700, padding: '6px 12px' }}>
                    ✓ Signed & Verified on {new Date(summaryData.existingReview.verified_at || summaryData.existingReview.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label className="form-label">Supervisor / Manager Name *</label>
                    <select 
                      className="form-select"
                      value={data.reviewer_name}
                      onChange={(e) => setData('reviewer_name', e.target.value)}
                      required
                    >
                      <option value="">-- Select Restaurant Member --</option>
                      {summaryData?.staffMembers?.map((staff) => (
                        <option key={staff.id} value={staff.name}>
                          {staff.name}
                        </option>
                      ))}
                    </select>
                    {errors.reviewer_name && <div style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>{errors.reviewer_name}</div>}
                  </div>

                  <div>
                    <label className="form-label">Overall Compliance Decision *</label>
                    <select 
                      className="form-select"
                      value={data.compliance_status}
                      onChange={(e) => setData('compliance_status', e.target.value)}
                      required
                    >
                      <option value="passed">Passed (Fully Compliant)</option>
                      <option value="passed_with_action">Passed with Action Taken</option>
                      <option value="failed">Failed / Action Required</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label">Supervisor General Comments & Observations</label>
                  <textarea 
                    className="form-input"
                    rows={3}
                    value={data.supervisor_comments}
                    onChange={(e) => setData('supervisor_comments', e.target.value)}
                    placeholder="Enter supervisory notes, log verification findings, or audit comments..."
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label className="form-label">Corrective Actions Taken (If any out-of-spec readings)</label>
                  <textarea 
                    className="form-input"
                    rows={2}
                    value={data.corrective_actions_taken}
                    onChange={(e) => setData('corrective_actions_taken', e.target.value)}
                    placeholder="Describe any corrective actions instructed or taken for non-compliant items..."
                  />
                </div>

                {/* Digital Canvas Signature */}
                <div style={{ marginBottom: '24px' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Supervisor Digital Signature Sign-Off *
                  </label>
                  <SignaturePad 
                    value={data.signature}
                    onChange={(sig) => setData('signature', sig)}
                  />
                  {errors.signature && <div style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>{errors.signature}</div>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    icon={CheckCircle2}
                    disabled={processing}
                    style={{ padding: '12px 28px', fontSize: '15px', fontWeight: 700 }}
                  >
                    {processing ? 'Saving Sign-Off...' : 'Submit & Verify Supervision Review'}
                  </Button>
                </div>
              </form>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default SupervisionReviewPage;
