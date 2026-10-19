import type { Machine } from './types';

/**
 * Catálogo de EXEMPLO com máquinas comuns em academias brasileiras.
 * Será substituído pelas máquinas reais da academia (com fotos).
 * Para adicionar foto: coloque o arquivo em assets/maquinas/ e use
 * `foto: require('@/assets/maquinas/leg-press-45.jpg')`.
 */
export const MACHINES: Machine[] = [
  { id: 'leg-press-45', nome: 'Leg press 45°', area: 'Pernas', passoKg: 5 },
  { id: 'hack-squat', nome: 'Hack (agachamento guiado)', area: 'Pernas', passoKg: 5 },
  { id: 'smith', nome: 'Smith (barra guiada)', area: 'Pesos livres', passoKg: 5 },
  { id: 'cadeira-extensora', nome: 'Cadeira extensora', area: 'Pernas', passoKg: 5 },
  { id: 'mesa-flexora', nome: 'Mesa flexora', area: 'Pernas', passoKg: 5 },
  { id: 'cadeira-flexora', nome: 'Cadeira flexora', area: 'Pernas', passoKg: 5 },
  { id: 'cadeira-abdutora', nome: 'Cadeira abdutora', area: 'Pernas', passoKg: 5 },
  { id: 'cadeira-adutora', nome: 'Cadeira adutora', area: 'Pernas', passoKg: 5 },
  { id: 'gluteo-maquina', nome: 'Máquina de glúteo (coice)', area: 'Pernas', passoKg: 5 },
  { id: 'elevacao-pelvica', nome: 'Máquina de elevação pélvica', area: 'Pernas', passoKg: 5 },
  { id: 'panturrilha-sentada', nome: 'Panturrilha sentada', area: 'Pernas', passoKg: 5 },
  { id: 'banco-lombar', nome: 'Banco de extensão lombar 45°', area: 'Pernas', passoKg: 0 },
  { id: 'puxador', nome: 'Puxador alto (pulley)', area: 'Costas', passoKg: 5 },
  { id: 'graviton', nome: 'Graviton (barra assistida)', area: 'Costas', passoKg: 5 },
  { id: 'remada-baixa', nome: 'Remada baixa no cabo', area: 'Costas', passoKg: 5 },
  { id: 'remada-maquina', nome: 'Remada articulada', area: 'Costas', passoKg: 5 },
  { id: 'supino-maquina', nome: 'Supino máquina (chest press)', area: 'Peito', passoKg: 5 },
  { id: 'peck-deck', nome: 'Voador (peck deck)', area: 'Peito', passoKg: 5 },
  { id: 'desenvolvimento-maquina', nome: 'Desenvolvimento máquina', area: 'Ombros', passoKg: 5 },
  { id: 'crossover', nome: 'Crossover (polia dupla)', area: 'Polias', passoKg: 2.5 },
  { id: 'banco-halteres', nome: 'Halteres + banco ajustável', area: 'Pesos livres', passoKg: 2 },
  { id: 'colchonete', nome: 'Área de colchonetes', area: 'Abdômen', passoKg: 0 },
  { id: 'esteira', nome: 'Esteira', area: 'Cardio', passoKg: 0 },
  { id: 'bicicleta', nome: 'Bicicleta ergométrica', area: 'Cardio', passoKg: 0 },
];
