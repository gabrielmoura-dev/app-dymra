import { DarkTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/schema';
import { configureNotifications } from '@/services/notifications';
import { ProfileProvider, useProfile } from '@/state/profile';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
  },
};

function Gate() {
  const { profile, loading } = useProfile();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    SplashScreen.hideAsync().catch(() => {});
    const onOnboarding = segments[0] === 'onboarding';
    if (!profile && !onOnboarding) router.replace('/onboarding');
    else if (profile && onOnboarding) router.replace('/');
  }, [loading, profile, segments, router]);

  useEffect(() => {
    configureNotifications().catch(() => {});
  }, []);

  // Mantém a splash até o perfil carregar.
  if (loading) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="sessao" options={{ title: 'Treino', gestureEnabled: false }} />
      <Stack.Screen name="resumo/[id]" options={{ title: 'Resumo', headerBackVisible: false, gestureEnabled: false }} />
      <Stack.Screen name="exercicio/[id]" options={{ title: 'Exercício' }} />
      <Stack.Screen name="maquina/[id]" options={{ title: 'Máquina' }} />
      <Stack.Screen name="historico/[id]" options={{ title: 'Treino feito' }} />
      <Stack.Screen name="rotina/[programa]/[dia]" options={{ title: 'Treino' }} />
      <Stack.Screen name="corpo" options={{ title: 'Corpo' }} />
      <Stack.Screen name="camera-foto" options={{ headerShown: false }} />
      <Stack.Screen name="scanner" options={{ title: 'Ler QR code', presentation: 'modal' }} />
      <Stack.Screen name="trocar" options={{ title: 'Máquina ocupada', presentation: 'modal' }} />
      <Stack.Screen name="adicionar" options={{ title: 'Adicionar exercício', presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style="light" />
          <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
            <ProfileProvider>
              <Gate />
            </ProfileProvider>
          </SQLiteProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
