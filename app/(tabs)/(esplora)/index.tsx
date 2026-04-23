import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Animated,
  ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MapPin, Plus } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { StarRating } from '@/components/StarRating';
import { CategoryBadge } from '@/components/CategoryBadge';
import { SkeletonListItem } from '@/components/SkeletonCard';
import { COLORS, CATEGORIES, CATEGORY_LABELS } from '@/constants/Colors';
import { fetchPlaces } from '@/utils/api';
import type { Place } from '@/types';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function EsploraScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlaces = useCallback(async (category: string, search: string) => {
    console.log('[Esplora] loadPlaces', { category, search });
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlaces(category, search || undefined);
      setPlaces(data.places ?? []);
    } catch (e: any) {
      console.error('[Esplora] loadPlaces error', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPlaces(selectedCategory, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery, loadPlaces]);

  const handleCategoryPress = (cat: string) => {
    console.log('[Esplora] categoria selezionata:', cat);
    setSelectedCategory(cat);
  };

  const handleCardPress = (place: Place) => {
    console.log('[Esplora] card premuta:', place.id, place.name);
    router.push(`/place/${place.id}`);
  };

  const handleAddPress = () => {
    console.log('[Esplora] aggiungi luogo premuto');
    router.push('/add-place');
  };

  const ratingDisplay = (place: Place) => {
    const r = Number(place.avg_rating);
    return isNaN(r) ? '—' : r.toFixed(1);
  };

  const renderItem = ({ item, index }: { item: Place; index: number }) => {
    const rating = ratingDisplay(item);
    const reviewCount = item.review_count ?? 0;
    const addressSnippet = item.address ? item.address.split(',').slice(0, 2).join(',') : '';

    return (
      <AnimatedListItem index={index}>
        <AnimatedPressable onPress={() => handleCardPress(item)} scaleValue={0.98}>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              padding: 12,
              marginBottom: 10,
              gap: 12,
              boxShadow: '0 1px 4px rgba(26,23,20,0.06), 0 4px 12px rgba(26,23,20,0.04)',
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Image
              source={resolveImageSource(item.image_url)}
              style={{ width: 80, height: 80, borderRadius: 10 }}
              contentFit="cover"
            />
            <View style={{ flex: 1, gap: 4, justifyContent: 'center' }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 15,
                  fontFamily: 'Nunito_700Bold',
                  color: COLORS.text,
                }}
              >
                {item.name}
              </Text>
              <CategoryBadge category={item.category} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <StarRating rating={Number(item.avg_rating)} size={12} />
                <Text
                  style={{
                    fontSize: 12,
                    color: COLORS.textSecondary,
                    fontFamily: 'Nunito_600SemiBold',
                  }}
                >
                  {rating}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
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
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  fontFamily: 'Nunito_400Regular',
                }}
              >
                {addressSnippet}
              </Text>
            </View>
          </View>
        </AnimatedPressable>
      </AnimatedListItem>
    );
  };

  const ListHeader = (
    <View>
      {/* CTA banner */}
      <AnimatedPressable onPress={handleAddPress} scaleValue={0.97} style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 4 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: COLORS.primary,
            borderRadius: 16,
            padding: 16,
            gap: 14,
            boxShadow: '0 4px 16px rgba(232, 115, 74, 0.35)',
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: 'rgba(255,255,255,0.20)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={22} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#FFFFFF' }}>
              Conosci un posto speciale?
            </Text>
            <Text style={{ fontSize: 13, fontFamily: 'Nunito_400Regular', color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              Aggiungilo alla mappa per le altre famiglie
            </Text>
          </View>
        </View>
      </AnimatedPressable>
      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
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
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  gap: 6,
                  backgroundColor: isSelected ? catColor : COLORS.surface,
                  borderWidth: 1,
                  borderColor: isSelected ? catColor : COLORS.border,
                  boxShadow: isSelected ? `0 2px 8px ${catColor}40` : '0 1px 3px rgba(26,23,20,0.06)',
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
            </AnimatedPressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const EmptyState = (
    <View
      style={{
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 32,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          backgroundColor: COLORS.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MapPin size={32} color={COLORS.primary} strokeWidth={1.5} />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontFamily: 'Nunito_700Bold',
          color: COLORS.text,
          textAlign: 'center',
        }}
      >
        Nessun luogo trovato
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontFamily: 'Nunito_400Regular',
          color: COLORS.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
          maxWidth: 280,
        }}
      >
        Cozy Corner ti aiuta a trovare ristoranti, parchi, musei e tanto altro, scelti e recensiti da genitori come te.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        {ListHeader}
        <View style={{ paddingHorizontal: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonListItem key={i} />
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <MapPin size={40} color={COLORS.danger} strokeWidth={1.5} />
        <Text
          style={{
            fontSize: 17,
            fontFamily: 'Nunito_700Bold',
            color: COLORS.text,
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Impossibile caricare i luoghi
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'Nunito_400Regular',
            color: COLORS.textSecondary,
            marginTop: 8,
            textAlign: 'center',
          }}
        >
          {error}
        </Text>
        <AnimatedPressable onPress={() => loadPlaces(selectedCategory, searchQuery)}>
          <View
            style={{
              marginTop: 20,
              backgroundColor: COLORS.primary,
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: '#FFF', fontFamily: 'Nunito_700Bold', fontSize: 15 }}>
              Riprova
            </Text>
          </View>
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <FlatList
      data={places}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={EmptyState}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 120,
      }}
      showsVerticalScrollIndicator={false}
    />
  );
}
