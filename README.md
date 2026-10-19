# Dymra

App de academia para Android, de uso pessoal (duas pessoas), sem login. Cada pessoa guarda os próprios treinos no celular. O catálogo (máquinas, exercícios, vídeos e fichas) chega para as duas pelas atualizações do app.

Feito com Expo SDK 58 (React Native 0.88), TypeScript e Expo Router.

## O que o app faz

| Área | O que tem |
|---|---|
| **Hoje** | Próximo treino da ficha (rodízio A → B → C), mapa dos músculos do dia, dicas de recuperação, água do dia, lembrete de backup |
| **Treino** | Séries pré-preenchidas com a sugestão, ✓ por série, esforço Fácil/Ok/Difícil, timer de descanso com vibração e notificação, peso que "desce" para as próximas séries, nota por exercício, adicionar/remover exercício, tela sempre ligada |
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
| **Backup** | Exporta tudo (incluindo fotos) num arquivo para salvar no Drive/WhatsApp e restaura em outro celular |

## Rodar no computador (desenvolvimento)

```bash
npm install
npm test            # testes da lógica (34)
npm run typecheck
npx expo start --web   # abre no navegador para testar telas (sem câmera/Health Connect)
```

## Gerar o APK e instalar nos celulares

É preciso uma conta gratuita em [expo.dev](https://expo.dev) (crie você mesmo).

```bash
npx eas-cli@latest login
npx eas-cli@latest init                 # liga o projeto à sua conta
npx eas-cli@latest update:configure     # ativa as atualizações pelo ar
npx eas-cli@latest build -p android --profile production
```

No fim, o EAS mostra um link/QR. Abra no celular, baixe o APK e autorize "instalar apps desta fonte". Mande o mesmo link para a sua amiga.

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
