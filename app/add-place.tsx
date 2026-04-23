import React, { useState, useRef } from 'react';
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
import { CheckCircle, MapPin } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { COLORS, CATEGORIES, CATEGORY_LABELS } from '@/constants/Colors';
import { createPlace } from '@/utils/api';

const FORM_CATEGORIES = CATEGORIES.filter((c) => c !== 'tutti') as string[];

interface FormErrors {
  name?: string;
  category?: string;
  description?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
}

export default function AddPlaceScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const successOpacity = useRef(new Animated.Value(0)).current;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = 'Il nome è obbligatorio';
    if (!category) newErrors.category = 'Seleziona una categoria';
    if (!address.trim()) newErrors.address = "L'indirizzo è obbligatorio";
    if (latitude && isNaN(Number(latitude))) newErrors.latitude = 'Inserisci un numero valido';
    if (longitude && isNaN(Number(longitude))) newErrors.longitude = 'Inserisci un numero valido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('[AddPlace] submit premuto', { name, category, address });
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
        latitude: latitude ? Number(latitude) : 0,
        longitude: longitude ? Number(longitude) : 0,
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

  const handleCategorySelect = (cat: string) => {
    console.log('[AddPlace] categoria selezionata:', cat);
    setCategory(cat);
    if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
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
        <Text style={{ fontSize: 15, fontFamily: 'Nunito_400Regular', color: COLORS.textSecondary, textAlign: 'center', maxWidth: 260 }}>
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
            onChangeText={(v) => { setName(v); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
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
                <AnimatedPressable
                  key={cat}
                  onPress={() => handleCategorySelect(cat)}
                  scaleValue={0.95}
                >
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

        {/* Address */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: COLORS.textSecondary }}>
            Indirizzo *
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} color={COLORS.textTertiary} style={{ position: 'absolute', left: 14, zIndex: 1 }} />
            <TextInput
              value={address}
              onChangeText={(v) => { setAddress(v); if (errors.address) setErrors((p) => ({ ...p, address: undefined })); }}
              placeholder="Via Roma 1, Milano"
              placeholderTextColor={COLORS.textTertiary}
              style={{
                flex: 1,
                backgroundColor: COLORS.surfaceSecondary,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingLeft: 40,
                paddingVertical: 14,
                fontSize: 15,
                fontFamily: 'Nunito_400Regular',
                color: COLORS.text,
                borderWidth: 1,
                borderColor: errors.address ? COLORS.danger : COLORS.border,
              }}
            />
          </View>
          {errors.address ? (
            <Text style={{ fontSize: 12, fontFamily: 'Nunito_400Regular', color: COLORS.danger }}>
              {errors.address}
            </Text>
          ) : null}
        </View>

        {/* Lat / Lng */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: COLORS.textSecondary }}>
              Latitudine
            </Text>
            <TextInput
              value={latitude}
              onChangeText={(v) => { setLatitude(v); if (errors.latitude) setErrors((p) => ({ ...p, latitude: undefined })); }}
              placeholder="41.9028"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="decimal-pad"
              style={{
                backgroundColor: COLORS.surfaceSecondary,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                fontFamily: 'Nunito_400Regular',
                color: COLORS.text,
                borderWidth: 1,
                borderColor: errors.latitude ? COLORS.danger : COLORS.border,
              }}
            />
            {errors.latitude ? (
              <Text style={{ fontSize: 12, fontFamily: 'Nunito_400Regular', color: COLORS.danger }}>
                {errors.latitude}
              </Text>
            ) : null}
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: COLORS.textSecondary }}>
              Longitudine
            </Text>
            <TextInput
              value={longitude}
              onChangeText={(v) => { setLongitude(v); if (errors.longitude) setErrors((p) => ({ ...p, longitude: undefined })); }}
              placeholder="12.4964"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="decimal-pad"
              style={{
                backgroundColor: COLORS.surfaceSecondary,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                fontFamily: 'Nunito_400Regular',
                color: COLORS.text,
                borderWidth: 1,
                borderColor: errors.longitude ? COLORS.danger : COLORS.border,
              }}
            />
            {errors.longitude ? (
              <Text style={{ fontSize: 12, fontFamily: 'Nunito_400Regular', color: COLORS.danger }}>
                {errors.longitude}
              </Text>
            ) : null}
          </View>
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
