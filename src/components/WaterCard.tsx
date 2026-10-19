import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { addWater, getWaterTotal, undoLastWater } from '@/db/repo';
import { writeHydration } from '@/services/health';
import { colors } from '@/theme';

import { Button, Card, Icon, ProgressBar, Row, Txt } from './ui';

export function WaterCard({ metaMl, healthConnect }: { metaMl: number; healthConnect: boolean }) {
  const db = useSQLiteContext();
  const [total, setTotal] = useState(0);

  const load = useCallback(() => {
    getWaterTotal(db).then(setTotal);
  }, [db]);
  useFocusEffect(load);

  const add = async (ml: number) => {
    await addWater(db, ml);
    load();
    if (healthConnect) writeHydration(ml);
  };
  const undo = async () => {
    await undoLastWater(db);
    load();
  };

  const pct = metaMl > 0 ? total / metaMl : 0;
  return (
    <Card tone={pct >= 1 ? 'water' : 'default'}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row>
          <Icon name="water" color={colors.water} />
          <Txt variant="h3">Água</Txt>
        </Row>
        <Txt color={colors.muted}>
          <Txt bold color={colors.text}>
            {(total / 1000).toFixed(2).replace('.', ',')} L
          </Txt>{' '}
          / {(metaMl / 1000).toFixed(1).replace('.', ',')} L
        </Txt>
      </Row>
      <ProgressBar value={pct} color={colors.water} height={10} />
      {pct >= 1 ? (
        <Txt variant="small" color={colors.water}>
          Meta do dia batida! 🎉
        </Txt>
      ) : null}
      <Row>
        <Button small variant="secondary" title="+250 ml" onPress={() => add(250)} style={{ flex: 1 }} />
        <Button small variant="secondary" title="+500 ml" onPress={() => add(500)} style={{ flex: 1 }} />
        <Button small variant="ghost" icon="arrow-undo" title="" onPress={undo} />
      </Row>
    </Card>
  );
}
