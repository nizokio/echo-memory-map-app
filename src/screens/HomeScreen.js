import React, { useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { colors, typography } from '../theme';
import { useEchoes } from '../features/echoes/application/EchoDataProvider';
import { useCurrentUser } from '../features/users/application/UserDataProvider';
import EchoCard from '../components/EchoCard';
import SearchBar from '../components/SearchBar';
import VerticalEchoStack from '../components/VerticalEchoStack';

const NEARBY_RADIUS_METERS = 1000;

export default function HomeScreen({ navigation, onProfilePress }) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nearbyEchoes, setNearbyEchoes] = useState([]);
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
                  setNearbyEchoes([]);
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
                  .map((item) => item.echo);

                setNearbyEchoes(nextNearbyEchoes);
                setNearbyStatus(nextNearbyEchoes.length ? 'ready' : 'empty');
              } catch (nextError) {
                setNearbyEchoes([]);
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
                {nearbyEchoes.map((echo) => (
                  <EchoCard key={echo.id} echo={echo} onPress={() => handlePressCard(echo)} />
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
});
