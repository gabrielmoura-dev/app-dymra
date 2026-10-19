import type { Program, RoutineExercise } from './types';

/** Atalho para montar um exercício de rotina. */
function ex(
  exercicioId: string,
  series: number,
  reps: [number, number],
  descansoSeg = 90,
  extra: Partial<RoutineExercise> = {},
): RoutineExercise {
  return { exercicioId, series, repsMin: reps[0], repsMax: reps[1], descansoSeg, ...extra };
}

function tempo(exercicioId: string, series: number, duracaoSeg: number, descansoSeg = 60): RoutineExercise {
  return { exercicioId, series, repsMin: 1, repsMax: 1, descansoSeg, duracaoSeg };
}

/**
 * Fichas de EXEMPLO. Serão substituídas pelas rotinas reais
 * enviadas por você e pela sua amiga.
 */
export const PROGRAMS: Program[] = [
  {
    id: 'exemplo-abc',
    nome: 'Iniciante ABC',
    dono: 'Exemplo',
    descricao: 'Três treinos alternados: pernas (quadríceps e glúteo), superiores e posterior + glúteo + core.',
    dias: [
      {
        id: 'A',
        nome: 'Treino A',
        foco: 'Quadríceps e glúteos',
        exercicios: [
          tempo('bicicleta', 1, 300, 60),
          ex('leg-press-45', 3, [10, 12], 120),
          ex('cadeira-extensora', 3, [10, 12]),
          ex('elevacao-pelvica-maquina', 3, [10, 12], 90),
          ex('cadeira-abdutora', 3, [12, 15], 60),
          ex('panturrilha-sentada', 3, [12, 15], 60),
        ],
      },
      {
        id: 'B',
        nome: 'Treino B',
        foco: 'Peito, costas, ombros e braços',
        exercicios: [
          ex('supino-maquina', 3, [10, 12]),
          ex('puxada-frente', 3, [10, 12]),
          ex('remada-baixa', 3, [10, 12]),
          ex('desenvolvimento-maquina', 3, [10, 12]),
          ex('elevacao-lateral-halteres', 3, [12, 15], 60),
          ex('rosca-direta-cabo', 2, [10, 12], 60),
          ex('triceps-corda', 2, [10, 12], 60),
        ],
      },
      {
        id: 'C',
        nome: 'Treino C',
        foco: 'Posteriores, glúteos e core',
        exercicios: [
          tempo('esteira', 1, 300, 60),
          ex('mesa-flexora', 3, [10, 12]),
          ex('stiff-halteres', 3, [10, 12], 120),
          ex('gluteo-coice-maquina', 3, [12, 15], 60),
          ex('cadeira-adutora', 3, [12, 15], 60),
          tempo('prancha', 3, 30, 45),
          ex('abdominal-crunch', 3, [12, 15], 45),
        ],
      },
    ],
  },
  {
    id: 'exemplo-fullbody',
    nome: 'Corpo inteiro (iniciante)',
    dono: 'Exemplo',
    descricao: 'Dois treinos de corpo inteiro para alternar 2 a 3 vezes por semana.',
    dias: [
      {
        id: 'A',
        nome: 'Corpo inteiro A',
        foco: 'Corpo inteiro',
        exercicios: [
          ex('leg-press-45', 3, [10, 12], 120),
          ex('supino-maquina', 3, [10, 12]),
          ex('puxada-frente', 3, [10, 12]),
          ex('mesa-flexora', 3, [10, 12]),
          ex('desenvolvimento-maquina', 2, [10, 12]),
          tempo('prancha', 3, 30, 45),
        ],
      },
      {
        id: 'B',
        nome: 'Corpo inteiro B',
        foco: 'Corpo inteiro',
        exercicios: [
          ex('agachamento-goblet', 3, [10, 12], 120),
          ex('remada-articulada', 3, [10, 12]),
          ex('crucifixo-peck-deck', 3, [12, 15]),
          ex('elevacao-pelvica-maquina', 3, [10, 12]),
          ex('cadeira-abdutora', 2, [12, 15], 60),
          ex('abdominal-crunch', 3, [12, 15], 45),
        ],
      },
    ],
  },
];
