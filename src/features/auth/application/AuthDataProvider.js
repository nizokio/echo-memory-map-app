import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured } from '../../../infrastructure/supabase/client';
import { SupabaseAuthRepository } from '../data/SupabaseAuthRepository';

const AuthDataContext = createContext(null);
const authRepository = new SupabaseAuthRepository();

export function AuthDataProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setSession(await authRepository.getSession());
    } catch (nextError) {
      setSession(null);
      setError(nextError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();

    const subscription = authRepository.onAuthStateChange(({ session: nextSession }) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [refreshSession]);

  const signOut = useCallback(async () => {
    await authRepository.signOut();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      return await authRepository.signInWithGoogle();
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.user),
      isLoading,
      error,
      isSupabaseConfigured,
      refreshSession,
      signInWithGoogle,
      signOut,
    }),
    [session, isLoading, error, refreshSession, signInWithGoogle, signOut]
  );

  return <AuthDataContext.Provider value={value}>{children}</AuthDataContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthDataContext);
  if (!context) throw new Error('useAuth must be used within AuthDataProvider.');
  return context;
}
