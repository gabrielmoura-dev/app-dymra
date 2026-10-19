export type Muscle =
  | 'peitoral'
  | 'ombro-anterior'
  | 'ombro-lateral'
  | 'ombro-posterior'
  | 'biceps'
  | 'triceps'
  | 'antebraco'
  | 'abdomen'
  | 'obliquos'
  | 'dorsais'
  | 'trapezio'
  | 'lombar'
  | 'gluteos'
  | 'gluteo-medio'
  | 'quadriceps'
  | 'posteriores'
  | 'adutores'
  | 'panturrilha';

export type MovementPattern =
  | 'agachamento'
  | 'dobradica-quadril'
  | 'extensao-quadril'
  | 'extensao-joelho'
  | 'flexao-joelho'
  | 'abducao-quadril'
  | 'aducao-quadril'
  | 'panturrilha'
  | 'empurrar-horizontal'
  | 'empurrar-vertical'
  | 'crucifixo'
  | 'puxar-horizontal'
  | 'puxar-vertical'
  | 'elevacao-lateral'
  | 'posterior-ombro'
  | 'encolhimento'
  | 'flexao-cotovelo'
  | 'extensao-cotovelo'
  | 'core-flexao'
  | 'core-estabilidade'
  | 'cardio';

export type ExerciseKind = 'carga' | 'peso-corporal' | 'tempo';

export interface Technique {
  /** Como ajustar banco, encosto, pino, pegada antes de começar. */
  ajuste: string[];
  /** Passo a passo do movimento. */
  execucao: string[];
  respiracao: string;
  escapulas?: string;
  core?: string;
  /** Velocidade recomendada, ex.: "2 s descendo, 1 s subindo". */
  cadencia?: string;
  errosComuns: string[];
  seguranca?: string[];
}

export interface YouTubeVideo {
  youtubeId: string;
  /** Segundo de início do trecho. */
  inicio?: number;
  fim?: number;
}

export interface Exercise {
  id: string;
  nome: string;
  /** Máquinas/equipamentos onde o exercício pode ser feito. */
  maquinaIds: string[];
  padrao: MovementPattern;
  primarios: Muscle[];
  secundarios: Muscle[];
  tipo: ExerciseKind;
  unilateral?: boolean;
  /** Carga de assistência (graviton): menos peso = mais difícil. */
  assistido?: boolean;
  /** Equivalente metabólico usado na estimativa de calorias. */
  met: number;
  tecnica: Technique;
  video?: YouTubeVideo;
  /** Alternativas escolhidas a dedo; têm prioridade sobre as automáticas. */
  alternativas?: string[];
}

export interface Machine {
  id: string;
  nome: string;
  area: string;
  /** Menor incremento de carga possível (kg). */
  passoKg: number;
  /** Resultado de require('@/assets/maquinas/arquivo.jpg'). */
  foto?: number;
  descricao?: string;
}

export interface RoutineExercise {
  exercicioId: string;
  series: number;
  repsMin: number;
  repsMax: number;
  descansoSeg: number;
  /** Para exercícios por tempo (prancha, esteira). */
  duracaoSeg?: number;
  observacao?: string;
}

export interface RoutineDay {
  id: string;
  nome: string;
  foco: string;
  exercicios: RoutineExercise[];
}

export interface Program {
  id: string;
  nome: string;
  dono: string;
  descricao: string;
  dias: RoutineDay[];
}

export type Goal = 'hipertrofia' | 'emagrecimento' | 'condicionamento';
export type Sex = 'feminino' | 'masculino';
