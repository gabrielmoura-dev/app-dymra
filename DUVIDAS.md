# Dúvidas para você responder

Nada aqui bloqueou o desenvolvimento: onde precisei decidir, escolhi o padrão mais seguro e anotei. Responda quando puder (pode ser só o número e a resposta).

## Precisam de você para o app chegar no celular

1. **Conta Expo.** Para gerar o APK e mandar atualizações é preciso uma conta gratuita em expo.dev. Você cria a conta (eu não posso criar contas), depois rodamos juntos os comandos do README. Prefere fazer isso numa próxima sessão comigo?
2. **Nome da sua amiga** (ou apelido), para nomear a ficha dela no app ("Ficha da …"). Hoje as fichas de exemplo aparecem como "de Exemplo".

## Sobre o conteúdo

3. **Fichas.** Mande a sua e a dela com séries × repetições × descanso. Se a academia/personal usa outra notação (ex.: "3×15/12/10", bi-set, drop-set), me avise: hoje o app trata cada exercício com uma faixa de repetições (ex.: 10–12). Bi-set e drop-set ainda não têm tela própria.
4. **Passo de carga das máquinas.** Usei 5 kg nas máquinas de placas, 2,5 kg nas polias e 2 kg nos halteres. Quando fotografar as máquinas, anote de quanto em quanto o peso sobe em cada uma: isso afeta as sugestões de "suba para X kg".
5. **Catálogo de exemplo.** Quando chegarem as máquinas reais, removo as 24 de exemplo ou mantenho as que existirem na academia (e os exercícios com halteres/colchonete, que existem em qualquer academia)?

## Sobre funcionalidades

6. **Relógio.** Qual relógio/pulseira vocês usam (Samsung, Xiaomi, Amazfit, Garmin…)? As calorias do resumo só vêm do relógio se o app dele sincronizar com o Health Connect. Samsung Health sincroniza; outros às vezes exigem ativar nas configurações.
7. **Analisar no Claude.** O app abre o compartilhamento do Android com a foto e já copia o texto. Isso precisa de teste no celular: alguns apps aceitam foto + texto juntos, outros só a foto (aí é só colar o texto). Vocês já têm o app do Claude instalado? Sua amiga vai usar a conta dela?
8. **Lembretes de água.** Coloquei a cada 2 h, das 9h às 19h. Bom assim ou prefere outro horário?
9. **Aquecimento.** O banco já guarda se uma série é de aquecimento, mas não há botão para isso na tela de treino. Querem que o app sugira séries de aquecimento (ex.: 1×12 com 50% da carga) antes do primeiro exercício pesado?
10. **Fotos de progresso.** Ficam só no celular e entram no backup. Ok, ou preferem que nem entrem no backup (arquivo menor)?

## Decisões que tomei sozinho (só confirme se discordar)

- O `id` do app Android é `com.dymra.app`.
- Unidades só em kg e cm.
- O "corpo" no cadastro tem só feminino/masculino, porque é usado apenas na estimativa de calorias e na figura do mapa muscular.
- A recuperação muscular considera 72 h para músculos grandes e 48 h (ou 36 h) para pequenos; 6 séries "cansam" totalmente um músculo.
- As dicas de "músculo pouco treinado" só aparecem depois de um ciclo completo da ficha na semana, para não incomodar no começo.
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
