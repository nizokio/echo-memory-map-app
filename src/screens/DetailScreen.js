import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate, useReducedMotion } from 'react-native-reanimated';
import { colors, typography } from '../theme';
import { getRelatedEchoes } from '../domain/echo/echoRelations';
import { useEchoes } from '../features/echoes/application/EchoDataProvider';
import FavoriteButton from '../components/FavoriteButton';
import EchoCard from '../components/EchoCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = 340;
const OVERLAP = 28;

export default function DetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const { echoes } = useEchoes();
  const routeEcho = route.params?.echo;
  const echo = echoes.find((item) => item.id === routeEcho?.id) || routeEcho;
  const relatedEchoes = getRelatedEchoes(echoes, echo);
  const scrollY = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const scrollHandler = useAnimatedScrollHandler({ onScroll: (event) => { scrollY.value = event.contentOffset.y; } });
  const heroImageStyle = useAnimatedStyle(() => ({ transform: [{ scale: reduceMotion ? 1 : interpolate(scrollY.value, [0, HERO_HEIGHT], [1, 1.08], 'clamp') }] }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: reduceMotion ? 0 : interpolate(scrollY.value, [0, HERO_HEIGHT], [0, 0.3], 'clamp') }));
  const topControlsStyle = useAnimatedStyle(() => ({ opacity: reduceMotion ? 1 : interpolate(scrollY.value, [0, HERO_HEIGHT * 0.6], [1, 0], 'clamp') }));

  return (
    <View style={styles.container}>
      <View style={styles.heroWrap}>
        <Animated.Image source={{ uri: echo?.photos[0]?.uri }} style={[styles.heroImage, heroImageStyle]} />
        <Animated.View style={[styles.darkOverlay, overlayStyle]} />
        <Animated.View style={[styles.topControls, { top: insets.top + 10 }, topControlsStyle]}>
          <Pressable style={styles.circleBtn} onPress={() => navigation.goBack()} accessibilityLabel="Go back" accessibilityRole="button"><Feather name="chevron-left" size={16} color="#000" /></Pressable>
          <FavoriteButton size={38} iconSize={16} />
        </Animated.View>
      </View>
      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16} showsVerticalScrollIndicator={false} bounces={false} style={StyleSheet.absoluteFill} contentContainerStyle={styles.scrollContent}>
        <View style={styles.spacer} />
        <View style={[styles.sheet, { minHeight: SCREEN_HEIGHT - HERO_HEIGHT + OVERLAP - insets.bottom }]}>
          <View style={styles.sheetHead}>
            <View><Text style={styles.sheetTitle}>{echo?.aiMetadata?.title || echo?.location.name}</Text><View style={styles.locRow}><View style={styles.locDot} /><Text style={styles.locText}>{echo?.location.locality}</Text></View></View>
            <View style={styles.rateBox}><Text style={styles.stars}>{echo?.photos.length} photo{echo?.photos.length === 1 ? '' : 's'}</Text><Text style={styles.reviews}>{echo?.tags.join(' - ')}</Text></View>
          </View>
          <Text style={styles.desc}>{expanded ? echo?.note : (echo?.aiMetadata?.summary || echo?.note)}</Text>
          <Pressable onPress={() => setExpanded(!expanded)}><Text style={styles.readMore}>{expanded ? 'Read less' : 'Read more'}</Text></Pressable>
          {echo?.aiMetadata?.caption ? (
            <View style={styles.captionBlock}>
              <Text style={styles.captionLabel}>Photo caption</Text>
              <Text style={styles.captionText}>{echo.aiMetadata.caption}</Text>
            </View>
          ) : null}
          <View style={styles.rowBetween}><Text style={styles.sectionTitle}>Related echoes</Text><Pressable onPress={() => navigation.navigate('MemoryTimeline', { echo })} accessibilityRole="button"><Text style={styles.seeAll}>View memory</Text></Pressable></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedScroll} contentContainerStyle={styles.relatedContent}>
            {relatedEchoes.map((relatedEcho) => <EchoCard key={relatedEcho.id} echo={relatedEcho} onPress={() => navigation.push('Detail', { echo: relatedEcho })} />)}
          </ScrollView>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  heroWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: HERO_HEIGHT, overflow: 'hidden', zIndex: 0 },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' }, darkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  topControls: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 20 },
  circleBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.circleBtn, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { flexGrow: 1 }, spacer: { height: HERO_HEIGHT - OVERLAP },
  sheet: { backgroundColor: colors.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 26, paddingHorizontal: 20, paddingBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: -12 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 4 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, sheetTitle: { ...typography.h2, color: colors.ink },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }, locDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.locDot }, locText: { ...typography.caption, color: colors.muted },
  rateBox: { alignItems: 'flex-end', maxWidth: 115 }, stars: { color: colors.gold, fontSize: 14, fontWeight: '700' }, reviews: { ...typography.label, color: colors.muted, textDecorationLine: 'underline', marginTop: 2, textAlign: 'right' },
  desc: { ...typography.bodySmall, color: colors.descText, lineHeight: 21, marginTop: 16 }, readMore: { ...typography.caption, fontWeight: '700', color: colors.ink, marginTop: 4 },
  captionBlock: { marginTop: 18, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: colors.gold }, captionLabel: { ...typography.label, color: colors.muted, textTransform: 'uppercase' }, captionText: { ...typography.bodySmall, color: colors.descText, lineHeight: 20, marginTop: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26 }, sectionTitle: { ...typography.h3, color: colors.ink }, seeAll: { ...typography.caption, fontWeight: '600', color: colors.muted, textDecorationLine: 'underline' },
  relatedScroll: { marginTop: 16, marginHorizontal: -20 }, relatedContent: { paddingLeft: 20, paddingBottom: 6 },
});
