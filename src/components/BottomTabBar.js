import React from 'react';
import { Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_WIDTH = 315; // Increased horizontal length

const tabs = [
  { key: 'home', icon: 'home-outline', iconActive: 'home' },
  { key: 'map', icon: 'navigate-outline', iconActive: 'navigate' },
  { key: 'camera', icon: 'camera-outline', iconActive: 'camera', isCenter: true },
  { key: 'search', icon: 'search-outline', iconActive: 'search' },
  { key: 'profile', icon: 'person-outline', iconActive: 'person' },
];

export default function BottomTabBar({ visible = true, activeTab = 0, onTabPress }) {
  const reduceMotion = useReducedMotion();

  const containerStyle = useAnimatedStyle(() => {
    const dur = reduceMotion ? 0 : 300;
    return {
      opacity: withTiming(visible ? 1 : 0, { duration: dur }),
      transform: [
        {
          translateY: visible
            ? withTiming(0, { duration: dur })
            : withTiming(40, { duration: dur }),
        },
      ],
    };
  }, [visible]);

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents={visible ? 'auto' : 'none'}>
      {tabs.map((tab, index) => {
        const isActive = index === activeTab;
        const isCenter = tab.isCenter;
        return (
          <Pressable
            key={tab.key}
            style={[
              styles.navItem,
              isActive && !isCenter && styles.navItemActive,
              isCenter && styles.centerNavItem
            ]}
            onPress={() => onTabPress?.(index)}
            accessibilityLabel={tab.key}
            accessibilityRole="tab"
          >
            <Ionicons
              name={isActive ? tab.iconActive : tab.icon}
              size={isCenter ? 26 : 24} // Increased size
              color={isCenter ? '#fff' : (isActive ? '#111' : '#9a9ea6')}
            />
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: (SCREEN_WIDTH - TAB_BAR_WIDTH) / 2,
    width: TAB_BAR_WIDTH,
    bottom: 28, // Shifted up
    height: 78, // Increased size
    backgroundColor: colors.ink,
    borderRadius: 39,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
    zIndex: 60,
  },
  navItem: {
    width: 50, // Increased touch targets
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
    backgroundColor: '#fff',
  },
  centerNavItem: {
    backgroundColor: '#ff7a4d', // primary solid orange accent
    width: 56, // Increased center button
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff7a4d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
