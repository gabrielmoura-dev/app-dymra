import type { YouTubeVideo } from "./types";

/**
 * Vídeo de cada exercício (YouTube, em português, curto e direto).
 * Para trocar um vídeo, mude só o `youtubeId` (os 11 caracteres depois de "v=" no link).
 * `inicio` (em segundos) faz o vídeo começar mais adiante.
 */
export const VIDEOS: Record<string, YouTubeVideo> = {
  // Leandro Twin · 1:55 · Como fazer abdominal prancha
  prancha: { youtubeId: "qNRqGqESAWU" },
  // Guilherme Stellbrink I FisioPrev · 1:36 · COMO FAZER PRANCHA LATERAL - Fisioprev
  "prancha-lateral": { youtubeId: "zt7PjySXWCw" },
  // Lukas Rodrigues Treinador · 0:50 · Abdominal Crunch no solo
  "abdominal-crunch": { youtubeId: "fR_KzGyKW3w" },
  // Treinador Morin · 1:08 · ABDOMINAL NA POLIA AJOELHADO- como executar de maneira correta!
  "abdominal-polia": { youtubeId: "I64bjVbs7XI" },
  // Smart Fit · 2:41 · Treino na Esteira: Dicas e Benefícios | Smart Fit
  esteira: { youtubeId: "raa5u4CF2Q4" },
  // Academia Sport Extrema · 1:12 · Como regular a bike na academia - Sport Extrema
  bicicleta: { youtubeId: "EYSBDytp0so" },
  // Laércio Refundini - Aulas · 1:42 · Como Fazer o Leg Press 45º
  "leg-press-45": { youtubeId: "FeZ8D00iK5E" },
  // Treino Mestre · 1:04 · Hack Machine - Execução Correta e Cuidados
  "agachamento-hack": { youtubeId: "Whp712OHPl8" },
  // Smart Fit · 1:02 · AGACHAMENTO SMITH: Técnica Perfeita para Quadríceps e Glúteos (Passo a Passo)
  "agachamento-smith": { youtubeId: "7p_qycgzx4U" },
  // Guilherme Stellbrink I FisioPrev · 1:49 · COMO FAZER AGACHAMENTO GOBLET (Agachamento frontal) - Fisioprev
  "agachamento-goblet": { youtubeId: "ge1vdJRP0UA" },
  // Miqueias Alves Personal · 2:04 · AFUNDO COM HALTERES - como fazer
  "afundo-halteres": { youtubeId: "7MKHBgJcX5I" },
  // Leandro Twin · 1:45 · Como fazer cadeira extensora
  "cadeira-extensora": { youtubeId: "el3oHblB5DM" },
  // Leandro Twin · 2:10 · Como fazer mesa flexora
  "mesa-flexora": { youtubeId: "2-ULaRrQa7c" },
  // Leandro Twin · 1:47 · Como fazer cadeira flexora
  "cadeira-flexora": { youtubeId: "Zss6E3VU6X0" },
  // Miqueias Alves Personal · 0:43 · STIFF COM HALTERES- COMO FAZER?
  "stiff-halteres": { youtubeId: "cETLf4xXYCQ" },
  // Treino Mestre · 0:46 · Exercício Stiff no Smith com Step - Como Fazer
  "stiff-smith": { youtubeId: "wx7FRJyCNBs" },
  // Otto Leone Personal · 1:44 · ELEVAÇÃO PÉLVICA NA MAQUINA | Otto
  "elevacao-pelvica-maquina": { youtubeId: "5B34iELOOGc" },
  // GUSTAVO SANTOS - Personal Nutri · 1:32 · Elevação pélvica no smith (barra guiada)
  "elevacao-pelvica-smith": { youtubeId: "1LQcKrm29GU" },
  // Leandro Twin · 1:11 · Como fazer glúteos máquina
  "gluteo-coice-maquina": { youtubeId: "JhodVO0l1vw" },
  // Leandro Twin · 1:47 · Como fazer glúteos cross (4 apoios)
  "gluteo-coice-cabo": { youtubeId: "JdHbXlggr6Q" },
  // Leandro Twin · 1:14 · Como fazer cadeira abdutora
  "cadeira-abdutora": { youtubeId: "e2gmqTG1OgQ" },
  // Miqueias Alves Personal · 1:56 · ABDUÇÃO DE QUADRIL NA POLIA - O JEITO CERTO DE FAZER
  "abducao-cabo": { youtubeId: "8dpez6IeZ3E" },
  // Leandro Twin · 1:35 · Como fazer cadeira adutora
  "cadeira-adutora": { youtubeId: "Wf602gn_9zU" },
  // Otto Leone Personal · 1:53 · ADUÇÃO DE QUADRIL NA POLIA | Otto
  "aducao-cabo": { youtubeId: "GxmyA8cEVF4" },
  // Laércio Refundini - Aulas · 1:36 · Como Fazer PANTURRILHA SENTADO do Jeito Certo (Aprenda em 1 Minuto)
  "panturrilha-sentada": { youtubeId: "qP9GavDpYmw" },
  // Guilherme Stellbrink I FisioPrev · 0:45 · COMO FAZER PANTURRILHA NO LEG PRESS - Fisioprev
  "panturrilha-leg": { youtubeId: "Ua7jx6wKyMw" },
  // MyTrainingPRO · 0:58 · Panturrilha no Smith
  "panturrilha-smith": { youtubeId: "Bfu6-o4QnOc" },
  // Leandro Twin · 1:41 · Como fazer extensão lombar
  "extensao-lombar": { youtubeId: "z0rx9swRDR0" },
  // Guilherme Stellbrink I FisioPrev · 1:04 · COMO FAZER SUPINO MAQUINA - Fisioprev
  "supino-maquina": { youtubeId: "WGdi4iTfza8" },
  // Laércio Refundini - Aulas · 1:14 · Como Fazer o Supino Reto Com Halteres (Aprenda em 1 Minuto)
  "supino-halteres": { youtubeId: "Cjh2fIMQHk0" },
  // Treino Mestre · 0:45 · Supino inclinado com halteres: Como fazer, Dicas e Postura
  "supino-inclinado-halteres": { youtubeId: "rCPwrZkrVVQ" },
  // Panobianco Academia · 1:10 · Fast Fit - Supino reto no smith
  "supino-smith": { youtubeId: "RS_AkiwHtu0" },
  // Personal Maurício Moraes · 1:39 · COMO FAZER O EXERCÍCIO PECK DECK (PEITO)?
  "crucifixo-peck-deck": { youtubeId: "QJT52jGuyVE" },
  // Laércio Refundini - Aulas · 1:06 · Como fazer o Crossover (Aprenda em 1 Minuto)
  "crossover-polia": { youtubeId: "pdMWt71MPlw" },
  // Leandro Twin · 1:21 · Como fazer crucifixo reto
  "crucifixo-halteres": { youtubeId: "uDMmccuPVPQ" },
  // Laércio Refundini - Aulas · 1:10 · Como Fazer o Pulley Frente (Aprenda em 1 Minuto)
  "puxada-frente": { youtubeId: "Hu3TbPgEGDo" },
  // Miqueias Alves Personal · 2:30 · BARRA FIXA NO GRAVITON COMO FAZER – TUTORIAL RÁPIDO E FÁCIL
  "barra-graviton": { youtubeId: "w0UVe0JAEDQ" },
  // Laércio Refundini - Aulas · 1:20 · Como Fazer a REMADA BAIXA (Aprenda em 1 Minuto)
  "remada-baixa": { youtubeId: "f8AVh4VBbos" },
  // Leandro Twin · 1:52 · Como fazer remada máquina
  "remada-articulada": { youtubeId: "QyvIEdEHzHc" },
  // Laércio Refundini - Aulas · 0:51 · Como Fazer a REMADA UNILATERAL (Aprenda em 1 Minuto)
  "remada-unilateral-halter": { youtubeId: "E008-XIJBEk" },
  // Guilherme Stellbrink I FisioPrev · 1:09 · COMO FAZER DESENVOLVIMENTO MAQUINA - Fisioprev
  "desenvolvimento-maquina": { youtubeId: "Xd5bgkvYdfk" },
  // Laércio Refundini - Aulas · 1:07 · Como fazer o Desenvolvimento com Halteres (Aprenda em 1 Minuto)
  "desenvolvimento-halteres": { youtubeId: "eufDL9MmF8A" },
  // Guilherme Stellbrink I FisioPrev · 1:22 · COMO REALIZAR ELEVAÇÃO LATERAL COM HALTERES - FISIOPREV
  "elevacao-lateral-halteres": { youtubeId: "ORparUDksUk" },
  // Laércio Refundini - Aulas · 0:44 · Como Fazer a ELEVAÇÃO LATERAL Na Polia (Aprenda e 1 Minuto)
  "elevacao-lateral-cabo": { youtubeId: "3vbYw9xklBc" },
  // Laércio Refundini - Aulas · 1:10 · Como fazer o Voador Inverso na Máquina (APRENDA EM 1 MINUTO)
  "crucifixo-inverso-peck": { youtubeId: "wjlX-5DTjBQ" },
  // Miqueias Alves Personal · 1:25 · PULLFACE CORDA - DESCUBRA COMO FAZER
  "face-pull": { youtubeId: "jvwPfCguVQM" },
  // Miqueias Alves Personal · 1:08 · ROSCA DIRETA NA POLIA - COMO FAZER?
  "rosca-direta-cabo": { youtubeId: "X12n32mNBp8" },
  // Laércio Refundini - Aulas · 1:05 · Como fazer a Rosca Alternada (Aprenda em 1 MINUTO)
  "rosca-alternada": { youtubeId: "AuBN9_8Iihc" },
  // Laércio Refundini - Aulas · 1:25 · Aprenda em 1 Minuto Como fazer a Rosca Martelo
  "rosca-martelo": { youtubeId: "OnNmaG_tZM4" },
  // Miqueias Alves Personal · 1:15 · PULLEY TRÍCEPS CORDA - FAÇA ASSIM!
  "triceps-corda": { youtubeId: "KhK5HWJfsrQ" },
  // Miqueias Alves Personal · 1:20 · PULLEY TRÍCEPS BARRA NA POLIA - MELHOR FORMA DE EXECUTAR
  "triceps-barra": { youtubeId: "iioOkPqsVr0" },
  // Guilherme Stellbrink I FisioPrev · 2:48 · COMO FAZER TRÍCEPS FRANCÊS SENTADO COM HALTER - Fisiprev
  "triceps-frances-halter": { youtubeId: "9EkGm94Q2Ms" },
};
