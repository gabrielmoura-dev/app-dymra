# Dymra

App de academia para Android, de uso pessoal (duas pessoas), sem login. Cada pessoa guarda os próprios treinos no celular. O catálogo (máquinas, exercícios, vídeos e fichas) chega para as duas pelas atualizações do app.

Feito com Expo SDK 58 (React Native 0.88), TypeScript e Expo Router.

## O que o app faz

| Área | O que tem |
|---|---|
| **Cadastro** | Nome, corpo, peso, altura e objetivo; depois a ficha: gerada pelo app (dias por semana, tempo, prioridade), uma pronta, ou pular e montar a própria |
| **Fichas** | Fichas próprias editáveis (dias, exercícios, séries, reps, descanso, ordem), gerar outra ficha, fichas prontas que chegam por atualização |
| **Hoje** | Próximo treino da ficha (rodízio A → B → C), mapa dos músculos do dia, dicas de recuperação, água do dia, lembrete de backup |
| **Treino** | Séries pré-preenchidas com a sugestão, ✓ por série, esforço Fácil/Ok/Difícil, séries de aquecimento sugeridas, timer de descanso com vibração e notificação, peso que "desce" para as próximas séries, nota por exercício, adicionar/remover exercício, tela sempre ligada |
| **Máquina ocupada** | Mesmo exercício em outra máquina → alternativas escolhidas a dedo → mesmo movimento → mesmos músculos. Vale só para o treino do dia; séries já feitas continuam no exercício original |
| **Técnica** | Checklist para iniciantes em cada exercício: ajuste da máquina, passo a passo, escápulas, abdômen/postura, respiração, velocidade, erros comuns, segurança |
| **Vídeo** | YouTube tocando dentro do app (precisa de internet); se o vídeo bloquear, botão para abrir no YouTube |
| **Sugestões** | Progressão dupla: bateu o topo da faixa → sobe a carga; ficou abaixo do mínimo 2× → reduz; 3 treinos parados → recarga de ~10%. Graviton tem lógica invertida (menos assistência = progresso). Cardio progride por minuto |
| **Resumo** | Duração, calorias (relógio via Health Connect ou estimativa MET), volume, séries, recordes, comparação com a última vez, músculos trabalhados |
| **Progresso** | Mapa de recuperação muscular (48–72 h), séries por músculo na semana, recordes e 1RM estimado, gráficos por exercício, histórico |
| **Corpo** | Peso e 8 medidas com gráfico, fotos de progresso (frente/lado/costas) com câmera que sobrepõe a foto anterior, comparação antes × agora |
| **Analisar no Claude** | Monta um texto com objetivo, peso, medidas e volume da semana e abre o compartilhamento com a foto. Você envia pelo app do Claude, com o seu plano. Nada de API ou chave |
| **QR code** | Cada máquina tem um QR (`dymra://maquina/<id>`). Lido pela câmera do celular ou pelo app, abre a ficha da máquina |
| **Água** | Meta diária (35 ml/kg), botões +250/+500, lembretes a cada 2 h |
| **Health Connect** | Grava treino, peso e água; lê calorias e frequência cardíaca do relógio |
| **Passo de carga** | Em cada máquina, de quanto em quanto o peso sobe (cadastrado no celular) |
| **Backup** | Exporta treinos, medidas, água e fichas próprias (sem as fotos de progresso) num arquivo para salvar no Drive/WhatsApp e restaura em outro celular |

## Rodar no computador (desenvolvimento)

```bash
npm install
npm test            # testes da lógica (46)
npm run typecheck
npx expo start --web   # abre no navegador para testar telas (sem câmera/Health Connect)
```

## Gerar o APK e instalar nos celulares

É preciso uma conta gratuita em [expo.dev](https://expo.dev) (a mesma do Expo Go serve). Rode na pasta do projeto, um comando por vez:

```bash
npx eas-cli@latest login                # pede o e-mail e a senha da conta Expo
npx eas-cli@latest init                 # liga o projeto à sua conta (responda "Y")
npx eas-cli@latest update:configure     # ativa as atualizações pelo ar
npx eas-cli@latest build -p android --profile production
```

O `init` e o `update:configure` só são necessários na primeira vez (eles gravam o id do projeto no `app.json`; faça commit dessa mudança). O build roda na nuvem da Expo (fila gratuita, uns 10 a 30 minutos). No fim, o EAS mostra um link e um QR code: abra no celular, baixe o APK e autorize "instalar apps desta fonte". Mande o mesmo link para a Rita.

O Expo Go **não** serve para usar o Dymra no dia a dia: ele não tem Health Connect, compartilhamento com o Claude nem as notificações do jeito que o app usa. Use o APK.

## Mandar atualizações (sem reinstalar)

Depois de mudar o catálogo, as fichas ou as telas:

```bash
npx eas-cli@latest update --channel production --message "Novas máquinas"
```

Na próxima vez que abrirem o app (ou em Perfil → Procurar atualização), as duas recebem.

Só é preciso um APK novo quando entra uma biblioteca nativa nova ou muda o `app.json`.

## Como o catálogo é organizado

Veja [CATALOGO.md](CATALOGO.md).

```
src/
  app/            telas (Expo Router)
  catalog/        máquinas, exercícios, fichas  ← o que muda com as atualizações
  components/     peças visuais (mapa muscular, gráfico, player, cards)
  db/             banco SQLite local (esquema + consultas)
  logic/          regras puras e testadas (progressão, alternativas, recuperação, calorias)
  services/       notificações, Health Connect, backup, fotos, compartilhar no Claude
  state/          perfil e timer de descanso
scripts/
  gerar-qrcodes.mjs   gera qrcodes.html para imprimir
```

## QR codes

```bash
npm run qrcodes
```

Abra o `qrcodes.html` gerado no navegador e imprima.
