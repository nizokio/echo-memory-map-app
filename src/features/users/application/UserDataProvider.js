import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/application/AuthDataProvider';
import { SupabaseUserRepository } from '../data/SupabaseUserRepository';

const UserDataContext = createContext(null);
const userRepository = new SupabaseUserRepository();

export function UserDataProvider({ children }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      setProfile(null);
      return;
    }

    userRepository.getCurrentProfile(user).then(setProfile).catch(() => setProfile(null));
  }, [user, isAuthLoading]);

  const value = useMemo(() => ({ profile }), [profile]);
  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useCurrentUser() {
  const context = useContext(UserDataContext);
  if (!context) throw new Error('useCurrentUser must be used within UserDataProvider.');
  return context;
}
