import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors, typography } from '../theme';
import FavoriteButton from './FavoriteButton';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const formatDate = (value) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));

export default function EchoCard({ echo, onPress }) {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPress={onPress}
      onPressIn={() => !reduceMotion && (scale.value = withTiming(0.97, { duration: 150 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 150 }))}
      accessibilityLabel={`${echo.aiMetadata?.title || echo.location.name}, captured ${formatDate(echo.capturedAt)}`}
      accessibilityRole="button"
    >
      <View style={styles.imgBox}>
        {echo.photos[0]?.uri ? <Image source={{ uri: echo.photos[0].uri }} style={styles.image} /> : <View style={styles.imageFallback} />}
      </View>
      <FavoriteButton size={30} iconSize={14} style={styles.favMini} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{echo.aiMetadata?.title || echo.location.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>{echo.location.name} - {formatDate(echo.capturedAt)}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.tag}>{echo.tags[0]}</Text>
          <Text style={styles.details}>{echo.photos.length} photo{echo.photos.length === 1 ? '' : 's'}</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 220, borderRadius: 22, overflow: 'hidden', marginRight: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.3, shadowRadius: 26, elevation: 8, backgroundColor: '#fff' },
  imgBox: { height: 130, overflow: 'hidden' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageFallback: { width: '100%', height: '100%', backgroundColor: colors.pill },
  favMini: { position: 'absolute', top: 10, right: 10 },
  body: { padding: 12, paddingHorizontal: 14, paddingBottom: 16, backgroundColor: '#fff' },
  title: { ...typography.echoTitle, color: colors.ink, marginBottom: 4 },
  meta: { ...typography.echoMeta, color: colors.muted, marginBottom: 6 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tag: { ...typography.echoMeta, color: colors.ink, textTransform: 'capitalize' },
  details: { ...typography.echoMeta, color: colors.ink },
});
