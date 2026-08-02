import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, XCircle, MinusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Button from '../components/common/Button';
import axios from 'axios';

const CleaningViewPage = ({ logId }) => {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await axios.get(`/api/cleaning-logs/${logId}`);
        setLog(res.data);
      } catch (err) {
        console.error('Failed to fetch cleaning log', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [logId]);

  const toggleSection = (id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getLogStats = (l) => {
    if (!l || !l.results) return { yes: 0, no: 0, na: 0 };
    let yes = 0, no = 0, na = 0;
    l.results.forEach(r => {
      if (r.result === 'Yes') yes++;
      if (r.result === 'No') no++;
      if (r.result === 'N/A') na++;
    });
    return { yes, no, na };
  };

  // Group results by section
  const getGroupedResults = (l) => {
    if (!l || !l.results) return [];
    
    const sectionsMap = {};
    l.results.forEach(res => {
      const q = res.question;
      if (!q || !q.section) return;
      const secId = q.section.id;
      
      if (!sectionsMap[secId]) {
        sectionsMap[secId] = {
          id: secId,
          title: q.section.title,
          results: []
        };
      }
      
      sectionsMap[secId].results.push({
        id: res.id,
        question: q.question,
        result: res.result,
        comment: res.comment
      });
    });
    
    return Object.values(sectionsMap);
  };

  if (loading) {
    return (
      <PageLayout>
        <Head title="View Cleaning Log" />
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading log details...
        </div>
      </PageLayout>
    );
  }

  if (!log) {
    return (
      <PageLayout>
        <Head title="Log Not Found" />
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <p>Cleaning log not found.</p>
          <Button variant="secondary" onClick={() => router.visit('/haccp-logs/cleaning')} style={{ marginTop: '16px' }}>
            Back to Monitoring
          </Button>
        </div>
      </PageLayout>
    );
  }

  const stats = getLogStats(log);

  return (
    <PageLayout>
      <Head title="View Cleaning Log" />

      <div>
        <button onClick={() => router.visit('/haccp-logs/cleaning')} className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to Logs</span>
        </button>

        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <h1 className="page-title">View Cleaning & Sanitation Details</h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Review the detailed results of this checklist submission.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#FAFAFA', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border-light)' }}>
            
            {/* Top Level Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #10B981', padding: '16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#10B981' }}></div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#047857', lineHeight: '1', marginTop: '4px' }}>{stats.yes}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>Passed (Yes)</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #EF4444', padding: '16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#EF4444' }}></div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#B91C1C', lineHeight: '1', marginTop: '4px' }}>{stats.no}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>Failed (No)</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #9CA3AF', padding: '16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(107, 114, 128, 0.1)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#9CA3AF' }}></div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#374151', lineHeight: '1', marginTop: '4px' }}>{stats.na}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>Not App. (N/A)</div>
              </div>
            </div>

            {/* General Info Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#F3F4F6', color: '#4B5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Time</label>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '2px', color: 'var(--color-text-primary)' }}>{log.log_date} <span style={{ color: 'var(--color-text-secondary)', marginLeft: '4px', fontSize: '13px' }}>{log.log_time}</span></div>
                </div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#F3F4F6', color: '#4B5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Staff Name</label>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '2px', color: 'var(--color-text-primary)' }}>{log.staff_name || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Checklist Results Grouped by Section (FAQ Accordion Style) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0 4px 0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Checklist Details</h4>
              </div>
              {getGroupedResults(log).map(section => {
                const isExpanded = expandedSections[section.id];
                return (
                <div key={section.id} style={{ border: '1px solid var(--color-border-light)', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div 
                    onClick={() => toggleSection(section.id)}
                    style={{ backgroundColor: isExpanded ? '#F9FAFB' : '#ffffff', padding: '16px 20px', borderBottom: isExpanded ? '1px solid var(--color-border-light)' : '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--color-primary-pale)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                        {section.id}
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>{section.title}</h3>
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)', backgroundColor: '#F3F4F6', borderRadius: '50%', padding: '4px' }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div style={{ padding: '0 20px', backgroundColor: '#ffffff' }}>
                      {section.results.map((res, index) => (
                        <div key={res.id} style={{ padding: '20px 0', borderBottom: index < section.results.length - 1 ? '1px solid var(--color-border-light)' : 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)', margin: 0, lineHeight: '1.5', flex: 1 }}>
                              {res.question}
                            </p>
                            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {res.result === 'Yes' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ECFDF5', color: '#047857', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, border: '1px solid #A7F3D0' }}><CheckCircle size={14} /> Yes</span>}
                              {res.result === 'No' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#FEF2F2', color: '#B91C1C', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, border: '1px solid #FECACA' }}><XCircle size={14} /> No</span>}
                              {res.result === 'N/A' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#F3F4F6', color: '#4B5563', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, border: '1px solid #E5E7EB' }}><MinusCircle size={14} /> N/A</span>}
                            </div>
                          </div>
                          
                          {res.comment && (
                            <div style={{ backgroundColor: '#FFFBEB', color: '#92400E', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontStyle: 'italic', display: 'flex', alignItems: 'flex-start', gap: '8px', borderLeft: '4px solid #F59E0B' }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '2px', flexShrink: 0 }}><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>
                              <span>{res.comment}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )})}
            </div>

            {/* Overall Comment */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '8px 0 12px 0', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Comment</h4>
              <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--color-text-primary)', padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid var(--color-border-light)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                {log.comment ? (
                  <span>{log.comment}</span>
                ) : (
                  <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No overall comment provided.</span>
                )}
              </div>
            </div>

            {/* Signature */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '8px 0 12px 0', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Signature</h4>
              <div>
                {log.signature ? (
                  <div style={{ border: '1px solid var(--color-border-light)', borderRadius: '12px', padding: '16px', display: 'inline-block', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <img src={log.signature} alt="Signature" style={{ height: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid var(--color-border-light)' }}>
                    No signature provided.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CleaningViewPage;
