import { useSQLiteContext } from 'expo-sqlite';
import { Pressable } from 'react-native';

import { toggleFavorite, useIsFavorite } from '@/state/userCatalog';
import { colors } from '@/theme';

import { Icon } from './ui';

/** Estrelinha para favoritar um exercício. Os favoritos aparecem em Academia → Favoritos. */
export function FavoriteStar({ exercicioId, size = 20 }: { exercicioId: string; size?: number }) {
  const db = useSQLiteContext();
  const fav = useIsFavorite(exercicioId);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={fav ? 'Tirar dos favoritos' : 'Favoritar'}
      accessibilityState={{ selected: fav }}
      hitSlop={10}
      onPress={() => void toggleFavorite(db, exercicioId).catch(() => {})}
      style={({ pressed }) => [{ padding: 2 }, pressed && { opacity: 0.6 }]}>
      <Icon name={fav ? 'star' : 'star-outline'} size={size} color={fav ? colors.warning : colors.muted} />
    </Pressable>
  );
}
