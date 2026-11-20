const games = [
    {name:"Valorant",short:"VAL",color:"#ff4655",abbr:"V",cover:"assets/games/valorant.jpg"},
    {name:"League of Legends",short:"LOL",color:"#c89b3c",abbr:"L",cover:"assets/games/lol.jpg"},
    {name:"Counter-Strike 2",short:"CS2",color:"#d6a34a",abbr:"2",cover:"assets/games/cs.jpg"},
    {name:"Fortnite",short:"FN",color:"#8c70ff",abbr:"F",cover:"assets/games/fortnite.jpg"},
    {name:"Rocket League",short:"RL",color:"#38a9ed",abbr:"R",cover:"assets/games/rocketleague.jpg"},
    {name:"Free Fire",short:"FF",color:"#ff8b25",abbr:"火",cover:"assets/games/freefire.jpg"},
    {name:"Rainbow Six Siege",short:"R6",color:"#e0c35b",abbr:"6",cover:"assets/games/rainbowsix.jpg"},
    {name:"Dota 2",short:"DOTA",color:"#c94c45",abbr:"D",cover:"assets/games/dota2.jpg"},
    {name:"Apex Legends",short:"APEX",color:"#e34e4e",abbr:"A",cover:"assets/games/apexlegends.jpg"},
    {name:"EA Sports FC",short:"FC",color:"#62b978",abbr:"FC",cover:"assets/games/easportsfc.jpg"},
    {name:"Overwatch 2",short:"OW2",color:"#e8a45a",abbr:"O"},
    {name:"PUBG",short:"PUBG",color:"#d5a53b",abbr:"P"},
    {name:"Minecraft",short:"MC",color:"#80a95c",abbr:"M"}
];
const championships = [
 {id:1,name:"Copa Arena Open",game:"Valorant",prize:"R$ 2.000",slots:"16 / 16",date:"05 dez 2026",status:"Inscrições abertas",description:"A competição aberta para quem quer provar seu nível. Formato eliminatório simples, partidas em melhor de três e final presencial demonstrativa.",teams:["Cinza Roxo","Fragmentos","Tatu Bola","Night Owls","CRX","Eclipse"],rounds:[["Cinza Roxo 2 × 0 Night Owls","Fragmentos 2 × 1 CRX"],["Cinza Roxo 1 × 2 Fragmentos"],["Final: Fragmentos × Tatu Bola"]]},
 {id:2,name:"Desafio Fragmento",game:"Counter-Strike 2",prize:"R$ 1.200",slots:"8 / 16",date:"12 dez 2026",status:"Inscrições abertas",description:"Um torneio para equipes que gostam de estratégia, comunicação e precisão.",teams:["Fragmentos","Eclipse","Vortex","Tropa 7"],rounds:[["Vortex 13 × 9 Eclipse","Fragmentos 13 × 7 Tropa 7"],["Semifinal a definir"],["Final a definir"]]},
 {id:3,name:"Liga Rivals — Temporada 04",game:"League of Legends",prize:"R$ 3.500",slots:"12 / 12",date:"Em andamento",status:"Em andamento",description:"Temporada competitiva com fase de grupos e playoffs.",teams:["Tatu Bola","Cinza Roxo","Lobos","Nexus"],rounds:[["Tatu Bola 1 × 0 Lobos","Nexus 0 × 1 Cinza Roxo"],["Playoffs em breve"],["Final em breve"]]},
 {id:4,name:"Rocket Cup",game:"Rocket League",prize:"R$ 800",slots:"4 / 16",date:"20 dez 2026",status:"Inscrições abertas",description:"Dispute partidas rápidas e mostre sua habilidade no campo.",teams:["Boosters","Aero"],rounds:[["Aguardando confrontos"],["A definir"],["A definir"]]},
 {id:5,name:"Battle Zone",game:"Free Fire",prize:"R$ 1.500",slots:"16 / 24",date:"Encerrado",status:"Encerrado",description:"Competição demonstrativa concluída. Confira os resultados da arena.",teams:["Fênix","CRX","Tropa 7"],rounds:[["Fênix venceu Tropa 7"],["CRX venceu Fênix"],["Campeão: CRX"]]}
];
const teams = [
 {id:1,name:"Fragmentos",tag:"FRG",game:"Valorant",points:1840,members:5,wins:28,losses:7,desc:"Precisão, leitura de jogo e trabalho em equipe. O objetivo é crescer a cada rodada.",players:["Kairo","Vexa","Mizu","Nox","Rin"]},
 {id:2,name:"Cinza Roxo",tag:"CRX",game:"Valorant",points:1620,members:5,wins:22,losses:10,desc:"Um time competitivo que acredita em estratégia e evolução constante.",players:["Lume","Dante","Mika","Jett","Sora"]},
 {id:3,name:"Tatu Bola",tag:"TBL",game:"League of Legends",points:1495,members:5,wins:19,losses:11,desc:"Jogo coletivo e muita resiliência. Nunca saímos da arena sem lutar.",players:["Brisa","Kairo","Téo","Lua","Zed"]},
 {id:4,name:"Eclipse",tag:"ECL",game:"Counter-Strike 2",points:1310,members:5,wins:16,losses:12,desc:"Equipe focada em disciplina tática e execução.",players:["NightRex","Vini","Ash","Mori","Kai"]},
 {id:5,name:"Boosters",tag:"BST",game:"Rocket League",points:1190,members:3,wins:14,losses:8,desc:"Velocidade, sincronia e jogadas aéreas.",players:["Rafa","Lyn","ZK"]}
];
const players = [
 {nick:"Kairo",team:"Fragmentos",game:"Valorant",points:1840,wins:48,losses:12},
 {nick:"Lume",team:"Cinza Roxo",game:"Valorant",points:1620,wins:42,losses:16},
 {nick:"Brisa",team:"Tatu Bola",game:"League of Legends",points:1495,wins:39,losses:18},
 {nick:"Vexa",team:"Fragmentos",game:"Valorant",points:1310,wins:35,losses:19},
 {nick:"NightRex",team:"Eclipse",game:"Counter-Strike 2",points:1120,wins:31,losses:20},
 {nick:"Mizu",team:"Fragmentos",game:"Valorant",points:1080,wins:29,losses:17},
 {nick:"Dante",team:"Cinza Roxo",game:"Valorant",points:990,wins:26,losses:21}
];
const matches = [
 {a:"FRG",b:"CRX",teamA:"Fragmentos",teamB:"Cinza Roxo",score:"1 — 1",game:"Valorant",event:"Liga Rivals",date:"Hoje · 19:30",state:"Em andamento"},
 {a:"TTB",b:"ECL",teamA:"Tatu Bola",teamB:"Eclipse",score:"—",game:"League of Legends",event:"Copa Arena Open",date:"12 nov · 20:00",state:"Agendada"},
 {a:"FRG",b:"TTB",teamA:"Fragmentos",teamB:"Tatu Bola",score:"2 — 0",game:"Valorant",event:"Desafio Fragmento",date:"Ontem · 18:00",state:"Finalizada"},
 {a:"BST",b:"VTX",teamA:"Boosters",teamB:"Vortex",score:"—",game:"Rocket League",event:"Rocket Cup",date:"14 nov · 21:00",state:"Agendada"},
 {a:"CRX",b:"ECL",teamA:"Cinza Roxo",teamB:"Eclipse",score:"0 — 2",game:"Counter-Strike 2",event:"Liga Rivals",date:"08 nov · 19:00",state:"Finalizada"}
];
const posts = [
 {user:"Kairo",tag:"Procura time",time:"há 2h",text:"Alguém pra completar o time no Valorant? Procuro duelista!"},
 {user:"Lume",tag:"Dicas",time:"há 4h",text:"Dica: treinem o posicionamento antes de pensar em mira. Consistência ganha rodada."},
 {user:"Brisa",tag:"Discussão",time:"há 6h",text:"Qual mapa vocês acham mais equilibrado nesta temporada? Quero ouvir opiniões."}
];