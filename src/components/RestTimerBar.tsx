import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatClock } from '@/logic/dates';
import { useRestTimer } from '@/state/restTimer';
import { colors, radius, spacing } from '@/theme';

import { Button, ProgressBar, Row, Txt } from './ui';

export function RestTimerBar() {
  const { endsAt, total, proximo, add, stop, finish } = useRestTimer();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endsAt == null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endsAt]);

  const restante = endsAt == null ? 0 : Math.max(0, (endsAt - now) / 1000);

  useEffect(() => {
    if (endsAt != null && restante <= 0) finish();
  }, [endsAt, restante, finish]);

  if (endsAt == null) return null;

  return (
    <View style={styles.bar}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Txt variant="label" color={colors.accent}>
            Descanso
          </Txt>
          <Txt variant="tiny" numberOfLines={1}>
            Próximo: {proximo}
          </Txt>
        </View>
        <Txt variant="h1" style={{ fontVariant: ['tabular-nums'] }}>
          {formatClock(Math.ceil(restante))}
        </Txt>
      </Row>
      <ProgressBar value={total > 0 ? 1 - restante / total : 1} height={6} />
      <Row>
        <Button small variant="secondary" title="−15 s" onPress={() => add(-15)} style={{ flex: 1 }} />
        <Button small variant="secondary" title="+15 s" onPress={() => add(15)} style={{ flex: 1 }} />
        <Button small variant="primary" title="Pular" onPress={stop} style={{ flex: 1 }} />
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
});
