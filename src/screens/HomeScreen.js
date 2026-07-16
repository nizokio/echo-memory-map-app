import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '../theme';
import { destinations } from '../data/destinations';

import SearchBar from '../components/SearchBar';
import VerticalImageStack from '../components/VerticalImageStack';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleIndexChange = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  const handlePressCard = useCallback((destination) => {
    navigation.navigate('Detail', { destination });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        bounces={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 150 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.helloRow}>
          <View>
            <Text style={styles.greeting}>Hello, Vanessa</Text>
            <Text style={styles.subtitle}>Welcome to Echo</Text>
          </View>
          <LinearGradient
            colors={[colors.avatarGradientStart, colors.avatarGradientEnd]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarEmoji}>🧑🏾‍🦱</Text>
          </LinearGradient>
        </View>

        {/* Search */}
        <SearchBar />

        {/* Section title */}
        <Text style={styles.memoriesHeading}>Memories</Text>

        {/* Vertical Image Stack */}
        <VerticalImageStack
          destinations={destinations}
          currentIndex={currentIndex}
          onIndexChange={handleIndexChange}
          onPressCard={handlePressCard}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  helloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    ...typography.h1,
    fontSize: 32, // increased size
    color: colors.ink,
  },
  memoriesHeading: {
    ...typography.h3,
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 28,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff7a4d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
    marginTop: 26,
    marginBottom: 14,
  },
  pillsScroll: {
    flexGrow: 0,
  },
  pillsContent: {
    paddingBottom: 4,
  },
});
