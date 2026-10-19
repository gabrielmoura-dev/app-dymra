import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { getExercise, MUSCLE_LABELS } from '@/catalog';
import { formatInput, parseNumber, TextField } from '@/components/inputs';
import { LineChart } from '@/components/LineChart';
import { Button, Card, Chip, Empty, Icon, Row, Screen, Txt } from '@/components/ui';
import {
  addBodyMeasure,
  addProgressPhoto,
  deleteBodyMeasure,
  deleteProgressPhoto,
  getCompletedSetsSince,
  listBodyMeasures,
  listProgressPhotos,
  listSessionDates,
  type BodyMeasure,
  type BodyMeasureInput,
  type PhotoPose,
  type ProgressPhoto,
} from '@/db/repo';
import { buildClaudePrompt } from '@/logic/claudePrompt';
import { daysAgo, formatDateShort } from '@/logic/dates';
import { weeklyVolume } from '@/logic/recovery';
import { formatKg } from '@/logic/strength';
import { writeWeight } from '@/services/health';
import { deletePhotoFile, photoUri, pickPhotoFromGallery } from '@/services/photos';
import { shareToClaude } from '@/services/shareClaude';
import { useProfile, useRequiredProfile } from '@/state/profile';
import { colors, radius, spacing } from '@/theme';

type MeasureKey = keyof BodyMeasureInput;

const FIELDS: { key: MeasureKey; label: string; unit: string }[] = [
  { key: 'pesoKg', label: 'Peso', unit: 'kg' },
  { key: 'cinturaCm', label: 'Cintura', unit: 'cm' },
  { key: 'quadrilCm', label: 'Quadril', unit: 'cm' },
  { key: 'peitoCm', label: 'Peito/busto', unit: 'cm' },
  { key: 'bracoCm', label: 'Braço', unit: 'cm' },
  { key: 'coxaCm', label: 'Coxa', unit: 'cm' },
  { key: 'panturrilhaCm', label: 'Panturrilha', unit: 'cm' },
  { key: 'gorduraPct', label: 'Gordura', unit: '%' },
];

const POSES: PhotoPose[] = ['frente', 'lado', 'costas'];

export default function Corpo() {
  const db = useSQLiteContext();
  const profile = useRequiredProfile();
  const { refresh } = useProfile();
  const [measures, setMeasures] = useState<BodyMeasure[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [form, setForm] = useState<Partial<Record<MeasureKey, string>>>({});
  const [showForm, setShowForm] = useState(false);
  const [chartKey, setChartKey] = useState<MeasureKey>('pesoKg');
  const [pose, setPose] = useState<PhotoPose>('frente');
  const [comparar, setComparar] = useState(false);

  const load = useCallback(async () => {
    setMeasures(await listBodyMeasures(db));
    setPhotos(await listProgressPhotos(db));
  }, [db]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const salvarMedidas = async () => {
    const m: BodyMeasureInput = {};
    for (const f of FIELDS) {
      const n = parseNumber(form[f.key] ?? '');
      if (n != null && n > 0) m[f.key] = n;
    }
    if (Object.keys(m).length === 0) return;
    await addBodyMeasure(db, m);
    if (m.pesoKg != null) {
      await refresh();
      if (profile.healthConnect) writeWeight(m.pesoKg);
    }
    setForm({});
    setShowForm(false);
    load();
  };

  const abrirForm = () => {
    const last = measures[measures.length - 1];
    const init: Partial<Record<MeasureKey, string>> = {};
    for (const f of FIELDS) init[f.key] = last ? formatInput(last[f.key]) : '';
    if (!init.pesoKg) init.pesoKg = formatInput(profile.pesoKg);
    setForm(init);
    setShowForm(true);
  };

  const fotosPose = photos.filter((p) => p.pose === pose);

  const analisar = async (foto: ProgressPhoto) => {
    const sets = await getCompletedSetsSince(db, daysAgo(7).toISOString());
    const sessoes = await listSessionDates(db, daysAgo(30).toISOString());
    const last = [...measures].reverse().find((m) => m.cinturaCm || m.quadrilCm);
    const prompt = buildClaudePrompt({
      nome: profile.nome,
      objetivo: profile.objetivo,
      sexo: profile.sexo,
      alturaCm: profile.alturaCm,
      pesos: measures.filter((m) => m.pesoKg != null).map((m) => ({ data: m.data, pesoKg: m.pesoKg as number })),
      medidas: last ? { data: last.data, cinturaCm: last.cinturaCm, quadrilCm: last.quadrilCm } : null,
      volumeSemanal: weeklyVolume(sets, getExercise),
      muscleLabels: MUSCLE_LABELS,
      treinos30dias: sessoes.length,
      pose: foto.pose,
      temFotoAnterior: photos.filter((p) => p.pose === foto.pose).length > 1,
    });
    const r = await shareToClaude(photoUri(foto.arquivo), prompt);
    Alert.alert(
      'Analisar no Claude',
      r === 'compartilhado'
        ? 'Escolha o app do Claude na lista. O texto também foi copiado: se ele não aparecer junto com a foto, é só colar na conversa.'
        : 'O texto foi copiado. Abra o app do Claude, anexe a foto e cole o texto.',
    );
  };

  const acoesFoto = (foto: ProgressPhoto) =>
    Alert.alert(`Foto de ${formatDateShort(foto.data)}`, undefined, [
      { text: 'Analisar no Claude', onPress: () => analisar(foto) },
      {
        text: 'Apagar foto',
        style: 'destructive',
        onPress: async () => {
          await deleteProgressPhoto(db, foto.id);
          deletePhotoFile(foto.arquivo);
          load();
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);

  const daGaleria = async () => {
    const nome = await pickPhotoFromGallery();
    if (nome) {
      await addProgressPhoto(db, nome, pose);
      load();
    }
  };

  const chartField = FIELDS.find((f) => f.key === chartKey)!;
  const pontos = measures
    .filter((m) => m[chartKey] != null)
    .map((m) => ({ data: m.data, valor: m[chartKey] as number }));

  return (
    <Screen edges={['bottom']}>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="h3">Medidas</Txt>
          {!showForm ? <Button small title="Registrar" icon="add" onPress={abrirForm} /> : null}
        </Row>
        {showForm ? (
          <View style={{ gap: spacing.sm }}>
            <Txt variant="tiny">Meça sempre no mesmo horário (de manhã, em jejum, é o ideal). Deixe em branco o que não mediu.</Txt>
            {[0, 2, 4, 6].map((i) => (
              <Row key={i} gap={spacing.md}>
                {FIELDS.slice(i, i + 2).map((f) => (
                  <TextField
                    key={f.key}
                    label={f.label}
                    value={form[f.key] ?? ''}
                    onChangeText={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
                    keyboardType="decimal-pad"
                    suffix={f.unit}
                  />
                ))}
              </Row>
            ))}
            <Row>
              <Button variant="ghost" title="Cancelar" onPress={() => setShowForm(false)} style={{ flex: 1 }} />
              <Button title="Salvar" onPress={salvarMedidas} style={{ flex: 1 }} />
            </Row>
          </View>
        ) : null}
        <Row wrap gap={6}>
          {FIELDS.map((f) => (
            <Chip key={f.key} label={f.label} active={chartKey === f.key} onPress={() => setChartKey(f.key)} />
          ))}
        </Row>
        <LineChart points={pontos} unit={chartField.unit} color={colors.violet} />
        {measures
          .slice()
          .reverse()
          .slice(0, 6)
          .map((m) => (
            <Pressable
              key={m.id}
              onLongPress={() =>
                Alert.alert('Apagar registro?', undefined, [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Apagar',
                    style: 'destructive',
                    onPress: async () => {
                      await deleteBodyMeasure(db, m.id);
                      load();
                    },
                  },
                ])
              }>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt variant="small" color={colors.muted}>
                  {formatDateShort(m.data)}
                </Txt>
                <Txt variant="small" numberOfLines={1} style={{ flex: 1, textAlign: 'right' }}>
                  {FIELDS.filter((f) => m[f.key] != null)
                    .map((f) => `${f.label} ${formatKg(m[f.key] as number)}${f.unit === '%' ? '%' : ` ${f.unit}`}`)
                    .join(' · ')}
                </Txt>
              </Row>
            </Pressable>
          ))}
      </Card>

      <Card>
        <Txt variant="h3">Fotos de progresso</Txt>
        <Txt variant="tiny">Ficam só no seu celular. A câmera do app mostra a foto anterior por cima para você alinhar.</Txt>
        <Row>
          {POSES.map((p) => (
            <Chip key={p} label={p[0].toUpperCase() + p.slice(1)} active={pose === p} onPress={() => setPose(p)} />
          ))}
        </Row>
        <Row>
          <Button
            icon="camera"
            title="Tirar foto"
            onPress={() => router.push({ pathname: '/camera-foto', params: { pose } })}
            style={{ flex: 1 }}
          />
          <Button icon="images-outline" variant="secondary" title="Galeria" onPress={daGaleria} style={{ flex: 1 }} />
        </Row>
        {fotosPose.length >= 2 ? (
          <Button
            small
            variant="ghost"
            icon="git-compare-outline"
            title={comparar ? 'Fechar comparação' : 'Comparar primeira × última'}
            onPress={() => setComparar((v) => !v)}
          />
        ) : null}
        {comparar && fotosPose.length >= 2 ? (
          <Row gap={spacing.sm}>
            {[fotosPose[fotosPose.length - 1], fotosPose[0]].map((f, i) => (
              <View key={f.id} style={{ flex: 1, gap: 4 }}>
                <Image source={{ uri: photoUri(f.arquivo) }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.md }} />
                <Txt variant="tiny" center>
                  {i === 0 ? 'Antes' : 'Agora'} · {formatDateShort(f.data)}
                </Txt>
              </View>
            ))}
          </Row>
        ) : null}
        {fotosPose.length === 0 ? (
          <Empty icon="image-outline" title="Nenhuma foto desta pose" />
        ) : (
          <Row wrap gap={spacing.sm}>
            {fotosPose.map((f) => (
              <Pressable key={f.id} onPress={() => acoesFoto(f)} style={{ width: '31%' }}>
                <Image source={{ uri: photoUri(f.arquivo) }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.sm }} />
                <Txt variant="tiny" center>
                  {formatDateShort(f.data)}
                </Txt>
              </Pressable>
            ))}
          </Row>
        )}
      </Card>

      {photos.length > 0 ? (
        <Card tone="violet">
          <Row style={{ alignItems: 'flex-start' }}>
            <Icon name="sparkles" color={colors.violet} />
            <View style={{ flex: 1, gap: 4 }}>
              <Txt variant="h3">Analisar no Claude</Txt>
              <Txt variant="small" color={colors.muted}>
                Toque numa foto e escolha “Analisar no Claude”. O Dymra monta um texto com seu objetivo, peso e treinos e
                abre o compartilhamento: você envia pelo app do Claude, usando o seu próprio plano.
              </Txt>
            </View>
          </Row>
        </Card>
      ) : null}
    </Screen>
  );
}
