import React, { useState, useCallback } from 'react';
import { Image, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, useReducedMotion } from 'react-native-reanimated';
import { colors, typography } from '../theme';
import FavoriteButton from '../components/FavoriteButton';
import SegmentedTabs from '../components/SegmentedTabs';
import DayAccordion from '../components/DayAccordion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const TAB_LABELS = ['Memory', 'Photos', 'Location'];
const formatDate = (value) => new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value));

export default function MemoryTimelineScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const echo = route.params?.echo;
  const [activeTab, setActiveTab] = useState(0);
  const actionScale = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  const actionStyle = useAnimatedStyle(() => ({ transform: [{ scale: actionScale.value }] }));
  const moments = (echo?.photos || []).map((photo, index) => ({
    id: photo.id,
    image: photo.uri,
    label: `Photo ${index + 1}`,
    title: photo.caption || `Memory from ${echo.location.name}`,
    details: [
      { label: 'Captured', text: formatDate(photo.capturedAt || echo.capturedAt) },
      { label: 'Place', text: echo.location.name },
      { label: 'Note', text: echo.note },
    ],
  }));
  const handleAction = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable style={styles.circleBtn} onPress={() => navigation.goBack()} accessibilityLabel="Go back" accessibilityRole="button"><Feather name="chevron-left" size={16} color="#000" /></Pressable>
          <View style={styles.titleBlock}><Text style={styles.memoryTitle}>{echo?.aiMetadata?.title || echo?.location.name}</Text><Text style={styles.memoryDate}>{echo ? formatDate(echo.capturedAt) : ''}</Text></View>
          <FavoriteButton size={38} iconSize={16} />
        </View>
        <SegmentedTabs tabs={TAB_LABELS} activeIndex={activeTab} onTabPress={setActiveTab} />
        {activeTab === 0 ? <MemoryTab echo={echo} moments={moments} /> : null}
        {activeTab === 1 ? <PhotosTab echo={echo} /> : null}
        {activeTab === 2 ? <LocationTab echo={echo} /> : null}
      </ScrollView>
      <AnimatedPressable style={[styles.actionBtn, actionStyle, { bottom: insets.bottom + 22 }]} onPress={handleAction} onPressIn={() => !reduceMotion && (actionScale.value = withTiming(0.97, { duration: 150 }))} onPressOut={() => (actionScale.value = withTiming(1, { duration: 150 }))} accessibilityLabel="Back to memory" accessibilityRole="button"><Text style={styles.actionBtnText}>Back to memory</Text></AnimatedPressable>
    </View>
  );
}

function MemoryTab({ echo, moments }) {
  return (
    <>
      <Text style={styles.sectionTitle}>Memory timeline</Text>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Note</Text>
        <Text style={styles.summaryText}>{echo?.note || echo?.aiMetadata?.caption || 'No note saved for this memory.'}</Text>
      </View>
      {moments.map((moment, index) => <DayAccordion key={moment.id} moment={moment} defaultOpen={index === 0} />)}
    </>
  );
}

function PhotosTab({ echo }) {
  const photos = echo?.photos || [];

  return (
    <>
      <Text style={styles.sectionTitle}>Photos</Text>
      <View style={styles.photoGrid}>
        {photos.length ? photos.map((photo, index) => (
          <View key={photo.id || photo.storagePath || index} style={styles.photoTile}>
            <Image source={{ uri: photo.uri }} style={styles.photoTileImage} />
            <Text style={styles.photoTileLabel}>Photo {index + 1}</Text>
          </View>
        )) : (
          <Text style={styles.emptyText}>No photos saved for this memory.</Text>
        )}
      </View>
    </>
  );
}

function LocationTab({ echo }) {
  return (
    <>
      <Text style={styles.sectionTitle}>Location</Text>
      <View style={styles.locationCard}>
        <InfoLine label="Place" value={echo?.location?.name || 'Unknown place'} />
        <InfoLine label="Area" value={echo?.location?.locality || 'Unknown area'} />
        <InfoLine label="Latitude" value={formatCoordinate(echo?.location?.latitude)} />
        <InfoLine label="Longitude" value={formatCoordinate(echo?.location?.longitude)} />
        <InfoLine label="Captured" value={echo ? formatDate(echo.capturedAt) : 'Unknown date'} />
      </View>
    </>
  );
}

function InfoLine({ label, value }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function formatCoordinate(value) {
  if (typeof value !== 'number') return 'Unknown';
  return value.toFixed(6);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  circleBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.circleBtn, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  memoryTitle: { ...typography.h4, color: colors.ink }, memoryDate: { ...typography.label, color: colors.muted, marginTop: 2 },
  sectionTitle: { ...typography.h3, color: colors.ink, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 10 },
  summaryCard: { marginHorizontal: 20, marginBottom: 14, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, padding: 16 },
  summaryLabel: { ...typography.label, color: colors.muted, textTransform: 'uppercase' },
  summaryText: { ...typography.bodySmall, color: colors.descText, lineHeight: 21, marginTop: 6 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  photoTile: { width: '48%', borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  photoTileImage: { width: '100%', height: 150, resizeMode: 'cover', backgroundColor: colors.pill },
  photoTileLabel: { ...typography.caption, color: colors.ink, fontWeight: '700', padding: 10 },
  emptyText: { ...typography.caption, color: colors.muted, padding: 16, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line },
  locationCard: { marginHorizontal: 20, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, padding: 16 },
  infoLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  infoLabel: { ...typography.caption, color: colors.muted },
  infoValue: { ...typography.bodySmall, color: colors.ink, fontWeight: '700', maxWidth: '58%', textAlign: 'right' },
  actionBtn: { position: 'absolute', left: 20, right: 20, height: 54, borderRadius: 27, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.5, shadowRadius: 30, elevation: 20 },
  actionBtnText: { color: '#fff', ...typography.button },
});
