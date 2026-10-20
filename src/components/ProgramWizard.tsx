import { View } from 'react-native';

import { getExercise } from '@/catalog';
import type { Program } from '@/catalog/types';
import {
  FOCO_LABELS,
  type DiasPorSemana,
  type DuracaoTreino,
  type FocoTreino,
} from '@/logic/programGenerator';
import { colors } from '@/theme';

import { Card, Chip, Row, Txt } from './ui';

export interface WizardChoice {
  dias: DiasPorSemana;
  duracaoMin: DuracaoTreino;
  foco: FocoTreino;
}

export const DEFAULT_WIZARD: WizardChoice = { dias: 3, duracaoMin: 45, foco: 'equilibrado' };

const DIAS: DiasPorSemana[] = [2, 3, 4, 5];
const DURACOES: DuracaoTreino[] = [30, 45, 60];
const FOCOS: FocoTreino[] = ['equilibrado', 'inferiores', 'superiores'];

/** Perguntas para gerar a ficha + prévia do que vai ser criado. */
export function ProgramWizard({
  value,
  onChange,
  preview,
}: {
  value: WizardChoice;
  onChange: (v: WizardChoice) => void;
  preview: Program;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Txt variant="label">Quantos dias por semana?</Txt>
      <Row wrap>
        {DIAS.map((d) => (
          <Chip key={d} label={`${d} dias`} active={value.dias === d} onPress={() => onChange({ ...value, dias: d })} />
        ))}
      </Row>
      <Txt variant="label">Quanto tempo por treino?</Txt>
      <Row wrap>
        {DURACOES.map((d) => (
          <Chip key={d} label={`${d} min`} active={value.duracaoMin === d} onPress={() => onChange({ ...value, duracaoMin: d })} />
        ))}
      </Row>
      <Txt variant="label">Prioridade</Txt>
      <Row wrap>
        {FOCOS.map((f) => (
          <Chip key={f} label={FOCO_LABELS[f]} active={value.foco === f} onPress={() => onChange({ ...value, foco: f })} />
        ))}
      </Row>

      <Txt variant="label" style={{ marginTop: 4 }}>
        Prévia
      </Txt>
      {preview.dias.map((d) => (
        <Card key={d.id} style={{ backgroundColor: colors.surface2, paddingVertical: 12, gap: 4 }}>
          <Txt bold>
            {d.nome} · {d.foco}
          </Txt>
          <Txt variant="tiny">{d.exercicios.map((r) => getExercise(r.exercicioId)?.nome).join(' · ')}</Txt>
        </Card>
      ))}
      <Txt variant="tiny">Depois dá para trocar, tirar ou adicionar exercícios em Fichas.</Txt>
    </View>
  );
}
