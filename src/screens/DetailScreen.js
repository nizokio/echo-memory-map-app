import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { tours } from '../data/tours';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  useReducedMotion,
} from 'react-native-reanimated';

import FavoriteButton from '../components/FavoriteButton';
import TourCard from '../components/TourCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = 340;
const OVERLAP = 28;

export default function DetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const destination = route.params?.destination;
  const [expanded, setExpanded] = useState(false);
  const destinationTours = tours.filter((t) => t.destinationId === destination?.id);

  const scrollY = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const heroImageStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return { transform: [{ scale: 1 }] };
    }
    const scale = interpolate(
      scrollY.value,
      [0, HERO_HEIGHT],
      [1, 1.08],
      'clamp'
    );
    return {
      transform: [{ scale: scrollY.value < 0 ? 1 : scale }],
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return { opacity: 0 };
    }
    const opacity = interpolate(
      scrollY.value,
      [0, HERO_HEIGHT],
      [0, 0.3],
      'clamp'
    );
    return { opacity };
  });

  const topControlsStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return { opacity: 1 };
    }
    const opacity = interpolate(
      scrollY.value,
      [0, HERO_HEIGHT * 0.6],
      [1, 0],
      'clamp'
    );
    return { opacity };
  });

  return (
    <View style={styles.container}>
      {/* Absolute Hero Header under ScrollView */}
      <View style={styles.heroWrap}>
        <Animated.Image
          source={{ uri: destination?.image }}
          style={[styles.heroImage, heroImageStyle]}
        />
        <Animated.View style={[styles.darkOverlay, overlayStyle]} />
        
        {/* Top Controls */}
        <Animated.View style={[styles.topControls, { top: insets.top + 10 }, topControlsStyle]}>
          <Pressable
            style={styles.circleBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Feather name="chevron-left" size={16} color="#000" />
          </Pressable>
          <FavoriteButton size={38} iconSize={16} />
        </Animated.View>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={StyleSheet.absoluteFill}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Spacer to align details sheet below initial hero position */}
        <View style={styles.spacer} />

        {/* Bottom Sheet */}
        <View style={[styles.sheet, { minHeight: SCREEN_HEIGHT - HERO_HEIGHT + OVERLAP - insets.bottom }]}>
          <View style={styles.sheetHead}>
            <View>
              <Text style={styles.sheetTitle}>{destination?.name}</Text>
              <View style={styles.locRow}>
                <View style={styles.locDot} />
                <Text style={styles.locText}>{destination?.country}</Text>
              </View>
            </View>
            <View style={styles.rateBox}>
              <Text style={styles.stars}>★ {destination?.rating.toFixed(1)}</Text>
              <Text style={styles.reviews}>{destination?.reviewCount} reviews</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.desc}>
            {expanded ? destination?.descriptionFull : destination?.description}
          </Text>
          <Pressable onPress={() => setExpanded(!expanded)}>
            <Text style={styles.readMore}>
              {expanded ? 'Read less' : 'Read more'}
            </Text>
          </Pressable>

          {/* Upcoming Tours */}
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Upcoming tours</Text>
            <Text style={styles.seeAll}>See all</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.toursScroll}
            contentContainerStyle={styles.toursContent}
          >
            {destinationTours.map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                onPress={() => navigation.navigate('Itinerary', { tour })}
              />
            ))}
          </ScrollView>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  heroWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
    overflow: 'hidden',
    zIndex: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  topControls: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.circleBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  spacer: {
    height: HERO_HEIGHT - OVERLAP,
  },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 26,
    paddingHorizontal: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  sheetHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sheetTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  locDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.locDot,
  },
  locText: {
    ...typography.caption,
    color: colors.muted,
  },
  rateBox: {
    alignItems: 'flex-end',
  },
  stars: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  reviews: {
    ...typography.label,
    color: colors.muted,
    textDecorationLine: 'underline',
    marginTop: 2,
  },
  desc: {
    ...typography.bodySmall,
    color: colors.descText,
    lineHeight: 21,
    marginTop: 16,
  },
  readMore: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  seeAll: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.muted,
    textDecorationLine: 'underline',
  },
  toursScroll: {
    marginTop: 16,
    marginHorizontal: -20,
  },
  toursContent: {
    paddingLeft: 20,
    paddingBottom: 6,
  },
});
