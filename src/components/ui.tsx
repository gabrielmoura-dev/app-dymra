import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, font, radius, spacing } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 22, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.screenContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.screenContent, { flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

type TxtVariant = 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'tiny' | 'label';

export function Txt({
  children,
  variant = 'body',
  color,
  style,
  numberOfLines,
  center,
  bold,
}: {
  children: ReactNode;
  variant?: TxtVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  center?: boolean;
  bold?: boolean;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        styles[variant],
        color ? { color } : null,
        center ? { textAlign: 'center' } : null,
        bold ? { fontWeight: '700' } : null,
        style,
      ]}>
      {children}
    </Text>
  );
}

export function Card({
  children,
  style,
  onPress,
  tone = 'default',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tone?: 'default' | 'accent' | 'violet' | 'danger' | 'water';
}) {
  const toneStyle =
    tone === 'accent'
      ? { backgroundColor: colors.accentSoft, borderColor: colors.accent }
      : tone === 'violet'
        ? { backgroundColor: colors.violetSoft, borderColor: colors.violet }
        : tone === 'danger'
          ? { backgroundColor: colors.dangerSoft, borderColor: colors.danger }
          : tone === 'water'
            ? { backgroundColor: colors.waterSoft, borderColor: colors.water }
            : null;
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, toneStyle, pressed && { opacity: 0.8 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, toneStyle, style]}>{children}</View>;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'violet';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  small,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const bg =
    variant === 'primary'
      ? colors.accent
      : variant === 'danger'
        ? colors.danger
        : variant === 'violet'
          ? colors.violet
          : variant === 'secondary'
            ? colors.surface2
            : 'transparent';
  const fg = variant === 'primary' ? colors.accentText : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg },
        variant === 'ghost' && { borderWidth: 1, borderColor: colors.border },
        (disabled || loading) && { opacity: 0.45 },
        pressed && { opacity: 0.75 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={small ? 16 : 20} color={fg} /> : null}
          <Text style={[styles.buttonText, small && { fontSize: font.small }, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color = colors.text,
  size = 22,
  bg = colors.surface2,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  color?: string;
  size?: number;
  bg?: string;
  label: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: bg }, pressed && { opacity: 0.7 }]}>
      <Icon name={icon} size={size} color={color} />
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
  tone = 'accent',
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
  tone?: 'accent' | 'violet' | 'muted';
}) {
  const activeBg = tone === 'violet' ? colors.violet : tone === 'muted' ? colors.surface2 : colors.accent;
  const activeFg = tone === 'accent' ? colors.accentText : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, active && { backgroundColor: activeBg, borderColor: activeBg }]}>
      {icon ? <Icon name={icon} size={14} color={active ? activeFg : colors.muted} /> : null}
      <Text style={[styles.chipText, active && { color: activeFg }]}>{label}</Text>
    </Pressable>
  );
}

export function Row({
  children,
  gap = spacing.sm,
  style,
  wrap,
}: {
  children: ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
  wrap?: boolean;
}) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, wrap && { flexWrap: 'wrap' }, style]}>{children}</View>;
}

export function Stat({ label, value, unit, color }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, color ? { color } : null]}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <Txt variant="h3">{children}</Txt>
      {action}
    </View>
  );
}

export function ProgressBar({ value, color = colors.accent, height = 8 }: { value: number; color?: string; height?: number }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={[styles.progressTrack, { height, borderRadius: height / 2 }]}>
      <View style={{ width: `${v * 100}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

export function Empty({ icon, title, text }: { icon: IconName; title: string; text?: string }) {
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={36} color={colors.faint} />
      <Txt variant="h3" center>
        {title}
      </Txt>
      {text ? (
        <Txt variant="small" color={colors.muted} center>
          {text}
        </Txt>
      ) : null}
    </View>
  );
}

export function Bullet({ children, icon = 'ellipse', color = colors.accent }: { children: ReactNode; icon?: IconName; color?: string }) {
  return (
    <View style={styles.bullet}>
      <View style={{ paddingTop: 3 }}>
        <Icon name={icon} size={icon === 'ellipse' ? 8 : 16} color={color} />
      </View>
      <Txt style={{ flex: 1 }}>{children}</Txt>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm }} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl * 2 },
  h1: { color: colors.text, fontSize: font.h1, fontWeight: '800', letterSpacing: -0.5 },
  h2: { color: colors.text, fontSize: font.h2, fontWeight: '800', letterSpacing: -0.3 },
  h3: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
  body: { color: colors.text, fontSize: font.body, lineHeight: 22 },
  small: { color: colors.text, fontSize: font.small, lineHeight: 19 },
  tiny: { color: colors.muted, fontSize: font.tiny },
  label: { color: colors.muted, fontSize: font.tiny, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonSmall: { minHeight: 38, paddingHorizontal: spacing.md },
  buttonText: { fontSize: font.body, fontWeight: '700' },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { color: colors.muted, fontSize: font.small, fontWeight: '600' },
  stat: { flex: 1, gap: 2 },
  statValue: { color: colors.text, fontSize: font.h2, fontWeight: '800' },
  statUnit: { color: colors.muted, fontSize: font.small, fontWeight: '600' },
  statLabel: { color: colors.muted, fontSize: font.tiny },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressTrack: { backgroundColor: colors.surface2, overflow: 'hidden' },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  bullet: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
});
