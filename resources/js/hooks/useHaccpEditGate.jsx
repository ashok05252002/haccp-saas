import { useState, useCallback } from 'react';
import { usePage, router } from '@inertiajs/react';

export const useHaccpEditGate = () => {
  const { auth } = usePage().props;
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const hasEditPermission = useCallback(() => {
    if (!auth || !auth.user) return false;
    // Client tenant owner or super admin has full permissions
    if (auth.user.role === 'client' || auth.user.role === 'super_admin') {
      return true;
    }

    // Main restaurant / branch manager login without assigned restrictive custom role
    if (auth.user.role === 'restaurant' && !auth.user.role_id && !auth.user.assigned_role && !auth.user.assignedRole) {
      return true;
    }

    let permissions = auth.user.assigned_role?.permissions ?? 
                      auth.user.assignedRole?.permissions ?? 
                      auth.user.role?.permissions ?? 
                      auth.user.permissions ?? 
                      null;

    if (typeof permissions === 'string') {
      const trimmed = permissions.trim();
      if (trimmed === '' || trimmed === 'null' || trimmed === 'NULL') {
        permissions = null;
      } else {
        try {
          permissions = JSON.parse(permissions);
        } catch (e) {
          permissions = [];
        }
      }
    }

    // null means legacy full access / unrestricted role
    if (permissions === null || permissions === undefined) {
      return true;
    }

    if (!Array.isArray(permissions)) return false;
    return permissions.includes('haccp.edit-submitted-logs');
  }, [auth]);

  const canEdit = hasEditPermission();

  const requestEdit = useCallback((targetUrlOrCallback) => {
    const execute = () => {
      if (typeof targetUrlOrCallback === 'function') {
        targetUrlOrCallback();
      } else if (typeof targetUrlOrCallback === 'string') {
        router.visit(targetUrlOrCallback);
      }
    };

    if (hasEditPermission()) {
      execute();
    } else {
      alert('You do not have permission to edit submitted HACCP logs.');
    }
  }, [hasEditPermission]);

  const handlePinSuccess = useCallback((managerData) => {
    setPinModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const handlePinClose = useCallback(() => {
    setPinModalOpen(false);
    setPendingAction(null);
  }, []);

  return {
    requestEdit,
    pinModalOpen,
    handlePinSuccess,
    handlePinClose,
    hasEditPermission,
    canEdit,
  };
};

export default useHaccpEditGate;
