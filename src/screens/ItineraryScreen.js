import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors, typography } from '../theme';
import { itinerary } from '../data/itinerary';

import FavoriteButton from '../components/FavoriteButton';
import SegmentedTabs from '../components/SegmentedTabs';
import DayAccordion from '../components/DayAccordion';
import Toast from '../components/Toast';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TAB_LABELS = ['Tour schedule', 'Accommodation', 'Booking details'];

export default function ItineraryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const bookScale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const bookAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookScale.value }],
  }));

  const onBookPressIn = () => {
    if (!reduceMotion) bookScale.value = withTiming(0.97, { duration: 150 });
  };
  const onBookPressOut = () => {
    bookScale.value = withTiming(1, { duration: 150 });
  };

  const handleBook = useCallback(() => {
    setToastMessage('Tour booked! ✈️');
    setToastVisible(true);
  }, []);

  const handleToastHide = useCallback(() => {
    setToastVisible(false);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable
            style={styles.circleBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Feather name="chevron-left" size={16} color="#000" />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.tripTitle}>{itinerary.title}</Text>
            <Text style={styles.tripDates}>{itinerary.dateRange}</Text>
          </View>
          <FavoriteButton size={38} iconSize={16} />
        </View>

        {/* Segmented Tabs */}
        <SegmentedTabs
          tabs={TAB_LABELS}
          activeIndex={activeTab}
          onTabPress={setActiveTab}
        />

        {/* Day title */}
        <Text style={styles.dayTitle}>{itinerary.subtitle}</Text>

        {/* Day accordions */}
        {itinerary.days.map((day, idx) => (
          <DayAccordion
            key={day.day}
            dayData={day}
            defaultOpen={idx === 0}
          />
        ))}
      </ScrollView>

      {/* Sticky Book Button */}
      <AnimatedPressable
        style={[styles.bookBtn, bookAnimStyle, { bottom: insets.bottom + 22 }]}
        onPress={handleBook}
        onPressIn={onBookPressIn}
        onPressOut={onBookPressOut}
        accessibilityLabel="Book a tour"
        accessibilityRole="button"
      >
        <Text style={styles.bookBtnText}>Book a tour</Text>
      </AnimatedPressable>

      {/* Toast */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={handleToastHide}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.circleBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  tripTitle: {
    ...typography.h4,
    color: colors.ink,
  },
  tripDates: {
    ...typography.label,
    color: colors.muted,
    marginTop: 2,
  },
  dayTitle: {
    ...typography.h3,
    color: colors.ink,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 10,
  },
  bookBtn: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  bookBtnText: {
    color: '#fff',
    ...typography.button,
  },
});
