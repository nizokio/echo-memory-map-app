import React, { useState, useCallback } from 'react';
import { Pressable, View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '../theme';
import { useEchoes } from '../features/echoes/application/EchoDataProvider';
import { useCurrentUser } from '../features/users/application/UserDataProvider';
import SearchBar from '../components/SearchBar';
import VerticalEchoStack from '../components/VerticalEchoStack';

export default function HomeScreen({ navigation, onProfilePress }) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { echoes, isLoading, error, isSupabaseConfigured } = useEchoes();
  const { profile } = useCurrentUser();
  const handlePressCard = useCallback((echo) => navigation.navigate('Detail', { echo }), [navigation]);
  const greeting = profile?.displayName ? `Hello, ${profile.displayName}` : 'Hello';
  const avatarInitial = profile?.displayName?.charAt(0).toUpperCase() || 'E';

  const emptyMessage = !isSupabaseConfigured
    ? 'Connect Supabase to see your Echoes.'
    : error
      ? 'Unable to load Echoes right now.'
      : isLoading
        ? 'Loading your Echoes...'
        : 'Your saved memories will appear here.';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} bounces={false} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 150 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.helloRow}>
          <View><Text style={styles.greeting}>{greeting}</Text><Text style={styles.subtitle}>Welcome to Echo</Text></View>
          <Pressable onPress={onProfilePress} accessibilityRole="button" accessibilityLabel="Open profile">
            <LinearGradient colors={[colors.avatarGradientStart, colors.avatarGradientEnd]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.avatar}><Text style={styles.avatarEmoji}>{avatarInitial}</Text></LinearGradient>
          </Pressable>
        </View>
        <SearchBar />
        <Text style={styles.memoriesHeading}>Echoes</Text>
        <VerticalEchoStack echoes={echoes} currentIndex={currentIndex} onIndexChange={setCurrentIndex} onPressCard={handlePressCard} emptyMessage={emptyMessage} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  scroll: { flex: 1 }, content: { paddingHorizontal: 20 },
  helloRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { ...typography.h1, fontSize: 32, color: colors.ink },
  memoriesHeading: { ...typography.h3, fontSize: 28, fontWeight: '800', color: colors.ink, marginTop: 16, marginBottom: 32 },
  subtitle: { ...typography.caption, color: colors.muted, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#ff7a4d', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  avatarEmoji: { fontSize: 18, color: '#fff', fontWeight: '700' },
});
