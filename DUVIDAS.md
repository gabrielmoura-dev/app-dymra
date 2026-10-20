# Dúvidas

## Respondidas em 19/10/2026

| # | Pergunta | Resposta | O que mudou no app |
|---|---|---|---|
| 1 | Conta Expo | Criada (a mesma do Expo Go) | Falta rodar os comandos do README para gerar o APK |
| 2 | Nomes | Gabriel e Rita | O cadastro oferece "Gabriel" e "Rita" com um toque; a ficha gerada se chama "Ficha de …" |
| 3 | Fichas | Onboarding para definir os treinos, com opção de pular e montar o próprio | Cadastro em 2 etapas. Na segunda: **Montar uma ficha para mim** (dias por semana, tempo e prioridade → o app monta com as máquinas do catálogo), **Usar uma ficha pronta** ou **Pular e montar o meu** (abre o editor com uma ficha vazia). Em Fichas dá para gerar outra, montar do zero e editar (séries, reps, descanso, ordem, dias) |
| 4 | Passo de carga | Um campo para cadastrar a evolução dos pesos | Na tela de cada máquina há o campo **Passo de carga** (de quanto em quanto o peso sobe). Vale para os botões − / + e para as sugestões. Entendi "evolução dos pesos" como esse passo; se era outra coisa, me diga |
| 5 | Catálogo de exemplo | Manter as máquinas que existem na academia e remover as outras | Feito quando você mandar a lista/fotos |
| 6 | Relógio | Gabriel ainda vai comprar; Rita não lembra o modelo | Nada a fazer: sem relógio, as calorias saem pela estimativa (MET). Ao comprar, prefira um que sincronize com o Health Connect |
| 7 | App do Claude | Os dois têm instalado | — |
| 8 | Lembrete de água | A cada 2 h, das 9h às 19h | Mantido |
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
