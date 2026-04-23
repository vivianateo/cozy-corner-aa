import { Stack } from 'expo-router';

export default function EsploraLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: 'transparent' },
        headerBlurEffect: 'none',
        headerLargeTitle: true,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Esplora',
          headerSearchBarOptions: {
            placeholder: 'Cerca un luogo...',
            hideWhenScrolling: false,
          },
        }}
      />
    </Stack>
  );
}
