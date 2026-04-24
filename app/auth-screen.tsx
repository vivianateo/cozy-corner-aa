import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/constants/Colors';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      console.log('[AuthScreen] utente autenticato, torno indietro:', user.email);
      router.back();
    }
  }, [user, router]);

  const handleEmailAuth = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Inserisci email e password');
      return;
    }
    if (isSignUp && !name.trim()) {
      setError('Inserisci il tuo nome');
      return;
    }
    console.log('[AuthScreen] tentativo', isSignUp ? 'registrazione' : 'accesso', { email });
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password, name.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (e: any) {
      console.error('[AuthScreen] errore auth email:', e.message);
      setError(e.message ?? 'Errore durante l\'autenticazione');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('[AuthScreen] accesso con Google premuto');
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      console.error('[AuthScreen] errore Google sign-in:', e.message);
      setError(e.message ?? 'Errore con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSkip = () => {
    console.log('[AuthScreen] continua senza accedere premuto');
    router.replace('/(tabs)/(home)');
  };

  const toggleMode = () => {
    console.log('[AuthScreen] toggle modalità:', isSignUp ? 'accesso' : 'registrazione');
    setIsSignUp((prev) => !prev);
    setError(null);
  };

  const buttonLabel = isSignUp ? 'Registrati' : 'Accedi';
  const togglePrompt = isSignUp ? 'Hai già un account?' : 'Non hai un account?';
  const toggleLabel = isSignUp ? 'Accedi' : 'Registrati';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 28,
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 32,
          alignItems: 'center',
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo area */}
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 56 }}>🏡</Text>
          <Text
            style={{
              fontSize: 32,
              fontFamily: 'Nunito_800ExtraBold',
              color: COLORS.primary,
              letterSpacing: -0.5,
            }}
          >
            Cozy Corner
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'Nunito_400Regular',
              color: COLORS.textSecondary,
              textAlign: 'center',
              maxWidth: 260,
              lineHeight: 22,
            }}
          >
            Trova i luoghi più accoglienti per la tua famiglia
          </Text>
        </View>

        <View style={{ height: 40 }} />

        {/* Google button */}
        <AnimatedPressable onPress={handleGoogleSignIn} disabled={googleLoading} style={{ width: '100%' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              backgroundColor: COLORS.surface,
              borderRadius: 14,
              paddingVertical: 15,
              borderWidth: 1,
              borderColor: COLORS.border,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <Text style={{ fontSize: 18, fontFamily: 'Nunito_700Bold', color: '#4285F4' }}>G</Text>
            )}
            <Text style={{ fontSize: 16, fontFamily: 'Nunito_600SemiBold', color: COLORS.text }}>
              Continua con Google
            </Text>
          </View>
        </AnimatedPressable>

        <View style={{ height: 20 }} />

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: COLORS.divider }} />
          <Text style={{ fontSize: 13, fontFamily: 'Nunito_400Regular', color: COLORS.textSecondary }}>
            oppure
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: COLORS.divider }} />
        </View>

        <View style={{ height: 20 }} />

        {/* Form fields */}
        <View style={{ width: '100%', gap: 12 }}>
          {isSignUp && (
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nome"
              placeholderTextColor={COLORS.textTertiary}
              autoCapitalize="words"
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 15,
                fontSize: 15,
                fontFamily: 'Nunito_400Regular',
                color: COLORS.text,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            />
          )}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 15,
              fontSize: 15,
              fontFamily: 'Nunito_400Regular',
              color: COLORS.text,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={COLORS.textTertiary}
            secureTextEntry
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 15,
              fontSize: 15,
              fontFamily: 'Nunito_400Regular',
              color: COLORS.text,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          />
        </View>

        <View style={{ height: 16 }} />

        {/* Submit button */}
        <AnimatedPressable onPress={handleEmailAuth} disabled={submitting || loading} style={{ width: '100%' }}>
          <View
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 14,
              paddingVertical: 15,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(232,115,74,0.35)',
            }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={{ fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#FFF' }}>
                {buttonLabel}
              </Text>
            )}
          </View>
        </AnimatedPressable>

        <View style={{ height: 16 }} />

        {/* Toggle sign-in / sign-up */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14, fontFamily: 'Nunito_400Regular', color: COLORS.textSecondary }}>
            {togglePrompt}
          </Text>
          <AnimatedPressable onPress={toggleMode} scaleValue={0.95}>
            <Text style={{ fontSize: 14, fontFamily: 'Nunito_700Bold', color: COLORS.primary }}>
              {toggleLabel}
            </Text>
          </AnimatedPressable>
        </View>

        {/* Error */}
        {error ? (
          <View style={{ marginTop: 14, width: '100%' }}>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Nunito_600SemiBold',
                color: COLORS.danger,
                textAlign: 'center',
              }}
            >
              {error}
            </Text>
          </View>
        ) : null}

        <View style={{ flex: 1, minHeight: 32 }} />

        {/* Skip */}
        <AnimatedPressable onPress={handleSkip} scaleValue={0.97}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Nunito_400Regular',
              color: COLORS.textSecondary,
              textAlign: 'center',
            }}
          >
            Continua senza accedere →
          </Text>
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
