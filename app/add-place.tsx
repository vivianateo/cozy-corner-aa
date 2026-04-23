import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle, MapPin, X } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Map } from '@/components/Map';
import type { MapMarker } from '@/components/Map';
import { COLORS, CATEGORIES, CATEGORY_LABELS, AMENITIES, AMENITY_LABELS, AMENITY_ICONS } from '@/constants/Colors';
import { createPlace } from '@/utils/api';

const FORM_CATEGORIES = CATEGORIES.filter((c) => c !== 'tutti') as string[];

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface FormErrors {
  name?: string;
  category?: string;
  address?: string;
}

export default function AddPlaceScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const successOpacity = useRef(new Animated.Value(0)).current;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced Nominatim address search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (address.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      console.log('[AddPlace] ricerca indirizzo Nominatim:', address);
      setLoadingSuggestions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=5&countrycodes=it&addressdetails=1`,
          { headers: { 'User-Agent': 'CozyCornerApp/1.0' } }
        );
        if (!res.ok) {
          console.warn('[AddPlace] Nominatim error', res.status);
          setSuggestions([]);
          return;
        }
        const data: NominatimResult[] = await res.json();
        console.log('[AddPlace] suggerimenti ricevuti:', data.length);
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (e) {
        console.error('[AddPlace] Nominatim fetch error', e);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [address]);

  const handleSelectSuggestion = (item: NominatimResult) => {
    console.log('[AddPlace] suggerimento selezionato:', item.display_name, item.lat, item.lon);
    setAddress(item.display_name);
    setLatitude(Number(item.lat));
    setLongitude(Number(item.lon));
    setSuggestions([]);
    setShowSuggestions(false);
    if (errors.address) setErrors((p) => ({ ...p, address: undefined }));
  };

  const toggleAmenity = (a: string) => {
    console.log('[AddPlace] amenità toggled:', a);
    setSelectedAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const handleCategorySelect = (cat: string) => {
    console.log('[AddPlace] categoria selezionata:', cat);
    setCategory(cat);
    if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
  };

  const mapMarkers: MapMarker[] = latitude && longitude
    ? [{ id: 'preview', latitude, longitude, title: name || 'Posizione selezionata' }]
    : [];

  const mapRegion = latitude && longitude
    ? { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : { latitude: 41.9, longitude: 12.5, latitudeDelta: 8, longitudeDelta: 8 };

  const hasCoords = Boolean(latitude && longitude);
  const mapLabel = hasCoords ? 'Posizione identificata ✓' : 'Anteprima mappa';
  const mapBorderColor = hasCoords ? COLORS.accent : COLORS.border;
  const coordsText = hasCoords ? `📍 ${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : null;
  const mapHintText = hasCoords ? null : 'Cerca un indirizzo sopra per posizionare il pin sulla mappa';

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = 'Il nome è obbligatorio';
    if (!category) newErrors.category = 'Seleziona una categoria';
    if (!address.trim()) newErrors.address = "L'indirizzo è obbligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('[AddPlace] submit premuto', { name, category, address, latitude, longitude });
    if (!validate()) {
      console.log('[AddPlace] validazione fallita', errors);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createPlace({
        name: name.trim(),
        category,
        description: description.trim(),
        address: address.trim(),
        latitude: latitude || 0,
        longitude: longitude || 0,
        amenities: selectedAmenities,
      });
      setSuccess(true);
      Animated.timing(successOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      setTimeout(() => {
        console.log('[AddPlace] chiusura sheet dopo successo');
        router.back();
      }, 1800);
    } catch (e: any) {
      console.error('[AddPlace] submit error', e.message);
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          opacity: successOpacity,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#4CAF8220',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircle size={40} color="#4CAF82" strokeWidth={1.5} />
        </View>
        <Text style={{ fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: COLORS.text }}>
          Luogo aggiunto!
        </Text>
        <Text
          style={{
            fontSize: 15,
            fontFamily: 'Nunito_400Regular',
            color: COLORS.textSecondary,
            textAlign: 'center',
            maxWidth: 260,
          }}
        >
          Il tuo luogo è stato aggiunto con successo alla mappa.
        </Text>
      </Animated.View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: COLORS.textSecondary }}>
            Nome del luogo *
          </Text>
          <TextInput
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
            }}
            placeholder="es. Ristorante La Famiglia"
            placeholderTextColor={COLORS.textTertiary}
            autoFocus
            style={{
              backgroundColor: COLORS.surfaceSecondary,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              fontFamily: 'Nunito_400Regular',
              color: COLORS.text,
              borderWidth: 1,
              borderColor: errors.name ? COLORS.danger : COLORS.border,
            }}
          />
          {errors.name ? (
            <Text style={{ fontSize: 12, fontFamily: 'Nunito_400Regular', color: COLORS.danger }}>
              {errors.name}
            </Text>
          ) : null}
        </View>

        {/* Category */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: COLORS.textSecondary }}>
            Categoria *
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {FORM_CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              const catColor = COLORS.categoryColors[cat] ?? COLORS.primary;
              return (
                <AnimatedPressable key={cat} onPress={() => handleCategorySelect(cat)} scaleValue={0.95}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: 10,
                      gap: 6,
                      backgroundColor: isSelected ? catColor : COLORS.surface,
                      borderWidth: 1.5,
                      borderColor: isSelected ? catColor : COLORS.border,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : catColor,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Nunito_600SemiBold',
                        color: isSelected ? '#FFF' : COLORS.text,
                      }}
                    >
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
          {errors.category ? (
            <Text style={{ fontSize: 12, fontFamily: 'Nunito_400Regular', color: COLORS.danger }}>
              {errors.category}
            </Text>
          ) : null}
        </View>

        {/* Amenities */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: COLORS.textSecondary }}>
            Servizi disponibili
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {AMENITIES.map((a) => {
              const isSelected = selectedAmenities.includes(a);
              return (
                <AnimatedPressable key={a} onPress={() => toggleAmenity(a)} scaleValue={0.95}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      gap: 6,
                      backgroundColor: isSelected ? 'rgba(76,175,130,0.15)' : COLORS.surface,
                      borderWidth: 1.5,
                      borderColor: isSelected ? '#4CAF82' : COLORS.border,
                    }}
                  >
                    <Text style={{ fontSize: 15 }}>{AMENITY_ICONS[a]}</Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Nunito_600SemiBold',
                        color: isSelected ? '#3A8F65' : COLORS.text,
                      }}
                    >
                      {AMENITY_LABELS[a]}
                    </Text>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        {/* Description */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: COLORS.textSecondary }}>
            Descrizione
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Descrivi il luogo, cosa lo rende adatto alle famiglie..."
            placeholderTextColor={COLORS.textTertiary}
            multiline
            numberOfLines={4}
            style={{
              backgroundColor: COLORS.surfaceSecondary,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
              fontFamily: 'Nunito_400Regular',
              color: COLORS.text,
              borderWidth: 1,
              borderColor: COLORS.border,
              minHeight: 100,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Address with autofill */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: COLORS.textSecondary }}>
            Indirizzo *
          </Text>
          <View>
            {/* Input row */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MapPin
                size={16}
                color={COLORS.textTertiary}
                style={{ position: 'absolute', left: 14, zIndex: 1 }}
              />
              <TextInput
                value={address}
                onChangeText={(v) => {
                  setAddress(v);
                  if (latitude || longitude) {
                    setLatitude(0);
                    setLongitude(0);
                  }
                  if (errors.address) setErrors((p) => ({ ...p, address: undefined }));
                }}
                placeholder="Cerca un indirizzo in Italia..."
                placeholderTextColor={COLORS.textTertiary}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.surfaceSecondary,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingLeft: 40,
                  paddingRight: address.length > 0 ? 40 : 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  fontFamily: 'Nunito_400Regular',
                  color: COLORS.text,
                  borderWidth: 1,
                  borderColor: errors.address
                    ? COLORS.danger
                    : showSuggestions
                    ? COLORS.primary
                    : COLORS.border,
                }}
              />
              {address.length > 0 && (
                <AnimatedPressable
                  onPress={() => {
                    console.log('[AddPlace] indirizzo cancellato');
                    setAddress('');
                    setLatitude(0);
                    setLongitude(0);
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  scaleValue={0.9}
                  style={{ position: 'absolute', right: 12, zIndex: 1 }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: COLORS.surfaceSecondary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={12} color={COLORS.textSecondary} strokeWidth={2.5} />
                  </View>
                </AnimatedPressable>
              )}
            </View>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <View
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 12,
                  marginTop: 4,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(26,23,20,0.12)',
                }}
              >
                {suggestions.map((item, idx) => (
                  <AnimatedPressable
                    key={item.place_id}
                    onPress={() => handleSelectSuggestion(item)}
                    scaleValue={0.98}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        gap: 10,
                        borderBottomWidth: idx < suggestions.length - 1 ? 1 : 0,
                        borderBottomColor: COLORS.divider,
                      }}
                    >
                      <MapPin size={14} color={COLORS.primary} strokeWidth={2} />
                      <Text
                        numberOfLines={2}
                        style={{
                          flex: 1,
                          fontSize: 13,
                          fontFamily: 'Nunito_400Regular',
                          color: COLORS.text,
                          lineHeight: 18,
                        }}
                      >
                        {item.display_name}
                      </Text>
                    </View>
                  </AnimatedPressable>
                ))}
              </View>
            )}

            {/* Loading indicator */}
            {loadingSuggestions && (
              <View style={{ paddingVertical: 8, alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Nunito_400Regular',
                    color: COLORS.textTertiary,
                  }}
                >
                  Ricerca in corso...
                </Text>
              </View>
            )}
          </View>
          {errors.address ? (
            <Text style={{ fontSize: 12, fontFamily: 'Nunito_400Regular', color: COLORS.danger }}>
              {errors.address}
            </Text>
          ) : null}
        </View>

        {/* Map preview */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: COLORS.textSecondary }}>
            {mapLabel}
          </Text>
          <View
            style={{
              height: 200,
              borderRadius: 12,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: mapBorderColor,
            }}
          >
            <Map
              markers={mapMarkers}
              initialRegion={mapRegion}
              style={{ flex: 1, borderRadius: 0 }}
            />
          </View>
          {coordsText ? (
            <Text style={{ fontSize: 12, fontFamily: 'Nunito_400Regular', color: COLORS.accent }}>
              {coordsText}
            </Text>
          ) : (
            <Text style={{ fontSize: 12, fontFamily: 'Nunito_400Regular', color: COLORS.textTertiary }}>
              {mapHintText}
            </Text>
          )}
        </View>

        {/* Submit error */}
        {submitError ? (
          <View
            style={{
              backgroundColor: COLORS.danger + '15',
              borderRadius: 10,
              padding: 12,
              borderWidth: 1,
              borderColor: COLORS.danger + '40',
            }}
          >
            <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: COLORS.danger }}>
              {submitError}
            </Text>
          </View>
        ) : null}

        {/* Submit button */}
        <AnimatedPressable onPress={handleSubmit} disabled={submitting} scaleValue={0.97}>
          <View
            style={{
              backgroundColor: submitting ? COLORS.textTertiary : COLORS.primary,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              boxShadow: submitting ? 'none' : '0 4px 16px rgba(232,115,74,0.4)',
            }}
          >
            <Text style={{ fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#FFF' }}>
              {submitting ? 'Aggiunta in corso...' : 'Aggiungi luogo'}
            </Text>
          </View>
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
