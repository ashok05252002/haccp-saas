import React, { useState } from 'react';
import {
  Users, Sparkles, UserCheck, ClipboardList, Clock,
  Pencil, Trash2, Plus, Mail, CheckCircle, Circle,
  UserPlus, PlusCircle, Truck, Thermometer, Flame,
  Snowflake, Soup, Wind, Droplets, Gauge, Bug, AlertTriangle,
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Button from '../components/common/Button';

/* ─── MOCK DATA ─────────────────────────────────── */
const MOCK_CLEANING = [
  { id: 1, name: 'Cofee table', frequency: 'Weekly', description: 'clean properly', active: true },
  { id: 2, name: 'coffee', frequency: 'Weekly', description: '', active: true },
  { id: 3, name: 'reception area', frequency: 'Monthly', description: '', active: true },
  { id: 4, name: 'Restroom 1', frequency: 'Weekly', description: '', active: true },
];

const MOCK_EMPLOYEES = [
  { id: 1, name: 'Richie Allen Vaz', email: 'rallenvaz320@gmail.com', role: 'Platform Admin' },
  { id: 2, name: 'Madhu Kani', email: 'madhukani09@gmail.com', role: 'Platform Admin' },
  { id: 3, name: 'Ashok Kumar', email: 'ashokkumarm25052002@gmail.com', role: 'Platform Admin' },
  { id: 4, name: 'Joseph Rufus', email: 'mdrufus02@gmail.com', role: 'Platform Admin' },
];

const MOCK_REVIEW_ITEMS = [
  { id: 1, title: 'Hygiene Sign off', description: 'Suo to so everrudagt', logTypes: ['Cleaning & Sanitation'] },
];

const MOCK_HISTORY = [
  {
    id: 1, type: 'added', badge: 'Review Item Added',
    text: 'Added review item: Hygiene Sign off',
    meta: 'by Richie Allen Vaz · 2026-07-09 at 19:21',
    logTypes: 'cleaning',
  },
  {
    id: 2, type: 'removed', badge: 'Review Item Removed',
    text: 'Removed review item: Food Delivery',
    meta: 'by Richie Allen Vaz · 2026-07-09 at 19:20',
    logTypes: 'delivery',
  },
  {
    id: 3, type: 'removed', badge: 'Review Item Removed',
    text: 'Removed review item: Cleaning',
    meta: 'by Richie Allen Vaz · 2026-07-09 at 19:20',
    logTypes: 'cleaning',
  },
  {
    id: 4, type: 'removed', badge: 'Review Item Removed',
    text: 'Removed review item: Thermometer Check',
    meta: 'by Richie Allen Vaz · 2026-07-09 at 19:20',
    logTypes: 'probe_calibration',
  },
  {
    id: 5, type: 'removed', badge: 'Review Item Removed',
    text: 'Removed review item: Thawing',
    meta: 'by Richie Allen Vaz · 2026-07-09 at 19:20',
    logTypes: 'thawing',
  },
];

const TOOL_ACCESS_OPTIONS = [
  'Food Delivery', 'Fridges & Freezers', 'Cooking / Cooling / Reheating',
  'Hot & Cold Hold', 'Thawing', 'Thermometer Check',
  'Cleaning', 'Recipe Calculator', 'Bulk Planner',
];

const LOG_TYPES = [
  'Temperature Monitoring', 'Delivery & Intake', 'Cooking Temperature', 'Blast Chilling',
  'Hot Holding / Bain Marie', 'Cooling Process', 'Thawing / Defrosting', 'Cleaning & Sanitation',
  'Personal Hygiene', 'Probe Calibration', 'Oil / Fryer Monitoring', 'Corrective Actions', 'Pest Control',
];

const TABS = [
  { key: 'suppliers', label: 'Suppliers', icon: Users },
  { key: 'cleaning', label: 'Cleaning Areas', icon: Sparkles },
  { key: 'employees', label: 'Employees', icon: UserCheck },
  { key: 'reviewItems', label: 'Review Items', icon: ClipboardList },
  { key: 'history', label: 'History', icon: Clock },
];

/* ─── TOGGLE COMPONENT ───────────────────────────── */
const Toggle = ({ checked, onChange }) => (
  <label style={S.switch} onClick={() => onChange(!checked)}>
    <span style={{ ...S.slider, backgroundColor: checked ? 'var(--color-success)' : '#E5E7EB' }}>
      <span style={{ ...S.sliderKnob, transform: checked ? 'translateX(20px)' : 'translateX(0)' }} />
    </span>
  </label>
);

/* ─── FREQUENCY BADGE ────────────────────────────── */
const FreqBadge = ({ text }) => (
  <span style={S.freqBadge}>{text}</span>
);

/* ─── CLEANING TAB ───────────────────────────────── */
const CleaningTab = () => {
  const [items, setItems] = useState(MOCK_CLEANING);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', frequency: 'Daily', description: '', active: true });

  const handleAdd = () => {
    if (!form.name) return;
    setItems(prev => [...prev, { id: Date.now(), ...form }]);
    setForm({ name: '', frequency: 'Daily', description: '', active: true });
    setShowForm(false);
  };

  const handleDelete = (id) => setItems(prev => prev.filter(i => i.id !== id));

  return (
    <div>
      {/* Add button */}
      {!showForm && (
        <div style={{ marginBottom: '20px' }}>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            Add Cleaning Area
          </Button>
        </div>
      )}

      {/* Inline form */}
      {showForm && (
        <div style={S.card}>
          <h2 style={S.cardTitle}>New Cleaning Area</h2>
          <div style={S.formGrid}>
            <div className="form-group">
              <label className="form-label">Area Name *</label>
              <input className="form-input" placeholder="e.g. Prep Area 1, Grill Station"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Cleaning Frequency</label>
              <select className="form-select" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>As Needed</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description / Instructions</label>
            <textarea className="form-textarea" style={{ minHeight: '80px' }}
              placeholder="What needs cleaning in this area (e.g. sanitize all surfaces, degrease behind fryer)"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          {/* Active toggle */}
          <div style={S.toggleFullRow}>
            <span style={S.toggleFullLabel}>Active</span>
            <Toggle checked={form.active} onChange={v => setForm({ ...form, active: v })} />
          </div>
          <div style={S.formFooter}>
            <button style={S.cancelBtn} onClick={() => setShowForm(false)}>✕ Cancel</button>
            <button style={S.addBtn} onClick={handleAdd}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
              Add Area
            </button>
          </div>
        </div>
      )}

      {/* List card */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sparkles size={18} color="var(--color-purple)" />
          <h3 style={S.listTitle}>Cleaning Areas ({items.length})</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map(item => (
            <div key={item.id} style={S.listRow}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={S.itemName}>{item.name}</span>
                  <FreqBadge text={item.frequency} />
                </div>
                {item.description && <div style={S.itemSub}>{item.description}</div>}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button style={S.iconBtn}><Pencil size={15} /></button>
                <button style={S.iconBtn} onClick={() => handleDelete(item.id)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── EMPLOYEES TAB ──────────────────────────────── */
const EmployeesTab = () => {
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'Staff', tools: [] });
  const [users] = useState(MOCK_EMPLOYEES);

  const toggleTool = (tool) => {
    setInviteForm(prev => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool],
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Invite card */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <UserPlus size={18} color="var(--color-primary)" />
          <h3 style={S.listTitle}>Invite New User</h3>
        </div>
        <div style={S.formGrid}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="name@company.com"
              value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">App Role</label>
            <select className="form-select" value={inviteForm.role} onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}>
              <option>Staff</option>
              <option>Supervisor</option>
              <option>Manager</option>
              <option>Platform Admin</option>
            </select>
          </div>
        </div>
        <p style={S.sectionLabel}>Tool Access (leave empty for all tools)</p>
        <div style={S.pillGrid}>
          {TOOL_ACCESS_OPTIONS.map(tool => {
            const selected = inviteForm.tools.includes(tool);
            return (
              <button key={tool} style={{ ...S.pillOption, ...(selected ? S.pillOptionActive : {}) }}
                onClick={() => toggleTool(tool)}>
                {selected
                  ? <CheckCircle size={16} color="var(--color-primary)" />
                  : <Circle size={16} color="#C5C5C5" />}
                {tool}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: '20px' }}>
          <button style={S.sendBtn}>
            <Mail size={15} style={{ marginRight: '6px' }} />
            Send Invite
          </button>
        </div>
      </div>

      {/* Users card */}
      <div style={S.card}>
        <h3 style={{ ...S.listTitle, marginBottom: '16px' }}>Users &amp; Access</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {users.map(u => (
            <div key={u.id} style={S.listRow}>
              <div style={{ flex: 1 }}>
                <div style={S.itemName}>{u.name}</div>
                <div style={S.itemSub}>{u.email}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={S.adminBadge}>{u.role}</span>
                <button style={S.editText}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── REVIEW ITEMS TAB ───────────────────────────── */
const ReviewItemsTab = () => {
  const [items, setItems] = useState(MOCK_REVIEW_ITEMS);
  const [form, setForm] = useState({ title: '', description: '', logTypes: [] });

  const toggleLog = (lt) => {
    setForm(prev => ({
      ...prev,
      logTypes: prev.logTypes.includes(lt)
        ? prev.logTypes.filter(t => t !== lt)
        : [...prev.logTypes, lt],
    }));
  };

  const handleAdd = () => {
    if (!form.title) return;
    setItems(prev => [...prev, { id: Date.now(), title: form.title, description: form.description, logTypes: form.logTypes }]);
    setForm({ title: '', description: '', logTypes: [] });
  };

  const handleDelete = (id) => setItems(prev => prev.filter(i => i.id !== id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Add form card */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <PlusCircle size={18} color="var(--color-primary)" />
          <h3 style={S.listTitle}>Add Review Item</h3>
        </div>
        <div className="form-group">
          <label className="form-label">Item Name</label>
          <input className="form-input" placeholder="e.g. Food Delivery Logs"
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-input" placeholder="What does this review cover?"
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <p style={S.sectionLabel}>Log Types to Include</p>
        <div style={{ ...S.pillGrid, gridTemplateColumns: '1fr 1fr' }}>
          {LOG_TYPES.map(lt => {
            const selected = form.logTypes.includes(lt);
            return (
              <button key={lt} style={{ ...S.pillOption, ...(selected ? S.pillOptionActive : {}) }}
                onClick={() => toggleLog(lt)}>
                {selected
                  ? <CheckCircle size={16} color="var(--color-primary)" />
                  : <Circle size={16} color="#C5C5C5" />}
                {lt}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: '20px' }}>
          <button style={S.sendBtn} onClick={handleAdd}>
            <Plus size={15} style={{ marginRight: '6px' }} />
            Add Item
          </button>
        </div>
      </div>

      {/* List card */}
      <div style={S.card}>
        <h3 style={{ ...S.listTitle, marginBottom: '16px' }}>Review Items ({items.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map(item => (
            <div key={item.id} style={S.listRow}>
              <div style={{ flex: 1 }}>
                <div style={S.itemName}>{item.title}</div>
                {item.description && <div style={S.itemSub}>{item.description}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {item.logTypes.map(lt => (
                    <span key={lt} style={S.logTypeBadge}>{lt}</span>
                  ))}
                </div>
              </div>
              <button style={S.iconBtn} onClick={() => handleDelete(item.id)}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── HISTORY TAB ────────────────────────────────── */
const HistoryTab = () => {
  const [items] = useState(MOCK_HISTORY);

  return (
    <div style={S.card}>
      <h3 style={{ ...S.listTitle, marginBottom: '16px' }}>Activity History</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map(item => (
          <div key={item.id} style={S.historyRow}>
            <div style={{
              ...S.historyIcon,
              backgroundColor: item.type === 'added' ? '#E8F8F0' : '#FEF2F2',
            }}>
              {item.type === 'added'
                ? <Plus size={16} color="var(--color-success)" />
                : <Trash2 size={16} color="#EF4444" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  ...S.historyBadge,
                  backgroundColor: item.type === 'added' ? '#E8F8F0' : '#FEF2F2',
                  color: item.type === 'added' ? 'var(--color-success)' : '#EF4444',
                }}>
                  {item.badge}
                </span>
                <span style={S.historyText}>{item.text}</span>
              </div>
              <div style={S.historyMeta}>{item.meta}</div>
              <div style={S.historyLogType}>Log types: {item.logTypes}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── SUPPLIERS TAB (unchanged, re-uses parent state) */
const SuppliersTab = ({ modalOpen, setModalOpen, supplierForm, setSupplierForm, handleSave, saving, suppliers }) => {
  return (
    <div>
      {!modalOpen && (
        <div style={{ marginBottom: '20px' }}>
          <Button variant="primary" onClick={() => {
            setSupplierForm({ name: '', category: 'Grocery', contactPerson: '', phone: '', email: '', orderDay: 'None', address: '', approved: true });
            setModalOpen(true);
          }}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            Add Supplier
          </Button>
        </div>
      )}

      {modalOpen && (
        <div style={S.card}>
          <h2 style={S.cardTitle}>New Supplier</h2>
          <div style={S.formGrid}>
            <div className="form-group">
              <label className="form-label">Supplier Name *</label>
              <input className="form-input" value={supplierForm.name}
                onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} placeholder="Enter supplier name" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={supplierForm.category}
                onChange={e => setSupplierForm({ ...supplierForm, category: e.target.value })}>
                <option>Grocery</option><option>Meat</option><option>Produce</option><option>Dairy</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Contact Name</label>
              <input className="form-input" value={supplierForm.contactPerson}
                onChange={e => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} placeholder="Contact person name" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" type="tel" value={supplierForm.phone}
                onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} placeholder="Phone number" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={supplierForm.email}
                onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} placeholder="Email address" />
            </div>
            <div className="form-group">
              <label className="form-label">Usual Order Day</label>
              <select className="form-select" value={supplierForm.orderDay}
                onChange={e => setSupplierForm({ ...supplierForm, orderDay: e.target.value })}>
                <option>None</option><option>Monday</option><option>Tuesday</option>
                <option>Wednesday</option><option>Thursday</option><option>Friday</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" value={supplierForm.address}
              onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} placeholder="Supplier address" />
          </div>
          <div style={S.toggleFullRow}>
            <span style={S.toggleFullLabel}>Active Supplier</span>
            <Toggle checked={supplierForm.approved} onChange={v => setSupplierForm({ ...supplierForm, approved: v })} />
          </div>
          <div style={S.formFooter}>
            <button style={S.cancelBtn} onClick={() => setModalOpen(false)}>✕ Cancel</button>
            <button style={S.addBtn} onClick={handleSave} disabled={saving || !supplierForm.name}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
              Add Supplier
            </button>
          </div>
        </div>
      )}

      {!modalOpen && (
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Users size={18} color="var(--color-primary)" />
            <h3 style={S.listTitle}>Suppliers ({suppliers.length})</h3>
          </div>
          {suppliers.length === 0
            ? <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>No suppliers added yet.</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {suppliers.map(s => (
                  <div key={s.id} style={S.listRow}>
                    <div style={{ flex: 1 }}>
                      <div style={S.itemName}>{s.name}</div>
                      {s.email && <div style={S.itemSub}>{s.email}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={S.iconBtn}><Pencil size={15} /></button>
                      <button style={S.iconBtn}><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  );
};

/* ─── MAIN PAGE ──────────────────────────────────── */
const ManagerHubPage = () => {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierForm, setSupplierForm] = useState({
    name: '', category: 'Grocery', contactPerson: '', phone: '', email: '',
    orderDay: 'None', address: '', approved: true,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    setSuppliers(prev => [...prev, { id: Date.now(), ...supplierForm }]);
    setSupplierModalOpen(false);
    setSaving(false);
  };

  // Hide tab bar when supplier form is open
  const hideTabBar = activeTab === 'suppliers' && supplierModalOpen;

  return (
    <PageLayout>
      <div className="page-header">
        <h1 className="page-title">Manager Hub</h1>
        <p className="page-subtitle">
          Manage suppliers, cleaning areas, employees, supervisor review items, and view activity history
        </p>
      </div>

      {!hideTabBar && (
        <div style={S.tabBar}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              style={{ ...S.tab, ...(activeTab === tab.key ? S.tabActive : {}) }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: '4px' }}>
        {activeTab === 'suppliers' && (
          <SuppliersTab
            modalOpen={supplierModalOpen}
            setModalOpen={setSupplierModalOpen}
            supplierForm={supplierForm}
            setSupplierForm={setSupplierForm}
            handleSave={handleSave}
            saving={saving}
            suppliers={suppliers}
          />
        )}
        {activeTab === 'cleaning' && <CleaningTab />}
        {activeTab === 'employees' && <EmployeesTab />}
        {activeTab === 'reviewItems' && <ReviewItemsTab />}
        {activeTab === 'history' && <HistoryTab />}
      </div>
    </PageLayout>
  );
};

/* ─── STYLES ─────────────────────────────────────── */
const S = {
  tabBar: {
    display: 'flex',
    gap: '2px',
    marginTop: '20px',
    marginBottom: '24px',
    backgroundColor: '#F3F4F6',
    border: '1px solid var(--color-border-light)',
    borderRadius: '999px',
    padding: '4px',
    width: 'fit-content',
    maxWidth: '100%',
  },
  tab: {
    padding: '7px 18px',
    borderRadius: '999px',
    fontSize: '13.5px',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 150ms',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    backgroundColor: '#fff',
    color: 'var(--color-text-primary)',
    fontWeight: 600,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '28px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    marginBottom: '22px',
  },
  listTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    margin: 0,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '4px',
  },
  toggleFullRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    padding: '14px 18px',
    marginTop: '8px',
    marginBottom: '24px',
  },
  toggleFullLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
  },
  formFooter: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginTop: '8px',
  },
  cancelBtn: {
    padding: '9px 18px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    backgroundColor: '#fff',
    color: 'var(--color-text-secondary)',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '9px 18px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-primary)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  listRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    backgroundColor: '#fff',
  },
  itemName: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  },
  itemSub: {
    fontSize: '12.5px',
    color: 'var(--color-text-muted)',
    marginTop: '2px',
  },
  freqBadge: {
    padding: '2px 10px',
    borderRadius: '999px',
    backgroundColor: '#F3F4F6',
    border: '1px solid #E5E7EB',
    fontSize: '12px',
    fontWeight: 500,
    color: '#374151',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    padding: '6px',
    cursor: 'pointer',
    color: '#9CA3AF',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '6px',
  },
  adminBadge: {
    padding: '4px 12px',
    borderRadius: '999px',
    backgroundColor: 'var(--color-primary)',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 600,
  },
  editText: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '2px 4px',
  },
  sectionLabel: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    marginTop: '16px',
    marginBottom: '12px',
  },
  pillGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  pillOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    backgroundColor: '#fff',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 150ms',
  },
  pillOptionActive: {
    border: '1px solid var(--color-primary)',
    backgroundColor: '#F0FAF5',
    color: 'var(--color-primary)',
  },
  sendBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '9px 20px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-primary)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    opacity: 0.9,
  },
  logTypeBadge: {
    padding: '2px 10px',
    borderRadius: '999px',
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    fontSize: '12px',
    fontWeight: 500,
  },
  historyRow: {
    display: 'flex',
    gap: '14px',
    padding: '16px',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    backgroundColor: '#fff',
    alignItems: 'flex-start',
  },
  historyIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  historyBadge: {
    padding: '2px 10px',
    borderRadius: '999px',
    fontSize: '11.5px',
    fontWeight: 600,
  },
  historyText: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  },
  historyMeta: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    marginTop: '4px',
  },
  historyLogType: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    marginTop: '2px',
  },
  // Toggle
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '44px',
    height: '24px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0, left: 0, right: 0, bottom: 0,
    transition: '.2s',
    borderRadius: '24px',
    display: 'flex',
    alignItems: 'center',
  },
  sliderKnob: {
    position: 'absolute',
    height: '20px', width: '20px',
    left: '2px', bottom: '2px',
    backgroundColor: 'white',
    transition: '.2s',
    borderRadius: '50%',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
};

export default ManagerHubPage;
