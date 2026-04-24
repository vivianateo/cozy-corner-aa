import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Alert,
  ActivityIndicator,
  ImageSourcePropType,
  Modal,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Plus, MapPin, Navigation, Compass, X } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Map } from '@/components/Map';
import type { MapMarker } from '@/components/Map';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { StarRating } from '@/components/StarRating';
import { CategoryBadge } from '@/components/CategoryBadge';
import { AmenityBadge } from '@/components/AmenityBadge';
import { SkeletonPlaceCard } from '@/components/SkeletonCard';
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

const ITALY_REGION = {
  latitude: 41.9,
  longitude: 12.5,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200';

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
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showNearbySheet, setShowNearbySheet] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);

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

  const toggleAmenity = (a: string) => {
    console.log('[Mappa] amenità toggled:', a);
    setSelectedAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

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

  const handleCompassPress = async () => {
    console.log('[Mappa] FAB bussola premuto — apri sheet vicino a me');
    if (userLocation) {
      setShowNearbySheet(true);
      return;
    }
    setNearbyLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Posizione non disponibile', 'Abilita la posizione nelle impostazioni per trovare luoghi vicini a te.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      console.log('[Mappa] posizione ottenuta per sheet vicino a me:', loc.coords.latitude, loc.coords.longitude);
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setShowNearbySheet(true);
    } catch {
      Alert.alert('Errore', 'Impossibile ottenere la posizione.');
    } finally {
      setNearbyLoading(false);
    }
  };

  const handleNearbyCardPress = (place: Place) => {
    console.log('[Mappa] card vicino a me premuta:', place.id, place.name);
    setShowNearbySheet(false);
    router.push(`/place/${place.id}`);
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

  const nearbyPlaces = userLocation
    ? places
        .map((p) => ({
          place: p,
          distKm: haversineKm(
            userLocation.latitude,
            userLocation.longitude,
            Number(p.latitude),
            Number(p.longitude)
          ),
        }))
        .filter(({ distKm }) => distKm <= 50)
        .sort((a, b) => a.distKm - b.distKm)
        .slice(0, 10)
    : [];

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

      {/* Amenity filter chips */}
      <View style={{ position: 'absolute', top: insets.top + 52, left: 0, right: 0, zIndex: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {AMENITIES.map((a) => {
            const isActive = selectedAmenities.includes(a);
            return (
              <AnimatedPressable key={a} onPress={() => toggleAmenity(a)} scaleValue={0.95}>
                <BlurView intensity={60} style={{ borderRadius: 16, overflow: 'hidden' }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      gap: 5,
                      backgroundColor: isActive ? 'rgba(76,175,130,0.85)' : 'rgba(255,255,255,0.75)',
                    }}
                  >
                    <Text style={{ fontSize: 12 }}>{AMENITY_ICONS[a]}</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Nunito_600SemiBold',
                        color: isActive ? '#FFF' : COLORS.text,
                      }}
                    >
                      {AMENITY_LABELS[a]}
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
                      resizeMode="cover"
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
                      {item.amenities && item.amenities.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                          {item.amenities.slice(0, 2).map((a) => (
                            <AmenityBadge key={a} amenity={a} size="sm" />
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </AnimatedPressable>
              );
            }}
          />
        )}
      </View>

      {/* FAB bussola — raccomandazioni vicino a me */}
      <AnimatedPressable
        onPress={handleCompassPress}
        scaleValue={0.94}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 150,
          right: 16,
          zIndex: 20,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#4A90D9',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(74,144,217,0.45)',
          }}
        >
          {nearbyLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Compass size={22} color="#FFF" strokeWidth={2} />
          )}
        </View>
      </AnimatedPressable>

      {/* FAB aggiungi luogo */}
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

      {/* Bottom sheet — Vicino a te */}
      <Modal
        visible={showNearbySheet}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          console.log('[Mappa] sheet vicino a me chiuso');
          setShowNearbySheet(false);
        }}
      >
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 24,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
            }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: COLORS.text }}>
                Vicino a te
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Nunito_400Regular',
                  color: COLORS.textSecondary,
                  lineHeight: 18,
                }}
              >
                I luoghi più adatti alle famiglie nelle tue vicinanze
              </Text>
            </View>
            <AnimatedPressable
              onPress={() => {
                console.log('[Mappa] sheet vicino a me chiuso tramite X');
                setShowNearbySheet(false);
              }}
              scaleValue={0.9}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: COLORS.surfaceSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 12,
                }}
              >
                <X size={16} color={COLORS.textSecondary} strokeWidth={2.5} />
              </View>
            </AnimatedPressable>
          </View>

          {/* List */}
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {nearbyPlaces.length === 0 ? (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 60,
                  gap: 12,
                }}
              >
                <MapPin size={36} color={COLORS.textTertiary} strokeWidth={1.5} />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Nunito_600SemiBold',
                    color: COLORS.textSecondary,
                    textAlign: 'center',
                  }}
                >
                  Nessun luogo trovato nelle vicinanze
                </Text>
              </View>
            ) : (
              nearbyPlaces.map(({ place, distKm }) => {
                const distText = distKm < 1
                  ? `${Math.round(distKm * 1000)} m`
                  : `${distKm.toFixed(1)} km`;
                const addressSnippet = place.address ? place.address.split(',')[0] : '';
                const placeAmenities = (place.amenities ?? []).slice(0, 2);
                const imageUri = place.image_url || FALLBACK_IMAGE;
                return (
                  <AnimatedPressable
                    key={place.id}
                    onPress={() => handleNearbyCardPress(place)}
                    scaleValue={0.97}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        backgroundColor: COLORS.surface,
                        borderRadius: 14,
                        padding: 12,
                        gap: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        boxShadow: '0 2px 10px rgba(26,23,20,0.08)',
                      }}
                    >
                      <Image
                        source={{ uri: imageUri }}
                        style={{ width: 72, height: 72, borderRadius: 10 }}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              flex: 1,
                              fontSize: 15,
                              fontFamily: 'Nunito_700Bold',
                              color: COLORS.text,
                            }}
                          >
                            {place.name}
                          </Text>
                          <View
                            style={{
                              backgroundColor: 'rgba(74,144,217,0.12)',
                              borderRadius: 10,
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                            }}
                          >
                            <Text
                              style={{
                                color: '#4A90D9',
                                fontFamily: 'Nunito_700Bold',
                                fontSize: 12,
                              }}
                            >
                              {distText}
                            </Text>
                          </View>
                        </View>
                        <CategoryBadge category={place.category} />
                        {placeAmenities.length > 0 && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                            {placeAmenities.map((a) => (
                              <AmenityBadge key={a} amenity={a} size="sm" />
                            ))}
                          </View>
                        )}
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: 12,
                            fontFamily: 'Nunito_400Regular',
                            color: COLORS.textSecondary,
                          }}
                        >
                          {addressSnippet}
                        </Text>
                      </View>
                    </View>
                  </AnimatedPressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
