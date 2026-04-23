import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  Animated,
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Plus, MapPin } from 'lucide-react-native';
import { Map } from '@/components/Map';
import type { MapMarker } from '@/components/Map';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { StarRating } from '@/components/StarRating';
import { CategoryBadge } from '@/components/CategoryBadge';
import { SkeletonPlaceCard } from '@/components/SkeletonCard';
import { COLORS, CATEGORIES, CATEGORY_LABELS } from '@/constants/Colors';
import { fetchPlaces } from '@/utils/api';
import type { Place } from '@/types';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

const ITALY_REGION = {
  latitude: 41.9,
  longitude: 12.5,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

export default function MappaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('tutti');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlaces = useCallback(async (category: string) => {
    console.log('[Mappa] loadPlaces', { category });
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlaces(category);
      setPlaces(data.places ?? []);
    } catch (e: any) {
      console.error('[Mappa] loadPlaces error', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaces(selectedCategory);
  }, [selectedCategory, loadPlaces]);

  const handleCategoryPress = (cat: string) => {
    console.log('[Mappa] categoria selezionata:', cat);
    setSelectedCategory(cat);
  };

  const handleCardPress = (place: Place) => {
    console.log('[Mappa] card premuta:', place.id, place.name);
    router.push(`/place/${place.id}`);
  };

  const handleAddPress = () => {
    console.log('[Mappa] FAB aggiungi luogo premuto');
    router.push('/add-place');
  };

  const markers: MapMarker[] = places.map((p) => ({
    id: p.id,
    latitude: Number(p.latitude),
    longitude: Number(p.longitude),
    title: p.name,
    description: p.address,
  }));

  const ratingDisplay = (place: Place) => {
    const r = Number(place.avg_rating);
    return isNaN(r) ? '—' : r.toFixed(1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Full screen map */}
      <Map
        markers={markers}
        initialRegion={ITALY_REGION}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 0 }}
      />

      {/* Category chips overlay */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const catColor = cat === 'tutti' ? COLORS.primary : (COLORS.categoryColors[cat] ?? COLORS.primary);
            return (
              <AnimatedPressable
                key={cat}
                onPress={() => handleCategoryPress(cat)}
                scaleValue={0.95}
              >
                <BlurView
                  intensity={60}
                  style={{
                    borderRadius: 20,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      gap: 6,
                      backgroundColor: isSelected
                        ? catColor
                        : 'rgba(255,255,255,0.75)',
                    }}
                  >
                    {cat !== 'tutti' && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : catColor,
                        }}
                      />
                    )}
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        fontFamily: 'Nunito_600SemiBold',
                        color: isSelected ? '#FFFFFF' : COLORS.text,
                      }}
                    >
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </View>
                </BlurView>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Bottom cards panel */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 80,
          zIndex: 10,
        }}
      >
        {loading ? (
          <FlatList
            horizontal
            data={[1, 2, 3]}
            keyExtractor={(item) => String(item)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            renderItem={() => <SkeletonPlaceCard />}
          />
        ) : error ? (
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
              boxShadow: '0 2px 12px rgba(26,23,20,0.12)',
            }}
          >
            <Text style={{ color: COLORS.danger, fontFamily: 'Nunito_600SemiBold', fontSize: 14 }}>
              {error}
            </Text>
            <AnimatedPressable onPress={() => loadPlaces(selectedCategory)}>
              <Text style={{ color: COLORS.primary, fontFamily: 'Nunito_700Bold', marginTop: 8 }}>
                Riprova
              </Text>
            </AnimatedPressable>
          </View>
        ) : places.length === 0 ? (
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
              boxShadow: '0 2px 12px rgba(26,23,20,0.12)',
            }}
          >
            <MapPin size={28} color={COLORS.textTertiary} />
            <Text
              style={{
                color: COLORS.textSecondary,
                fontFamily: 'Nunito_600SemiBold',
                fontSize: 14,
                marginTop: 8,
              }}
            >
              Nessun luogo trovato in questa categoria
            </Text>
          </View>
        ) : (
          <FlatList
            horizontal
            data={places}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            renderItem={({ item }) => {
              const rating = ratingDisplay(item);
              const reviewCount = item.review_count ?? 0;
              const addressSnippet = item.address ? item.address.split(',')[0] : '';
              return (
                <AnimatedPressable onPress={() => handleCardPress(item)} scaleValue={0.97}>
                  <View
                    style={{
                      width: 200,
                      height: 190,
                      backgroundColor: COLORS.surface,
                      borderRadius: 16,
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(26,23,20,0.14)',
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    <Image
                      source={resolveImageSource(item.image_url)}
                      style={{ width: '100%', height: 100 }}
                      contentFit="cover"
                    />
                    <View style={{ padding: 10, gap: 4 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 14,
                          fontFamily: 'Nunito_700Bold',
                          color: COLORS.text,
                        }}
                      >
                        {item.name}
                      </Text>
                      <CategoryBadge category={item.category} />
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <StarRating rating={Number(item.avg_rating)} size={12} />
                        <Text
                          style={{
                            fontSize: 11,
                            color: COLORS.textSecondary,
                            fontFamily: 'Nunito_400Regular',
                          }}
                        >
                          {rating}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: COLORS.textTertiary,
                            fontFamily: 'Nunito_400Regular',
                          }}
                        >
                          ({reviewCount})
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 11,
                          color: COLORS.textSecondary,
                          fontFamily: 'Nunito_400Regular',
                        }}
                      >
                        {addressSnippet}
                      </Text>
                    </View>
                  </View>
                </AnimatedPressable>
              );
            }}
          />
        )}
      </View>

      {/* FAB + button */}
      <AnimatedPressable
        onPress={handleAddPress}
        scaleValue={0.94}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 90,
          right: 16,
          zIndex: 20,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: COLORS.primary,
            borderRadius: 28,
            paddingVertical: 14,
            paddingHorizontal: 20,
            boxShadow: '0 4px 20px rgba(232, 115, 74, 0.50)',
          }}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={{ fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#FFFFFF' }}>
            Aggiungi luogo
          </Text>
        </View>
      </AnimatedPressable>
    </View>
  );
}
