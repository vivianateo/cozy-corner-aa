import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { StarRating } from '@/components/StarRating';
import { CategoryBadge } from '@/components/CategoryBadge';
import { useAuth } from '@/contexts/AuthContext';
import { fetchFavorites } from '@/utils/api';
import { COLORS } from '@/constants/Colors';
import type { Place } from '@/types';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ProfiloScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading, signOut } = useAuth();

  const [favorites, setFavorites] = useState<Place[]>([]);
  const [favLoading, setFavLoading] = useState(false);
  const [favError, setFavError] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    console.log('[Profilo] carico preferiti per utente:', user.email);
    setFavLoading(true);
    setFavError(null);
    try {
      const data = await fetchFavorites();
      setFavorites(data);
    } catch (e: any) {
      console.error('[Profilo] errore caricamento preferiti:', e.message);
      setFavError(e.message);
    } finally {
      setFavLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleSignOut = async () => {
    console.log('[Profilo] disconnessione premuta');
    try {
      await signOut();
      console.log('[Profilo] disconnessione completata');
    } catch (e: any) {
      console.error('[Profilo] errore disconnessione:', e.message);
    }
  };

  const handleLoginPress = () => {
    console.log('[Profilo] accedi premuto');
    router.push('/auth-screen');
  };

  const handlePlacePress = (place: Place) => {
    console.log('[Profilo] preferito premuto:', place.id, place.name);
    router.push(`/place/${place.id}`);
  };

  const userInitials = user?.name ? getInitials(user.name) : '?';
  const userName = user?.name ?? '';
  const userEmail = user?.email ?? '';

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          gap: 16,
        }}
      >
        <Text style={{ fontSize: 48 }}>🏡</Text>
        <Text style={{ fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: COLORS.text, textAlign: 'center' }}>
          Accedi a Cozy Corner
        </Text>
        <Text
          style={{
            fontSize: 15,
            fontFamily: 'Nunito_400Regular',
            color: COLORS.textSecondary,
            textAlign: 'center',
            maxWidth: 240,
            lineHeight: 22,
          }}
        >
          Salva i tuoi luoghi preferiti e accedi al tuo profilo
        </Text>
        <AnimatedPressable onPress={handleLoginPress} scaleValue={0.97} style={{ width: '100%', marginTop: 8 }}>
          <View
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(232,115,74,0.35)',
            }}
          >
            <Text style={{ fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#FFF' }}>
              Accedi o Registrati
            </Text>
          </View>
        </AnimatedPressable>
      </View>
    );
  }

  // ── Logged in ──────────────────────────────────────────────────────────────
  const renderFavoriteItem = ({ item }: { item: Place }) => {
    const rating = Number(item.avg_rating);
    const ratingText = isNaN(rating) ? '—' : rating.toFixed(1);
    const reviewCount = item.review_count ?? 0;
    const addressSnippet = item.address ? item.address.split(',').slice(0, 2).join(',') : '';

    return (
      <AnimatedPressable onPress={() => handlePlacePress(item)} scaleValue={0.98}>
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
            resizeMode="cover"
          />
          <View style={{ flex: 1, gap: 4, justifyContent: 'center' }}>
            <Text numberOfLines={1} style={{ fontSize: 15, fontFamily: 'Nunito_700Bold', color: COLORS.text }}>
              {item.name}
            </Text>
            <CategoryBadge category={item.category} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <StarRating rating={rating} size={12} />
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
                {ratingText}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                ({reviewCount})
              </Text>
            </View>
            <Text numberOfLines={1} style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: 'Nunito_400Regular' }}>
              {addressSnippet}
            </Text>
          </View>
        </View>
      </AnimatedPressable>
    );
  };

  const ListHeader = (
    <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 16, gap: 20 }}>
      {/* User header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: COLORS.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: '#FFF' }}>
            {userInitials}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: COLORS.text }} numberOfLines={1}>
            {userName}
          </Text>
          <Text style={{ fontSize: 14, fontFamily: 'Nunito_400Regular', color: COLORS.textSecondary }} numberOfLines={1}>
            {userEmail}
          </Text>
        </View>
      </View>

      {/* Section title */}
      <Text style={{ fontSize: 17, fontFamily: 'Nunito_700Bold', color: COLORS.text }}>
        I tuoi preferiti
      </Text>

      {/* Loading / error states for favorites */}
      {favLoading && (
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}
      {favError && (
        <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: COLORS.danger, textAlign: 'center' }}>
          {favError}
        </Text>
      )}
    </View>
  );

  const EmptyFavorites = !favLoading ? (
    <View style={{ alignItems: 'center', paddingTop: 24, paddingHorizontal: 32, gap: 12 }}>
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
      <Text style={{ fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: COLORS.textSecondary, textAlign: 'center' }}>
        Nessun preferito ancora.
      </Text>
      <Text
        style={{
          fontSize: 13,
          fontFamily: 'Nunito_400Regular',
          color: COLORS.textTertiary,
          textAlign: 'center',
          lineHeight: 20,
          maxWidth: 260,
        }}
      >
        Esplora i luoghi e salva i tuoi preferiti!
      </Text>
    </View>
  ) : null;

  const ListFooter = (
    <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 32 }}>
      <AnimatedPressable onPress={handleSignOut} scaleValue={0.97}>
        <View
          style={{
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: COLORS.danger,
          }}
        >
          <Text style={{ fontSize: 15, fontFamily: 'Nunito_700Bold', color: COLORS.danger }}>
            Esci
          </Text>
        </View>
      </AnimatedPressable>
    </View>
  );

  return (
    <FlatList
      data={favLoading ? [] : favorites}
      keyExtractor={(item) => item.id}
      renderItem={renderFavoriteItem}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={EmptyFavorites}
      ListFooterComponent={ListFooter}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    />
  );
}
