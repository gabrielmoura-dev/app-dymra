import { Platform } from 'react-native';

/**
 * Integração com o Health Connect do Android.
 * O módulo nativo só existe no APK (development build); no Expo Go e na web
 * todas as funções falham silenciosamente e o app usa a estimativa por MET.
 */
type HC = typeof import('react-native-health-connect');

let cached: HC | null | undefined;

function hc(): HC | null {
  if (cached !== undefined) return cached;
  if (Platform.OS !== 'android') {
    cached = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('react-native-health-connect') as HC;
  } catch {
    cached = null;
  }
  return cached;
}

export type HealthStatus = 'indisponivel' | 'precisa-atualizar' | 'disponivel';

export async function healthStatus(): Promise<HealthStatus> {
  const m = hc();
  if (!m) return 'indisponivel';
  try {
    const s = await m.getSdkStatus();
    if (s === m.SdkAvailabilityStatus.SDK_AVAILABLE) return 'disponivel';
    if (s === m.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return 'precisa-atualizar';
    return 'indisponivel';
  } catch {
    return 'indisponivel';
  }
}

async function ready(): Promise<HC | null> {
  const m = hc();
  if (!m) return null;
  try {
    return (await m.initialize()) ? m : null;
  } catch {
    return null;
  }
}

/** Pede as permissões. Retorna true se ao menos a gravação de treinos foi liberada. */
export async function connectHealth(): Promise<boolean> {
  const m = await ready();
  if (!m) return false;
  try {
    const granted = await m.requestPermission([
      { accessType: 'write', recordType: 'ExerciseSession' },
      { accessType: 'write', recordType: 'Weight' },
      { accessType: 'read', recordType: 'Weight' },
      { accessType: 'write', recordType: 'Hydration' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'TotalCaloriesBurned' },
      { accessType: 'read', recordType: 'HeartRate' },
    ]);
    return granted.some((p) => 'recordType' in p && p.recordType === 'ExerciseSession' && p.accessType === 'write');
  } catch {
    return false;
  }
}

export function openHealthSettings() {
  try {
    hc()?.openHealthConnectSettings();
  } catch {
    // ignorado
  }
}

export interface WatchStats {
  kcal: number | null;
  fcMedia: number | null;
  fcMax: number | null;
}

/** Lê calorias e frequência cardíaca do relógio no intervalo do treino. */
export async function readWorkoutStats(startIso: string, endIso: string): Promise<WatchStats> {
  const empty: WatchStats = { kcal: null, fcMedia: null, fcMax: null };
  const m = await ready();
  if (!m) return empty;
  const timeRangeFilter = { operator: 'between' as const, startTime: startIso, endTime: endIso };
  const out: WatchStats = { ...empty };
  try {
    const active = await m.aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter });
    const kcal = active.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? 0;
    if (kcal > 0) out.kcal = kcal;
  } catch {
    // sem permissão ou sem dados
  }
  try {
    const hr = await m.aggregateRecord({ recordType: 'HeartRate', timeRangeFilter });
    if (hr.MEASUREMENTS_COUNT > 0) {
      out.fcMedia = hr.BPM_AVG;
      out.fcMax = hr.BPM_MAX;
    }
  } catch {
    // sem permissão ou sem dados
  }
  return out;
}

export async function writeWorkout(startIso: string, endIso: string, title: string): Promise<boolean> {
  const m = await ready();
  if (!m) return false;
  try {
    await m.insertRecords([
      {
        recordType: 'ExerciseSession',
        startTime: startIso,
        endTime: endIso,
        exerciseType: m.ExerciseType.STRENGTH_TRAINING,
        title,
        metadata: { recordingMethod: m.RecordingMethod.RECORDING_METHOD_ACTIVELY_RECORDED },
      },
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function writeWeight(kg: number): Promise<boolean> {
  const m = await ready();
  if (!m) return false;
  try {
    await m.insertRecords([
      {
        recordType: 'Weight',
        time: new Date().toISOString(),
        weight: { value: kg, unit: 'kilograms' },
        metadata: { recordingMethod: m.RecordingMethod.RECORDING_METHOD_MANUAL_ENTRY },
      },
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function writeHydration(ml: number): Promise<boolean> {
  const m = await ready();
  if (!m) return false;
  const end = new Date();
  const start = new Date(end.getTime() - 60_000);
  try {
    await m.insertRecords([
      {
        recordType: 'Hydration',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        volume: { value: ml, unit: 'milliliters' },
        metadata: { recordingMethod: m.RecordingMethod.RECORDING_METHOD_MANUAL_ENTRY },
      },
    ]);
    return true;
  } catch {
    return false;
  }
}
