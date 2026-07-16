import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, useReducedMotion } from 'react-native-reanimated';
import { colors, typography } from '../theme';
import FavoriteButton from '../components/FavoriteButton';
import SegmentedTabs from '../components/SegmentedTabs';
import DayAccordion from '../components/DayAccordion';
import Toast from '../components/Toast';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const TAB_LABELS = ['Memory', 'Photos', 'Location'];
const formatDate = (value) => new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value));

export default function MemoryTimelineScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const echo = route.params?.echo;
  const [activeTab, setActiveTab] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
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
  const handleAction = useCallback(() => setToastVisible(true), []);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable style={styles.circleBtn} onPress={() => navigation.goBack()} accessibilityLabel="Go back" accessibilityRole="button"><Feather name="chevron-left" size={16} color="#000" /></Pressable>
          <View style={styles.titleBlock}><Text style={styles.memoryTitle}>{echo?.aiMetadata?.title || echo?.location.name}</Text><Text style={styles.memoryDate}>{echo ? formatDate(echo.capturedAt) : ''}</Text></View>
          <FavoriteButton size={38} iconSize={16} />
        </View>
        <SegmentedTabs tabs={TAB_LABELS} activeIndex={activeTab} onTabPress={setActiveTab} />
        <Text style={styles.sectionTitle}>Memory timeline</Text>
        {moments.map((moment, index) => <DayAccordion key={moment.id} moment={moment} defaultOpen={index === 0} />)}
      </ScrollView>
      <AnimatedPressable style={[styles.actionBtn, actionStyle, { bottom: insets.bottom + 22 }]} onPress={handleAction} onPressIn={() => !reduceMotion && (actionScale.value = withTiming(0.97, { duration: 150 }))} onPressOut={() => (actionScale.value = withTiming(1, { duration: 150 }))} accessibilityLabel="Mark for revisit" accessibilityRole="button"><Text style={styles.actionBtnText}>Mark for revisit</Text></AnimatedPressable>
      <Toast message="Saved for a future visit" visible={toastVisible} onHide={() => setToastVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  circleBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.circleBtn, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  memoryTitle: { ...typography.h4, color: colors.ink }, memoryDate: { ...typography.label, color: colors.muted, marginTop: 2 },
  sectionTitle: { ...typography.h3, color: colors.ink, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 10 },
  actionBtn: { position: 'absolute', left: 20, right: 20, height: 54, borderRadius: 27, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.5, shadowRadius: 30, elevation: 20 },
  actionBtnText: { color: '#fff', ...typography.button },
});
