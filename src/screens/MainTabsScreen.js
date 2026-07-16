import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from './HomeScreen';
import MapScreen from './MapScreen';
import BottomTabBar from '../components/BottomTabBar';
import { colors, typography } from '../theme';

export default function MainTabsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(0);

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return <HomeScreen navigation={navigation} />;
      case 1:
        return <MapScreen navigation={navigation} />;
      case 2:
        return <SearchPlaceholder />;
      case 3:
        return <ProfilePlaceholder />;
      default:
        return <HomeScreen navigation={navigation} />;
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
        onTabPress={setActiveTab}
      />
    </View>
  );
}

function SearchPlaceholder() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.placeholderContainer, { paddingTop: insets.top }]}>
      <Text style={styles.placeholderTitle}>AI Semantic Search</Text>
      <Text style={styles.placeholderText}>Search through all your location memories and Echoes.</Text>
    </View>
  );
}

function ProfilePlaceholder() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.placeholderContainer, { paddingTop: insets.top }]}>
      <Text style={styles.placeholderTitle}>Your Profile</Text>
      <Text style={styles.placeholderText}>Manage your saved locations, data settings, and credentials.</Text>
    </View>
  );
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
  },
});
