import type { SQLiteDatabase } from 'expo-sqlite';
import { useMemo } from 'react';
import { create } from 'zustand';

import { getProgram, PROGRAMS } from '@/catalog';
import type { Program } from '@/catalog/types';
import { deleteCustomProgram, listCustomPrograms, listMachineSteps, setMachineStep, upsertCustomProgram } from '@/db/repo';

/** O que cada pessoa cria no próprio celular: fichas e passo de carga das máquinas. */
interface UserCatalogState {
  programs: Program[];
  steps: Record<string, number>;
}

export const useUserCatalog = create<UserCatalogState>(() => ({ programs: [], steps: {} }));

export async function loadUserCatalog(db: SQLiteDatabase) {
  const [programs, steps] = await Promise.all([listCustomPrograms(db), listMachineSteps(db)]);
  useUserCatalog.setState({ programs, steps });
}

export async function saveCustomProgram(db: SQLiteDatabase, p: Program) {
  useUserCatalog.setState((s) => ({
    programs: s.programs.some((x) => x.id === p.id) ? s.programs.map((x) => (x.id === p.id ? p : x)) : [...s.programs, p],
  }));
  await upsertCustomProgram(db, p);
}

export async function removeCustomProgram(db: SQLiteDatabase, id: string) {
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
