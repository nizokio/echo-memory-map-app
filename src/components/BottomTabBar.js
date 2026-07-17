import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Dimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EXPANDED_WIDTH = Math.min(326, SCREEN_WIDTH - 34);
const COLLAPSED_WIDTH = 76;
const AUTO_COLLAPSE_MS = 2400;

const tabs = [
  { key: 'home', icon: 'home-outline', iconActive: 'home' },
  { key: 'map', icon: 'navigate-outline', iconActive: 'navigate' },
  { key: 'camera', icon: 'camera-outline', iconActive: 'camera' }, // Treated as normal tab
  { key: 'search', icon: 'search-outline', iconActive: 'search' },
  { key: 'settings', icon: 'settings-outline', iconActive: 'settings' },
];

export default function BottomTabBar({ visible = true, activeTab = 0, onTabPress }) {
  const [expanded, setExpanded] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!visible || !expanded) return undefined;

    const timer = setTimeout(() => setExpanded(false), AUTO_COLLAPSE_MS);
    return () => clearTimeout(timer);
  }, [expanded, visible]);

  const containerStyle = useAnimatedStyle(() => {
    const dur = reduceMotion ? 0 : 300;
    return {
      left: withTiming((SCREEN_WIDTH - (expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH)) / 2, { duration: dur }),
      width: withTiming(expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH, { duration: dur }),
      opacity: withTiming(visible ? 1 : 0, { duration: dur }),
      transform: [
        {
          translateY: visible
            ? withTiming(0, { duration: dur })
            : withTiming(40, { duration: dur }),
        },
      ],
    };
  }, [expanded, reduceMotion, visible]);

  const activeTabItem = tabs[activeTab] || tabs[0];

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents={visible ? 'auto' : 'none'}>
      {expanded ? tabs.map((tab, index) => {
        const isActive = index === activeTab;
        return (
          <Pressable
            key={tab.key}
            style={[
              styles.navItem,
              isActive && styles.navItemActive
            ]}
            onPress={() => onTabPress?.(index)}
            accessibilityLabel={tab.key}
            accessibilityRole="tab"
          >
            <Ionicons
              name={isActive ? tab.iconActive : tab.icon}
              size={26} // Larger icon size
              color={isActive ? '#111' : '#9a9ea6'}
            />
          </Pressable>
        );
      }) : (
        <Pressable
          style={styles.collapsedButton}
          onPress={() => setExpanded(true)}
          accessibilityLabel="Open navigation"
          accessibilityRole="button"
        >
          <Ionicons name={activeTabItem.iconActive} size={24} color="#111" />
          <View style={styles.collapsedDot} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 18,
    height: 64,
    backgroundColor: colors.ink,
    borderRadius: 32,
    overflow: 'hidden',
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
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
    backgroundColor: '#fff',
  },
  collapsedButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedDot: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
});
