import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { usePage, router } from '@inertiajs/react';
import { 
  selectRestaurant as selectRestService, 
  getSelectedRestaurant, 
  clearSelectedRestaurant 
} from "../../../services/restaurantService";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { props } = usePage();
  const authUser = props.auth?.user || null;

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore restaurant state from localStorage on mount or auto-select context
  useEffect(() => {
    if (authUser) {
      if (authUser.role === 'restaurant' && authUser.branch) {
        setSelectedRestaurant({
          id: authUser.branch.id,
          restaurantName: authUser.branch.name,
          branchName: authUser.branch.branch_name,
          branchManager: authUser.branch.branch_manager,
          email: authUser.branch.email,
          phone: authUser.branch.phone,
          haccpStatus: 'Active',
        });
      } else if (authUser.role === 'client' && authUser.tenant?.branches?.length === 1) {
        const singleBranch = authUser.tenant.branches[0];
        setSelectedRestaurant({
          id: singleBranch.id,
          restaurantName: singleBranch.name,
          branchName: singleBranch.branch_name,
          branchManager: singleBranch.branch_manager,
          email: singleBranch.email,
          phone: singleBranch.phone,
          haccpStatus: 'Active',
        });
      } else {
        const savedRest = getSelectedRestaurant();
        if (savedRest) {
          setSelectedRestaurant(savedRest);
        }
      }
    }
    setLoading(false);
  }, [authUser]);

  // Sync selected restaurant if auth state changes
  useEffect(() => {
    if (!authUser) {
      clearSelectedRestaurant();
      setSelectedRestaurant(null);
    }
  }, [authUser]);

  // Select Restaurant
  const selectRestaurant = useCallback((restaurant) => {
    selectRestService(restaurant);
    setSelectedRestaurant(restaurant);
  }, []);

  // Clear Restaurant
  const switchRestaurant = useCallback(() => {
    clearSelectedRestaurant();
    setSelectedRestaurant(null);
  }, []);

  // Logout
  const logout = useCallback(() => {
    router.post(route('logout'), {}, {
      onSuccess: () => {
        clearSelectedRestaurant();
        setSelectedRestaurant(null);
      }
    });
  }, []);

  const value = useMemo(
    () => ({
      user: authUser,
      token: authUser ? 'inertia-session' : null,
      isAuthenticated: !!authUser,
      loading,
      selectedRestaurant,
      selectRestaurant,
      switchRestaurant,
      logout,
    }),
    [authUser, loading, selectedRestaurant, selectRestaurant, switchRestaurant, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
