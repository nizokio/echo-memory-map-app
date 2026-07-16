import { isSupabaseConfigured, supabase } from '../../../infrastructure/supabase/client';
import { AuthRepository } from './AuthRepository';

export class SupabaseAuthRepository extends AuthRepository {
  async getSession() {
    if (!isSupabaseConfigured || !supabase) return null;

    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  onAuthStateChange(callback) {
    if (!isSupabaseConfigured || !supabase) return { unsubscribe: () => {} };

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback({ event, session });
    });

    return data.subscription;
  }

  async signOut() {
    if (!isSupabaseConfigured || !supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}
