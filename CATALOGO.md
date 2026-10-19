# Catálogo do Dymra

Hoje o app tem um **catálogo de exemplo**: 24 máquinas comuns, 52 exercícios com técnica completa e 2 fichas. Ele será trocado pelas máquinas reais da sua academia.

## O que me mandar

### 1. Máquinas (uma por vez ou todas juntas)

Para cada máquina:
- **Foto** de frente, com a máquina inteira e boa luz
- **Nome** como vocês chamam (ex.: "Leg 45 da esquerda")
- **Exercícios** que dá para fazer nela
- **Passo de carga**: de quanto em quanto o peso sobe (ex.: placas de 5 kg, ou 7 kg, ou anilhas de 2,5 kg)
- **Área** da academia, se quiser agrupar (ex.: "Pernas", "Polias", "Andar de cima")

Exemplo de mensagem:

> Máquina: Cadeira extensora Movement (foto anexa). Placas de 5 kg. Área: pernas.
> Exercícios: cadeira extensora, extensora unilateral.

### 2. Vídeos

Para cada exercício, o link do YouTube (vídeo normal ou Shorts). Se o trecho certo começa no meio, mande o link com o tempo (`?t=42`) ou diga "começa em 0:42".

### 3. Fichas

A sua e a da sua amiga, por foto ou texto. O ideal é ter, para cada exercício: séries × repetições e descanso.

> Treino A – 4×10–12 leg press (descanso 2 min), 3×12 cadeira extensora (1 min 30)…

Se faltar alguma informação, eu completo com o padrão para iniciantes e aviso.

## Onde fica cada coisa no código

| Arquivo | Conteúdo |
|---|---|
| `src/catalog/machines.ts` | Máquinas (`id`, `nome`, `area`, `passoKg`, `foto`) |
| `src/catalog/exercises-*.ts` | Exercícios, técnica, músculos, vídeo e alternativas |
| `src/catalog/programs.ts` | Fichas e dias (A, B, C…) |
| `assets/maquinas/` | Fotos das máquinas (`foto: require('@/assets/maquinas/arquivo.jpg')`) |

Regras:
- **Nunca troque o `id`** de uma máquina ou exercício que já foi usado: o histórico e os recordes dependem dele. Pode mudar o nome à vontade.
- Ao mudar o catálogo, suba o `CATALOG_VERSION` em `src/catalog/index.ts`.
- `npm test` confere se nenhuma ficha aponta para exercício inexistente e se toda máquina e alternativa existe.
