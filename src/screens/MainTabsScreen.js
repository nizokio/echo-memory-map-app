import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from './HomeScreen';
import MapScreen from './MapScreen';
import BottomTabBar from '../components/BottomTabBar';
import CameraView from '../components/CameraView';
import { useAuth } from '../features/auth/application/AuthDataProvider';
import { useCurrentUser } from '../features/users/application/UserDataProvider';
import { colors, typography } from '../theme';

export default function MainTabsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(0);
  const [cameraVisible, setCameraVisible] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return <HomeScreen navigation={navigation} />;
      case 1:
        return <MapScreen navigation={navigation} />;
      case 3:
        return <SearchPlaceholder />;
      case 4:
        return <ProfilePlaceholder />;
      default:
        return <HomeScreen navigation={navigation} />;
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
  const { error, isAuthenticated, isLoading, signInWithGoogle, signOut, user } = useAuth();
  const { profile } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayName = profile?.displayName || user?.email || 'Echo user';
  const avatarUrl = profile?.avatarUrl;
  const initial = displayName.charAt(0).toUpperCase();

  const handleAuthAction = async (action) => {
    setIsSubmitting(true);
    try {
      await action();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.placeholderContainer, { paddingTop: insets.top }]}>
      <View style={styles.profileAvatar}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.profileAvatarImage} />
        ) : (
          <Text style={styles.profileAvatarText}>{initial}</Text>
        )}
      </View>
      <Text style={styles.placeholderTitle}>
        {isAuthenticated ? displayName : 'Your Profile'}
      </Text>
      <Text style={styles.placeholderText}>
        {isAuthenticated
          ? user?.email || 'Signed in with Google'
          : 'Sign in to restore sessions and prepare your private Echoes.'}
      </Text>
      {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
      <Pressable
        style={[styles.authButton, (isLoading || isSubmitting) && styles.authButtonDisabled]}
        onPress={() => handleAuthAction(isAuthenticated ? signOut : signInWithGoogle)}
        disabled={isLoading || isSubmitting}
        accessibilityRole="button"
        accessibilityLabel={isAuthenticated ? 'Sign out' : 'Sign in with Google'}
      >
        {isLoading || isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.authButtonText}>
            {isAuthenticated ? 'Sign out' : 'Continue with Google'}
          </Text>
        )}
      </Pressable>
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
  profileAvatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  profileAvatarText: {
    ...typography.h2,
    color: '#fff',
  },
  authButton: {
    minWidth: 210,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    paddingHorizontal: 22,
  },
  authButtonDisabled: {
    opacity: 0.7,
  },
  authButtonText: {
    ...typography.button,
    color: '#fff',
  },
  errorText: {
    ...typography.caption,
    color: '#c43d3d',
    textAlign: 'center',
    marginTop: 14,
    maxWidth: 280,
  },
});
