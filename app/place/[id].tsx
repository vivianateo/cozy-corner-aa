import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, MessageSquare, Star, ChevronDown, ChevronUp } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { StarRating } from '@/components/StarRating';
import { CategoryBadge } from '@/components/CategoryBadge';
import { AmenityBadge } from '@/components/AmenityBadge';
import { COLORS } from '@/constants/Colors';
import { fetchPlace, createReview } from '@/utils/api';
import type { PlaceDetail, Review } from '@/types';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <AnimatedPressable key={star} onPress={() => { console.log('[PlaceDetail] stella selezionata:', star); onChange(star); }} scaleValue={0.85}>
          <Star
            size={32}
            color={star <= value ? COLORS.warning : COLORS.textTertiary}
            fill={star <= value ? COLORS.warning : 'transparent'}
            strokeWidth={1.5}
          />
        </AnimatedPressable>
      ))}
    </View>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, delay: index * 50, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dateDisplay = new Date(review.created_at).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        boxShadow: '0 1px 4px rgba(26,23,20,0.05)',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontSize: 14, fontFamily: 'Nunito_700Bold', color: COLORS.text }}>
          {review.author_name || 'Anonimo'}
        </Text>
        <Text style={{ fontSize: 12, fontFamily: 'Nunito_400Regular', color: COLORS.textTertiary }}>
          {dateDisplay}
        </Text>
      </View>
      <StarRating rating={Number(review.rating)} size={13} />
      {review.comment ? (
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'Nunito_400Regular',
            color: COLORS.textSecondary,
            lineHeight: 20,
            marginTop: 8,
          }}
        >
          {review.comment}
        </Text>
      ) : null}
    </Animated.View>
  );
}

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const formHeight = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  const loadPlace = useCallback(async () => {
    if (!id) return;
    console.log('[PlaceDetail] loadPlace', { id });
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlace(id);
      setPlace(data);
      navigation.setOptions({ title: data.name });
    } catch (e: any) {
      console.error('[PlaceDetail] loadPlace error', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useEffect(() => {
    loadPlace();
  }, [loadPlace]);

  const toggleReviewForm = () => {
    console.log('[PlaceDetail] toggle form recensione, showReviewForm:', !showReviewForm);
    if (!showReviewForm) {
      setShowReviewForm(true);
      Animated.parallel([
        Animated.timing(formHeight, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.timing(formOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(formHeight, { toValue: 0, duration: 250, useNativeDriver: false }),
        Animated.timing(formOpacity, { toValue: 0, duration: 250, useNativeDriver: false }),
      ]).start(() => setShowReviewForm(false));
    }
  };

  const handleSubmitReview = async () => {
    if (!id) return;
    if (!reviewName.trim()) {
      setSubmitError('Inserisci il tuo nome');
      return;
    }
    if (reviewRating === 0) {
      setSubmitError('Seleziona una valutazione');
      return;
    }
    console.log('[PlaceDetail] pubblica recensione', { placeId: id, reviewName, reviewRating });
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createReview(id, {
        author_name: reviewName.trim(),
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setSubmitSuccess(true);
      setReviewName('');
      setReviewRating(0);
      setReviewComment('');
      // Collapse form and reload
      Animated.parallel([
        Animated.timing(formHeight, { toValue: 0, duration: 250, useNativeDriver: false }),
        Animated.timing(formOpacity, { toValue: 0, duration: 250, useNativeDriver: false }),
      ]).start(() => setShowReviewForm(false));
      await loadPlace();
    } catch (e: any) {
      console.error('[PlaceDetail] submitReview error', e.message);
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: COLORS.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MapPin size={28} color={COLORS.primary} strokeWidth={1.5} />
        </View>
        <Text style={{ marginTop: 16, fontFamily: 'Nunito_600SemiBold', color: COLORS.textSecondary, fontSize: 15 }}>
          Caricamento...
        </Text>
      </View>
    );
  }

  if (error || !place) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <MapPin size={40} color={COLORS.danger} strokeWidth={1.5} />
        <Text style={{ fontSize: 17, fontFamily: 'Nunito_700Bold', color: COLORS.text, marginTop: 16, textAlign: 'center' }}>
          Impossibile caricare il luogo
        </Text>
        <Text style={{ fontSize: 14, fontFamily: 'Nunito_400Regular', color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' }}>
          {error ?? 'Luogo non trovato'}
        </Text>
        <AnimatedPressable onPress={loadPlace}>
          <View style={{ marginTop: 20, backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
            <Text style={{ color: '#FFF', fontFamily: 'Nunito_700Bold', fontSize: 15 }}>Riprova</Text>
          </View>
        </AnimatedPressable>
      </View>
    );
  }

  const avgRating = Number(place.avg_rating);
  const ratingDisplay = isNaN(avgRating) ? '—' : avgRating.toFixed(1);
  const reviewCount = place.review_count ?? 0;
  const reviews: Review[] = place.reviews ?? [];

  const formMaxHeight = formHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero image */}
        <View style={{ height: 260, position: 'relative' }}>
          <Image
            source={resolveImageSource(place.image_url)}
            style={{ width: '100%', height: 260 }}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(26,23,20,0.6)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 }}
          />
        </View>

        {/* Content */}
        <View style={{ padding: 20, gap: 16 }}>
          {/* Category + Name */}
          <View style={{ gap: 8 }}>
            <CategoryBadge category={place.category} size="md" />
            <Text
              style={{
                fontSize: 26,
                fontFamily: 'Nunito_800ExtraBold',
                color: COLORS.text,
                letterSpacing: -0.3,
                lineHeight: 32,
              }}
            >
              {place.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color={COLORS.textSecondary} />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Nunito_400Regular',
                  color: COLORS.textSecondary,
                  flex: 1,
                }}
                selectable
              >
                {place.address}
              </Text>
            </View>
          </View>

          {/* Rating row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: COLORS.surface,
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <StarRating rating={avgRating} size={18} />
            <Text style={{ fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: COLORS.text }}>
              {ratingDisplay}
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Nunito_400Regular', color: COLORS.textSecondary }}>
              ({reviewCount}
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Nunito_400Regular', color: COLORS.textSecondary }}>
              {reviewCount === 1 ? 'recensione' : 'recensioni'})
            </Text>
          </View>

          {/* Amenities */}
          {place.amenities && place.amenities.length > 0 && (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 17, fontFamily: 'Nunito_700Bold', color: COLORS.text }}>
                Servizi per famiglie
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {place.amenities.map((a) => (
                  <AmenityBadge key={a} amenity={a} size="md" />
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          {place.description ? (
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 17, fontFamily: 'Nunito_700Bold', color: COLORS.text }}>
                Descrizione
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'Nunito_400Regular',
                  color: COLORS.textSecondary,
                  lineHeight: 22,
                }}
              >
                {place.description}
              </Text>
            </View>
          ) : null}

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: COLORS.divider }} />

          {/* Reviews section */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 17, fontFamily: 'Nunito_700Bold', color: COLORS.text }}>
                Recensioni
              </Text>
              <View
                style={{
                  backgroundColor: COLORS.primaryMuted,
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 13, fontFamily: 'Nunito_700Bold', color: COLORS.primary }}>
                  {reviewCount}
                </Text>
              </View>
            </View>

            {reviews.length === 0 ? (
              <View
                style={{
                  alignItems: 'center',
                  padding: 24,
                  backgroundColor: COLORS.surfaceSecondary,
                  borderRadius: 14,
                  gap: 8,
                }}
              >
                <MessageSquare size={28} color={COLORS.textTertiary} strokeWidth={1.5} />
                <Text style={{ fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: COLORS.textSecondary }}>
                  Ancora nessuna recensione
                </Text>
                <Text style={{ fontSize: 13, fontFamily: 'Nunito_400Regular', color: COLORS.textTertiary, textAlign: 'center' }}>
                  Sii il primo a condividere la tua esperienza!
                </Text>
              </View>
            ) : (
              reviews.map((review, index) => (
                <ReviewCard key={review.id} review={review} index={index} />
              ))
            )}
          </View>

          {/* Success message */}
          {submitSuccess && (
            <View
              style={{
                backgroundColor: '#4CAF8220',
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: '#4CAF82',
              }}
            >
              <Text style={{ fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: '#4CAF82', textAlign: 'center' }}>
                Recensione pubblicata con successo!
              </Text>
            </View>
          )}

          {/* Write review button */}
          <AnimatedPressable onPress={toggleReviewForm} scaleValue={0.98}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: COLORS.primary,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 20,
                boxShadow: '0 4px 12px rgba(232,115,74,0.35)',
              }}
            >
              <MessageSquare size={18} color="#FFF" />
              <Text style={{ fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#FFF' }}>
                Scrivi una recensione
              </Text>
              {showReviewForm ? (
                <ChevronUp size={16} color="#FFF" />
              ) : (
                <ChevronDown size={16} color="#FFF" />
              )}
            </View>
          </AnimatedPressable>

          {/* Inline review form */}
          <Animated.View
            style={{
              maxHeight: formMaxHeight,
              opacity: formOpacity,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 16,
                padding: 16,
                gap: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Nunito_700Bold', color: COLORS.text }}>
                La tua recensione
              </Text>

              {/* Name field */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: COLORS.textSecondary }}>
                  Nome *
                </Text>
                <TextInput
                  value={reviewName}
                  onChangeText={setReviewName}
                  placeholder="Il tuo nome"
                  placeholderTextColor={COLORS.textTertiary}
                  style={{
                    backgroundColor: COLORS.surfaceSecondary,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 15,
                    fontFamily: 'Nunito_400Regular',
                    color: COLORS.text,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                />
              </View>

              {/* Star selector */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: COLORS.textSecondary }}>
                  Valutazione *
                </Text>
                <StarSelector value={reviewRating} onChange={setReviewRating} />
              </View>

              {/* Comment field */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: COLORS.textSecondary }}>
                  Commento
                </Text>
                <TextInput
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  placeholder="Racconta la tua esperienza..."
                  placeholderTextColor={COLORS.textTertiary}
                  multiline
                  numberOfLines={4}
                  style={{
                    backgroundColor: COLORS.surfaceSecondary,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
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

              {/* Submit error */}
              {submitError ? (
                <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: COLORS.danger }}>
                  {submitError}
                </Text>
              ) : null}

              {/* Submit button */}
              <AnimatedPressable
                onPress={handleSubmitReview}
                disabled={submitting}
                scaleValue={0.97}
              >
                <View
                  style={{
                    backgroundColor: submitting ? COLORS.textTertiary : COLORS.primary,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#FFF' }}>
                    {submitting ? 'Pubblicazione...' : 'Pubblica recensione'}
                  </Text>
                </View>
              </AnimatedPressable>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
