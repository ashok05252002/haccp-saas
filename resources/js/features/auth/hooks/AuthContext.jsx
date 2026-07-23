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

  // Restore restaurant state from localStorage on mount
  useEffect(() => {
    const savedRest = getSelectedRestaurant();
    if (savedRest) {
      setSelectedRestaurant(savedRest);
    }
    setLoading(false);
  }, []);

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
