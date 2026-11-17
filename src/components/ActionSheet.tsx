import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme';

import { Icon, Txt, type IconName } from './ui';

export interface SheetOption {
  label: string;
  icon: IconName;
  onPress: () => void;
  destructive?: boolean;
}

/**
 * Menu que sobe de baixo da tela. Fecha ao tocar fora, no "voltar" do Android
 * ou ao escolher uma opção.
 */
export function ActionSheet({
  visible,
  title,
  options,
  onClose,
}: {
  visible: boolean;
  title?: string;
  options: SheetOption[];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar menu">
        {/* Toque dentro do painel não fecha. */}
        <Pressable style={[styles.sheet, { paddingBottom: spacing.lg + insets.bottom }]} onPress={() => {}}>
          <View style={styles.handle} />
          {title ? (
            <Txt variant="label" style={{ paddingHorizontal: spacing.sm, marginBottom: spacing.xs }}>
              {title}
            </Txt>
          ) : null}
          {options.map((o) => (
            <Pressable
              key={o.label}
              accessibilityRole="button"
              onPress={() => {
                onClose();
                o.onPress();
              }}
              style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.surface2 }]}>
              <Icon name={o.icon} size={22} color={o.destructive ? colors.danger : colors.text} />
              <Txt bold color={o.destructive ? colors.danger : colors.text}>
                {o.label}
              </Txt>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: 2,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
});
