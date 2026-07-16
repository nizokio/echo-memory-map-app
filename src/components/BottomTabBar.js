import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const tabs = [
  { key: 'home', icon: 'home-outline', iconActive: 'home' },
  { key: 'explore', icon: 'grid-outline', iconActive: 'grid' },
  { key: 'favorites', icon: 'heart-outline', iconActive: 'heart' },
  { key: 'menu', icon: 'apps-outline', iconActive: 'apps' },
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
        return (
          <Pressable
            key={tab.key}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => onTabPress?.(index)}
            accessibilityLabel={tab.key}
            accessibilityRole="tab"
          >
            <Ionicons
              name={isActive ? tab.iconActive : tab.icon}
              size={20}
              color={isActive ? '#111' : '#9a9ea6'}
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
    left: 20,
    right: 20,
    bottom: 18,
    height: 64,
    backgroundColor: colors.ink,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
    zIndex: 60,
  },
  navItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
    backgroundColor: '#fff',
  },
});
