import { useState } from 'react';
import { StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { colors, font, radius, spacing } from '@/theme';

import { IconButton, Txt } from './ui';

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  suffix,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  suffix?: string;
}) {
  return (
    <View style={{ gap: 6, flex: 1 }}>
      {label ? <Txt variant="label">{label}</Txt> : null}
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          keyboardType={keyboardType}
          multiline={multiline}
          style={[styles.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
        />
        {suffix ? <Txt color={colors.muted}>{suffix}</Txt> : null}
      </View>
    </View>
  );
}

/** Converte texto digitado (aceita vírgula) em número. */
export function parseNumber(v: string): number | null {
  const n = Number(v.replace(',', '.').trim());
  return v.trim() === '' || Number.isNaN(n) ? null : n;
}

export function formatInput(n: number | null | undefined): string {
  if (n == null) return '';
  return Number.isInteger(n) ? String(n) : String(n).replace('.', ',');
}

/**
 * Campo numérico com botões − e +. Grande o bastante para usar com a mão suada na academia.
 */
export function Stepper({
  value,
  onChange,
  step,
  min = 0,
  suffix,
  label,
  decimals = true,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  step: number;
  min?: number;
  suffix?: string;
  label?: string;
  decimals?: boolean;
}) {
  const [text, setText] = useState(formatInput(value));
  // Quando o valor muda por fora (botões − / +), atualiza o texto exibido.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setText(formatInput(value));
  }

  const commit = (t: string) => {
    const n = parseNumber(t);
    if (n == null) onChange(null);
    else onChange(Math.max(min, decimals ? Math.round(n * 100) / 100 : Math.round(n)));
  };

  const bump = (dir: 1 | -1) => {
    const base = value ?? 0;
    const next = Math.max(min, Math.round((base + dir * step) * 100) / 100);
    onChange(next);
  };

  return (
    <View style={{ gap: 4, flex: 1 }}>
      {label ? <Txt variant="label">{label}</Txt> : null}
      <View style={styles.stepper}>
        <IconButton icon="remove" label="Diminuir" onPress={() => bump(-1)} size={18} />
        <TextInput
          value={text}
          onChangeText={setText}
          onEndEditing={(e) => commit(e.nativeEvent.text)}
          onBlur={() => commit(text)}
          keyboardType={decimals ? 'decimal-pad' : 'number-pad'}
          selectTextOnFocus
          style={styles.stepperInput}
          placeholder="–"
          placeholderTextColor={colors.faint}
        />
        {suffix ? (
          <Txt variant="tiny" color={colors.muted} style={{ marginLeft: -6 }}>
            {suffix}
          </Txt>
        ) : null}
        <IconButton icon="add" label="Aumentar" onPress={() => bump(1)} size={18} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, color: colors.text, fontSize: font.body, paddingVertical: 12 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  stepperInput: {
    flex: 1,
    color: colors.text,
    fontSize: font.h3,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 6,
    minWidth: 40,
  },
});
