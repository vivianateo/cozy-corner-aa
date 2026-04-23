import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TextInput,
  Animated,
  Alert,
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MapPin, Plus, Search, Navigation } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { StarRating } from '@/components/StarRating';
import { CategoryBadge } from '@/components/CategoryBadge';
import { AmenityBadge } from '@/components/AmenityBadge';
import { SkeletonListItem } from '@/components/SkeletonCard';
import { COLORS, CATEGORIES, CATEGORY_LABELS, AMENITIES, AMENITY_LABELS, AMENITY_ICONS } from '@/constants/Colors';
import { fetchPlaces } from '@/utils/api';
import type { Place } from '@/types';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
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
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nearMe, setNearMe] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

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

  const toggleAmenity = (a: string) => {
    console.log('[Esplora] amenità toggled:', a);
    setSelectedAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

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

  const handleNearMeToggle = async () => {
    if (nearMe) {
      console.log('[Esplora] "Vicino a me" disattivato');
      setNearMe(false);
      setUserLocation(null);
      return;
    }
    console.log('[Esplora] "Vicino a me" attivato — richiesta posizione');
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Posizione non disponibile',
          'Abilita la posizione nelle impostazioni per trovare luoghi vicini a te.'
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      console.log('[Esplora] posizione ottenuta:', loc.coords.latitude, loc.coords.longitude);
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setNearMe(true);
    } catch (e) {
      console.error('[Esplora] errore posizione', e);
      Alert.alert('Errore', 'Impossibile ottenere la posizione.');
    } finally {
      setLocationLoading(false);
    }
  };

  const displayedPlaces = (nearMe && userLocation
    ? places.filter((p) =>
        haversineKm(
          userLocation.latitude,
          userLocation.longitude,
          Number(p.latitude),
          Number(p.longitude)
        ) <= 30
      )
    : places
  ).filter((p) =>
    selectedAmenities.length === 0 ||
    selectedAmenities.every((a) => (p.amenities ?? []).includes(a))
  );

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
              <Text numberOfLines={1} style={{ fontSize: 15, fontFamily: 'Nunito_700Bold', color: COLORS.text }}>
                {item.name}
              </Text>
              <CategoryBadge category={item.category} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <StarRating rating={Number(item.avg_rating)} size={12} />
                <Text style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                  {rating}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                  ({reviewCount})
                </Text>
              </View>
              <Text numberOfLines={1} style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                {addressSnippet}
              </Text>
              {item.amenities && item.amenities.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                  {item.amenities.slice(0, 3).map((a) => (
                    <AmenityBadge key={a} amenity={a} size="sm" />
                  ))}
                </View>
              )}
            </View>
          </View>
        </AnimatedPressable>
      </AnimatedListItem>
    );
  };

  const renderListHeader = () => (
    <View>
      {/* Inline header: title + search */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 12, gap: 12 }}>
        <Text style={{ fontSize: 30, fontFamily: 'Nunito_800ExtraBold', color: COLORS.text, letterSpacing: -0.5 }}>
          Esplora
        </Text>
        {/* Search bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: COLORS.surface,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 11,
            gap: 10,
            borderWidth: 1,
            borderColor: COLORS.border,
            boxShadow: '0 1px 4px rgba(26,23,20,0.06)',
          }}
        >
          <Search size={18} color={COLORS.textTertiary} strokeWidth={2} />
          <TextInput
            value={searchQuery}
            onChangeText={(text) => {
              console.log('[Esplora] ricerca:', text);
              setSearchQuery(text);
            }}
            placeholder="Cerca un luogo..."
            placeholderTextColor={COLORS.textTertiary}
            style={{
              flex: 1,
              fontSize: 15,
              fontFamily: 'Nunito_400Regular',
              color: COLORS.text,
              padding: 0,
            }}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <AnimatedPressable
              onPress={() => {
                console.log('[Esplora] ricerca cancellata');
                setSearchQuery('');
              }}
              scaleValue={0.9}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: COLORS.surfaceSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 20, textAlign: 'center' }}>
                  ✕
                </Text>
              </View>
            </AnimatedPressable>
          )}
        </View>
      </View>

      {/* CTA banner */}
      <AnimatedPressable
        onPress={handleAddPress}
        scaleValue={0.97}
        style={{ marginHorizontal: 16, marginBottom: 16 }}
      >
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
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Nunito_400Regular',
                color: 'rgba(255,255,255,0.85)',
                marginTop: 2,
              }}
            >
              Aggiungilo alla mappa per le altre famiglie
            </Text>
          </View>
        </View>
      </AnimatedPressable>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: COLORS.divider, marginHorizontal: 16 }} />

      {/* Category chips + "Vicino a me" */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 8 }}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          const catColor = cat === 'tutti' ? COLORS.primary : (COLORS.categoryColors[cat] ?? COLORS.primary);
          return (
            <AnimatedPressable key={cat} onPress={() => handleCategoryPress(cat)} scaleValue={0.95}>
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

        {/* "Vicino a me" chip */}
        <AnimatedPressable onPress={handleNearMeToggle} scaleValue={0.95}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              gap: 6,
              backgroundColor: nearMe ? '#4A90D9' : COLORS.surface,
              borderWidth: 1,
              borderColor: nearMe ? '#4A90D9' : COLORS.border,
              boxShadow: nearMe ? '0 2px 8px rgba(74,144,217,0.4)' : '0 1px 3px rgba(26,23,20,0.06)',
            }}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color={nearMe ? '#FFF' : '#4A90D9'} />
            ) : (
              <Navigation size={13} color={nearMe ? '#FFF' : '#4A90D9'} strokeWidth={2} />
            )}
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                fontFamily: 'Nunito_600SemiBold',
                color: nearMe ? '#FFFFFF' : COLORS.text,
              }}
            >
              Vicino a me
            </Text>
          </View>
        </AnimatedPressable>
      </ScrollView>

      {/* Amenity filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}
      >
        {AMENITIES.map((a) => {
          const isActive = selectedAmenities.includes(a);
          return (
            <AnimatedPressable key={a} onPress={() => toggleAmenity(a)} scaleValue={0.95}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 16,
                  gap: 5,
                  backgroundColor: isActive ? 'rgba(76,175,130,0.15)' : COLORS.surface,
                  borderWidth: 1,
                  borderColor: isActive ? '#4CAF82' : COLORS.border,
                }}
              >
                <Text style={{ fontSize: 13 }}>{AMENITY_ICONS[a]}</Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Nunito_600SemiBold',
                    color: isActive ? '#3A8F65' : COLORS.text,
                  }}
                >
                  {AMENITY_LABELS[a]}
                </Text>
              </View>
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      {/* Divider before list */}
      <View style={{ height: 1, backgroundColor: COLORS.divider, marginHorizontal: 16, marginBottom: 12 }} />
    </View>
  );

  const emptyMessage = nearMe
    ? 'Nessun luogo trovato entro 30 km da te'
    : 'Nessun luogo trovato';

  const EmptyState = (
    <View style={{ alignItems: 'center', paddingTop: 40, paddingHorizontal: 32, gap: 12 }}>
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
      <Text style={{ fontSize: 18, fontFamily: 'Nunito_700Bold', color: COLORS.text, textAlign: 'center' }}>
        {emptyMessage}
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
        {renderListHeader()}
        <View style={{ paddingHorizontal: 16 }}>
          {[1, 2, 3, 4].map((i) => <SkeletonListItem key={i} />)}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        {renderListHeader()}
        <View style={{ alignItems: 'center', padding: 32 }}>
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
              <Text style={{ color: '#FFF', fontFamily: 'Nunito_700Bold', fontSize: 15 }}>Riprova</Text>
            </View>
          </AnimatedPressable>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={displayedPlaces}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={renderListHeader}
      ListEmptyComponent={EmptyState}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      style={{ backgroundColor: COLORS.background }}
    />
  );
}
