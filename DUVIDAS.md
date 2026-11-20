# Dúvidas

## Respondidas em 19/10/2026

| # | Pergunta | Resposta | O que mudou no app |
|---|---|---|---|
| 1 | Conta Expo | Criada (a mesma do Expo Go) | Falta rodar os comandos do README para gerar o APK |
| 2 | Nomes | Gabriel, Rita e Val (Valentina) | O cadastro oferece "Gabriel", "Rita" e "Val" com um toque; a ficha gerada se chama "Ficha de …" |
| 3 | Fichas | Onboarding para definir os treinos, com opção de pular e montar o próprio | Cadastro em 2 etapas. Na segunda: **Montar uma ficha para mim** (dias por semana, tempo e prioridade → o app monta com as máquinas do catálogo), **Usar uma ficha pronta** ou **Pular e montar o meu** (abre o editor com uma ficha vazia). Em Fichas dá para gerar outra, montar do zero e editar (séries, reps, descanso, ordem, dias) |
| 4 | Passo de carga | Um campo para cadastrar a evolução dos pesos | Na tela de cada máquina há o campo **Passo de carga** (de quanto em quanto o peso sobe). Vale para os botões − / + e para as sugestões. Entendi "evolução dos pesos" como esse passo; se era outra coisa, me diga |
| 5 | Catálogo de exemplo | Manter as máquinas que existem na academia e remover as outras | Feito quando você mandar a lista/fotos |
| 6 | Relógio | Gabriel ainda vai comprar; Rita não lembra o modelo | Nada a fazer: sem relógio, as calorias saem pela estimativa (MET). Ao comprar, prefira um que sincronize com o Health Connect |
| 7 | App do Claude | Os dois têm instalado | — |
| 8 | Lembrete de água | A cada 2 h, das 9h às 19h | **Removido em 20/11/2026** a seu pedido: sem card de água, sem meta, sem lembretes (os já agendados são cancelados ao abrir o app) |
| 9 | Aquecimento | Sim, sugerir | No primeiro exercício pesado de pernas e no de tronco, o treino já vem com 1×12 a ~50% da carga (e, de 30 kg para cima, mais 1×6 a ~75%). Aparece com chama laranja, não conta em volume nem recordes e o descanso depois dele é curto. Dá para desligar em Perfil → Treino |
| 10 | Fotos no backup | Não precisa | As fotos de progresso ficam só no celular e não entram no backup. Fichas próprias e passos de carga entram |

## Ainda em aberto

- **Catálogo**: máquinas (foto, nome, passo de carga), exercícios de cada uma e links do YouTube. Veja [CATALOGO.md](CATALOGO.md).
- **Fichas do personal/academia**: se vocês tiverem fichas prontas, mando para "Fichas prontas" com o nome de cada um. O cadastro já marca a ficha de quem tiver o mesmo nome.

## Decisões que tomei sozinho (só confirme se discordar)

- O `id` do app Android é `com.dymra.app`.
- Unidades só em kg e cm.
- O "corpo" no cadastro tem só feminino/masculino, porque é usado apenas na estimativa de calorias e na figura do mapa muscular.
- A recuperação muscular considera 72 h para músculos grandes e 48 h (ou 36 h) para pequenos; 6 séries "cansam" totalmente um músculo.
- As dicas de "músculo pouco treinado" só aparecem depois de um ciclo completo da ficha na semana, para não incomodar no começo.
- A ficha gerada prefere máquinas guiadas a halteres e Smith, por serem mais seguras para iniciantes. Cada treino começa com 5 min de bicicleta; em emagrecimento e condicionamento (45 min ou mais) termina com esteira.
- Sem gamificação, sem social, sem login (como combinado).

## O que ainda não foi testado (precisa do celular)

Não há Android SDK nem emulador neste computador, então testei as telas no navegador e a lógica com testes automáticos. Só no APK dá para conferir:
- Notificação de fim de descanso com a tela bloqueada e vibração
- Player do YouTube dentro do app
- Câmera (QR code e foto com sobreposição)
- Health Connect (permissões, calorias, frequência cardíaca)
- Compartilhar com o app do Claude
- Backup no Drive e restauração
- Atualização pelo ar (EAS Update)

## Melhorias baseadas em evidências (branch `melhorias-baseadas-em-evidencias`)

- **Constância** (Progresso): treinos na semana contra a meta (dias da ficha) e semanas seguidas. A semana em andamento não quebra a sequência. Motivo: aderência é o maior preditor de resultado.
- **Faixas de volume** (Progresso): cada músculo mostra "pouco" (<6 séries/semana), "bom para começar" (6–10), "faixa ideal" (10–20) ou "muito alto" (>20).
- Já existiam: progressão dupla, aquecimento, recarga (deload), esforço percebido por série, recuperação por músculo e descanso maior em compostos.
- **Meta semanal editável** (Perfil → Treino): define quantos treinos por semana você quer; o card Constância usa essa meta (padrão: dias da ficha). Base: revisões sobre apps de atividade física (Laranjo 2021, BJSM; Gal 2018) apontam automonitoramento, meta específica, revisão da meta e feedback de desempenho como as técnicas mais eficazes. As faixas de volume seguem a meta-análise de Schoenfeld (2017), que mostra mais ganho com 10+ séries semanais por músculo.
- **Meta da semana no resumo do treino**: ao terminar, o app mostra "x/meta" e quantos treinos faltam (feedback imediato de desempenho e revisão da meta).
- **Revisão da meta**: o card Constância mostra também a semana passada e sugere reduzir a meta quando ela ficou difícil de cumprir.
- **Acessibilidade e atrito (da pesquisa de mercado, ver `reports/`)**: texto de apoio com contraste ~5:1 (antes ~3:1); alvos de toque de 44 px em chips, botões de ícone e atalhos do exercício; o campo de peso/reps grava a cada dígito (tocar direto no ✓ com o teclado aberto não perde o valor); aviso único quando as notificações estão desligadas e o descanso só avisa com o app aberto.
- **Descanso persistente**: se o app for fechado no meio do descanso, a barra volta na tela do treino com o tempo restante (e o aviso do sistema continua agendado).

## Ajustes de 20/11/2026

- **Água removida**: saiu da tela Hoje, do Perfil, dos lembretes e do Health Connect.
- **Fichas mais enxutas**: aparece só a ficha atual. As outras ficam em "Trocar ou criar ficha", em linhas compactas (toque para ver os treinos). Ao escolher uma ficha, a lista se recolhe.
- **Máquinas mais usadas no topo**: dentro de cada área (Pernas, Costas…), a máquina usada em 2 treinos ou mais sobe, com "N× usada". O resto segue a ordem do catálogo.
- **Exercícios**: (substituído pelos cards por grupo, abaixo).

## Telas em cards (20/11/2026)

- **Treino em aberto**: só o exercício em andamento fica aberto. Os outros viram uma linha com nome e "x/y séries" (✓ verde quando terminados). Toque para abrir; abrir um recolhe o anterior.
- **Máquinas**: cada área (Pernas, Pesos livres, Costas…) é um card fechado com o número de máquinas e a mais usada. As áreas onde a pessoa mais treina sobem.
- **Exercícios**: card "Seus mais usados" aberto no topo (quando há histórico) e um card fechado por grupo (Pernas, Glúteos, Peito…). A busca mostra a lista direta.
- **Progresso**: Recuperação muscular e Peso corporal começam recolhidos, com um resumo ("Tudo recuperado", "Último: 60 kg").
- **Perfil**: todas as seções viram cards fechados com o resumo do que está configurado.
