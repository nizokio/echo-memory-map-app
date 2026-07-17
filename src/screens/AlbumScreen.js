import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { useEchoes } from '../features/echoes/application/EchoDataProvider';
import { buildMemoryAlbums, formatMemoryDate, getMemoryTitle } from '../domain/echo/memoryAlbums';

export default function AlbumScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { echoes } = useEchoes();
  const albumKey = route.params?.albumKey || 'recent';
  const albums = buildMemoryAlbums(echoes);
  const album = albums.find((item) => item.key === albumKey) || albums[0];

  return (
    <View style={styles.container}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 110 },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
            <Feather name="chevron-left" size={18} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Album</Text>
            <Text style={styles.title}>{album.title}</Text>
            <Text style={styles.subtitle}>{album.items.length} memories</Text>
          </View>
          <View style={styles.albumIcon}>
            <Ionicons name={album.icon} size={22} color="#fff" />
          </View>
        </View>

        {album.items.length ? (
          <View style={styles.grid}>
            {album.items.map((echo) => (
              <Pressable
                key={echo.id}
                onPress={() => navigation.navigate('Detail', { echo })}
                style={styles.memoryCard}
                accessibilityRole="button"
              >
                {echo.photos[0]?.uri ? (
                  <Image source={{ uri: echo.photos[0].uri }} style={styles.memoryImage} />
                ) : (
                  <View style={styles.memoryImageFallback} />
                )}
                <View style={styles.memoryBody}>
                  <Text style={styles.memoryTitle} numberOfLines={2}>{getMemoryTitle(echo)}</Text>
                  <Text style={styles.memoryMeta} numberOfLines={1}>{formatMemoryDate(echo.capturedAt)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="albums-outline" size={28} color={colors.ink} />
            <Text style={styles.emptyTitle}>No memories here yet</Text>
            <Text style={styles.emptyText}>Capture more moments and this album will fill itself.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, paddingHorizontal: 14 },
  eyebrow: { ...typography.label, color: colors.muted, textTransform: 'uppercase' },
  title: { ...typography.h1, color: colors.ink, fontSize: 32, marginTop: 2 },
  subtitle: { ...typography.caption, color: colors.muted, marginTop: 2 },
  albumIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  memoryCard: { width: '48%', borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  memoryImage: { width: '100%', height: 132, resizeMode: 'cover' },
  memoryImageFallback: { width: '100%', height: 132, backgroundColor: colors.pill },
  memoryBody: { padding: 12 },
  memoryTitle: { ...typography.bodySmall, color: colors.ink, fontWeight: '800', lineHeight: 18 },
  memoryMeta: { ...typography.caption, color: colors.muted, marginTop: 7 },
  emptyState: { minHeight: 260, borderRadius: 28, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { ...typography.h3, color: colors.ink, marginTop: 12 },
  emptyText: { ...typography.caption, color: colors.muted, textAlign: 'center', lineHeight: 18, marginTop: 6 },
});
