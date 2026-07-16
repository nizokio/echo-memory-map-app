import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors, typography } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SegmentedTabs({ tabs, activeIndex, onTabPress }) {
  const reduceMotion = useReducedMotion();

  return (
    <View style={styles.container}>
      {tabs.map((tab, index) => {
        const isActive = index === activeIndex;
        return (
          <TabItem
            key={tab}
            label={tab}
            isActive={isActive}
            onPress={() => onTabPress(index)}
            reduceMotion={reduceMotion}
          />
        );
      })}
    </View>
  );
}

function TabItem({ label, isActive, onPress, reduceMotion }) {
  const animStyle = useAnimatedStyle(() => {
    const dur = reduceMotion ? 0 : 250;
    return {
      backgroundColor: withTiming(isActive ? colors.ink : colors.pill, { duration: dur }),
    };
  }, [isActive]);

  return (
    <AnimatedPressable style={[styles.tab, animStyle]} onPress={onPress}>
      <Text style={[styles.tabText, { color: isActive ? '#fff' : colors.muted }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  tabText: {
    ...typography.tab,
  },
});
