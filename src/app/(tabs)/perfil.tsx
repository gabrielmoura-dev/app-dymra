import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Updates from 'expo-updates';
import { useCallback, useState } from 'react';
import { Alert, Switch, View } from 'react-native';

import { CATALOG_VERSION } from '@/catalog';
import type { Goal } from '@/catalog/types';
import { formatInput, parseNumber, Stepper, TextField } from '@/components/inputs';
import { Button, Card, Chip, Divider, Icon, Row, Screen, Txt } from '@/components/ui';
import { suggestedWaterGoal } from '@/logic/calories';
import { formatDateLong } from '@/logic/dates';
import { GOAL_LABELS } from '@/logic/progression';
import { BackupError, exportBackup, importBackup } from '@/services/backup';
import { connectHealth, healthStatus, openHealthSettings, type HealthStatus } from '@/services/health';
import { syncReminders } from '@/services/notifications';
import { useProfile, useRequiredProfile } from '@/state/profile';
import { useProgram } from '@/state/userCatalog';
import { colors, spacing } from '@/theme';

const GOALS: Goal[] = ['hipertrofia', 'emagrecimento', 'condicionamento'];
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function Linha({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Txt style={{ flex: 1 }}>{label}</Txt>
      {children}
    </Row>
  );
}

export default function Perfil() {
  const db = useSQLiteContext();
  const profile = useRequiredProfile();
  const { update, refresh } = useProfile();
  const [nome, setNome] = useState(profile.nome);
  const [altura, setAltura] = useState(formatInput(profile.alturaCm));
  const [hc, setHc] = useState<HealthStatus>('indisponivel');
  const [busy, setBusy] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      healthStatus().then(setHc);
    }, []),
  );

  const salvarDados = async () => {
    const a = parseNumber(altura);
    await update({ nome: nome.trim() || profile.nome, alturaCm: a && a > 100 && a < 230 ? a : profile.alturaCm });
    Alert.alert('Pronto', 'Dados atualizados.');
  };

  const setLembretes = async (patch: { lembreteAgua?: boolean; lembreteTreinoDias?: number[]; lembreteTreinoHora?: number }) => {
    const next = {
      agua: patch.lembreteAgua ?? profile.lembreteAgua,
      treinoDias: patch.lembreteTreinoDias ?? profile.lembreteTreinoDias,
      treinoHora: patch.lembreteTreinoHora ?? profile.lembreteTreinoHora,
    };
    const ok = await syncReminders(next);
    if (!ok && (next.agua || next.treinoDias.length > 0)) {
      Alert.alert('Notificações bloqueadas', 'Libere as notificações do Dymra nas configurações do Android.');
      return;
    }
    await update(patch);
  };

  const toggleHealth = async (on: boolean) => {
    if (!on) {
      await update({ healthConnect: false });
      return;
    }
    if (hc !== 'disponivel') {
      Alert.alert(
        'Health Connect indisponível',
        hc === 'precisa-atualizar'
          ? 'Atualize o app Health Connect pela Play Store e tente de novo.'
          : 'O Health Connect só funciona no APK instalado no Android (não no Expo Go).',
      );
      return;
    }
    const ok = await connectHealth();
    if (ok) await update({ healthConnect: true });
    else Alert.alert('Sem permissão', 'Libere o acesso do Dymra no Health Connect.', [{ text: 'Abrir Health Connect', onPress: openHealthSettings }, { text: 'Ok' }]);
  };

  const backup = async () => {
    setBusy('backup');
    try {
      await exportBackup(db);
      await refresh();
    } catch (e) {
      Alert.alert('Erro no backup', String(e));
    } finally {
      setBusy(null);
    }
  };

  const restaurar = () =>
    Alert.alert('Restaurar backup?', 'Isso SUBSTITUI todos os dados atuais deste celular pelos do arquivo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Escolher arquivo',
        style: 'destructive',
        onPress: async () => {
          setBusy('restore');
          try {
            if (await importBackup(db)) {
              await refresh();
              Alert.alert('Backup restaurado', 'Seus dados voltaram!');
            }
          } catch (e) {
            Alert.alert('Não deu para restaurar', e instanceof BackupError ? e.message : String(e));
          } finally {
            setBusy(null);
          }
        },
      },
    ]);

  const buscarAtualizacao = async () => {
    if (!Updates.isEnabled) {
      Alert.alert('Atualizações', 'Disponível só no app instalado (APK).');
      return;
    }
    setBusy('update');
    try {
      const r = await Updates.checkForUpdateAsync();
      if (!r.isAvailable) {
        Alert.alert('Tudo em dia', 'Você já está com a versão mais recente.');
        return;
      }
      await Updates.fetchUpdateAsync();
      Alert.alert('Atualização baixada', 'O app vai reiniciar para aplicar.', [{ text: 'Reiniciar', onPress: () => Updates.reloadAsync() }]);
    } catch (e) {
      Alert.alert('Não deu para atualizar', String(e));
    } finally {
      setBusy(null);
    }
  };

  const program = useProgram(profile.programaId);

  return (
    <Screen>
      <Txt variant="h1">Perfil</Txt>

      <Card>
        <Txt variant="h3">Seus dados</Txt>
        <TextField label="Nome" value={nome} onChangeText={setNome} />
        <Row gap={spacing.md}>
          <TextField label="Altura" value={altura} onChangeText={setAltura} keyboardType="number-pad" suffix="cm" />
          <View style={{ flex: 1, gap: 6 }}>
            <Txt variant="label">Peso</Txt>
            <Button small variant="secondary" title={`${formatInput(profile.pesoKg)} kg · atualizar`} onPress={() => router.push('/corpo')} />
          </View>
        </Row>
        <Button small variant="secondary" title="Salvar dados" onPress={salvarDados} />
        <Divider />
        <Txt variant="label">Objetivo</Txt>
        <Row wrap>
          {GOALS.map((g) => (
            <Chip key={g} label={GOAL_LABELS[g]} active={profile.objetivo === g} onPress={() => update({ objetivo: g })} />
          ))}
        </Row>
        <Divider />
        <Linha label="Ficha atual">
          <Chip label={program?.nome ?? 'Nenhuma'} onPress={() => router.push('/treinos')} />
        </Linha>
      </Card>

      <Card>
        <Txt variant="h3">Treino</Txt>
        <Txt variant="label">Descanso padrão (quando a ficha não define)</Txt>
        <Stepper
          value={profile.descansoPadraoSeg}
          onChange={(v) => v != null && update({ descansoPadraoSeg: Math.max(15, Math.round(v)) })}
          step={15}
          min={15}
          suffix="s"
          decimals={false}
        />
        <Linha label="Sugerir séries de aquecimento">
          <Switch
            value={profile.sugerirAquecimento}
            onValueChange={(v) => update({ sugerirAquecimento: v })}
            trackColor={{ true: colors.accent, false: colors.surface2 }}
          />
        </Linha>
        <Txt variant="tiny">
          No primeiro exercício pesado de pernas e no de tronco: 1×12 com metade da carga e, acima de 30 kg, mais 1×6 com 3/4.
        </Txt>
      </Card>

      <Card>
        <Txt variant="h3">Água</Txt>
        <Txt variant="label">Meta diária</Txt>
        <Stepper
          value={profile.metaAguaMl}
          onChange={(v) => v != null && update({ metaAguaMl: Math.max(500, Math.round(v)) })}
          step={250}
          min={500}
          suffix="ml"
          decimals={false}
        />
        <Txt variant="tiny">Sugestão para o seu peso: {suggestedWaterGoal(profile.pesoKg)} ml (35 ml por kg).</Txt>
        <Linha label="Lembretes a cada 2 h (9h–19h)">
          <Switch
            value={profile.lembreteAgua}
            onValueChange={(v) => setLembretes({ lembreteAgua: v })}
            trackColor={{ true: colors.water, false: colors.surface2 }}
          />
        </Linha>
      </Card>

      <Card>
        <Txt variant="h3">Lembrete de treino</Txt>
        <Row wrap gap={6}>
          {DIAS.map((d, i) => {
            const on = profile.lembreteTreinoDias.includes(i);
            return (
              <Chip
                key={d}
                label={d}
                active={on}
                onPress={() =>
                  setLembretes({
                    lembreteTreinoDias: on
                      ? profile.lembreteTreinoDias.filter((x) => x !== i)
                      : [...profile.lembreteTreinoDias, i].sort(),
                  })
                }
              />
            );
          })}
        </Row>
        <Txt variant="label">Horário</Txt>
        <Stepper
          value={profile.lembreteTreinoHora}
          onChange={(v) => v != null && setLembretes({ lembreteTreinoHora: Math.min(23, Math.max(5, Math.round(v))) })}
          step={1}
          min={5}
          suffix="h"
          decimals={false}
        />
      </Card>

      <Card>
        <Row>
          <Icon name="heart-circle-outline" color={colors.danger} />
          <Txt variant="h3">Health Connect</Txt>
        </Row>
        <Txt variant="small" color={colors.muted}>
          Salva seus treinos, peso e água no Health Connect e lê calorias e frequência cardíaca do relógio para o resumo do treino.
        </Txt>
        <Linha label={hc === 'disponivel' ? 'Conectar' : hc === 'precisa-atualizar' ? 'Atualize o Health Connect' : 'Indisponível neste aparelho'}>
          <Switch
            value={profile.healthConnect}
            onValueChange={toggleHealth}
            trackColor={{ true: colors.danger, false: colors.surface2 }}
          />
        </Linha>
        {profile.healthConnect ? <Button small variant="ghost" title="Gerenciar permissões" onPress={openHealthSettings} /> : null}
      </Card>

      <Card>
        <Row>
          <Icon name="cloud-upload-outline" color={colors.violet} />
          <Txt variant="h3">Backup</Txt>
        </Row>
        <Txt variant="small" color={colors.muted}>
          Seus dados ficam só neste celular. Faça backup e salve no Google Drive ou mande para você no WhatsApp. As fotos de progresso não entram no backup.
        </Txt>
        <Txt variant="tiny">
          Último backup: {profile.ultimoBackupEm ? formatDateLong(profile.ultimoBackupEm) : 'nunca'}
        </Txt>
        <Row>
          <Button title="Fazer backup" variant="violet" onPress={backup} loading={busy === 'backup'} style={{ flex: 1 }} />
          <Button title="Restaurar" variant="ghost" onPress={restaurar} loading={busy === 'restore'} style={{ flex: 1 }} />
        </Row>
      </Card>

      <Card>
        <Txt variant="h3">Sobre</Txt>
        <Txt variant="small" color={colors.muted}>
          Dymra {Constants.expoConfig?.version ?? ''} · catálogo {CATALOG_VERSION}
        </Txt>
        <Txt variant="tiny">Atualização: {Updates.updateId ? Updates.updateId.slice(0, 8) : 'versão do APK'}</Txt>
        <Button small variant="secondary" icon="refresh" title="Procurar atualização" onPress={buscarAtualizacao} loading={busy === 'update'} />
      </Card>
    </Screen>
  );
}
