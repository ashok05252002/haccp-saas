import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Users, Shield, Edit2, Trash2 } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SearchBar from '../components/common/SearchBar';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import axios from 'axios';

const UserRoleManagementPage = () => {
  const [activeTab, setActiveTab] = useState('roles'); // 'roles' | 'users'
  
  // Roles State
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [roleSearch, setRoleSearch] = useState('');
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', status: 'Active' });
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [roleError, setRoleError] = useState(null);

  // Restaurant Users State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', pin_code: '', role_id: '', status: 'Active' });
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [userError, setUserError] = useState(null);

  // Fetch Roles
  const fetchRoles = useCallback(async () => {
    try {
      setLoadingRoles(true);
      const res = await axios.get('/api/roles');
      setRoles(res.data || []);
    } catch (err) {
      console.error('Failed to fetch roles', err);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  // Fetch Restaurant Users
  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await axios.get('/api/tenant-users');
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch restaurant users', err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, [fetchRoles, fetchUsers]);

  // Roles Filtered
  const filteredRoles = useMemo(() => {
    return roles.filter(r => {
      const q = roleSearch.toLowerCase();
      return r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q));
    });
  }, [roles, roleSearch]);

  // Users Filtered
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = userSearch.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email && u.email.toLowerCase().includes(q);
      const matchPhone = u.phone && u.phone.includes(q);
      const matchRole = u.assigned_role?.name?.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchRole;
    });
  }, [users, userSearch]);

  // --- Role Handlers ---
  const handleOpenAddRole = () => {
    setEditingRole(null);
    setRoleForm({ name: '', description: '', status: 'Active' });
    setRoleError(null);
    setRoleModalOpen(true);
  };

  const handleOpenEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({ name: role.name, description: role.description || '', status: role.status || 'Active' });
    setRoleError(null);
    setRoleModalOpen(true);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    setRoleSubmitting(true);
    setRoleError(null);

    try {
      if (editingRole) {
        await axios.put(`/api/roles/${editingRole.id}`, roleForm);
      } else {
        await axios.post('/api/roles', roleForm);
      }
      setRoleModalOpen(false);
      fetchRoles();
    } catch (err) {
      console.error('Failed to save role', err);
      setRoleError(err.response?.data?.message || 'Failed to save role.');
    } finally {
      setRoleSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await axios.delete(`/api/roles/${roleId}`);
      fetchRoles();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete role.');
    }
  };

  // --- User Handlers ---
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({ name: '', email: '', phone: '', pin_code: '', role_id: '', status: 'Active' });
    setUserError(null);
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      pin_code: user.pin_code || '',
      role_id: user.role_id || '',
      status: user.status || 'Active',
    });
    setUserError(null);
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setUserSubmitting(true);
    setUserError(null);

    try {
      if (editingUser) {
        await axios.put(`/api/tenant-users/${editingUser.id}`, userForm);
      } else {
        await axios.post('/api/tenant-users', userForm);
      }
      setUserModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Failed to save user', err);
      setUserError(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setUserSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this restaurant user?')) return;
    try {
      await axios.delete(`/api/tenant-users/${userId}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  return (
    <PageLayout>
      <Head title="User & Role Management" />

      <div>
        <button onClick={() => router.visit('/manager-hub')} className="back-btn">
          <ArrowLeft size={16} />
          <span>Back to Manager Hub</span>
        </button>

        <div className="panel-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <h1 className="page-title">User & Role Management</h1>
            <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Manage restaurant staff team members and assign custom operational roles.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '2px solid var(--color-border-light)', paddingBottom: '2px' }}>
          <button
            onClick={() => setActiveTab('roles')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px 8px 0 0',
              fontWeight: 700,
              fontSize: '15px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: activeTab === 'roles' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'roles' ? '#ffffff' : 'var(--color-text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <Shield size={18} />
            <span>Roles ({roles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px 8px 0 0',
              fontWeight: 700,
              fontSize: '15px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: activeTab === 'users' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'users' ? '#ffffff' : 'var(--color-text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <Users size={18} />
            <span>Restaurant Staff Users ({users.length})</span>
          </button>
        </div>

        {/* TAB 1: ROLES MANAGEMENT */}
        {activeTab === 'roles' && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <SearchBar value={roleSearch} onChange={setRoleSearch} placeholder="Search roles..." />
                <Button variant="primary" icon={Plus} onClick={handleOpenAddRole}>
                  Add Role
                </Button>
              </div>
            </div>

            {loadingRoles ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading roles...</div>
            ) : filteredRoles.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                No roles found. Click "Add Role" to create one.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Role Name</th>
                    <th>Description</th>
                    <th>Assigned Staff</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map(role => (
                    <tr key={role.id}>
                      <td>
                        <strong style={{ color: 'var(--color-text-primary)', fontSize: '15px' }}>{role.name}</strong>
                      </td>
                      <td>{role.description || '-'}</td>
                      <td>
                        <span style={{ backgroundColor: '#F3F4F6', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '12px' }}>
                          {role.users_count || 0} Staff
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={role.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <Button variant="secondary" size="sm" icon={Edit2} onClick={() => handleOpenEditRole(role)} />
                          <Button variant="secondary" size="sm" icon={Trash2} onClick={() => handleDeleteRole(role.id)} style={{ color: '#EF4444' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {/* TAB 2: RESTAURANT USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <SearchBar value={userSearch} onChange={setUserSearch} placeholder="Search staff by name, email, or role..." />
                <Button variant="primary" icon={Plus} onClick={handleOpenAddUser}>
                  Add Staff Member
                </Button>
              </div>
            </div>

            {loadingUsers ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading restaurant staff...</div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                No staff members found. Click "Add Staff Member" to add one.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Assigned Role</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <strong style={{ color: 'var(--color-text-primary)', fontSize: '15px' }}>{u.name}</strong>
                        {u.pin_code && <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>PIN: {u.pin_code}</div>}
                      </td>
                      <td>{u.email || '-'}</td>
                      <td>{u.phone || '-'}</td>
                      <td>
                        {u.assigned_role ? (
                          <span style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '12px' }}>
                            {u.assigned_role.name}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '13px' }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={u.status || 'Active'} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <Button variant="secondary" size="sm" icon={Edit2} onClick={() => handleOpenEditUser(u)} />
                          <Button variant="secondary" size="sm" icon={Trash2} onClick={() => handleDeleteUser(u.id)} style={{ color: '#EF4444' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {/* ROLE MODAL */}
        <Modal
          isOpen={roleModalOpen}
          onClose={() => setRoleModalOpen(false)}
          title={editingRole ? 'Edit Role' : 'Add New Role'}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
              <Button variant="secondary" onClick={() => setRoleModalOpen(false)} disabled={roleSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveRole} disabled={roleSubmitting}>
                {roleSubmitting ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSaveRole} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {roleError && (
              <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', fontSize: '14px' }}>
                {roleError}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Role Name *</label>
              <input type="text" className="form-input" placeholder="e.g. Head Chef" value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input type="text" className="form-input" placeholder="e.g. Responsible for main kitchen operations & log verification" value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={roleForm.status} onChange={e => setRoleForm({ ...roleForm, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </form>
        </Modal>

        {/* RESTAURANT USER MODAL */}
        <Modal
          isOpen={userModalOpen}
          onClose={() => setUserModalOpen(false)}
          title={editingUser ? 'Edit Staff Member' : 'Add Staff Member'}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
              <Button variant="secondary" onClick={() => setUserModalOpen(false)} disabled={userSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveUser} disabled={userSubmitting}>
                {userSubmitting ? 'Saving...' : editingUser ? 'Update Staff Member' : 'Create Staff Member'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {userError && (
              <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', fontSize: '14px' }}>
                {userError}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Staff Member Name *</label>
              <input type="text" className="form-input" placeholder="e.g. Alex Smith" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="e.g. alex@kitchen.com" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-input" placeholder="e.g. +353 87 123 4567" value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Assign Role</label>
                <select className="form-input" value={userForm.role_id} onChange={e => setUserForm({ ...userForm, role_id: e.target.value })}>
                  <option value="">-- Select Role --</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Staff PIN Code (Optional)</label>
                <input type="text" className="form-input" placeholder="e.g. 1234" value={userForm.pin_code} onChange={e => setUserForm({ ...userForm, pin_code: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={userForm.status} onChange={e => setUserForm({ ...userForm, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </form>
        </Modal>

      </div>
    </PageLayout>
  );
};

export default UserRoleManagementPage;
