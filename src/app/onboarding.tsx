import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';

import { EXERCISES, PROGRAMS } from '@/catalog';
import type { Goal, Sex } from '@/catalog/types';
import { notify } from '@/components/confirm';
import { parseNumber, TextField } from '@/components/inputs';
import { DEFAULT_WIZARD, ProgramWizard, type WizardChoice } from '@/components/ProgramWizard';
import { Button, Card, Chip, Icon, Row, Screen, Txt } from '@/components/ui';
import { createProfile } from '@/db/repo';
import { suggestedWaterGoal } from '@/logic/calories';
import { emptyProgram, generateProgram } from '@/logic/programGenerator';
import { GOAL_LABELS } from '@/logic/progression';
import { useProfile } from '@/state/profile';
import { newCustomProgramId, saveCustomProgram } from '@/state/userCatalog';
import { colors, spacing } from '@/theme';

const GOALS: Goal[] = ['hipertrofia', 'emagrecimento', 'condicionamento'];
/** Atalhos para quem vai usar o app. */
const NOMES = ['Gabriel', 'Rita'];

type Modo = 'gerar' | 'pronta' | 'pular';

function OpcaoTreino({
  icon,
  titulo,
  texto,
  ativo,
  onPress,
}: {
  icon: 'sparkles' | 'list' | 'construct-outline';
  titulo: string;
  texto: string;
  ativo: boolean;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} tone={ativo ? 'accent' : 'default'} style={{ paddingVertical: 14 }}>
      <Row style={{ alignItems: 'flex-start' }}>
        <Icon name={icon} color={ativo ? colors.accent : colors.muted} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="h3">{titulo}</Txt>
          <Txt variant="small" color={colors.muted}>
            {texto}
          </Txt>
        </View>
      </Row>
    </Card>
  );
}

export default function Onboarding() {
  const db = useSQLiteContext();
  const { refresh } = useProfile();
  const [etapa, setEtapa] = useState<'dados' | 'treino'>('dados');
  const [nome, setNome] = useState('');
  const [sexo, setSexo] = useState<Sex | null>(null);
  const [objetivo, setObjetivo] = useState<Goal>('hipertrofia');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [modo, setModo] = useState<Modo>('gerar');
  const [wizard, setWizard] = useState<WizardChoice>(DEFAULT_WIZARD);
  const [prontaId, setProntaId] = useState<string>(PROGRAMS[0]?.id ?? '');
  const [fichaId] = useState(newCustomProgramId);
  const [salvando, setSalvando] = useState(false);

  const nomeLimpo = nome.trim();
  const pesoN = parseNumber(peso);
  const alturaN = parseNumber(altura);
  const valido =
    nomeLimpo.length > 0 && sexo != null && pesoN != null && pesoN > 25 && pesoN < 300 && alturaN != null && alturaN > 100 && alturaN < 230;

  const preview = generateProgram({ nome: nomeLimpo, objetivo, ...wizard }, EXERCISES, fichaId);

  const continuar = () => {
    // Se já existe uma ficha do catálogo com o nome da pessoa, ela vem marcada.
    const minha = PROGRAMS.find((p) => p.dono.toLowerCase() === nomeLimpo.toLowerCase());
    if (minha) {
      setProntaId(minha.id);
      setModo('pronta');
    }
    setEtapa('treino');
  };

  const salvar = async () => {
    if (!valido || pesoN == null || alturaN == null || sexo == null) return;
    setSalvando(true);
    try {
      let programaId: string | null = null;
      if (modo === 'gerar') {
        await saveCustomProgram(db, preview);
        programaId = preview.id;
      } else if (modo === 'pular') {
        await saveCustomProgram(db, emptyProgram(nomeLimpo, fichaId));
        programaId = fichaId;
      } else {
        programaId = prontaId || null;
      }
      await createProfile(db, {
        nome: nomeLimpo,
        sexo,
        objetivo,
        pesoKg: pesoN,
        alturaCm: alturaN,
        metaAguaMl: suggestedWaterGoal(pesoN),
        programaId,
      });
      await refresh();
      router.replace('/');
      // Abre o editor por cima da tela Hoje (depois que a troca de tela termina), para o "voltar" funcionar.
      if (modo === 'pular') setTimeout(() => router.push(`/ficha/${fichaId}`), 300);
    } catch (e) {
      notify('Não deu para salvar', String(e));
      setSalvando(false);
    }
  };

  if (etapa === 'dados') {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={{ gap: spacing.xs, marginTop: spacing.lg }}>
          <Txt variant="h1">
            Boas-vindas ao <Txt variant="h1" color={colors.accent}>Dymra</Txt>
          </Txt>
          <Txt color={colors.muted}>Alguns dados para personalizar seu treino. Tudo fica só no seu celular.</Txt>
        </View>

        <Card>
          <Txt variant="label">Quem está usando?</Txt>
          <Row wrap>
            {NOMES.map((n) => (
              <Chip key={n} label={n} active={nomeLimpo === n} onPress={() => setNome(n)} />
            ))}
          </Row>
          <TextField label="Nome" value={nome} onChangeText={setNome} placeholder="Nome ou apelido" />
          <Txt variant="label" style={{ marginTop: spacing.sm }}>
            Corpo (para o mapa muscular e calorias)
          </Txt>
          <Row>
            <Chip label="Feminino" active={sexo === 'feminino'} onPress={() => setSexo('feminino')} />
            <Chip label="Masculino" active={sexo === 'masculino'} onPress={() => setSexo('masculino')} />
          </Row>
          <Row gap={spacing.md} style={{ marginTop: spacing.sm }}>
            <TextField label="Peso" value={peso} onChangeText={setPeso} keyboardType="decimal-pad" suffix="kg" placeholder="60" />
            <TextField label="Altura" value={altura} onChangeText={setAltura} keyboardType="number-pad" suffix="cm" placeholder="165" />
          </Row>
        </Card>

        <Card>
          <Txt variant="label">Objetivo principal</Txt>
          <Row wrap>
            {GOALS.map((g) => (
              <Chip key={g} label={GOAL_LABELS[g]} active={objetivo === g} onPress={() => setObjetivo(g)} />
            ))}
          </Row>
          <Txt variant="tiny">Define a faixa de repetições e o tipo de sugestão.</Txt>
        </Card>

        <Button title="Continuar" icon="arrow-forward" onPress={continuar} disabled={!valido} />
        {!valido ? (
          <Txt variant="tiny" center>
            Preencha nome, corpo, peso e altura para continuar.
          </Txt>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ gap: spacing.xs, marginTop: spacing.lg }}>
        <Txt variant="h1">Seu treino, {nomeLimpo}</Txt>
        <Txt color={colors.muted}>Escolha como quer começar. Dá para mudar tudo depois em Fichas.</Txt>
      </View>

      <OpcaoTreino
        icon="sparkles"
        titulo="Montar uma ficha para mim"
        texto="Responda 3 perguntas e o app monta os treinos com as máquinas da academia."
        ativo={modo === 'gerar'}
        onPress={() => setModo('gerar')}
      />
      {modo === 'gerar' ? (
        <Card>
          <ProgramWizard value={wizard} onChange={setWizard} preview={preview} />
        </Card>
      ) : null}

      <OpcaoTreino
        icon="list"
        titulo="Usar uma ficha pronta"
        texto="Fichas que chegam pelas atualizações do app."
        ativo={modo === 'pronta'}
        onPress={() => setModo('pronta')}
      />
      {modo === 'pronta' ? (
        <Card>
          {PROGRAMS.map((p) => (
            <Card
              key={p.id}
              onPress={() => setProntaId(p.id)}
              tone={prontaId === p.id ? 'accent' : 'default'}
              style={{ backgroundColor: prontaId === p.id ? colors.accentSoft : colors.surface2 }}>
              <Txt variant="h3">{p.nome}</Txt>
              <Txt variant="small" color={colors.muted}>
                {p.descricao}
              </Txt>
              <Txt variant="tiny">
                {p.dias.length} treinos · de {p.dono}
              </Txt>
            </Card>
          ))}
        </Card>
      ) : null}

      <OpcaoTreino
        icon="construct-outline"
        titulo="Pular e montar o meu"
        texto="Começa com uma ficha vazia para você escolher cada exercício, séries e descanso."
        ativo={modo === 'pular'}
        onPress={() => setModo('pular')}
      />

      <Button title={modo === 'pular' ? 'Montar minha ficha' : 'Começar'} icon="arrow-forward" onPress={salvar} loading={salvando} />
      <Button title="Voltar" variant="ghost" onPress={() => setEtapa('dados')} />
    </Screen>
  );
}
