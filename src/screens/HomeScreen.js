import React, { useState, useCallback } from 'react';
import { ActivityIndicator, Image, Pressable, View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { useEchoes } from '../features/echoes/application/EchoDataProvider';
import { useCurrentUser } from '../features/users/application/UserDataProvider';
import SearchBar from '../components/SearchBar';

const NEARBY_RADIUS_METERS = 1000;

export default function HomeScreen({ navigation, onProfilePress }) {
  const insets = useSafeAreaInsets();
  const [nearbyItems, setNearbyItems] = useState([]);
  const [nearbyStatus, setNearbyStatus] = useState('idle');
  const [selectedAlbumKey, setSelectedAlbumKey] = useState('recent');
  const { echoes, isLoading, error, isSupabaseConfigured } = useEchoes();
  const { profile } = useCurrentUser();
  const handlePressCard = useCallback((echo) => navigation.navigate('Detail', { echo }), [navigation]);
  const greeting = profile?.displayName ? `Hello, ${profile.displayName}` : 'Hello';
  const avatarInitial = profile?.displayName?.charAt(0).toUpperCase() || 'E';
  const albums = buildAlbums(echoes);
  const selectedAlbum = albums.find((album) => album.key === selectedAlbumKey) || albums[0];
  const featuredMemory = echoes[0];

  const emptyMessage = !isSupabaseConfigured
    ? 'Connect Supabase to see your memories.'
    : error
      ? 'Unable to load memories right now.'
      : isLoading
        ? 'Loading your memories...'
        : 'Your saved memories will appear here.';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} bounces={false} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.helloRow}>
          <View><Text style={styles.greeting}>{greeting}</Text><Text style={styles.subtitle}>Your memory library</Text></View>
          <Pressable onPress={onProfilePress} accessibilityRole="button" accessibilityLabel="Open profile">
            <LinearGradient colors={[colors.avatarGradientStart, colors.avatarGradientEnd]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.avatar}><Text style={styles.avatarEmoji}>{avatarInitial}</Text></LinearGradient>
          </Pressable>
        </View>
        <SearchBar />

        {featuredMemory ? (
          <Pressable onPress={() => handlePressCard(featuredMemory)} style={styles.featuredCard} accessibilityRole="button">
            {featuredMemory.photos[0]?.uri ? (
              <Image source={{ uri: featuredMemory.photos[0].uri }} style={styles.featuredImage} />
            ) : (
              <View style={styles.featuredImageFallback} />
            )}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={styles.featuredGradient} />
            <View style={styles.featuredCopy}>
              <Text style={styles.featuredLabel}>Continue remembering</Text>
              <Text style={styles.featuredTitle} numberOfLines={2}>{getMemoryTitle(featuredMemory)}</Text>
              <Text style={styles.featuredMeta}>{formatMemoryTime(featuredMemory.capturedAt)} - {featuredMemory.photos.length} photo{featuredMemory.photos.length === 1 ? '' : 's'}</Text>
            </View>
          </Pressable>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="albums-outline" size={28} color={colors.ink} />
            <Text style={styles.emptyTitle}>No memories yet</Text>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Albums</Text>
          <Text style={styles.sectionMeta}>{echoes.length} memories</Text>
        </View>
        <View style={styles.albumGrid}>
          {albums.map((album) => (
            <Pressable
              key={album.key}
              onPress={() => setSelectedAlbumKey(album.key)}
              style={[styles.albumCard, selectedAlbum?.key === album.key && styles.albumCardActive]}
              accessibilityRole="button"
            >
              <View style={[styles.albumIcon, selectedAlbum?.key === album.key && styles.albumIconActive]}>
                <Ionicons name={album.icon} size={18} color={selectedAlbum?.key === album.key ? '#fff' : colors.ink} />
              </View>
              <Text style={styles.albumTitle}>{album.title}</Text>
              <Text style={styles.albumCount}>{album.items.length} memories</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.nearbyHeader}>
          <View>
            <Text style={styles.nearbyTitle}>Nearby</Text>
            <Text style={styles.nearbySubtitle}>Memories within 1 km</Text>
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
                  .sort((left, right) => left.distance - right.distance);

                setNearbyItems(nextNearbyEchoes);
                setNearbyStatus(nextNearbyEchoes.length ? 'ready' : 'empty');
              } catch (nextError) {
                setNearbyItems([]);
                setNearbyStatus('error');
              }
            }}
            style={styles.nearbyButton}
            accessibilityRole="button"
            accessibilityLabel="Find nearby memories"
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
                  ? 'Location permission is needed to find nearby memories.'
                  : nearbyStatus === 'error'
                    ? 'Unable to get your current location.'
                    : 'No memories found within 1 km.'}
              </Text>
            )}
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{selectedAlbum?.title || 'Recently Added'}</Text>
          <Text style={styles.sectionMeta}>{selectedAlbum?.items.length || 0} memories</Text>
        </View>
        {selectedAlbum?.items.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memoryList}>
            {selectedAlbum.items.slice(0, 8).map((echo) => (
              <MemoryPreviewCard key={echo.id} echo={echo} onPress={() => handlePressCard(echo)} />
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.nearbyMessage}>This album will fill as you capture more memories.</Text>
        )}
      </ScrollView>
    </View>
  );
}

function buildAlbums(echoes) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const thisWeek = echoes.filter((echo) => new Date(echo.capturedAt) >= weekStart);
  const withPlaces = echoes.filter((echo) => echo.location?.latitude && echo.location?.longitude);
  const withMedia = echoes.filter((echo) => echo.photos.length > 0);

  return [
    { key: 'recent', title: 'Recent', icon: 'time-outline', items: echoes },
    { key: 'week', title: 'This Week', icon: 'calendar-outline', items: thisWeek },
    { key: 'places', title: 'Places', icon: 'map-outline', items: withPlaces },
    { key: 'media', title: 'Media', icon: 'images-outline', items: withMedia },
  ];
}

function getMemoryTitle(echo) {
  return echo.note?.trim() || echo.aiMetadata?.title || echo.location?.name || 'Saved memory';
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

function MemoryPreviewCard({ echo, onPress }) {
  const photoUri = echo.photos[0]?.uri;

  return (
    <Pressable onPress={onPress} style={styles.memoryCard} accessibilityRole="button">
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.memoryImage} /> : <View style={styles.memoryImageFallback} />}
      <Text style={styles.memoryTitle} numberOfLines={2}>{getMemoryTitle(echo)}</Text>
      <Text style={styles.memoryMeta} numberOfLines={1}>{formatMemoryTime(echo.capturedAt)}</Text>
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

function formatMemoryTime(value) {
  if (!value) return 'Unknown time';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
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
  subtitle: { ...typography.caption, color: colors.muted, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#ff7a4d', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  avatarEmoji: { fontSize: 18, color: '#fff', fontWeight: '700' },
  featuredCard: { height: 250, borderRadius: 28, overflow: 'hidden', marginTop: 20, backgroundColor: colors.ink, shadowColor: '#000', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 6 },
  featuredImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  featuredImageFallback: { width: '100%', height: '100%', backgroundColor: colors.pill },
  featuredGradient: { ...StyleSheet.absoluteFillObject },
  featuredCopy: { position: 'absolute', left: 18, right: 18, bottom: 18 },
  featuredLabel: { ...typography.label, color: colors.gold, textTransform: 'uppercase', marginBottom: 6 },
  featuredTitle: { color: '#fff', fontSize: 24, lineHeight: 29, fontWeight: '800' },
  featuredMeta: { ...typography.caption, color: 'rgba(255,255,255,0.76)', marginTop: 8 },
  emptyState: { minHeight: 210, borderRadius: 28, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, marginTop: 20 },
  emptyTitle: { ...typography.h3, color: colors.ink, marginTop: 12 },
  emptyText: { ...typography.caption, color: colors.muted, textAlign: 'center', lineHeight: 18, marginTop: 6 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 24, marginBottom: 12 },
  sectionTitle: { ...typography.h3, color: colors.ink, fontSize: 22 },
  sectionMeta: { ...typography.caption, color: colors.muted },
  albumGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  albumCard: { width: '48%', minHeight: 112, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, padding: 14, justifyContent: 'space-between' },
  albumCardActive: { borderColor: colors.gold },
  albumIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  albumIconActive: { backgroundColor: colors.ink },
  albumTitle: { ...typography.bodySmall, color: colors.ink, fontWeight: '800', marginTop: 12 },
  albumCount: { ...typography.caption, color: colors.muted, marginTop: 2 },
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
  memoryList: { paddingRight: 4, paddingBottom: 8 },
  memoryCard: { width: 154, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, overflow: 'hidden', marginRight: 12 },
  memoryImage: { width: '100%', height: 110, resizeMode: 'cover' },
  memoryImageFallback: { width: '100%', height: 110, backgroundColor: colors.pill },
  memoryTitle: { ...typography.bodySmall, color: colors.ink, fontWeight: '800', lineHeight: 18, paddingHorizontal: 12, paddingTop: 10 },
  memoryMeta: { ...typography.caption, color: colors.muted, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 12 },
});
