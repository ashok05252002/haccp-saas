import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Clock, CheckCircle, ChevronRight, GraduationCap, Users, ShieldCheck, Search } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import axios from 'axios';

const StaffTrainingMonitoringPage = () => {
  const [staffList, setStaffList] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [completedLogs, setCompletedLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [staffRes, tasksRes, logsRes] = await Promise.all([
          axios.get('/api/tenant-users'),
          axios.get('/api/training-tasks'),
          axios.get('/api/staff-training-logs'),
        ]);

        setStaffList(staffRes.data || []);
        const rawTasks = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data?.tasks || []);
        setTasks(rawTasks.filter(t => t.status === 'Active' || !t.status));
        setCompletedLogs(logsRes.data || []);
      } catch (err) {
        console.error('Failed to load training monitoring data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStaffAssignedTasks = (staff) => {
    return tasks.filter(t => {
      const appliesTo = t.applies_to || t.appliesTo || 'All Staff';
      if (appliesTo === 'All Staff') return true;
      if (appliesTo === 'By Position') {
        const staffRole = staff.role || staff.position || '';
        const taskRole = t.position || '';
        return staffRole.toLowerCase() === taskRole.toLowerCase();
      }
      if (appliesTo === 'Specific Staff') {
        const staffName = staff.name || '';
        const taskStaff = t.staff_member || t.staffMember || '';
        return staffName.toLowerCase() === taskStaff.toLowerCase();
      }
      return true;
    });
  };

  const getStaffCompletedCount = (staff) => {
    const staffLogs = completedLogs.filter(l => l.staff_name.toLowerCase() === staff.name.toLowerCase());
    return staffLogs.length;
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.role && s.role.toLowerCase().includes(q)) ||
        (s.position && s.position.toLowerCase().includes(q))
      );
    });
  }, [staffList, searchQuery]);

  return (
    <PageLayout>
      <Head title="Staff Training & Hygiene Logs" />

      <div>
        <button onClick={() => router.visit('/haccp-logs')} className="back-btn" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} />
          <span>Back to HACCP Logs</span>
        </button>

        {/* Header */}
        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="page-title">Staff Training & Hygiene Log</h1>
              <span className="badge badge-prp">PRP</span>
              <span className="badge badge-standard">EC 852/2004 Annex II</span>
            </div>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Complete and track staff food safety, hygiene, and safe-catering training tasks.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <Card style={{ padding: '16px 20px', marginBottom: '24px' }}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search staff members by name or position..." />
        </Card>

        {/* Staff Overview Table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading staff training data...</div>
          ) : filteredStaff.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No staff members found. Add staff users in <strong>Manager Hub → Users & Roles</strong>.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Position</th>
                  <th>Assigned Tasks</th>
                  <th>Completed Logs</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(staff => {
                  const assignedTasks = getStaffAssignedTasks(staff);
                  const completedCount = getStaffCompletedCount(staff);

                  let statusBadge = <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>Pending</span>;
                  if (completedCount > 0 && completedCount >= assignedTasks.length) {
                    statusBadge = <span className="badge" style={{ backgroundColor: '#D1FAE5', color: '#047857' }}>Completed</span>;
                  } else if (completedCount > 0) {
                    statusBadge = <span className="badge" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>In Progress</span>;
                  }

                  return (
                    <tr key={staff.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--color-primary-pale)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                            {staff.name.charAt(0)}
                          </div>
                          <strong style={{ color: 'var(--color-text-primary)' }}>{staff.name}</strong>
                        </div>
                      </td>
                      <td>{staff.role || staff.position || 'Staff'}</td>
                      <td><strong>{assignedTasks.length} tasks</strong></td>
                      <td><span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{completedCount} completed</span></td>
                      <td>{statusBadge}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Button variant="primary" size="sm" onClick={() => router.visit(`/haccp-logs/staff-training/task/${staff.id}`)}>
                          Select <ChevronRight size={15} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};

export default StaffTrainingMonitoringPage;
