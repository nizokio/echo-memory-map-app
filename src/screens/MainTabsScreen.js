import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from './HomeScreen';
import MapScreen from './MapScreen';
import SettingsScreen from './SettingsScreen';
import BottomTabBar from '../components/BottomTabBar';
import CameraView from '../components/CameraView';
import { useEchoes } from '../features/echoes/application/EchoDataProvider';
import { colors, typography } from '../theme';

export default function MainTabsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(0);
  const [cameraVisible, setCameraVisible] = useState(false);
  const { refresh } = useEchoes();

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return <HomeScreen navigation={navigation} onProfilePress={() => setActiveTab(4)} />;
      case 1:
        return <MapScreen navigation={navigation} />;
      case 3:
        return <SearchPlaceholder />;
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

function SearchPlaceholder() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.placeholderContainer, { paddingTop: insets.top }]}>
      <Text style={styles.placeholderTitle}>AI Semantic Search</Text>
      <Text style={styles.placeholderText}>Search through your saved memories by place, note, and moment.</Text>
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
    maxWidth: 280,
  },
});
