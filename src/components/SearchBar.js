import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors, typography } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SearchBar() {
  const filterScale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const filterAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: filterScale.value }],
  }));

  const onFilterPressIn = () => {
    if (!reduceMotion) filterScale.value = withTiming(0.95, { duration: 80 });
  };
  const onFilterPressOut = () => {
    filterScale.value = withTiming(1, { duration: 120 });
  };

  return (
    <View style={styles.row}>
      <View style={styles.bar}>
        <Feather name="search" size={16} color={colors.muted} />
        <Text style={styles.placeholder}>Search</Text>
      </View>
      <AnimatedPressable
        style={[styles.filterBtn, filterAnimStyle]}
        onPressIn={onFilterPressIn}
        onPressOut={onFilterPressOut}
        accessibilityLabel="Filter"
        accessibilityRole="button"
      >
        <Feather name="sliders" size={18} color="#fff" />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  bar: {
    flex: 1,
    backgroundColor: colors.pill,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  placeholder: {
    ...typography.body,
    color: colors.muted,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
