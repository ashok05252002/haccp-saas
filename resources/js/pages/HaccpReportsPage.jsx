import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Download, Printer, FileText, Calendar, CheckCircle2, AlertTriangle, Filter, BarChart3, Clock, ChevronRight } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import MultiSelectDropdown from '../components/common/MultiSelectDropdown';
import HaccpLogDetailDrawer from '../components/haccp/HaccpLogDetailDrawer';
import axios from 'axios';

const ALL_MODULE_OPTIONS = [
  { id: 'temperature', name: 'Temperature Monitoring' },
  { id: 'delivery-intake', name: 'Delivery Intake' },
  { id: 'cleaning', name: 'Cleaning & Sanitation' },
  { id: 'cooking-temperature', name: 'Cooking Temperature' },
  { id: 'blast-chilling', name: 'Blast Chilling' },
  { id: 'cooling-process', name: 'Cooling Process' },
  { id: 'probe-calibration', name: 'Probe Accuracy Check' },
  { id: 'food-dispatch', name: 'Food Dispatch & Transfer' },
  { id: 'fryer-oil', name: 'Fryer Oil & Grease Management' },
  { id: 'pest-control', name: 'Pest Prevention & Activity Log' },
  { id: 'food-waste', name: 'Food Waste & Disposal Log' },
  { id: 'hot-holding', name: 'Hot Holding / Bain Marie' },
  { id: 'staff-training', name: 'Staff Training & Hygiene Log' },
  { id: 'thawing', name: 'Thawing / Defrosting Record' },
  { id: 'health-declaration', name: 'Staff Health Declaration' },
];

const formatDate = (dateVal) => {
  if (!dateVal) return 'N/A';
  const str = String(dateVal).trim();
  if (str.includes('T')) {
    return str.split('T')[0];
  }
  if (str.includes(' ')) {
    return str.split(' ')[0];
  }
  return str;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  let t = String(timeStr).trim();
  if (t.includes('T')) {
    t = t.split('T')[1];
  }
  const parts = t.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return t;
};

const formatTimestamp = (val) => {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}(?:T00:00(?::00)?(?:\.0+)?(?:Z|[+-]00:?00)?)?$/.test(str) && (str.includes('T00:00') || !str.includes('T'))) {
    return str.split('T')[0];
  }
  const isoRegex = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/;
  if (isoRegex.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} at ${hours}:${minutes}`;
    }
  }
  return str;
};

const getTemperatureStorageUnit = (log) => {
  if (log?.storageUnit) return log.storageUnit;
  if (log?.formData?.storageUnit) return log.formData.storageUnit;
  const zone = log?.storage_zone || log?.storageZone;
  const name = (zone?.name || log?.formData?.storage_zone_name || log?.storage_zone_name || '').trim();
  const rawType = (zone?.type || zone?.storage_type || log?.formData?.storage_type || '').trim();
  const type = rawType ? (rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase()) : '';
  if (name && type && type !== '-') {
    return `${name} (${type})`;
  }
  if (name) return name;
  if (type && type !== '-') return `(${type})`;
  return null;
};

const getTemperatureRecordedTemp = (log) => {
  if (log?.recordedTemperature) return log.recordedTemperature;
  if (log?.formData?.recordedTemperature) return log.formData.recordedTemperature;
  const temp = log?.formData?.temperature ?? log?.temperature;
  if (temp !== undefined && temp !== null && String(temp).trim() !== '') {
    return `${parseFloat(temp)}°C`;
  }
  return null;
};

const hasValidComment = (comment) => {
  if (!comment) return false;
  const str = String(comment).trim();
  const lower = str.toLowerCase();
  return (
    str !== '' &&
    lower !== 'null' &&
    lower !== 'n/a' &&
    lower !== 'none' &&
    lower !== 'none recorded.' &&
    lower !== 'no comment provided.' &&
    lower !== 'no comments'
  );
};

const getDeliverySupplier = (log) => {
  // 1. Related supplier object: log.supplier.name, deliveryLog.supplier.name
  if (log?.supplier && typeof log.supplier === 'object' && log.supplier.name) {
    const s = String(log.supplier.name).trim();
    if (s && s.toLowerCase() !== 'n/a' && s.toLowerCase() !== 'null') return s;
  }
  if (log?.deliveryLog?.supplier && typeof log.deliveryLog.supplier === 'object' && log.deliveryLog.supplier.name) {
    const s = String(log.deliveryLog.supplier.name).trim();
    if (s && s.toLowerCase() !== 'n/a' && s.toLowerCase() !== 'null') return s;
  }
  const rawSupplier = log?.formData?.rawLog?.supplier || log?.formData?.rawLog?.deliveryLog?.supplier;
  if (rawSupplier && typeof rawSupplier === 'object' && rawSupplier.name) {
    const s = String(rawSupplier.name).trim();
    if (s && s.toLowerCase() !== 'n/a' && s.toLowerCase() !== 'null') return s;
  }
  if (log?.deliverySummary?.supplier) {
    const s = String(log.deliverySummary.supplier).trim();
    if (s && s.toLowerCase() !== 'n/a' && s.toLowerCase() !== 'null') return s;
  }

  // 2. Stored supplier_id relation: supplier_id -> suppliers table/name
  if (typeof log?.supplier === 'string') {
    const s = log.supplier.trim();
    if (s && s.toLowerCase() !== 'n/a' && s.toLowerCase() !== 'null') return s;
  }
  if (typeof log?.deliveryLog?.supplier === 'string') {
    const s = log.deliveryLog.supplier.trim();
    if (s && s.toLowerCase() !== 'n/a' && s.toLowerCase() !== 'null') return s;
  }
  if (typeof log?.formData?.supplier === 'string') {
    const s = log.formData.supplier.trim();
    if (s && s.toLowerCase() !== 'n/a' && s.toLowerCase() !== 'null') return s;
  }

  // 3. Stored supplier name field, if available: supplier_name, supplier, vendor_name
  const nameCandidate = log?.supplier_name ||
    log?.deliveryLog?.supplier_name ||
    log?.formData?.supplier_name ||
    log?.formData?.rawLog?.supplier_name ||
    log?.formData?.rawLog?.deliveryLog?.supplier_name ||
    log?.vendor_name ||
    log?.deliveryLog?.vendor_name ||
    log?.formData?.vendor_name ||
    log?.formData?.rawLog?.vendor_name ||
    log?.formData?.rawLog?.deliveryLog?.vendor_name;

  if (nameCandidate && String(nameCandidate).trim() !== '') {
    const s = String(nameCandidate).trim();
    if (s && s.toLowerCase() !== 'n/a' && s.toLowerCase() !== 'null') return s;
  }

  return null;
};

const getDeliveryVehicle = (log) => {
  if (log?.vehicleSafe) return log.vehicleSafe;
  if (log?.deliverySummary?.vehicleSafe) return log.deliverySummary.vehicleSafe;
  if (log?.formData?.vehicleSafe) return log.formData.vehicleSafe;
  const vSafe = log?.formData?.rawLog?.vehicle_safe ?? log?.vehicle_safe;
  if (vSafe !== undefined && vSafe !== null) {
    if (vSafe === true || vSafe === 1 || vSafe === '1' || String(vSafe).toLowerCase() === 'true') {
      return 'Clean & Safe';
    }
    if (vSafe === false || vSafe === 0 || vSafe === '0' || String(vSafe).toLowerCase() === 'false') {
      return 'Unsafe / Unclean';
    }
  }
  return null;
};

const formatDisplayDate = (dateVal) => {
  if (!dateVal || dateVal === '-') return '-';
  const cleanStr = String(dateVal).split('T')[0].split(' ')[0].trim();
  const parts = cleanStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const d = new Date(cleanStr + 'T00:00:00');
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  return cleanStr;
};

const formatProductTemp = (temp) => {
  if (temp === null || temp === undefined || temp === '' || temp === '-') return '-';
  const str = String(temp).trim();
  if (str.includes('°C')) return str;
  const num = parseFloat(str);
  return isNaN(num) ? str : `${num}°C`;
};

const getDeliveryProducts = (log) => {
  if (Array.isArray(log?.deliveredProducts) && log.deliveredProducts.length > 0) {
    return log.deliveredProducts;
  }
  if (Array.isArray(log?.deliverySummary?.products) && log.deliverySummary.products.length > 0) {
    return log.deliverySummary.products;
  }
  if (Array.isArray(log?.formData?.deliveredProducts) && log.formData.deliveredProducts.length > 0) {
    return log.formData.deliveredProducts;
  }
  const rawProducts = log?.formData?.rawLog?.products;
  if (Array.isArray(rawProducts) && rawProducts.length > 0) {
    return rawProducts.map((p) => ({
      food: p.food_item?.name || p.foodItem?.name || p.name || 'Unknown Product',
      batchCode: p.batch_number || p.batch_code || '-',
      useByDate: p.use_by_date || '-',
      temperature: (p.temperature !== null && p.temperature !== '') ? `${p.temperature}°C` : '-',
    }));
  }
  return [];
};

const getThawingDetails = (log) => {
  const summary = log?.thawingSummary || log?.formData?.thawingSummary || {};
  const rawLog = log?.formData?.rawLog || {};

  const cleanVal = (v) => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'n/a') return null;
    return s;
  };

  const foodItem = cleanVal(summary.foodItem || log?.formData?.foodItem || rawLog.food_item_name);
  const defrostMethod = cleanVal(summary.defrostMethod || log?.formData?.defrostMethod || rawLog.defrost_method);
  const storageLocation = cleanVal(summary.storageLocation || log?.formData?.storageLocation || rawLog.storage_location);

  // Defrost Start
  let defrostStart = cleanVal(summary.defrostStart);
  if (!defrostStart) {
    const sDate = rawLog.start_date ? String(rawLog.start_date).split('T')[0] : '';
    let sTime = rawLog.start_time ? String(rawLog.start_time).trim() : '';
    if (sTime.includes('T')) sTime = sTime.split('T')[1];
    if (sTime.length > 5) sTime = sTime.substring(0, 5);
    if (sDate && sTime) {
      defrostStart = `${sDate} at ${sTime}`;
    } else if (sDate) {
      defrostStart = sDate;
    } else if (sTime) {
      defrostStart = sTime;
    }
  }

  // Defrost Completed
  let defrostCompleted = cleanVal(summary.defrostCompleted);
  if (!defrostCompleted) {
    const cDate = rawLog.completed_date ? String(rawLog.completed_date).split('T')[0] : '';
    let cTime = rawLog.completed_time ? String(rawLog.completed_time).trim() : '';
    if (cTime.includes('T')) cTime = cTime.split('T')[1];
    if (cTime.length > 5) cTime = cTime.substring(0, 5);
    if (cDate && cTime) {
      defrostCompleted = `${cDate} at ${cTime}`;
    } else if (cDate) {
      defrostCompleted = cDate;
    } else if (cTime) {
      defrostCompleted = cTime;
    }
  }

  // Temperature
  let temperature = cleanVal(summary.temperature);
  if (!temperature) {
    const rawTemp = rawLog.defrost_temp ?? log?.formData?.defrost_temp ?? log?.formData?.defrostTemp;
    if (rawTemp !== undefined && rawTemp !== null && String(rawTemp).trim() !== '' && String(rawTemp).toLowerCase() !== 'null') {
      temperature = `${parseFloat(rawTemp)}°C`;
    }
  }

  // Evaluation / Result
  let evaluation = cleanVal(summary.evaluation || rawLog.status || log?.status);
  if (evaluation) {
    const evalLower = evaluation.toLowerCase().trim();
    if (evalLower === 'pass' || evalLower === 'passed') evaluation = 'Passed';
    else if (evalLower === 'fail' || evalLower === 'failed' || evalLower === 'needs_review' || evalLower === 'need_review' || evalLower === 'action_required') evaluation = 'Needs Review';
  }

  return {
    foodItem,
    defrostMethod,
    storageLocation,
    defrostStart,
    defrostCompleted,
    temperature,
    evaluation,
    hasAny: Boolean(foodItem || defrostMethod || storageLocation || defrostStart || defrostCompleted || temperature || evaluation)
  };
};

const HaccpReportsPage = () => {
  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [activePreset, setActivePreset] = useState('today');
  const [selectedModuleIds, setSelectedModuleIds] = useState([]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Drill-Down Drawer State
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const SUPPORTED_DETAIL_MODULES = ['cooking-temperature', 'temperature', 'delivery-intake', 'cleaning', 'hot-holding', 'blast-chilling', 'cooling-process', 'thawing', 'probe-calibration', 'food-dispatch', 'fryer-oil', 'pest-control', 'health-declaration', 'staff-training'];

  const openLogDetail = async (logRow) => {
    if (!SUPPORTED_DETAIL_MODULES.includes(logRow.moduleId)) {
      return;
    }

    setDetailDrawerOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setSelectedLogDetail(null);

    try {
      const res = await axios.get(`/api/haccp-reports/log-detail/${logRow.moduleId}/${logRow.id}`);
      setSelectedLogDetail(res.data);
    } catch (err) {
      console.error('Failed to load detailed log record', err);
      setDetailError(err.response?.data?.message || 'Failed to load detailed log record.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeLogDetail = () => {
    setDetailDrawerOpen(false);
    setSelectedLogDetail(null);
    setDetailError(null);
  };

  // Quick Date Preset Helpers
  const handlePresetSelect = (presetType) => {
    setActivePreset(presetType);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (presetType === 'today') {
      setFromDate(today);
      setToDate(today);
    } else if (presetType === 'this_week') {
      const dayOfWeek = now.getDay();
      const diffToMon = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diffToMon)).toISOString().split('T')[0];
      setFromDate(monday);
      setToDate(todayStr);
    } else if (presetType === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      setFromDate(firstDay);
      setToDate(todayStr);
    } else if (presetType === 'last_30_days') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      setFromDate(past30.toISOString().split('T')[0]);
      setToDate(todayStr);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const moduleParam = selectedModuleIds.length > 0 ? selectedModuleIds.join(',') : 'all';
      const res = await axios.get('/api/haccp-reports', {
        params: {
          from_date: fromDate,
          to_date: toDate,
          preset: activePreset,
          module: moduleParam,
        },
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load HACCP report data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [fromDate, toDate, selectedModuleIds]);

  const handleCSV = () => {
    const moduleParam = selectedModuleIds.length > 0 ? selectedModuleIds.join(',') : 'all';
    window.open(`/api/haccp-reports/export-csv?from_date=${fromDate}&to_date=${toDate}&module=${moduleParam}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageLayout>
      <Head title="HACCP Reports & Audits" />

      <div className="haccp-reports-main-content">
        {/* Page Header */}
        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="page-title">HACCP Reports & Historical Audits</h1>
              <span className="badge badge-standard">Audit Ready</span>
            </div>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Aggregated historical log records for environmental health officers (EHO), managers & auditors.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" icon={Download} onClick={handleCSV}>
              Export CSV Report
            </Button>
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>
              Print Report
            </Button>
          </div>
        </div>

        {/* Filter Controls Bar with Date Ranges & Multi-Select Modules */}
        <Card style={{ padding: '20px', marginBottom: '24px', borderRadius: '16px' }}>
          {/* Quick Date Range Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Quick Date Filters:
            </span>

            <button
              type="button"
              onClick={() => handlePresetSelect('today')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activePreset === 'today' ? 'var(--color-primary)' : '#F3F4F6',
                color: activePreset === 'today' ? '#fff' : 'var(--color-text-secondary)',
                transition: 'all 150ms ease',
              }}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('this_week')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activePreset === 'this_week' ? 'var(--color-primary)' : '#F3F4F6',
                color: activePreset === 'this_week' ? '#fff' : 'var(--color-text-secondary)',
                transition: 'all 150ms ease',
              }}
            >
              This Week
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('this_month')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activePreset === 'this_month' ? 'var(--color-primary)' : '#F3F4F6',
                color: activePreset === 'this_month' ? '#fff' : 'var(--color-text-secondary)',
                transition: 'all 150ms ease',
              }}
            >
              This Month
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('last_30_days')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activePreset === 'last_30_days' ? 'var(--color-primary)' : '#F3F4F6',
                color: activePreset === 'last_30_days' ? '#fff' : 'var(--color-text-secondary)',
                transition: 'all 150ms ease',
              }}
            >
              Last 30 Days
            </button>
          </div>

          {/* Custom Date Inputs & Multi-Select Module Filter */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'flex-start' }}>
            
            {/* From Date */}
            <div>
              <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>From Date</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--color-primary)" />
                <input
                  type="date"
                  className="form-input"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setActivePreset('');
                  }}
                  style={{ fontSize: '13px', padding: '8px 10px' }}
                />
              </div>
            </div>

            {/* To Date */}
            <div>
              <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>To Date</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--color-primary)" />
                <input
                  type="date"
                  className="form-input"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setActivePreset('');
                  }}
                  style={{ fontSize: '13px', padding: '8px 10px' }}
                />
              </div>
            </div>

            {/* Multi-Select Modules Filter */}
            <div>
              <MultiSelectDropdown 
                label="Filter by Modules (Multi-Select)"
                options={ALL_MODULE_OPTIONS}
                selectedIds={selectedModuleIds}
                onChange={setSelectedModuleIds}
                placeholder="All 15 Modules Selected..."
              />
            </div>

          </div>
        </Card>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Loading HACCP report data for range ({fromDate} to {toDate})...
          </div>
        ) : (
          <>
            {/* Aggregate KPI Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <Card style={{ padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '2px' }}>
                  {data?.totalEntries || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Log Entries</div>
              </Card>

              <Card style={{ padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563EB', marginBottom: '2px' }}>
                  {data?.modulesUsed || 0} / {data?.totalModules || 15}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Modules Active</div>
              </Card>

              <Card style={{ padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#047857', marginBottom: '2px' }}>
                  {data?.passed || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Passed Logs</div>
              </Card>

              <Card style={{ padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#DC2626', marginBottom: '2px' }}>
                  {data?.failed || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Needs Review / Failed</div>
              </Card>
            </div>

            {/* Audit Logs List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Array.isArray(data?.logs) && data.logs.length > 0 ? (
                data.logs.map((log, idx) => {
                  const isClickable = SUPPORTED_DETAIL_MODULES.includes(log.moduleId);

                  return (
                    <Card
                      key={idx}
                      onClick={isClickable ? () => openLogDetail(log) : undefined}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        cursor: isClickable ? 'pointer' : 'default',
                        transition: 'all 0.15s ease-in-out',
                        border: isClickable ? '1px solid #D1FAE5' : '1px solid var(--color-border-light)',
                        backgroundColor: '#FFFFFF',
                      }}
                      className={isClickable ? 'haccp-clickable-report-card' : ''}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                              {log.moduleName}
                            </h3>
                            {isClickable && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: 'var(--color-primary)',
                                  backgroundColor: '#ECFDF5',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                View Details <ChevronRight size={12} />
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            Log Record ID: #{log.id} • Date: <strong>{formatDate(log.date)}</strong> at {formatTime(log.time)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <StatusBadge status={log.status} />
                        </div>
                      </div>

                      {/* Mandatory Display Fields Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '13px', backgroundColor: '#F9FAFB', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--color-border-light)' }}>
                        <div>
                          <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Logged On / Checked At</span>
                          <strong style={{ color: 'var(--color-text-primary)' }}>
                            {formatDate(log.date)} at {formatTime(log.time)}
                          </strong>
                        </div>

                        <div>
                          <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Updated At</span>
                          {log.updated_at ? (
                            <strong style={{ color: 'var(--color-text-primary)' }}>{formatTimestamp(log.updated_at)}</strong>
                          ) : (
                            <span style={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '13px' }}>Null</span>
                          )}
                        </div>

                        <div>
                          <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Staff / Inspector</span>
                          <strong style={{ color: 'var(--color-text-primary)' }}>{log.staffName || 'Staff'}</strong>
                        </div>

                        <div>
                          <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Signature Status</span>
                          {log.signature ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#065F46',
                                backgroundColor: '#ECFDF5',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                <CheckCircle2 size={12} /> Signed
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '13px' }}>Not Recorded</span>
                          )}
                        </div>

                        {/* Temperature Monitoring Fields */}
                        {log.moduleId === 'temperature' && getTemperatureStorageUnit(log) && (
                          <div>
                            <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Storage Unit</span>
                            <strong style={{ color: 'var(--color-text-primary)' }}>{getTemperatureStorageUnit(log)}</strong>
                          </div>
                        )}

                        {log.moduleId === 'temperature' && getTemperatureRecordedTemp(log) && (
                          <div>
                            <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Recorded Temperature</span>
                            <strong style={{ color: 'var(--color-text-primary)' }}>{getTemperatureRecordedTemp(log)}</strong>
                          </div>
                        )}

                        {/* Delivery Intake Fields */}
                        {log.moduleId === 'delivery-intake' && (
                          <>
                            {getDeliverySupplier(log) && (
                              <div>
                                <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Supplier</span>
                                <strong style={{ color: 'var(--color-text-primary)' }}>{getDeliverySupplier(log)}</strong>
                              </div>
                            )}

                            {getDeliveryVehicle(log) && (
                              <div>
                                <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Delivery Vehicle</span>
                                <strong style={{ color: 'var(--color-text-primary)' }}>{getDeliveryVehicle(log)}</strong>
                              </div>
                            )}
                          </>
                        )}

                        {log.formData?.holdingUnit && (
                          <div>
                            <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Station / Unit</span>
                            <strong style={{ color: 'var(--color-text-primary)' }}>{log.formData.holdingUnit}</strong>
                          </div>
                        )}

                        {log.formData?.mainReason && (
                          <div>
                            <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Primary Waste Reason</span>
                            <strong style={{ color: 'var(--color-text-primary)' }}>{log.formData.mainReason}</strong>
                          </div>
                        )}

                        {log.formData?.taskTitle && (
                          <div>
                            <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Training Task</span>
                            <strong style={{ color: 'var(--color-text-primary)' }}>{log.formData.taskTitle}</strong>
                          </div>
                        )}
                      </div>

                      {/* Amendment Reason Alert Box - only if an amendment exists */}
                      {Boolean(
                        log.latest_amendment_reason &&
                        String(log.latest_amendment_reason).trim() !== '' &&
                        String(log.latest_amendment_reason).trim().toLowerCase() !== 'null' &&
                        String(log.latest_amendment_reason).trim().toLowerCase() !== 'n/a'
                      ) && (
                        <div
                          style={{
                            backgroundColor: '#FFFBEB',
                            color: '#92400E',
                            borderLeft: '4px solid #F59E0B',
                            padding: '10px 14px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                          }}
                        >
                          <div>
                            <strong>Amendment Reason:</strong> {String(log.latest_amendment_reason).trim()}
                          </div>
                          {(log.latest_amended_by || log.latest_amended_at) && (
                            <div style={{ fontSize: '11.5px', color: '#B45309' }}>
                              Amended {log.latest_amended_by ? `by ${log.latest_amended_by}` : ''} {log.latest_amended_at ? `on ${formatTimestamp(log.latest_amended_at)}` : ''}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Cooking Temperature Multi-Stage Filled Summaries */}
                      {log.moduleId === 'cooking-temperature' && (log.cookingSummary || log.formData?.cookingSummary) && (
                        (() => {
                          const summary = log.cookingSummary || log.formData?.cookingSummary;
                          const hasAnyStage = summary && (summary.foodDetails || summary.cooking || summary.blastChilling || summary.chillerHold || summary.reheating || summary.hotHolding);
                          if (!hasAnyStage) return null;

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                                Filled Stage Summaries:
                              </span>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
                                {/* Food Details */}
                                {summary.foodDetails && (
                                  <div style={{ backgroundColor: '#F9FAFB', border: '1px solid var(--color-border-light)', borderRadius: '8px', padding: '10px 12px', fontSize: '12.5px' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px' }}>
                                      Food Details
                                    </div>
                                    <div><strong>Product:</strong> {summary.foodDetails.foodItem || '-'}</div>
                                    {summary.foodDetails.batchCode && (
                                      <div><strong>Batch / Lot:</strong> {summary.foodDetails.batchCode}</div>
                                    )}
                                  </div>
                                )}

                                {/* Cooking (CCP-3) */}
                                {summary.cooking && (
                                  <div style={{ backgroundColor: '#F9FAFB', border: '1px solid var(--color-border-light)', borderRadius: '8px', padding: '10px 12px', fontSize: '12.5px' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span>Cooking (CCP-3)</span>
                                      <span style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        backgroundColor: summary.cooking.passed ? '#ECFDF5' : '#FEF2F2',
                                        color: summary.cooking.passed ? '#065F46' : '#991B1B'
                                      }}>
                                        {summary.cooking.result}
                                      </span>
                                    </div>
                                    <div><strong>Core Temp:</strong> {summary.cooking.temp}</div>
                                    {summary.cooking.target && <div><strong>Target:</strong> {summary.cooking.target}</div>}
                                    {summary.cooking.method && <div><strong>Method:</strong> {summary.cooking.method}</div>}
                                  </div>
                                )}

                                {/* Blast Chilling (CCP-4) */}
                                {summary.blastChilling && (
                                  <div style={{ backgroundColor: '#F9FAFB', border: '1px solid var(--color-border-light)', borderRadius: '8px', padding: '10px 12px', fontSize: '12.5px' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span>Blast Chilling (CCP-4)</span>
                                      <span style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        backgroundColor: summary.blastChilling.passed ? '#ECFDF5' : '#FEF2F2',
                                        color: summary.blastChilling.passed ? '#065F46' : '#991B1B'
                                      }}>
                                        {summary.blastChilling.result}
                                      </span>
                                    </div>
                                    {summary.blastChilling.startTemp && <div><strong>Start:</strong> {summary.blastChilling.startTemp}</div>}
                                    <div><strong>End:</strong> {summary.blastChilling.endTemp} in {summary.blastChilling.duration}</div>
                                  </div>
                                )}

                                {/* Chiller Hold */}
                                {summary.chillerHold && (
                                  <div style={{ backgroundColor: '#F9FAFB', border: '1px solid var(--color-border-light)', borderRadius: '8px', padding: '10px 12px', fontSize: '12.5px' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span>Chiller Hold</span>
                                      <span style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        backgroundColor: summary.chillerHold.passed ? '#ECFDF5' : '#FEF2F2',
                                        color: summary.chillerHold.passed ? '#065F46' : '#991B1B'
                                      }}>
                                        {summary.chillerHold.result}
                                      </span>
                                    </div>
                                    <div><strong>Temp:</strong> {summary.chillerHold.temp}</div>
                                    {summary.chillerHold.location && <div><strong>Unit:</strong> {summary.chillerHold.location}</div>}
                                  </div>
                                )}

                                {/* Reheating */}
                                {summary.reheating && (
                                  <div style={{ backgroundColor: '#F9FAFB', border: '1px solid var(--color-border-light)', borderRadius: '8px', padding: '10px 12px', fontSize: '12.5px' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span>Reheating</span>
                                      <span style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        backgroundColor: summary.reheating.passed ? '#ECFDF5' : '#FEF2F2',
                                        color: summary.reheating.passed ? '#065F46' : '#991B1B'
                                      }}>
                                        {summary.reheating.result}
                                      </span>
                                    </div>
                                    <div><strong>Reheated Temp:</strong> {summary.reheating.temp}</div>
                                    {summary.reheating.method && <div><strong>Method:</strong> {summary.reheating.method}</div>}
                                  </div>
                                )}

                                {/* Hot Holding */}
                                {summary.hotHolding && (
                                  <div style={{ backgroundColor: '#F9FAFB', border: '1px solid var(--color-border-light)', borderRadius: '8px', padding: '10px 12px', fontSize: '12.5px' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span>Hot Holding / Final (CCP-5)</span>
                                      <span style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        backgroundColor: summary.hotHolding.passed ? '#ECFDF5' : '#FEF2F2',
                                        color: summary.hotHolding.passed ? '#065F46' : '#991B1B'
                                      }}>
                                        {summary.hotHolding.result}
                                      </span>
                                    </div>
                                    <div><strong>Holding Temp:</strong> {summary.hotHolding.temp}</div>
                                    {summary.hotHolding.location && <div><strong>Location:</strong> {summary.hotHolding.location}</div>}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      )}

                      {/* Thawing / Defrosting Process Details */}
                      {log.moduleId === 'thawing' && (() => {
                        const thawing = getThawingDetails(log);
                        if (!thawing.hasAny) return null;

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                              Thawing / Defrosting Details:
                            </span>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '12px',
                                backgroundColor: '#F9FAFB',
                                border: '1px solid var(--color-border-light)',
                                borderRadius: '8px',
                                padding: '12px 14px',
                                fontSize: '13px',
                              }}
                            >
                              {thawing.foodItem && (
                                <div>
                                  <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Food Product / Item</span>
                                  <strong style={{ color: 'var(--color-primary)' }}>{thawing.foodItem}</strong>
                                </div>
                              )}

                              {thawing.defrostMethod && (
                                <div>
                                  <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Defrosting Method</span>
                                  <strong style={{ color: 'var(--color-text-primary)' }}>{thawing.defrostMethod}</strong>
                                </div>
                              )}

                              {thawing.storageLocation && (
                                <div>
                                  <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Storage / Location</span>
                                  <strong style={{ color: 'var(--color-text-primary)' }}>{thawing.storageLocation}</strong>
                                </div>
                              )}

                              {thawing.defrostStart && (
                                <div>
                                  <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Defrost Start</span>
                                  <strong style={{ color: 'var(--color-text-primary)' }}>{thawing.defrostStart}</strong>
                                </div>
                              )}

                              {thawing.defrostCompleted && (
                                <div>
                                  <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Defrost Completed</span>
                                  <strong style={{ color: 'var(--color-text-primary)' }}>{thawing.defrostCompleted}</strong>
                                </div>
                              )}

                              {thawing.temperature && (
                                <div>
                                  <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Temperature After Defrosting</span>
                                  <strong style={{ color: parseFloat(thawing.temperature) > 5 ? '#DC2626' : 'var(--color-text-primary)' }}>{thawing.temperature}</strong>
                                </div>
                              )}

                              {thawing.evaluation && (
                                <div>
                                  <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'block', fontWeight: 600 }}>Evaluation / Result</span>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      fontSize: '11.5px',
                                      fontWeight: 700,
                                      color: thawing.evaluation === 'Passed' ? '#065F46' : '#991B1B',
                                      backgroundColor: thawing.evaluation === 'Passed' ? '#ECFDF5' : '#FEF2F2',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      marginTop: '2px',
                                    }}
                                  >
                                    {thawing.evaluation}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Form Details Summary - only show if actual content exists */}
                      {hasValidComment(log.formData?.generalComments || log.thawingSummary?.comments || log.formData?.rawLog?.comments) && (
                        <div style={{ padding: '10px 14px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid var(--color-border-light)', fontSize: '13px' }}>
                          <strong>Comments / Observations:</strong> {String(log.formData?.generalComments || log.thawingSummary?.comments || log.formData?.rawLog?.comments).trim()}
                        </div>
                      )}

                      {/* Delivered Foods Table for Delivery Intake */}
                      {log.moduleId === 'delivery-intake' && getDeliveryProducts(log).length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                            Delivered Foods / Products:
                          </span>
                          <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-light)', borderRadius: '8px' }}>
                            <table className="data-table" style={{ fontSize: '12.5px', width: '100%' }}>
                              <thead>
                                <tr>
                                  <th>Food</th>
                                  <th>Batch Code</th>
                                  <th>Use By Date</th>
                                  <th>Temperature</th>
                                </tr>
                              </thead>
                              <tbody>
                                {getDeliveryProducts(log).map((prod, pIdx) => (
                                  <tr key={pIdx}>
                                    <td><strong>{prod.food || '-'}</strong></td>
                                    <td>{prod.batchCode || '-'}</td>
                                    <td>{formatDisplayDate(prod.useByDate)}</td>
                                    <td>{formatProductTemp(prod.temperature)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Itemized Table if Hot Holding */}
                      {log.moduleId === 'hot-holding' && Array.isArray(log.formData?.items) && log.formData.items.length > 0 && (
                        <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-light)', borderRadius: '8px' }}>
                          <table className="data-table" style={{ fontSize: '12.5px' }}>
                            <thead>
                              <tr>
                                <th>Food Item</th>
                                <th>Time into Hold</th>
                                <th>Check 1 (°C)</th>
                                <th>Check 2 (°C)</th>
                                <th>Check 3 (°C)</th>
                                <th>Check 4 (°C)</th>
                                <th>Comments</th>
                              </tr>
                            </thead>
                            <tbody>
                              {log.formData.items.map((it, iIdx) => (
                                <tr key={iIdx}>
                                  <td><strong>{it.foodName}</strong></td>
                                  <td>{it.timeIntoHold || '-'}</td>
                                  <td>{it.check1 ? `${it.check1}°C` : '-'}</td>
                                  <td>{it.check2 ? `${it.check2}°C` : '-'}</td>
                                  <td>{it.check3 ? `${it.check3}°C` : '-'}</td>
                                  <td>{it.check4 ? `${it.check4}°C` : '-'}</td>
                                  <td>{it.comments || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Signature */}
                      {log.signature && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--color-border-light)', paddingTop: '10px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Staff Signature:</span>
                          <div style={{ height: '40px', padding: '4px 10px', backgroundColor: '#FAFAFA', border: '1px solid var(--color-border-light)', borderRadius: '6px' }}>
                            <img src={log.signature} alt="Signature" style={{ height: '100%', objectFit: 'contain' }} />
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })
              ) : (
                <Card style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  <FileText size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <div>No HACCP log records found for range ({fromDate} to {toDate}).</div>
                </Card>
              )}
            </div>
          </>
        )}
      </div>

      {/* HACCP Log Detail Drawer (Requirement 4) */}
      <HaccpLogDetailDrawer
        isOpen={detailDrawerOpen}
        onClose={closeLogDetail}
        data={selectedLogDetail}
        loading={detailLoading}
        error={detailError}
      />
    </PageLayout>
  );
};

export default HaccpReportsPage;
