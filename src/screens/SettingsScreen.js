import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../theme';
import { useAuth } from '../features/auth/application/AuthDataProvider';
import { useCurrentUser } from '../features/users/application/UserDataProvider';

const version = '0.1.0';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { error, isAuthenticated, isLoading, signInWithGoogle, signOut, user } = useAuth();
  const { profile } = useCurrentUser();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const displayName = profile?.displayName || user?.email || 'Echo user';
  const email = user?.email || 'Not signed in';
  const avatarUrl = profile?.avatarUrl;
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 140 },
        ]}
      >
        <Text style={styles.title}>Settings</Text>

        <Section title="Account">
          <View style={styles.accountRow}>
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initial}</Text>
              )}
            </View>
            <View style={styles.accountCopy}>
              <Text style={styles.accountName}>{isAuthenticated ? displayName : 'Guest'}</Text>
              <Text style={styles.accountEmail}>{email}</Text>
            </View>
          </View>
          {isAuthenticated ? (
            <Pressable
              style={[styles.primaryButton, (isLoading || isSigningOut) && styles.disabled]}
              onPress={handleSignOut}
              disabled={isLoading || isSigningOut}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              {isSigningOut ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign Out</Text>
              )}
            </Pressable>
          ) : (
            <>
              <Pressable
                style={[styles.primaryButton, (isLoading || isSigningIn) && styles.disabled]}
                onPress={handleSignIn}
                disabled={isLoading || isSigningIn}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
              >
                {isSigningIn ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.googleButtonContent}>
                    <Ionicons name="logo-google" size={18} color="#fff" />
                    <Text style={styles.primaryButtonText}>Continue with Google</Text>
                  </View>
                )}
              </Pressable>
              {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
            </>
          )}
        </Section>

        <Section title="Appearance">
          <View style={styles.segmented}>
            {['System', 'Light', 'Dark'].map((item) => (
              <View key={item} style={[styles.segment, item === 'System' && styles.segmentActive]}>
                <Text style={[styles.segmentText, item === 'System' && styles.segmentTextActive]}>{item}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.comingSoon}>Theme switching coming soon.</Text>
        </Section>

        <Section title="About">
          <InfoRow label="Version" value={version} />
          <InfoRow label="Build" value="OpenAI Build Week" />
          <Pressable style={styles.secondaryButton} accessibilityRole="button" accessibilityLabel="GitHub repository">
            <Ionicons name="logo-github" size={18} color={colors.ink} />
            <Text style={styles.secondaryButtonText}>GitHub Repository</Text>
          </Pressable>
        </Section>

        <Section title="Danger Zone">
          <DisabledRow label="Delete Account" />
          <DisabledRow label="Delete All Echoes" />
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function DisabledRow({ label }) {
  return (
    <View style={styles.disabledRow}>
      <Text style={styles.disabledLabel}>{label}</Text>
      <Text style={styles.disabledBadge}>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    color: colors.ink,
    marginBottom: 18,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: 10,
  },
  sectionBody: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 14,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    ...typography.h2,
    color: '#fff',
  },
  accountCopy: {
    flex: 1,
  },
  accountName: {
    ...typography.h3,
    color: colors.ink,
  },
  accountEmail: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 3,
  },
  primaryButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.button,
    color: '#fff',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  errorText: {
    ...typography.caption,
    color: '#A84A3A',
    marginTop: 10,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.paper,
    borderRadius: 16,
    padding: 4,
  },
  segment: {
    flex: 1,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.45,
  },
  segmentActive: {
    backgroundColor: '#fff',
    opacity: 0.75,
  },
  segmentText: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: colors.ink,
  },
  comingSoon: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  infoLabel: {
    ...typography.body,
    color: colors.ink,
  },
  infoValue: {
    ...typography.caption,
    color: colors.muted,
  },
  secondaryButton: {
    height: 46,
    borderRadius: 18,
    backgroundColor: colors.paper,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.ink,
  },
  disabledRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0.5,
  },
  disabledLabel: {
    ...typography.body,
    color: colors.ink,
  },
  disabledBadge: {
    ...typography.label,
    color: colors.muted,
    backgroundColor: colors.paper,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
  },
});
