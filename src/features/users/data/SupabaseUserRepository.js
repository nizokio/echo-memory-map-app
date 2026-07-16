import { isSupabaseConfigured, supabase } from '../../../infrastructure/supabase/client';
import { UserRepository } from './UserRepository';

export class SupabaseUserRepository extends UserRepository {
  async getCurrentProfile(authUser) {
    if (!isSupabaseConfigured || !supabase) return null;

    const user = authUser || (await this.getAuthenticatedUser());
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (data) return this.mapProfile(data);

    return this.createProfile(user);
  }

  async getAuthenticatedUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  async createProfile(user) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      })
      .select('id, display_name, avatar_url')
      .single();

    if (error) throw error;
    return this.mapProfile(data);
  }

  mapProfile(profile) {
    return {
      id: profile.id,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
    };
  }
}
