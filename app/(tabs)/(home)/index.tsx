import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Alert,
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Plus, MapPin, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';
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

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
  const [nearMe, setNearMe] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

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

  const handleNearMeToggle = async () => {
    if (nearMe) {
      console.log('[Mappa] "Vicino a me" disattivato');
      setNearMe(false);
      setUserLocation(null);
      return;
    }
    console.log('[Mappa] "Vicino a me" attivato — richiesta posizione');
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
      console.log('[Mappa] posizione ottenuta:', loc.coords.latitude, loc.coords.longitude);
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setNearMe(true);
    } catch (e) {
      console.error('[Mappa] errore posizione', e);
      Alert.alert('Errore', 'Impossibile ottenere la posizione.');
    } finally {
      setLocationLoading(false);
    }
  };

  const displayedPlaces = nearMe && userLocation
    ? places.filter((p) =>
        haversineKm(
          userLocation.latitude,
          userLocation.longitude,
          Number(p.latitude),
          Number(p.longitude)
        ) <= 30
      )
    : places;

  const baseMarkers: MapMarker[] = displayedPlaces.map((p) => ({
    id: p.id,
    latitude: Number(p.latitude),
    longitude: Number(p.longitude),
    title: p.name,
    description: p.address,
  }));

  const userMarker: MapMarker | null =
    nearMe && userLocation
      ? {
          id: 'user',
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          title: 'Sei qui 📍',
          description: 'La tua posizione',
        }
      : null;

  const markers: MapMarker[] = userMarker ? [userMarker, ...baseMarkers] : baseMarkers;

  const mapRegion =
    nearMe && userLocation
      ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.3,
          longitudeDelta: 0.3,
        }
      : ITALY_REGION;

  const ratingDisplay = (place: Place) => {
    const r = Number(place.avg_rating);
    return isNaN(r) ? '—' : r.toFixed(1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Full screen map */}
      <Map
        markers={markers}
        initialRegion={mapRegion}
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
                <BlurView intensity={60} style={{ borderRadius: 20, overflow: 'hidden' }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      gap: 6,
                      backgroundColor: isSelected ? catColor : 'rgba(255,255,255,0.75)',
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

          {/* "Vicino a me" chip */}
          <AnimatedPressable onPress={handleNearMeToggle} scaleValue={0.95}>
            <BlurView intensity={60} style={{ borderRadius: 20, overflow: 'hidden' }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  gap: 6,
                  backgroundColor: nearMe ? '#4A90D9' : 'rgba(255,255,255,0.75)',
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
            </BlurView>
          </AnimatedPressable>
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
        ) : displayedPlaces.length === 0 ? (
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
                textAlign: 'center',
              }}
            >
              {nearMe
                ? 'Nessun luogo trovato entro 30 km da te'
                : 'Nessun luogo trovato in questa categoria'}
            </Text>
          </View>
        ) : (
          <FlatList
            horizontal
            data={displayedPlaces}
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

      {/* FAB */}
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
