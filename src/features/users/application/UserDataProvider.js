import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SupabaseUserRepository } from '../data/SupabaseUserRepository';

const UserDataContext = createContext(null);
const userRepository = new SupabaseUserRepository();

export function UserDataProvider({ children }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    userRepository.getCurrentProfile().then(setProfile).catch(() => setProfile(null));
  }, []);

  const value = useMemo(() => ({ profile }), [profile]);
  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useCurrentUser() {
  const context = useContext(UserDataContext);
  if (!context) throw new Error('useCurrentUser must be used within UserDataProvider.');
  return context;
}
