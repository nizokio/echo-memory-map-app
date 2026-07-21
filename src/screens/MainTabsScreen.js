import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './HomeScreen';
import MapScreen from './MapScreen';
import SettingsScreen from './SettingsScreen';
import BottomTabBar from '../components/BottomTabBar';
import CameraView from '../components/CameraView';
import { useEchoes } from '../features/echoes/application/EchoDataProvider';
import { colors, typography } from '../theme';

const NEARBY_RADIUS_METERS = 1000;

export default function MainTabsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(0);
  const [cameraVisible, setCameraVisible] = useState(false);
  const { echoes, refresh } = useEchoes();

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return <HomeScreen navigation={navigation} onProfilePress={() => setActiveTab(4)} />;
      case 1:
        return <MapScreen navigation={navigation} />;
      case 3:
        return <NearbyScreen navigation={navigation} echoes={echoes} />;
      case 4:
        return <SettingsScreen />;
      default:
        return <HomeScreen navigation={navigation} onProfilePress={() => setActiveTab(4)} />;
    }
  };

  const handleTabPress = (index) => {
    if (index === 2) {
      setCameraVisible(true);
    } else {
      setActiveTab(index);
    }
  };

  return (
    <View style={styles.container}>
      {/* Active Tab Screen Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Pinned Bottom Tab Bar */}
      <BottomTabBar
        visible={true}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />

      {/* Full-screen Camera Overlay */}
      <CameraView
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onEchoSaved={refresh}
      />
    </View>
  );
}

function NearbyScreen({ navigation, echoes }) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState('idle');
  const [nearbyItems, setNearbyItems] = useState([]);

  const findNearby = async () => {
    if (status === 'loading') return;

    setStatus('loading');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setNearbyItems([]);
        setStatus('denied');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nextItems = echoes
        .map((echo) => ({
          echo,
          distance: getDistanceMeters(position.coords, echo.location),
        }))
        .filter((item) => item.distance <= NEARBY_RADIUS_METERS)
        .sort((left, right) => left.distance - right.distance);

      setNearbyItems(nextItems);
      setStatus(nextItems.length ? 'ready' : 'empty');
    } catch (error) {
      setNearbyItems([]);
      setStatus('error');
    }
  };

  const message =
    status === 'denied'
      ? 'Location permission is needed to find nearby memories.'
      : status === 'error'
        ? 'Unable to get your current location.'
        : status === 'empty'
          ? 'No memories found within 1 km.'
          : 'Use your current location to surface memories around you.';

  return (
    <ScrollView
      style={styles.nearbyContainer}
      contentContainerStyle={[styles.nearbyContent, { paddingTop: insets.top + 18, paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.nearbyHero}>
        <View style={styles.nearbyHeroIcon}>
          <Ionicons name="location" size={22} color="#fff" />
        </View>
        <Text style={styles.nearbyTitle}>Nearby Memories</Text>
        <Text style={styles.nearbyText}>Find saved moments within 1 km of where you are right now.</Text>
        <Pressable onPress={findNearby} style={styles.findButton} disabled={status === 'loading'} accessibilityRole="button">
          {status === 'loading' ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <>
              <Ionicons name="navigate" size={17} color={colors.ink} />
              <Text style={styles.findButtonText}>Find Memories Near Me</Text>
            </>
          )}
        </Pressable>
      </View>

      {status !== 'ready' ? (
        <View style={styles.nearbyState}>
          <Text style={styles.nearbyStateText}>{message}</Text>
        </View>
      ) : (
        <View style={styles.nearbyResults}>
          <Text style={styles.nearbyResultsTitle}>{nearbyItems.length} nearby memor{nearbyItems.length === 1 ? 'y' : 'ies'}</Text>
          {nearbyItems.map(({ echo, distance }) => (
            <Pressable
              key={echo.id}
              onPress={() => navigation.navigate('Detail', { echo })}
              style={styles.nearbyMemory}
              accessibilityRole="button"
            >
              {echo.photos[0]?.uri ? (
                <Image source={{ uri: echo.photos[0].uri }} style={styles.nearbyMemoryImage} />
              ) : (
                <View style={styles.nearbyMemoryFallback} />
              )}
              <View style={styles.nearbyMemoryCopy}>
                <Text style={styles.nearbyMemoryTitle} numberOfLines={2}>{echo.note?.trim() || echo.location?.name || 'Saved memory'}</Text>
                <Text style={styles.nearbyMemoryMeta} numberOfLines={1}>{formatDistance(distance)} away</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
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

function formatDistance(value) {
  if (value < 1000) return `${Math.max(1, Math.round(value))} m`;
  return `${(value / 1000).toFixed(1)} km`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  placeholderTitle: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderText: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  nearbyContainer: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  nearbyContent: {
    paddingHorizontal: 20,
  },
  nearbyHero: {
    borderRadius: 28,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  nearbyHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  nearbyTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  nearbyText: {
    ...typography.bodySmall,
    color: colors.muted,
    lineHeight: 21,
    marginTop: 8,
  },
  findButton: {
    height: 48,
    borderRadius: 20,
    backgroundColor: colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
  },
  findButtonText: {
    ...typography.button,
    color: colors.ink,
  },
  nearbyState: {
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginTop: 16,
  },
  nearbyStateText: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
  },
  nearbyResults: {
    marginTop: 18,
    gap: 12,
  },
  nearbyResultsTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: 2,
  },
  nearbyMemory: {
    minHeight: 96,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 12,
  },
  nearbyMemoryImage: {
    width: 74,
    height: 74,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  nearbyMemoryFallback: {
    width: 74,
    height: 74,
    borderRadius: 16,
    backgroundColor: colors.pill,
  },
  nearbyMemoryCopy: {
    flex: 1,
  },
  nearbyMemoryTitle: {
    ...typography.bodySmall,
    color: colors.ink,
    fontWeight: '800',
    lineHeight: 19,
  },
  nearbyMemoryMeta: {
    ...typography.caption,
    color: colors.gold,
    marginTop: 6,
  },
});
