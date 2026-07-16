import { isSupabaseConfigured, supabase } from '../../../infrastructure/supabase/client';
import { UserRepository } from './UserRepository';

export class SupabaseUserRepository extends UserRepository {
  async getCurrentProfile() {
    if (!isSupabaseConfigured || !supabase) return null;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (error) throw error;
    return data
      ? { id: data.id, displayName: data.display_name, avatarUrl: data.avatar_url }
      : null;
  }
}
