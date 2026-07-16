import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/application/AuthDataProvider';
import { isSupabaseConfigured } from '../../../infrastructure/supabase/client';
import { SupabaseEchoRepository } from '../data/SupabaseEchoRepository';

const EchoDataContext = createContext(null);
const echoRepository = new SupabaseEchoRepository();

export function EchoDataProvider({ children }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [echoes, setEchoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (isAuthLoading) return;
    if (!user) {
      setEchoes([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      setEchoes(await echoRepository.listForCurrentUser());
    } catch (nextError) {
      setEchoes([]);
      setError(nextError);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthLoading]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ echoes, isLoading, error, isSupabaseConfigured, refresh }),
    [echoes, isLoading, error, refresh]
  );

  return <EchoDataContext.Provider value={value}>{children}</EchoDataContext.Provider>;
}

export function useEchoes() {
  const context = useContext(EchoDataContext);
  if (!context) throw new Error('useEchoes must be used within EchoDataProvider.');
  return context;
}
