import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { useProfile } from '@/state/profile';
import { colors } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function icon(name: IconName, focusedName: IconName) {
  return function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return <Ionicons name={focused ? focusedName : name} size={size} color={color as string} />;
  };
}

export default function TabsLayout() {
  const { profile, loading } = useProfile();
  if (loading) return null;
  if (!profile) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', paddingBottom: 4 },
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Hoje', tabBarIcon: icon('flash-outline', 'flash') }} />
      <Tabs.Screen name="treinos" options={{ title: 'Fichas', tabBarIcon: icon('list-outline', 'list') }} />
      <Tabs.Screen name="maquinas" options={{ title: 'Máquinas', tabBarIcon: icon('barbell-outline', 'barbell') }} />
      <Tabs.Screen name="progresso" options={{ title: 'Progresso', tabBarIcon: icon('trending-up-outline', 'trending-up') }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icon('person-outline', 'person') }} />
    </Tabs>
  );
}
