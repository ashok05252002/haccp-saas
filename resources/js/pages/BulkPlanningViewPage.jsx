import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
  CalendarDays, ArrowLeft, Printer, Edit2, Truck, AlertCircle
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import axios from 'axios';
import { getPlanById } from '../services/planningService';

const BulkPlanningViewPage = ({ planId }) => {
  const [plan, setPlan] = useState(null);
  const [masterRecipes, setMasterRecipes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [planData, recRes, supRes] = await Promise.all([
          getPlanById(planId),
          axios.get('/api/recipes'),
          axios.get('/api/suppliers')
        ]);
        setPlan(planData);
        setMasterRecipes(recRes.data || []);
        setSuppliers((supRes.data || []).filter(s => s.status === 'Active'));
      } catch (err) {
        console.error('Failed to load bulk production plan details', err);
        setError('Failed to load production plan details.');
      } finally {
        setLoading(false);
      }
    };

    if (planId) {
      fetchData();
    }
  }, [planId]);

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

  // Compute Aggregated Raw Ingredient Order List
  const aggregatedOrderList = useMemo(() => {
    if (!plan || !plan.recipes) return [];
    const map = {};

    plan.recipes.forEach(item => {
      if (!item.recipe_id) return;
      const rec = masterRecipes.find(m => String(m.id) === String(item.recipe_id));
      if (!rec || !rec.ingredients) return;

      const baseServ = rec.servings || 1;
      const targetServ = parseFloat(item.target_servings) || 1;
      const bufferMultiplier = item.extra_buffer ? 1.20 : 1.0;
      const multiplier = (targetServ / baseServ) * bufferMultiplier;

      rec.ingredients.forEach(ing => {
        const ingId = ing.ingredient_id ? String(ing.ingredient_id) : '';
        const nameKey = (ing.ingredient_name || '').trim().toLowerCase();
        const unitKey = (ing.unit || '').trim();
        const mapKey = ingId ? `id_${ingId}` : `name_${nameKey}__${unitKey}`;

        const baseQty = parseFloat(ing.quantity) || 0;
        const totalLineQty = baseQty * multiplier;

        if (map[mapKey]) {
          map[mapKey].quantity += totalLineQty;
          map[mapKey].dishes.push(rec.name);
        } else {
          map[mapKey] = {
            mapKey,
            ingredient_id: ingId,
            name: ing.ingredient_name,
            quantity: totalLineQty,
            unit: ing.unit,
            dishes: [rec.name]
          };
        }
      });
    });

    return Object.values(map).map(item => {
      const qty = item.quantity;
      const formattedQty = Number.isInteger(qty) ? qty : Math.round(qty * 100) / 100;
      return {
        ...item,
        quantity: formattedQty,
        dishesText: Array.from(new Set(item.dishes)).join(', ')
      };
    });
  }, [plan, masterRecipes]);

  // Group BY SUPPLIER (Which Supplier -> Which Product -> How Much)
  const supplierPurchaseGroups = useMemo(() => {
    if (aggregatedOrderList.length === 0) return [];
    const overrides = (plan && plan.supplier_overrides) ? plan.supplier_overrides : {};

    const grouped = {};

    aggregatedOrderList.forEach(ing => {
      const matchingSups = suppliers.filter(sup => {
        if (!sup.ingredients || sup.ingredients.length === 0) return false;
        return sup.ingredients.some(m => {
          if (ing.ingredient_id && String(m.id) === String(ing.ingredient_id)) return true;
          return m.name.trim().toLowerCase() === ing.name.trim().toLowerCase();
        });
      });

      const overrideId = overrides[ing.mapKey];
      let selectedSup = null;

      if (overrideId) {
        if (overrideId !== 'unassigned') {
          selectedSup = suppliers.find(s => String(s.id) === String(overrideId));
        }
      } else if (matchingSups.length > 0) {
        selectedSup = matchingSups[0];
      }

      const groupKey = selectedSup ? `sup_${selectedSup.id}` : 'unassigned';
      const groupName = selectedSup ? selectedSup.name : 'Unassigned / General Supplier';

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          supplierName: groupName,
          supplierPhone: selectedSup ? selectedSup.phone : null,
          supplierEmail: selectedSup ? selectedSup.email : null,
          items: []
        };
      }

      grouped[groupKey].items.push(ing);
    });

    return Object.values(grouped);
  }, [aggregatedOrderList, suppliers, plan]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageLayout>
      <Head title={plan ? plan.name : 'Production Plan Details'} />

      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-order-sheet, #printable-order-sheet * {
            visibility: visible;
          }
          #printable-order-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: #fff;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div>
        {/* Header Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <button
              onClick={() => router.visit('/bulk-planning')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: 0,
                marginBottom: '8px'
              }}
            >
              <ArrowLeft size={18} />
              Back to Bulk Planning
            </button>

            {plan && (
              <div>
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                  <CalendarDays size={30} color="var(--color-primary)" />
                  <span>{plan.name}</span>
                </h1>
                <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px', margin: 0 }}>
                  Weekly production schedule and supplier purchase order breakdown.
                </p>
              </div>
            )}
          </div>

          {plan && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="secondary" icon={Printer} onClick={handlePrint}>
                Print Purchase Orders
              </Button>
              <Button variant="primary" icon={Edit2} onClick={() => router.visit(`/bulk-planning/${plan.id}/edit`)}>
                Edit Plan
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <Card>
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Loading production plan...
            </div>
          </Card>
        ) : error || !plan ? (
          <Card>
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Production Plan Not Found
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                The requested production plan could not be located.
              </p>
              <Button variant="primary" onClick={() => router.visit('/bulk-planning')}>
                Return to Bulk Planning List
              </Button>
            </div>
          </Card>
        ) : (
          <div id="printable-order-sheet" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Meta Specifications */}
            <Card padding="20px">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    📅 Planned Date: {formatDate(plan.planned_date || plan.weekLabel)}
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-pale)', padding: '6px 14px', borderRadius: '16px' }}>
                  {(plan.recipes || []).length} Planned Dishes
                </div>
              </div>
            </Card>

            {/* Planned Dishes Breakdown Table */}
            <Card padding="0">
              <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-light)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  Planned Dish Schedule & Servings
                </h3>
              </div>

              {(!plan.recipes || plan.recipes.length === 0) ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No dishes scheduled in this plan.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Dish Name</th>
                        <th>Base Servings</th>
                        <th>Target Planned Servings</th>
                        <th>Safety Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.recipes.map((r, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>
                              {r.recipe_name}
                            </strong>
                          </td>
                          <td style={{ color: 'var(--color-text-secondary)' }}>
                            {r.base_servings || 1} serv
                          </td>
                          <td style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary-darker)' }}>
                            {r.target_servings} serv
                          </td>
                          <td>
                            {r.extra_buffer ? (
                              <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>
                                +20% Buffer
                              </span>
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Standard</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Supplier Purchase Order Breakdown */}
            <Card padding="0">
              <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={20} color="var(--color-primary)" />
                    <span>Supplier Purchase Orders (Which Supplier • Which Product • How Much)</span>
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
                    Aggregated commercial ingredient purchase quantities grouped by Supplier.
                  </p>
                </div>

                <div style={{ backgroundColor: 'var(--color-primary-pale)', color: 'var(--color-primary)', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '13px' }}>
                  {supplierPurchaseGroups.length} Supplier Purchase Sheets
                </div>
              </div>

              {supplierPurchaseGroups.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No supplier purchase breakdown items to display.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
                  {supplierPurchaseGroups.map((group, gIdx) => (
                    <div
                      key={gIdx}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border-light)',
                        overflow: 'hidden',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                      }}
                    >
                      {/* Supplier Group Header */}
                      <div style={{
                        backgroundColor: '#F9FAFB',
                        padding: '14px 18px',
                        borderBottom: '1px solid var(--color-border-light)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Truck size={18} color="var(--color-primary)" />
                          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                            {group.supplierName}
                          </h4>
                          {group.supplierPhone && (
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                              📞 {group.supplierPhone}
                            </span>
                          )}
                          {group.supplierEmail && (
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                              ✉️ {group.supplierEmail}
                            </span>
                          )}
                        </div>

                        <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                          {group.items.length} {group.items.length === 1 ? 'Product' : 'Products'}
                        </span>
                      </div>

                      {/* Products Table */}
                      <div style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Product / Ingredient Name</th>
                              <th style={{ backgroundColor: '#F0FDF4', color: '#15803D', fontWeight: 800 }}>
                                Required Purchase Qty
                              </th>
                              <th>Unit</th>
                              <th>Referenced Dishes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.items.map((ing, iIdx) => (
                              <tr key={iIdx}>
                                <td style={{ color: 'var(--color-text-muted)', fontWeight: 600, width: '40px' }}>
                                  {iIdx + 1}
                                </td>
                                <td>
                                  <strong style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>
                                    {ing.name}
                                  </strong>
                                </td>
                                <td style={{ backgroundColor: '#F0FDF4', color: '#15803D', fontWeight: 800, fontSize: '16px' }}>
                                  {ing.quantity}
                                </td>
                                <td>
                                  <span style={{ backgroundColor: '#F3F4F6', color: '#4B5563', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
                                    {ing.unit}
                                  </span>
                                </td>
                                <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                  {ing.dishesText}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default BulkPlanningViewPage;
