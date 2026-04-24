import "react-native-reanimated";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme, Alert } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";

const DevErrorBoundary = __DEV__
  ? ErrorBoundary
  : ({ children }: { children: React.ReactNode }) => <>{children}</>;

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "Sei offline",
        "Controlla la tua connessione internet e riprova."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "#E8734A",
      background: "#F7F5F2",
      card: "#FFFFFF",
      text: "#1A1714",
      border: "rgba(26, 23, 20, 0.08)",
      notification: "#E53E3E",
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "#E8734A",
      background: "#1A1714",
      card: "#2A2420",
      text: "#F7F5F2",
      border: "rgba(247, 245, 242, 0.08)",
      notification: "#E53E3E",
    },
  };

  if (!loaded) return null;

  return (
    <DevErrorBoundary>
      <AuthProvider>
        <StatusBar style="auto" animated />
        <ThemeProvider
          value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
        >
          <SafeAreaProvider>
            <WidgetProvider>
              <GestureHandlerRootView>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="place/[id]"
                    options={{ headerShown: true, title: "" }}
                  />
                  <Stack.Screen
                    name="add-place"
                    options={{
                      presentation: "formSheet",
                      sheetGrabberVisible: true,
                      sheetAllowedDetents: [0.75, 1.0],
                      headerShown: true,
                      title: "Aggiungi un luogo",
                    }}
                  />
                  <Stack.Screen
                    name="auth-screen"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="auth-popup"
                    options={{ headerShown: false, presentation: "fullScreenModal" }}
                  />
                  <Stack.Screen
                    name="auth-callback"
                    options={{ headerShown: false }}
                  />
                </Stack>
                <SystemBars style={"auto"} />
              </GestureHandlerRootView>
            </WidgetProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </AuthProvider>
    </DevErrorBoundary>
  );
}
