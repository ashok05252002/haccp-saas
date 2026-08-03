import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
  CalendarDays, Plus, Eye, Edit2, Trash2
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import { getSavedPlans, deletePlan } from '../services/planningService';

const BulkPlanningPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await getSavedPlans();
      setPlans(data || []);
    } catch (err) {
      console.error('Failed to load bulk plans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not Set';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const filteredPlans = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return plans.filter(p => {
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchDate = (p.planned_date || p.weekLabel || '').toLowerCase().includes(q);
      const formattedDate = formatDate(p.planned_date || p.weekLabel).toLowerCase();
      return matchName || matchDate || formattedDate.includes(q);
    });
  }, [plans, searchQuery]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deletePlan(id);
      fetchPlans();
    } catch (err) {
      alert('Failed to delete production plan.');
    }
  };

  return (
    <PageLayout>
      <Head title="Bulk Production Planning" />

      <div>
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarDays size={28} color="var(--color-primary)" />
              <span>Bulk Production Planning</span>
            </h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Manage commercial kitchen production schedules, aggregated raw ingredient order lists, and supplier purchase orders.
            </p>
          </div>

          <Button variant="primary" icon={Plus} onClick={() => router.visit('/bulk-planning/create')}>
            Create New Plan
          </Button>
        </div>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search plans by name or date..."
        />

        {/* Data Table Container */}
        <Card padding="0">
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Loading production plans...
            </div>
          ) : filteredPlans.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <CalendarDays size={48} color="#D1D5DB" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 6px 0' }}>
                No Production Plans Found
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', margin: '0 0 20px 0' }}>
                {searchQuery ? 'No plans match your search criteria.' : 'Get started by creating your first bulk production plan.'}
              </p>
              <Button variant="primary" icon={Plus} onClick={() => router.visit('/bulk-planning/create')}>
                Create New Plan
              </Button>
            </div>
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <th>Plan Name</th>
                  <th>Planned Date</th>
                  <th>Planned Dishes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map(row => {
                  const dishCount = row.recipes ? row.recipes.length : (row.recipeCount || 0);

                  return (
                    <tr key={row.id}>
                      <td>
                        <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{row.name}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                          📅 {formatDate(row.planned_date || row.weekLabel)}
                        </span>
                      </td>
                      <td>
                        <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                          {dishCount} {dishCount === 1 ? 'Dish' : 'Dishes'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Eye}
                            onClick={() => router.visit(`/bulk-planning/${row.id}`)}
                            title="View Details & Purchase Orders"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Edit2}
                            onClick={() => router.visit(`/bulk-planning/${row.id}/edit`)}
                            title="Edit Plan"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleDelete(row.id, row.name)}
                            style={{ color: '#EF4444' }}
                            title="Delete Plan"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};

export default BulkPlanningPage;
