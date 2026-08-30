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
    const permissions = auth.user.assigned_role?.permissions ?? auth.user.role?.permissions ?? null;
    if (!permissions) return true;
    return Array.isArray(permissions) && permissions.includes('haccp.edit-submitted-logs');
  }, [auth]);

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
      setPendingAction(() => execute);
      setPinModalOpen(true);
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
  };
};

export default useHaccpEditGate;
