import type { SQLiteDatabase } from 'expo-sqlite';
import { useMemo } from 'react';
import { create } from 'zustand';

import { getProgram, PROGRAMS } from '@/catalog';
import type { Program } from '@/catalog/types';
import {
  deleteCustomProgram,
  listCustomPrograms,
  listFavoriteExercises,
  listMachineSteps,
  setFavoriteExercise,
  setMachineStep,
  upsertCustomProgram,
} from '@/db/repo';

/** O que cada pessoa cria no próprio celular: fichas, passo de carga das máquinas e favoritos. */
interface UserCatalogState {
  programs: Program[];
  steps: Record<string, number>;
  /** Ids dos exercícios favoritos, do mais recente para o mais antigo. */
  favoritos: string[];
}

export const useUserCatalog = create<UserCatalogState>(() => ({ programs: [], steps: {}, favoritos: [] }));

export async function loadUserCatalog(db: SQLiteDatabase) {
  const [programs, steps, favoritos] = await Promise.all([
    listCustomPrograms(db),
    listMachineSteps(db),
    listFavoriteExercises(db),
  ]);
  useUserCatalog.setState({ programs, steps, favoritos });
}

/** Marca ou desmarca um exercício como favorito (a tela muda na hora). */
export async function toggleFavorite(db: SQLiteDatabase, exercicioId: string) {
  const era = useUserCatalog.getState().favoritos.includes(exercicioId);
  useUserCatalog.setState((s) => ({
    favoritos: era ? s.favoritos.filter((id) => id !== exercicioId) : [exercicioId, ...s.favoritos],
  }));
  await setFavoriteExercise(db, exercicioId, !era);
}

export function useIsFavorite(exercicioId: string): boolean {
  return useUserCatalog((s) => s.favoritos.includes(exercicioId));
}

export function useFavorites(): string[] {
  return useUserCatalog((s) => s.favoritos);
}

function setProgramInState(p: Program) {
  useUserCatalog.setState((s) => ({
    programs: s.programs.some((x) => x.id === p.id) ? s.programs.map((x) => (x.id === p.id ? p : x)) : [...s.programs, p],
  }));
}

export async function saveCustomProgram(db: SQLiteDatabase, p: Program) {
  cancelPendingSave(p.id);
  setProgramInState(p);
  await upsertCustomProgram(db, p);
}

/** Gravações adiadas do editor de fichas, por id da ficha. */
const pendingSaves = new Map<string, { timer: ReturnType<typeof setTimeout>; flush: () => Promise<void> }>();
const SAVE_DELAY_MS = 400;

function cancelPendingSave(id: string) {
  const p = pendingSaves.get(id);
  if (p) {
    clearTimeout(p.timer);
    pendingSaves.delete(id);
  }
}

/**
 * Para edição contínua (digitar o nome, apertar − / +): a tela atualiza na hora
 * e o banco é gravado uma vez só, quando a pessoa para de mexer.
 */
export function saveCustomProgramDebounced(db: SQLiteDatabase, p: Program) {
  cancelPendingSave(p.id);
  setProgramInState(p);
  const flush = async () => {
    pendingSaves.delete(p.id);
    await upsertCustomProgram(db, p);
  };
  pendingSaves.set(p.id, { timer: setTimeout(() => flush().catch(() => {}), SAVE_DELAY_MS), flush });
}

/** Grava agora o que estiver adiado (ao sair do editor). */
export async function flushPendingSaves() {
  const all = [...pendingSaves.values()];
  for (const p of all) clearTimeout(p.timer);
  await Promise.all(all.map((p) => p.flush()));
}

export async function removeCustomProgram(db: SQLiteDatabase, id: string) {
  cancelPendingSave(id);
  useUserCatalog.setState((s) => ({ programs: s.programs.filter((x) => x.id !== id) }));
  await deleteCustomProgram(db, id);
}

export async function saveMachineStep(db: SQLiteDatabase, maquinaId: string, passoKg: number | null) {
  useUserCatalog.setState((s) => {
    const steps = { ...s.steps };
    if (passoKg == null) delete steps[maquinaId];
    else steps[maquinaId] = passoKg;
    return { steps };
  });
  await setMachineStep(db, maquinaId, passoKg);
}

export function newCustomProgramId(): string {
  return `minha-${Date.now().toString(36)}`;
}

export function isCustomProgramId(id: string | null | undefined): boolean {
  return !!id && id.startsWith('minha-');
}

/** Fichas criadas no celular primeiro, depois as do catálogo. */
export function usePrograms(): Program[] {
  const custom = useUserCatalog((s) => s.programs);
  return useMemo(() => [...custom, ...PROGRAMS], [custom]);
}

export function useProgram(id: string | null | undefined): Program | undefined {
  const custom = useUserCatalog((s) => s.programs);
  return getProgram(id, custom);
}

export function useStepOverrides(): Record<string, number> {
  return useUserCatalog((s) => s.steps);
}

/** Para código fora de componentes (ex.: montar a sessão). */
export function currentStepOverrides(): Record<string, number> {
  return useUserCatalog.getState().steps;
}
