import React, { useState, useCallback } from 'react';
import { ActivityIndicator, Image, Pressable, View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { colors, typography } from '../theme';
import { useEchoes } from '../features/echoes/application/EchoDataProvider';
import { useCurrentUser } from '../features/users/application/UserDataProvider';
import SearchBar from '../components/SearchBar';
import VerticalEchoStack from '../components/VerticalEchoStack';

const NEARBY_RADIUS_METERS = 1000;

export default function HomeScreen({ navigation, onProfilePress }) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nearbyItems, setNearbyItems] = useState([]);
  const [nearbyStatus, setNearbyStatus] = useState('idle');
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
        <View style={styles.nearbyHeader}>
          <View>
            <Text style={styles.nearbyTitle}>Nearby</Text>
            <Text style={styles.nearbySubtitle}>Echoes within 1 km</Text>
          </View>
          <Pressable
            onPress={async () => {
              if (nearbyStatus === 'loading') return;

              setNearbyStatus('loading');
              try {
                const permission = await Location.requestForegroundPermissionsAsync();
                if (!permission.granted) {
                  setNearbyItems([]);
                  setNearbyStatus('denied');
                  return;
                }

                const position = await Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.Balanced,
                });
                const nextNearbyEchoes = echoes
                  .map((echo) => ({
                    echo,
                    distance: getDistanceMeters(position.coords, echo.location),
                  }))
                  .filter((item) => item.distance <= NEARBY_RADIUS_METERS)
                  .sort((left, right) => left.distance - right.distance)

                setNearbyItems(nextNearbyEchoes);
                setNearbyStatus(nextNearbyEchoes.length ? 'ready' : 'empty');
              } catch (nextError) {
                setNearbyItems([]);
                setNearbyStatus('error');
              }
            }}
            style={styles.nearbyButton}
            accessibilityRole="button"
            accessibilityLabel="Find nearby Echoes"
          >
            {nearbyStatus === 'loading' ? (
              <ActivityIndicator size="small" color={colors.ink} />
            ) : (
              <Text style={styles.nearbyButtonText}>Find</Text>
            )}
          </Pressable>
        </View>
        {nearbyStatus !== 'idle' ? (
          <View style={styles.nearbyPanel}>
            {nearbyStatus === 'ready' ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyList}>
                {nearbyItems.map(({ echo, distance }) => (
                  <NearbyEchoCard key={echo.id} echo={echo} distance={distance} onPress={() => handlePressCard(echo)} />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.nearbyMessage}>
                {nearbyStatus === 'denied'
                  ? 'Location permission is needed to find nearby Echoes.'
                  : nearbyStatus === 'error'
                    ? 'Unable to get your current location.'
                    : 'No Echoes found within 1 km.'}
              </Text>
            )}
          </View>
        ) : null}
        <Text style={styles.memoriesHeading}>Echoes</Text>
        <VerticalEchoStack echoes={echoes} currentIndex={currentIndex} onIndexChange={setCurrentIndex} onPressCard={handlePressCard} emptyMessage={emptyMessage} />
      </ScrollView>
    </View>
  );
}

function getDistanceMeters(left, right) {
  const earthRadiusMeters = 6371000;
  const leftLatitude = toRadians(left.latitude);
  const rightLatitude = toRadians(right.latitude);
  const latitudeDelta = toRadians(right.latitude - left.latitude);
  const longitudeDelta = toRadians(right.longitude - left.longitude);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(leftLatitude) *
      Math.cos(rightLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function NearbyEchoCard({ echo, distance, onPress }) {
  const photoUri = echo.photos[0]?.uri;
  const note = echo.note?.trim() || 'Saved memory';

  return (
    <Pressable onPress={onPress} style={styles.nearbyCard} accessibilityRole="button">
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.nearbyImage} /> : <View style={styles.nearbyImageFallback} />}
      <View style={styles.nearbyCardBody}>
        <Text style={styles.nearbyNote} numberOfLines={2}>{note}</Text>
        <Text style={styles.nearbyTime} numberOfLines={1}>{formatNearbyTime(echo.capturedAt)}</Text>
        <Text style={styles.nearbyDistance}>{formatDistance(distance)} away</Text>
      </View>
    </Pressable>
  );
}

function formatNearbyTime(value) {
  if (!value) return 'Unknown time';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDistance(value) {
  if (value < 1000) return `${Math.max(1, Math.round(value))} m`;
  return `${(value / 1000).toFixed(1)} km`;
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
  nearbyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  nearbyTitle: { ...typography.h3, color: colors.ink },
  nearbySubtitle: { ...typography.caption, color: colors.muted, marginTop: 2 },
  nearbyButton: { minWidth: 72, height: 40, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  nearbyButtonText: { ...typography.button, color: colors.ink },
  nearbyPanel: { marginTop: 12, marginHorizontal: -20 },
  nearbyList: { paddingLeft: 20, paddingRight: 6, paddingBottom: 4 },
  nearbyMessage: { ...typography.caption, color: colors.muted, marginHorizontal: 20, padding: 14, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line },
  nearbyCard: { width: 250, height: 118, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, flexDirection: 'row', overflow: 'hidden', marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 3 },
  nearbyImage: { width: 92, height: '100%', resizeMode: 'cover' },
  nearbyImageFallback: { width: 92, backgroundColor: colors.pill },
  nearbyCardBody: { flex: 1, padding: 12, justifyContent: 'center' },
  nearbyNote: { ...typography.bodySmall, color: colors.ink, fontWeight: '700', lineHeight: 19 },
  nearbyTime: { ...typography.caption, color: colors.muted, marginTop: 6 },
  nearbyDistance: { ...typography.label, color: colors.gold, marginTop: 8 },
});
