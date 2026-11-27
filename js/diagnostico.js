/* Diagnóstico de ar condicionado por sintoma (27/11/2026).
   Usado em /diagnostico-de-ar-condicionado/ (todos os sintomas) e em /ar-condicionado-nao-gela/
   (já começa no sintoma "não gela", via data-sintoma). Triagem pelo sintoma, não substitui medição no local. */
(function () {
  'use strict';

  var WA = 'https://wa.me/5551985801284?text=';
  var PAGINA_COMPLETA = '/diagnostico-de-ar-condicionado/';

  var IC = {
    termometro: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>',
    gota: '<path d="M12 2.7c-3 3.6-6 6.9-6 10.3a6 6 0 0 0 12 0c0-3.4-3-6.7-6-10.3z"/>',
    botao: '<path d="M12 3v9"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/>',
    som: '<path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
    vento: '<path d="M3 8h10a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h7a2.5 2.5 0 1 1-2.5 2.5"/>',
    raio: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>'
  };
  var IC_WA = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

  var SINTOMAS = [
    { id: 'nao-gela', rotulo: 'Não gela ou gela pouco', icone: 'termometro', inicio: 'ng1' },
    { id: 'pinga', rotulo: 'Pinga água', icone: 'gota', inicio: 'pg1' },
    { id: 'nao-liga', rotulo: 'Não liga', icone: 'botao', inicio: 'nl1' },
    { id: 'barulho', rotulo: 'Faz barulho', icone: 'som', inicio: 'br1' },
    { id: 'cheiro', rotulo: 'Cheiro ruim', icone: 'vento', inicio: 'ch1' },
    { id: 'disjuntor', rotulo: 'Desarma o disjuntor', icone: 'raio', inicio: 'dj1' }
  ];

  // Cada opção: r = texto do botão, vai = próxima pergunta ou resultado (começa com "r-")
  var PERGUNTAS = {
    ng1: { t: 'O que acontece quando você liga o ar?', rot: 'Ao ligar', op: [
      { r: 'Sai vento, mas não sai frio', vai: 'ng2' },
      { r: 'Gela, mas pouco ou demora muito', vai: 'ng3' },
      { r: 'Gela no começo e depois para', vai: 'ng5' },
      { r: 'Não sai vento nenhum', vai: 'r-ng-sem-vento' }
    ] },
    ng2: { t: 'A unidade de fora está funcionando?', rot: 'Unidade de fora',
      ajuda: 'É a caixa com ventilador que fica do lado de fora. Dá pra ouvir o motor e sentir o vento quente saindo dela.', op: [
      { r: 'Sim, liga e fica ligada', vai: 'r-ng-gas' },
      { r: 'Não liga, ou liga e desliga em seguida', vai: 'r-ng-eletrica' },
      { r: 'Não consigo ver nem ouvir', vai: 'r-ng-modo' }
    ] },
    ng3: { t: 'Sempre foi assim ou foi piorando?', rot: 'Histórico', op: [
      { r: 'Gelava bem e foi piorando', vai: 'ng4' },
      { r: 'Nunca gelou direito, desde a instalação', vai: 'r-ng-nunca' }
    ] },
    ng4: { t: 'Tem gelo nos canos de cobre ou na unidade de dentro?', rot: 'Gelo nos canos',
      ajuda: 'Os canos de cobre ligam a unidade de dentro à de fora. O gelo aparece como uma crosta branca.', op: [
      { r: 'Sim, tem gelo', vai: 'r-ng-gas-gelo' },
      { r: 'Não tem gelo', vai: 'r-ng-sujeira' },
      { r: 'Não sei', vai: 'r-ng-sujeira' }
    ] },
    ng5: { t: 'Aparece gelo nos canos de cobre quando ele para de gelar?', rot: 'Gelo nos canos',
      ajuda: 'Os canos de cobre ligam a unidade de dentro à de fora. O gelo aparece como uma crosta branca.', op: [
      { r: 'Sim, aparece gelo', vai: 'r-ng-gas-gelo' },
      { r: 'Não aparece', vai: 'r-ng-calor' },
      { r: 'Não sei', vai: 'r-ng-calor' }
    ] },
    pg1: { t: 'Onde está pingando?', rot: 'Onde pinga', op: [
      { r: 'Dentro de casa, pela unidade de dentro', vai: 'pg2' },
      { r: 'Do lado de fora, pela mangueira ou pela unidade externa', vai: 'r-pg-normal' }
    ] },
    pg2: { t: 'O ar continua gelando normal?', rot: 'Gelando', op: [
      { r: 'Sim, gela normal', vai: 'r-pg-dreno' },
      { r: 'Não, gela pouco ou tem gelo', vai: 'r-pg-gelo' }
    ] },
    nl1: { t: 'O que acontece quando você aperta o botão de ligar?', rot: 'Ao ligar', op: [
      { r: 'Nada: nenhuma luz, nenhum bipe', vai: 'nl2' },
      { r: 'Acende ou bipa, mas não funciona', vai: 'r-nl-codigo' },
      { r: 'Liga e desliga sozinho logo depois', vai: 'r-nl-protecao' }
    ] },
    nl2: { t: 'Você já trocou as pilhas do controle e conferiu o disjuntor?', rot: 'Pilhas e disjuntor', op: [
      { r: 'Ainda não', vai: 'r-nl-basico' },
      { r: 'Já, e continua sem ligar', vai: 'r-nl-placa' }
    ] },
    br1: { t: 'Como é o barulho?', rot: 'Tipo de barulho', op: [
      { r: 'Estalos ao ligar ou desligar', vai: 'r-br-estalo' },
      { r: 'Som de água ou chiado leve', vai: 'r-br-agua' },
      { r: 'Vibração ou chocalho', vai: 'r-br-vibra' },
      { r: 'Metálico, raspando ou rangendo', vai: 'r-br-metal' }
    ] },
    ch1: { t: 'Que cheiro é?', rot: 'Tipo de cheiro', op: [
      { r: 'Mofo, azedo ou pano úmido', vai: 'r-ch-mofo' },
      { r: 'Queimado ou plástico quente', vai: 'r-ch-queimado' },
      { r: 'Esgoto', vai: 'r-ch-esgoto' }
    ] },
    dj1: { t: 'Quando o disjuntor desarma?', rot: 'Quando desarma', op: [
      { r: 'Na hora em que ligo o ar', vai: 'r-dj-na-hora' },
      { r: 'Depois de um tempo funcionando', vai: 'r-dj-depois' }
    ] }
  };

  var SERV = {
    conserto: { url: '/manutencao-e-conserto/', rotulo: 'Ver manutenção e conserto' },
    gas: { url: '/carga-de-gas/', rotulo: 'Ver como é a carga de gás' },
    limpeza: { url: '/limpeza-e-higienizacao/', rotulo: 'Ver limpeza e higienização' },
    btu: { url: '/calculadora-de-btu/', rotulo: 'Abrir a calculadora de BTU' }
  };

  // nivel: casa (dá pra conferir em casa) · tecnico (caso de técnico) · urgente (desligar) · normal
  var RESULTADOS = {
    'r-ng-gas': { nivel: 'tecnico', titulo: 'Suspeita principal: falta de gás por vazamento',
      texto: 'Quando a unidade de fora funciona e mesmo assim o ar sai na temperatura do ambiente, a suspeita principal é falta de gás. O gás não acaba com o uso: se está baixo, existe um vazamento.',
      passos: ['Confirme que o controle está em COOL (floco de neve), e não em FAN ou DRY.',
        'Olhe os canos de cobre: gelo neles reforça a suspeita de falta de gás.',
        'Não aceite recarga sem medir a pressão e corrigir o vazamento. Senão o problema volta em semanas.'],
      serv: 'gas', zap: 'falta de gás por vazamento' },
    'r-ng-eletrica': { nivel: 'tecnico', titulo: 'Suspeita principal: capacitor, placa ou proteção elétrica',
      texto: 'Se a unidade de fora nem parte, ou liga e desliga em ciclos curtos, o compressor não está conseguindo trabalhar. A suspeita vai pra capacitor, que é reparo barato, placa eletrônica ou proteção elétrica. Compressor é a hipótese mais cara e só se confirma com medição.',
      passos: ['Confirme o modo COOL e coloque em 17 ou 18 °C pra testar.',
        'Veja se o disjuntor do ar está ligado. Se ele desarmou, não insista em religar.',
        'Se aparecer código ou luz piscando no visor, tire uma foto pra mandar junto.'],
      serv: 'conserto', zap: 'capacitor, placa ou proteção elétrica' },
    'r-ng-modo': { nivel: 'casa', titulo: 'Comece pelo controle e pelos filtros',
      texto: 'Sem conseguir ver a unidade de fora, vale eliminar o que é simples antes de pagar uma visita.',
      passos: ['Coloque o controle em COOL (floco de neve), em 17 ou 18 °C.',
        'Abra a tampa da frente e lave os filtros com água. Seque e recoloque.',
        'Espere 15 minutos com portas e janelas fechadas.',
        'Continua sem gelar? Grave um vídeo curto do aparelho ligado e mande no WhatsApp.'],
      serv: 'conserto', zap: 'ainda sem causa definida, não consegui ver a unidade de fora' },
    'r-ng-gas-gelo': { nivel: 'tecnico', titulo: 'Gelo nos canos: sinal clássico de falta de gás',
      texto: 'Gelo na tubulação junto com o ar rendendo cada vez menos aponta pra falta de gás. E se falta gás, existe vazamento, que precisa ser corrigido antes da recarga. Filtro muito sujo também pode formar gelo, então vale conferir.',
      passos: ['Desligue o aparelho e deixe o gelo derreter.',
        'Lave os filtros e ligue de novo. Se o gelo voltar, é caso de medir a pressão do gás.',
        'Evite usar assim por dias: esse sinal piora e encarece com o uso.'],
      serv: 'gas', zap: 'falta de gás, com gelo nos canos' },
    'r-ng-sujeira': { nivel: 'casa', titulo: 'Suspeita principal: sujeira no filtro, na serpentina ou na unidade de fora',
      texto: 'Ar que gelava bem e foi perdendo força com os meses quase sempre é sujeira. Ela funciona como um cobertor sobre a parte que gela: o aparelho trabalha dobrado, gasta mais energia e entrega menos frio.',
      passos: ['Lave os filtros com água, seque e recoloque.',
        'Veja se a unidade de fora tem espaço livre e a grade sem sujeira grossa.',
        'Não melhorou? A sujeira está na serpentina, e aí é higienização completa.'],
      serv: 'limpeza', zap: 'sujeira no filtro, na serpentina ou na unidade de fora' },
    'r-ng-nunca': { nivel: 'casa', titulo: 'Duas suspeitas: aparelho pequeno pro cômodo ou instalação malfeita',
      texto: 'Quando o ar nunca deu conta, desde o primeiro dia, o aparelho pode estar saudável e só estar no ambiente errado. Ou a instalação ficou com tubulação esmagada, curva demais ou sem vácuo na linha, o que derruba o rendimento até ser corrigido.',
      passos: ['Faça a conta de BTU do cômodo na calculadora. Sala integrada ou com sol da tarde pede mais capacidade.',
        'Se o BTU está certo, a suspeita passa pra instalação, e precisa de avaliação no local.'],
      serv: 'btu', zap: 'aparelho pequeno pro cômodo ou instalação malfeita' },
    'r-ng-calor': { nivel: 'tecnico', titulo: 'Suspeita: unidade de fora esquentando demais ou sensor com defeito',
      texto: 'Quando o ar gela nos primeiros minutos e depois o vento fica morno, a unidade de fora pode estar suja ou abafada, esquentando até desarmar por proteção. A outra suspeita é um sensor descalibrado, que desliga o compressor antes da hora.',
      passos: ['Veja se a grade da unidade de fora está livre, sem objeto encostado nem sujeira grossa.',
        'Desligar e ligar de novo pode resolver por um tempo. Se volta todo dia, a causa continua lá.',
        'Sensor e placa só se confirmam com instrumento de medição.'],
      serv: 'conserto', zap: 'unidade de fora esquentando demais ou sensor' },
    'r-ng-sem-vento': { nivel: 'casa', titulo: 'Faça o teste do degelo',
      texto: 'Se o painel acende e não sai vento nenhum, o problema está na passagem do ar pela unidade de dentro. Muitas vezes a serpentina está coberta de gelo.',
      passos: ['Desligue o aparelho por uma ou duas horas e ligue de novo.',
        'O vento voltou? Era gelo na serpentina: lave os filtros. Se repetir, a suspeita é falta de gás.',
        'O vento não voltou? A suspeita vai pro motor do ventilador ou pra placa, e aí só com técnico.'],
      serv: 'conserto', zap: 'não sai vento: gelo na serpentina, ventilador ou placa' },

    'r-pg-dreno': { nivel: 'tecnico', titulo: 'Suspeita principal: dreno entupido',
      texto: 'O ar condicionado tira umidade do ambiente, e essa água sai por uma mangueira, o dreno. Quando a bandeja e o dreno entopem com sujeira, ou a unidade fica desnivelada, a água volta e escorre pra dentro de casa.',
      passos: ['Desligue o aparelho pra não molhar parede, móvel ou tomada.',
        'Lave os filtros: a sujeira acumulada acaba indo parar na bandeja e no dreno.',
        'A higienização completa lava a bandeja e o dreno, que é onde a água está presa.'],
      serv: 'limpeza', zap: 'dreno entupido, pinga dentro de casa' },
    'r-pg-gelo': { nivel: 'tecnico', titulo: 'Suspeita: gelo na serpentina derretendo',
      texto: 'Quando o ar pinga e também gela pouco, o mais provável é que a serpentina esteja congelando. O gelo derrete, a bandeja não dá conta e a água escorre. As causas são filtro muito sujo ou falta de gás.',
      passos: ['Desligue e deixe o gelo derreter por uma ou duas horas.',
        'Lave os filtros e ligue de novo.',
        'Se voltar a pingar ou a formar gelo, é caso de medir o gás.'],
      serv: 'conserto', zap: 'gelo na serpentina, pinga e gela pouco' },
    'r-pg-normal': { nivel: 'normal', titulo: 'Provavelmente é normal',
      texto: 'A água que sai pela mangueira do lado de fora é a umidade que o aparelho tirou do ar da casa. Em dia úmido, pinga bastante. No modo quente, a unidade de fora também solta água.',
      passos: ['Se a água cai em lugar ruim, como a janela do vizinho ou a calçada, dá pra mudar a saída do dreno.',
        'Se parou de pingar lá fora e começou a pingar dentro, aí sim é sinal de dreno entupido.'],
      serv: 'conserto', zap: 'água pingando do lado de fora, quero mudar a saída do dreno' },

    'r-nl-basico': { nivel: 'casa', titulo: 'Três checagens antes de chamar alguém',
      texto: 'Antes de pagar uma visita, vale eliminar o que é simples: pilha, disjuntor e controle.',
      passos: ['Troque as pilhas do controle. É a causa mais simples e a mais esquecida.',
        'Veja no quadro de luz se o disjuntor do ar está ligado. Se ele desarmar de novo, não insista.',
        'Procure o botão de emergência na unidade de dentro, geralmente embaixo da tampa da frente. Se o ar ligar por ele, o defeito é do controle.'],
      serv: 'conserto', zap: 'não liga, ainda vou conferir pilhas e disjuntor' },
    'r-nl-placa': { nivel: 'tecnico', titulo: 'Suspeita: energia que não chega no aparelho ou placa eletrônica',
      texto: 'Com pilha nova e disjuntor ligado, um aparelho que não dá sinal nenhum costuma ter problema na alimentação elétrica (tomada, fiação, fusível) ou na placa eletrônica. Isso se confirma medindo com instrumento.',
      passos: ['Não abra o aparelho: há componentes que guardam carga mesmo desligados.',
        'Lembre se houve queda ou pico de luz antes do defeito e conte isso ao técnico.',
        'Anote a marca e o modelo, que ficam na etiqueta da unidade de dentro.'],
      serv: 'conserto', zap: 'não liga: alimentação elétrica ou placa' },
    'r-nl-codigo': { nivel: 'tecnico', titulo: 'O aparelho está avisando um erro',
      texto: 'Luz piscando ou código no visor é o aparelho dizendo que travou por proteção. O código muda de marca pra marca e ajuda a chegar no defeito mais rápido.',
      passos: ['Tire uma foto do código ou grave a luz piscando.',
        'Desligue no disjuntor, espere 5 minutos e ligue de novo, uma vez só.',
        'Se o erro voltar, mande a foto no WhatsApp junto com a marca do aparelho.'],
      serv: 'conserto', zap: 'acende mas não funciona, com código de erro ou luz piscando' },
    'r-nl-protecao': { nivel: 'tecnico', titulo: 'Suspeita: proteção desligando o aparelho',
      texto: 'Ar que liga e desliga sozinho em seguida está desarmando por proteção. Pode ser sujeira pesada, sensor com defeito ou falha elétrica. Insistir em religar força o compressor.',
      passos: ['Veja se o timer do controle não está programado pra desligar.',
        'Lave os filtros e confira se a unidade de fora está com a grade livre.',
        'Se continuar, pare de religar e chame o técnico.'],
      serv: 'conserto', zap: 'liga e desliga sozinho' },

    'r-br-estalo': { nivel: 'normal', titulo: 'Provavelmente é normal',
      texto: 'Estalos na unidade de dentro, logo depois de ligar ou desligar, são o plástico dilatando e contraindo com a mudança de temperatura. Não é defeito.',
      passos: ['Se o estalo for forte, novo ou constante durante o uso, grave um vídeo e mande pra gente avaliar.'],
      serv: 'conserto', zap: 'estalos ao ligar ou desligar' },
    'r-br-agua': { nivel: 'normal', titulo: 'Na maioria das vezes é normal',
      texto: 'Um chiado ou som de líquido leve, principalmente ao ligar e ao desligar, é o gás circulando na tubulação. Passa a ser suspeito quando o som é novo e o ar começou a gelar menos.',
      passos: ['O ar gela como sempre? Pode usar tranquilo.',
        'Gela menos que antes? Aí vale medir a pressão do gás.'],
      serv: 'gas', zap: 'som de água ou chiado' },
    'r-br-vibra': { nivel: 'casa', titulo: 'Suspeita: peça solta ou suporte frouxo',
      texto: 'Vibração e chocalho costumam vir de algo solto: tampa da frente mal encaixada, filtro fora do trilho, parafuso frouxo ou o suporte da unidade de fora.',
      passos: ['Confira se a tampa da frente e os filtros estão bem encaixados.',
        'Veja se tem algo encostado na unidade de fora.',
        'Não suba pra apertar o suporte externo. É serviço em altura, deixa com o técnico.'],
      serv: 'conserto', zap: 'vibração ou chocalho' },
    'r-br-metal': { nivel: 'urgente', titulo: 'Desligue o aparelho',
      texto: 'Barulho metálico, de coisa raspando ou rangendo, indica ventilador encostando em alguma parte ou rolamento gasto. Usar assim aumenta o dano e encarece o conserto.',
      passos: ['Se der, grave um vídeo curto com o som.',
        'Depois desligue e não use até o técnico olhar.',
        'Diga se o barulho vem da unidade de dentro ou da de fora.'],
      serv: 'conserto', zap: 'barulho metálico ou raspando' },

    'r-ch-mofo': { nivel: 'tecnico', titulo: 'Suspeita principal: fungos na serpentina e na bandeja',
      texto: 'A parte que gela fica úmida o tempo todo. Com poeira acumulada, vira ambiente pra fungos e bactérias, e o cheiro sai junto com o vento.',
      passos: ['Lavar os filtros ajuda, mas não chega onde o cheiro nasce.',
        'O que resolve é a higienização completa, que lava serpentina, bandeja, dreno e turbina.',
        'A limpeza é recomendada a cada 6 a 12 meses.'],
      serv: 'limpeza', zap: 'cheiro de mofo' },
    'r-ch-queimado': { nivel: 'urgente', titulo: 'Desligue no disjuntor agora',
      texto: 'Cheiro de queimado ou de plástico quente indica aquecimento em fiação, conector, motor ou placa. Não é pra testar de novo.',
      passos: ['Desligue o ar pelo disjuntor, não só pelo controle.',
        'Não religue até um técnico avaliar.',
        'Se viu faísca, fumaça ou marca escura na tomada, avise na mensagem.'],
      serv: 'conserto', zap: 'cheiro de queimado' },
    'r-ch-esgoto': { nivel: 'tecnico', titulo: 'Suspeita: dreno ligado no esgoto sem sifão',
      texto: 'Quando a mangueira do dreno é ligada direto na rede de esgoto, sem sifão, o cheiro do encanamento sobe por ela e sai pelo aparelho. A correção é no dreno, não no ar condicionado.',
      passos: ['Repare se o cheiro vem mesmo de dentro do aparelho ou de um ralo próximo.',
        'A correção é refazer a saída do dreno com sifão ou levar a água pra outro ponto.',
        'Se o cheiro for mais de mofo que de esgoto, o caminho é a higienização.'],
      serv: 'conserto', zap: 'cheiro de esgoto' },

    'r-dj-na-hora': { nivel: 'urgente', titulo: 'Não insista em religar',
      texto: 'Disjuntor que cai na hora da partida indica curto, compressor travado ou capacitor com defeito. O disjuntor está fazendo o trabalho dele, que é proteger a fiação.',
      passos: ['Deixe o ar desligado.',
        'Não troque o disjuntor por um maior por conta própria: isso tira a proteção e pode esquentar a fiação.',
        'Conte ao técnico se o disjuntor é só do ar ou dividido com outros aparelhos.'],
      serv: 'conserto', zap: 'disjuntor desarma na hora em que ligo' },
    'r-dj-depois': { nivel: 'tecnico', titulo: 'Suspeita: aparelho esquentando ou circuito fraco pra ele',
      texto: 'Quando desarma depois de alguns minutos ou horas, o aparelho está puxando mais corrente do que deveria, ou o circuito não aguenta a carga. As causas comuns são unidade de fora suja ou abafada, compressor forçando, disjuntor desgastado ou fiação fina demais.',
      passos: ['Veja se a grade da unidade de fora está livre e limpa.',
        'Confira se o ar divide o disjuntor com chuveiro, micro-ondas ou outro aparelho forte.',
        'Se desarmar de novo, pare de usar e chame o técnico. A medição de corrente mostra onde está o problema.'],
      serv: 'conserto', zap: 'disjuntor desarma depois de um tempo funcionando' }
  };

  var NIVEIS = {
    casa: { selo: 'Dá pra conferir em casa', botao: 'Mandar no WhatsApp' },
    tecnico: { selo: 'Caso de técnico', botao: 'Mandar no WhatsApp' },
    urgente: { selo: 'Pare de usar o aparelho', botao: 'Chamar no WhatsApp' },
    normal: { selo: 'Sem defeito aparente', botao: 'Tirar dúvida no WhatsApp' }
  };

  // Exposto pro teste automático (Node) e pra conferência no console
  var DADOS = { SINTOMAS: SINTOMAS, PERGUNTAS: PERGUNTAS, RESULTADOS: RESULTADOS, SERV: SERV, NIVEIS: NIVEIS };
  if (typeof module !== 'undefined' && module.exports) { module.exports = DADOS; return; }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function sintomaPorId(id) {
    for (var i = 0; i < SINTOMAS.length; i++) if (SINTOMAS[i].id === id) return SINTOMAS[i];
    return null;
  }
  function evento(nome, rotulo) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', nome, { event_category: 'diagnostico', event_label: rotulo, page_path: window.location.pathname });
    }
  }

  function montar(raiz) {
    var fixo = sintomaPorId(raiz.getAttribute('data-sintoma'));   // página de um sintoma só
    var sintoma = fixo;
    var caminho = [];            // [{ p: idPergunta, i: índiceDaOpção }]
    var atual = fixo ? fixo.inicio : null;
    var primeira = true;

    function mensagem(res) {
      var l = ['Olá! Fiz o diagnóstico no site.', 'Sintoma: ' + sintoma.rotulo.toLowerCase() + '.'];
      for (var i = 0; i < caminho.length; i++) {
        var q = PERGUNTAS[caminho[i].p];
        l.push(q.rot + ': ' + q.op[caminho[i].i].r.toLowerCase() + '.');
      }
      l.push('Resultado: ' + res.zap + '.');
      l.push('Quero um orçamento. Minha cidade é: ');
      return l.join('\n');
    }

    function topo(texto) {
      return '<span class="diag-passo">' + esc(texto) + '</span>';
    }
    var VOLTAR = '<button type="button" class="diag-voltar" data-acao="voltar">Voltar uma pergunta</button>';

    function telaSintomas() {
      var h = topo('Escolha o sintoma') +
        '<h2 class="diag-pergunta" tabindex="-1">O que o seu ar condicionado está fazendo?</h2><div class="diag-sintomas">';
      for (var i = 0; i < SINTOMAS.length; i++) {
        h += '<button type="button" class="diag-sintoma" data-sintoma="' + SINTOMAS[i].id + '">' +
          '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          IC[SINTOMAS[i].icone] + '</svg><span>' + esc(SINTOMAS[i].rotulo) + '</span></button>';
      }
      return h + '</div>';
    }

    function telaPergunta() {
      var q = PERGUNTAS[atual];
      var n = caminho.length + 1;
      var h = topo(sintoma.rotulo + ' · pergunta ' + n) +
        '<h2 class="diag-pergunta" tabindex="-1">' + esc(q.t) + '</h2>' +
        (q.ajuda ? '<p class="diag-ajuda">' + esc(q.ajuda) + '</p>' : '') + '<div class="diag-opcoes">';
      for (var i = 0; i < q.op.length; i++) {
        h += '<button type="button" class="diag-opcao" data-op="' + i + '">' + esc(q.op[i].r) + '</button>';
      }
      h += '</div>';
      if (!(fixo && caminho.length === 0)) {
        h += '<div class="diag-fim">' + (caminho.length ? VOLTAR
          : '<button type="button" class="diag-voltar" data-acao="voltar">Trocar o sintoma</button>') + '</div>';
      }
      return h;
    }

    function telaResultado() {
      var res = RESULTADOS[atual];
      var nv = NIVEIS[res.nivel];
      var sv = SERV[res.serv];
      var h = topo(sintoma.rotulo + ' · resultado') +
        '<span class="diag-selo diag-selo-' + res.nivel + '">' + esc(nv.selo) + '</span>' +
        '<h2 class="diag-pergunta diag-titulo-res" tabindex="-1">' + esc(res.titulo) + '</h2>' +
        '<p class="diag-texto">' + esc(res.texto) + '</p>' +
        '<p class="diag-sub">O que fazer agora</p><ol class="diag-passos">';
      for (var i = 0; i < res.passos.length; i++) h += '<li>' + esc(res.passos[i]) + '</li>';
      h += '</ol><div class="diag-acoes">' +
        '<a class="btn btn-wa" target="_blank" rel="noopener" data-wa="diagnostico-' + sintoma.id + '" href="' + WA + encodeURIComponent(mensagem(res)) + '">' +
        IC_WA + esc(nv.botao) + '</a>' +
        '<a class="btn btn-ghost" href="' + sv.url + '">' + esc(sv.rotulo) + '</a></div>' +
        '<p class="diag-nota">A mensagem já vai com as suas respostas. Isto é uma triagem pelo sintoma: a causa só se confirma com medição no local.</p>' +
        '<div class="diag-fim">' + VOLTAR + '<button type="button" class="diag-voltar" data-acao="refazer">Refazer do começo</button>' +
        (fixo ? '<a href="' + PAGINA_COMPLETA + '">Tenho outro sintoma</a>' : '') + '</div>';
      return h;
    }

    function desenhar() {
      var ehRes = atual && atual.indexOf('r-') === 0;
      raiz.innerHTML = '<div class="diag-card' + (ehRes ? ' diag-card-res' : '') + '">' +
        (!atual ? telaSintomas() : ehRes ? telaResultado() : telaPergunta()) + '</div>';
      if (primeira) { primeira = false; return; }
      var alvo = raiz.querySelector('.diag-pergunta');
      if (alvo) { try { alvo.focus({ preventScroll: true }); } catch (e) { alvo.focus(); } }
      var topoCard = raiz.getBoundingClientRect().top;
      if (topoCard < 70 || topoCard > window.innerHeight * 0.45) {
        var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        raiz.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'start' });
      }
    }

    raiz.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || !raiz.contains(b)) return;
      if (b.hasAttribute('data-sintoma')) {
        sintoma = sintomaPorId(b.getAttribute('data-sintoma'));
        caminho = [];
        atual = sintoma.inicio;
        evento('diagnostico_inicio', sintoma.id);
      } else if (b.hasAttribute('data-op')) {
        var i = parseInt(b.getAttribute('data-op'), 10);
        if (fixo && caminho.length === 0) evento('diagnostico_inicio', sintoma.id);
        caminho.push({ p: atual, i: i });
        atual = PERGUNTAS[atual].op[i].vai;
        if (atual.indexOf('r-') === 0) evento('diagnostico_resultado', sintoma.id + ':' + atual.slice(2));
      } else if (b.getAttribute('data-acao') === 'voltar') {
        if (caminho.length) { atual = caminho.pop().p; }
        else { atual = null; sintoma = null; }
      } else if (b.getAttribute('data-acao') === 'refazer') {
        caminho = [];
        if (fixo) { atual = fixo.inicio; } else { atual = null; sintoma = null; }
      } else { return; }
      desenhar();
    });

    raiz.classList.add('diag-ativo');
    desenhar();
  }

  var raizes = document.querySelectorAll('[data-diag]');
  for (var r = 0; r < raizes.length; r++) montar(raizes[r]);
})();
