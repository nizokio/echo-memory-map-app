import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { isSupabaseConfigured, supabase } from '../../../infrastructure/supabase/client';
import { AuthRepository } from './AuthRepository';

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_PATH = 'auth/callback';

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

  async signInWithGoogle() {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured.');
    }

    const redirectTo = this.getRedirectUri();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('Supabase did not return a Google OAuth URL.');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return null;

    return this.setSessionFromRedirectUrl(result.url);
  }

  async signOut() {
    if (!isSupabaseConfigured || !supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  getRedirectUri() {
    return AuthSession.makeRedirectUri({
      path: REDIRECT_PATH,
    });
  }

  async setSessionFromRedirectUrl(url) {
    const params = this.getUrlParams(url);
    const errorDescription = params.get('error_description') || params.get('error');
    if (errorDescription) throw new Error(errorDescription);

    const code = params.get('code');
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      return data.session;
    }

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken || !refreshToken) return null;

    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) throw error;
    return data.session;
  }

  getUrlParams(url) {
    const parsedUrl = new URL(url);
    const params = new URLSearchParams(parsedUrl.search);
    const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));

    hashParams.forEach((value, key) => {
      params.set(key, value);
    });

    return params;
  }
}
