import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, interpolate, withTiming, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';
import FavoriteButton from './FavoriteButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = 500;
const formatDate = (value) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));

export default function VerticalEchoStack({ echoes, currentIndex, onIndexChange, onPressCard, onFavoriteToggle, emptyMessage }) {
  const total = echoes.length;
  const stackProgress = useSharedValue(currentIndex);
  const startProgress = useSharedValue(0);

  useEffect(() => {
    if (total === 0) return;
    const currentVal = stackProgress.value;
    const currentWrapped = ((currentVal % total) + total) % total;
    let diff = currentIndex - currentWrapped;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    stackProgress.value = withTiming(currentVal + diff, { duration: 300 });
  }, [currentIndex, total]);

  if (total === 0) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>{emptyMessage}</Text></View>;
  }

  const gesture = Gesture.Pan()
    .onStart(() => { startProgress.value = stackProgress.value; })
    .onUpdate((event) => { stackProgress.value = startProgress.value + event.translationY / 400; })
    .onEnd((event) => {
      const targetProgress = Math.round(stackProgress.value + (event.velocityY / 400) * 0.15);
      stackProgress.value = withTiming(targetProgress, { duration: 300 });
      runOnJS(onIndexChange)(((targetProgress % total) + total) % total);
    });

  return (
    <View style={styles.container}>
      <View style={styles.ambientGlow} />
      <GestureDetector gesture={gesture}>
        <Animated.View style={styles.stackWrapper}>
          {echoes.map((echo, index) => <StackCard key={echo.id} echo={echo} index={index} total={total} stackProgress={stackProgress} isCurrent={index === currentIndex} onPress={() => onPressCard(echo)} onFavoriteToggle={onFavoriteToggle} />)}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function StackCard({ echo, index, total, stackProgress, isCurrent, onPress, onFavoriteToggle }) {
  const cardStyle = useAnimatedStyle(() => {
    let diff = (index - stackProgress.value) % total;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    if (diff < 0) return { transform: [{ translateY: -diff * 500 }, { scale: 1 }], opacity: interpolate(diff, [-1, 0], [0, 1], 'clamp'), zIndex: 20 };
    return { transform: [{ translateY: -diff * 28 }, { scale: 1 - diff * 0.04 }], opacity: interpolate(diff, [0, 3], [1, 0.5], 'clamp'), zIndex: Math.round(10 - diff) };
  });
  const gradientStyle = useAnimatedStyle(() => {
    let diff = (index - stackProgress.value) % total;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return { opacity: interpolate(diff, [-0.001, 0], [0, 1], 'clamp') };
  });
  const photoUri = echo.photos[0]?.uri;

  return (
    <Animated.View style={[styles.cardWrapper, cardStyle]} pointerEvents={isCurrent ? 'auto' : 'none'}>
      <Pressable onPress={onPress} style={styles.cardInner} accessibilityRole="button">
        {photoUri ? <Animated.Image source={{ uri: photoUri }} style={styles.image} /> : <View style={styles.imageFallback} />}
        <Animated.View style={[styles.gradient, gradientStyle]} pointerEvents="none"><LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} locations={[0.4, 1]} style={StyleSheet.absoluteFill} /></Animated.View>
        {isCurrent && <FavoriteButton size={40} iconSize={19} style={styles.favBtn} onToggle={onFavoriteToggle} />}
        {isCurrent && <View style={styles.info}><Text style={styles.location}>{echo.location.name}</Text><Text style={styles.name}>{echo.aiMetadata?.title || echo.location.name}</Text><View style={styles.detailRow}><Text style={styles.tag}>{echo.tags[0]}</Text><Text style={styles.details}>{formatDate(echo.capturedAt)} - {echo.photos.length} photo{echo.photos.length === 1 ? '' : 's'}</Text></View></View>}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { height: 540, width: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative', marginTop: 8 },
  emptyContainer: { height: 540, width: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  ambientGlow: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: colors.pill, opacity: 0.08, transform: [{ scale: 1.5 }], zIndex: -1 },
  stackWrapper: { width: CARD_WIDTH, height: CARD_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  cardWrapper: { position: 'absolute', width: CARD_WIDTH, height: CARD_HEIGHT, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 },
  cardInner: { width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden', backgroundColor: '#1a1a1a' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' }, imageFallback: { width: '100%', height: '100%', backgroundColor: colors.pill }, gradient: { ...StyleSheet.absoluteFillObject },
  favBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10 }, info: { position: 'absolute', left: 20, right: 20, bottom: 24 },
  location: { color: '#fff', opacity: 0.85, fontSize: 12, marginBottom: 2 }, name: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 }, detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 }, tag: { color: colors.gold, fontSize: 12, textTransform: 'capitalize' }, details: { color: '#fff', fontSize: 11 },
});
