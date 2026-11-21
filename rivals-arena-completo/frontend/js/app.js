// Se o site for aberto pelo Live Server (porta 5500...) ou direto do arquivo, fala com o backend na porta 3000.
// Quando o próprio backend serve o site (npm run dev), usa o caminho relativo /api.
const API_URL = (location.protocol === 'file:' || ['5500', '5501', '5173'].includes(location.port))
  ? 'http://localhost:3000/api'
  : '/api';

// Proteção contra XSS: tudo que vem do banco (nick, nome de time, posts...) é escapado
// antes de entrar na tela, já que o site monta o HTML com innerHTML.
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const escDeep = (v) => Array.isArray(v) ? v.map(escDeep)
  : (v && typeof v === 'object') ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, escDeep(x)]))
  : typeof v === 'string' ? esc(v) : v;

let stateChampionships = [...championships];
let stateTeams = [...teams];
let statePlayers = [...players];
let stateMatches = [...matches];
let statePosts = [...posts];

function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem('ra_session') || 'null');
    // token do Supabase expira (1h por padrão): se já venceu, trata como deslogado
    if (s?.expires_at && Date.now() / 1000 > s.expires_at) {
      localStorage.removeItem('ra_session');
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

async function syncBackendData() {
  try {
    const [cRes, tRes, pRes, mRes, postRes] = await Promise.all([
      fetch(`${API_URL}/championships`),
      fetch(`${API_URL}/teams`),
      fetch(`${API_URL}/players`),
      fetch(`${API_URL}/matches`),
      fetch(`${API_URL}/posts`)
    ]);
    if (cRes.ok) stateChampionships = escDeep(await cRes.json());
    if (tRes.ok) stateTeams = escDeep(await tRes.json());
    if (pRes.ok) statePlayers = escDeep(await pRes.json());
    if (mRes.ok) stateMatches = escDeep(await mRes.json());
    if (postRes.ok) statePosts = escDeep(await postRes.json());
  } catch (err) {
    console.warn('Backend offline: usando os dados de demonstração do arquivo js/data.js. Rode "npm run dev" na pasta backend.');
  }
}

const page = document.body.dataset.page;
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const links = [
 ["index.html","⌂","Início","home"],["campeonatos.html","♜","Campeonatos","championships"],
 ["times.html","♟","Times","teams"],["jogadores.html","▥","Jogadores","players"],
 ["partidas.html","▷","Partidas","matches"],["comunidade.html","☷","Comunidade","community"],
 ["sobre.html","ⓘ","Sobre","about"]
];

function nav(){
 const active = page==="championship-detail"?"championships":page==="team-detail"?"teams":page;
 const session = getSession();
 const authButtons = session?.profile
   ? `<span class="tiny" style="color:var(--lime);font-weight:700">● ${esc(session.profile.nick)}</span><button class="btn btn-outline" id="logoutBtn">Sair</button>`
   : `<a class="btn btn-outline" href="login.html">Entrar</a><a class="btn btn-primary" href="cadastro.html">Cadastrar</a>`;

 return `<aside class="sidebar" id="sidebar"><a class="brand" href="index.html"><img src="assets/logos/logo2-ra.png" alt="Rivals Arena" onerror="this.style.display='none';this.parentNode.insertAdjacentHTML('beforeend','<span class=brand-fallback>RIVALS<br>ARENA</span>')"></a><div class="nav-label">MENU PRINCIPAL</div><nav class="nav">${links.map(([url,ico,label,key])=>`<a class="${active===key?'active':''}" href="${url}"><span class="nav-icon">${ico}</span>${label}</a>`).join("")}</nav><div class="side-promo"><strong>ENTRE NA ARENA.</strong><p>Encontre sua equipe, dispute campeonatos e conquiste seu lugar.</p><a class="btn btn-primary" href="cadastro.html">Criar meu perfil ↗</a></div></aside>
 <main class="main"><header class="topbar"><button class="mobile-toggle" id="menuToggle" aria-label="Abrir menu">☰</button><div class="top-actions"><input class="search-top" id="globalSearch" placeholder="Buscar na arena..." aria-label="Buscar na arena">${authButtons}</div></header><div class="content" id="content"></div><footer class="footer"><span>© 2026 RIVALS ARENA · FEITO PARA QUEM JOGA.</span></footer></main>`;
}

function head(kicker,title,desc="",action=""){return `<div class="page-head"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${desc}</p></div>${action}</div>`}
function gameArt(game){const g=games.find(x=>x.name===game)||games[0];return g.cover?`<div class="game-art has-cover" style="--game-color:${g.color}"><img src="${g.cover}" alt="${g.name}"></div>`:`<div class="game-art" style="--game-color:${g.color}"><b>${g.short}</b></div>`}
function eventCard(c){return `<article class="item-card"><div class="item-top"><span class="game-chip">${c.game}</span><span class="status ${c.status==='Em andamento'?'purple':c.status==='Encerrado'?'gray':''}">${c.status}</span></div><h3>${c.name}</h3><p>${c.description}</p><div class="item-stats"><span>🏆 ${c.prize}</span><span>♟ ${c.slots} vagas</span><span>◷ ${c.date}</span></div><a class="btn btn-dark" href="campeonato.html?id=${c.id}">Ver detalhes ↗</a></article>`}
function teamCard(t){return `<article class="item-card"><div class="item-top"><span class="game-chip">${t.tag}</span><span class="muted tiny">${t.game}</span></div><h3>${t.name}</h3><p>${t.desc}</p><div class="item-stats"><span>▥ ${t.points} pts</span><span>♟ ${t.members} integrantes</span><span>✓ ${t.wins} vitórias</span></div><a class="btn btn-dark" href="time.html?id=${t.id}">Ver equipe ↗</a></article>`}

function home(){
 const content = $("#content");
 const feat = stateChampionships.find(c => c.status === 'Inscrições abertas') || stateChampionships[0];
 const live = stateMatches.find(m => m.state === 'Em andamento');
 content.innerHTML=`<section class="hero hero-home"><div class="hero-copy"><div class="eyebrow">SUA PRÓXIMA VITÓRIA COMEÇA AQUI</div><h1>RIVALS ARENA<br>SUA ARENA DE <span>ESPORTS.</span></h1><p>Compita em campeonatos, suba no ranking, forme seu time e faça parte de uma comunidade que joga para vencer.</p><div class="hero-actions"><a class="btn btn-primary" href="campeonatos.html">♜ Explorar campeonatos</a><a class="btn btn-outline" href="times.html">♟ Encontrar equipes</a></div></div><img class="hero-logo" src="assets/logos/logo-hero.png" alt="Rivals Arena"></section>
 <div class="grid home-grid">
 <section class="panel"><div class="panel-head"><h2><span class="accent-icon">♜</span>Campeonatos em destaque</h2><a href="campeonatos.html">Ver todos →</a></div>${feat ? `<div class="feature-event">${gameArt(feat.game)}<div class="event-info"><span class="status ${feat.status==='Em andamento'?'purple':feat.status==='Encerrado'?'gray':''}">${feat.status.toUpperCase()}</span><h3>${feat.name}</h3><div class="muted tiny">${feat.game}</div><div class="event-meta"><b>🏆 ${feat.prize}</b><span>♟ ${feat.slots}</span><span>◷ ${feat.date}</span></div><a class="btn btn-primary" href="campeonato.html?id=${feat.id}">Ver detalhes →</a></div></div>` : '<p class="muted">Nenhum campeonato cadastrado ainda.</p>'}</section>
 <section class="panel"><div class="panel-head"><h2><span class="accent-icon">▣</span>Próximas partidas</h2><a href="partidas.html">Ver todas →</a></div>${stateMatches.slice(0,3).map(m=>`<div class="match-row"><div class="crest">${m.a}</div><div><div class="match-title">${m.a} <span class="muted">vs</span> ${m.b}</div><div class="tiny muted">${m.event}</div></div><div class="match-time">${m.date}<br><span class="status ${m.state==='Em andamento'?'purple':''}">${m.state}</span></div></div>`).join("")}</section>
 <section class="panel ranking-panel"><div class="panel-head"><h2><span class="accent-icon">▥</span>Ranking de jogadores</h2><a href="jogadores.html">Ver todos →</a></div><div class="podium">${(()=>{const top=[...statePlayers].sort((a,b)=>b.points-a.points).slice(0,3);return [[top[1],2],[top[0],1],[top[2],3]].filter(([p])=>p)})().map(([p,rank])=>`<div class="podium-item ${rank===1?'first':''}"><div class="podium-rank">${rank}</div><div class="avatar">${p.nick[0]}</div><strong>${p.nick}</strong><small>${p.points.toLocaleString('pt-BR')} pts</small></div>`).join("")}</div><div class="tiny muted" style="text-align:center;margin-top:12px">Classificação da temporada</div></section></div>
 <div class="grid home-lower"><section class="panel"><div class="panel-head"><h2><span class="accent-icon">✦</span>Jogos disponíveis</h2><a href="campeonatos.html">Explorar →</a></div><div class="game-grid">${games.slice(0,10).map(g=>g.cover?`<div class="game-tile has-cover" style="--game-color:${g.color}"><img src="${g.cover}" alt="${g.name}" loading="lazy"><span>${g.name}</span></div>`:`<div class="game-tile" style="--game-color:${g.color}"><b>${g.short}</b><span>${g.name}</span></div>`).join("")}</div></section>
 <section class="panel"><div class="panel-head"><h2><span class="accent-icon">▥</span>Ranking de equipes</h2><a href="times.html">Ver todos →</a></div>${stateTeams.slice(0,3).map((t,i)=>`<div class="match-row"><div class="rank-num">${i+1}</div><div><div class="match-title">${t.name}</div><div class="tiny muted">${t.tag} · ${t.game}</div></div><b class="tiny">${t.points} pts</b></div>`).join("")}</section>
 <section class="panel"><div class="panel-head"><h2><span class="accent-icon">◉</span>Comunidade</h2><a href="comunidade.html">Ver todas →</a></div>${statePosts.slice(0,2).map(postHTML).join("")}</section></div>
 ${live ? `<div class="live-strip"><div><span class="live-dot"></span><b>PARTIDA EM ANDAMENTO</b><div class="tiny muted" style="margin:7px 0 0 17px">${live.event} · ${live.game}</div></div><strong style="color:var(--orange)">${live.a}　${live.score}　${live.b}</strong><a class="btn btn-dark" href="partidas.html">Acompanhar partidas →</a></div>` : ''}`;
}

function postHTML(p){return `<div class="community-post"><div class="avatar small">${p.user[0]}</div><div><strong>${p.user}</strong><span class="tag">• ${p.tag}</span><div class="tiny muted">${p.time}</div><p>${p.text}</p></div></div>`}

function championshipsPage(){
 const content = $("#content");
 const initialQ = new URLSearchParams(location.search).get("q") || "";
 content.innerHTML=head("DISPUTE E CONQUISTE","CAMPEONATOS","Encontre sua próxima competição, confira as regras e acompanhe cada etapa.")+`<div class="filters"><input id="filterSearch" value="${esc(initialQ)}" placeholder="Buscar campeonato..."><select id="filterGame"><option value="">Todos os jogos</option>${games.map(g=>`<option>${g.name}</option>`).join("")}</select><select id="filterStatus"><option value="">Todos os status</option><option>Inscrições abertas</option><option>Em andamento</option><option>Encerrado</option></select></div><div class="cards" id="eventCards">${stateChampionships.map(eventCard).join("")}</div>`;
 const filter=()=>{const q=$("#filterSearch").value.toLowerCase(),g=$("#filterGame").value,s=$("#filterStatus").value;const list=stateChampionships.filter(c=>(c.name+" "+c.game).toLowerCase().includes(q)&&(!g||c.game===g)&&(!s||c.status===s));$("#eventCards").innerHTML=list.length?list.map(eventCard).join(""):`<div class="empty">Nenhum campeonato encontrado.</div>`};
 ["filterSearch","filterGame","filterStatus"].forEach(id=>$("#"+id).addEventListener("input",filter));
 if (initialQ) filter();
}

function championshipDetail(){
 const content = $("#content");
 const c=stateChampionships.find(x=>x.id===Number(new URLSearchParams(location.search).get("id")))||stateChampionships[0];
 if(!c){content.innerHTML='<a class="btn btn-dark" href="campeonatos.html">← Voltar aos campeonatos</a><div class="empty">Campeonato não encontrado.</div>';return;}
 content.innerHTML=`<a class="btn btn-dark" href="campeonatos.html">← Voltar aos campeonatos</a><div class="profile-hero section">${gameArt(c.game)}<div><div class="eyebrow">${c.game} · TEMPORADA 2026</div><h2>${c.name}</h2><p>${c.description}</p><span class="status">${c.status}</span></div></div><div class="detail-grid"><section class="panel"><div class="panel-head"><h2>Chaveamento</h2><span class="muted tiny">Etapas do torneio</span></div><div class="bracket">${c.rounds.map((r,i)=>`<div class="round"><h4>${["Quartas / grupos","Semifinal","Final"][i]}</h4>${r.map(x=>`<div class="bracket-match">${x}</div>`).join("")}</div>`).join("")}</div><div class="section"><h2 class="section-title">Equipes inscritas</h2>${c.teams.map((t,i)=>`<div class="match-row"><div class="crest">${t.slice(0,3).toUpperCase()}</div><div class="match-title">${t}</div><span class="tiny muted">Equipe ${String(i+1).padStart(2,"0")}</span></div>`).join("")}</div></section><aside class="panel"><h2 class="section-title">Informações</h2><div class="item-stats">🏆 Premiação: <b>${c.prize}</b></div><div class="item-stats">♟ Vagas: <b>${c.slots}</b></div><div class="item-stats">◷ Início: <b>${c.date}</b></div><div class="item-stats">🎮 Jogo: <b>${c.game}</b></div><div class="field" style="margin-top:14px"><label>Nome da equipe <span class="tiny muted">(só se você ainda não tiver uma)</span></label><input id="teamNameInput" placeholder="Ex: Rivals Squad"></div><button class="btn btn-primary" id="joinEvent">Solicitar inscrição ↗</button><div id="joinNotice"></div></aside></div>`;
 $("#joinEvent").onclick = async () => {
   const session = getSession();
   const teamName = $("#teamNameInput").value.trim();
   if (!session?.access_token) {
     $("#joinNotice").innerHTML = '<div class="notice">Faça login primeiro para inscrever sua equipe. <a href="login.html" style="color:var(--lime)">Entrar</a></div>';
     return;
   }
   try {
     const res = await fetch(`${API_URL}/championships/${c.id}/register`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
       body: JSON.stringify({ team_name: teamName })
     });
     const data = await res.json();
     if (!res.ok) {
       if (res.status === 401) localStorage.removeItem('ra_session');
       throw new Error(data.error);
     }
     $("#joinNotice").innerHTML = `<div class="notice">${esc(data.message)}</div>`;
   } catch (err) {
     $("#joinNotice").innerHTML = `<div class="notice">${esc(err.message === 'Failed to fetch' ? 'Não foi possível falar com o servidor. O backend está rodando?' : err.message)}</div>`;
   }
 };
}

function teamsPage(){
 const content = $("#content");
 content.innerHTML=head("CONEXÕES QUE VENCEM","TIMES","Conheça equipes, encontre novos parceiros e acompanhe quem domina a arena.")+`<div class="filters"><input id="filterSearch" placeholder="Buscar por nome ou tag..."><select id="filterGame"><option value="">Todos os jogos</option>${games.map(g=>`<option>${g.name}</option>`).join("")}</select></div><div class="cards" id="teamCards">${stateTeams.map(teamCard).join("")}</div>`;
 const filter=()=>{let q=$("#filterSearch").value.toLowerCase(),g=$("#filterGame").value;let arr=stateTeams.filter(t=>(t.name+" "+t.tag).toLowerCase().includes(q)&&(!g||t.game===g));$("#teamCards").innerHTML=arr.length?arr.map(teamCard).join(""):'<div class="empty">Nenhuma equipe encontrada.</div>'};
 $("#filterSearch").oninput=filter;$("#filterGame").onchange=filter;
}

function teamDetail(){
 const content = $("#content");
 const t=stateTeams.find(x=>x.id===Number(new URLSearchParams(location.search).get("id")))||stateTeams[0];
 if(!t){content.innerHTML='<a class="btn btn-dark" href="times.html">← Voltar aos times</a><div class="empty">Equipe não encontrada.</div>';return;}
 content.innerHTML=`<a class="btn btn-dark" href="times.html">← Voltar aos times</a><div class="profile-hero section"><div class="profile-mark">${t.tag}</div><div><div class="eyebrow">PERFIL DA EQUIPE · ${t.game}</div><h2>${t.name}</h2><p>${t.desc}</p></div></div><div class="grid home-lower section"><section class="panel"><h2 class="section-title">Desempenho</h2><div class="item-stats">▥ <b>${t.points} pontos</b></div><div class="item-stats">✓ <b>${t.wins} vitórias</b></div><div class="item-stats">× <b>${t.losses} derrotas</b></div><div class="item-stats">♟ <b>${t.members} integrantes</b></div></section><section class="panel"><h2 class="section-title">Integrantes</h2>${t.players.map((p,i)=>`<div class="match-row"><div class="avatar small">${p[0]}</div><div class="match-title">${p}</div><span class="tiny muted">Jogador</span></div>`).join("")}</section><section class="panel"><h2 class="section-title">Próximo objetivo</h2><p class="muted">A equipe está se preparando para as próximas competições da temporada.</p><a class="btn btn-primary" href="campeonatos.html">Ver campeonatos →</a></section></div>`;
}

function playersPage(){
 const content = $("#content");
 content.innerHTML=head("OS MELHORES DA ARENA","RANKING DE JOGADORES","Pontuação baseada no desempenho da temporada.")+`<div class="filters"><input id="filterSearch" placeholder="Buscar jogador ou equipe..."><select id="filterGame"><option value="">Todos os jogos</option>${games.map(g=>`<option>${g.name}</option>`).join("")}</select></div><div class="table-wrap"><table><thead><tr><th>Posição</th><th>Jogador</th><th>Equipe</th><th>Jogo principal</th><th>Vitórias</th><th>Derrotas</th><th>Pontos</th></tr></thead><tbody id="playerRows"></tbody></table></div><div class="section"><h2 class="section-title">Ranking de equipes</h2><div class="cards">${stateTeams.slice(0,3).map(teamCard).join("")}</div></div>`;
 const render=()=>{let q=$("#filterSearch").value.toLowerCase(),g=$("#filterGame").value;let arr=statePlayers.filter(p=>(p.nick+" "+p.team).toLowerCase().includes(q)&&(!g||p.game===g));$("#playerRows").innerHTML=arr.map((p,i)=>`<tr><td class="rank-num">#${i+1}</td><td><strong>${p.nick}</strong></td><td>${p.team}</td><td>${p.game}</td><td>${p.wins}</td><td>${p.losses}</td><td><b>${p.points.toLocaleString("pt-BR")}</b></td></tr>`).join("")||'<tr><td colspan="7" class="empty">Nenhum jogador encontrado.</td></tr>'};
 $("#filterSearch").oninput=render;$("#filterGame").onchange=render;render();
}

function matchesPage(){
 const content = $("#content");
 content.innerHTML=head("ACOMPANHE CADA CONFRONTO","PARTIDAS","Calendário, placares e resultados da arena em um só lugar.")+`<div class="filters"><select id="matchState"><option value="">Todos os status</option><option>Agendada</option><option>Em andamento</option><option>Finalizada</option></select><select id="matchGame"><option value="">Todos os jogos</option>${games.map(g=>`<option>${g.name}</option>`).join("")}</select></div><div class="cards" id="matchCards"></div>`;
 const render=()=>{let s=$("#matchState").value,g=$("#matchGame").value,arr=stateMatches.filter(m=>(!s||m.state===s)&&(!g||m.game===g));$("#matchCards").innerHTML=arr.map(m=>`<article class="item-card"><div class="item-top"><span class="game-chip">${m.game}</span><span class="status ${m.state==='Em andamento'?'purple':m.state==='Finalizada'?'gray':''}">${m.state}</span></div><div class="match-title" style="font-size:17px;margin:20px 0">${m.teamA} <span class="muted">vs</span> ${m.teamB}</div><div style="font:800 29px 'Barlow Condensed';color:var(--lime)">${m.score}</div><div class="item-stats"><span>♜ ${m.event}</span><span>◷ ${m.date}</span></div></article>`).join("")||'<div class="empty">Nenhuma partida encontrada.</div>'};
 $("#matchState").onchange=render;$("#matchGame").onchange=render;render();
}

function communityPage(){
 const content = $("#content");
 const session = getSession();
 const logged = !!(session?.access_token && session?.profile);
 const formHTML = logged
   ? `<p class="tiny muted">Publicando como <b style="color:var(--lime)">${esc(session.profile.nick)}</b></p><form id="postForm"><div class="field"><label>Categoria</label><select name="tag"><option>Discussão</option><option>Procura time</option><option>Dicas</option><option>Clipes</option></select></div><div class="field"><label>Mensagem</label><textarea name="text" required maxlength="280" placeholder="Compartilhe com a comunidade..."></textarea></div><button class="btn btn-primary">Publicar no feed</button><div id="postNotice"></div></form>`
   : `<div class="notice">Entre na sua conta para publicar no feed. <a href="login.html" style="color:var(--lime)">Entrar</a> · <a href="cadastro.html" style="color:var(--lime)">Cadastrar</a></div>`;
 content.innerHTML=head("A ARENA É DE TODOS","COMUNIDADE","Compartilhe ideias, encontre jogadores e converse sobre seus jogos favoritos.")+`<div class="detail-grid"><section class="panel"><div class="panel-head"><h2>Publicações recentes</h2><span class="muted tiny">Feed da comunidade</span></div><div id="feed">${statePosts.map(postHTML).join("")}</div></section><aside class="panel"><h2 class="section-title">Criar publicação</h2>${formHTML}</aside></div>`;
 if (!logged) return;
 $("#postForm").onsubmit = async e => {
   e.preventDefault();
   const f = new FormData(e.target);
   try {
     const res = await fetch(`${API_URL}/posts`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
       body: JSON.stringify({ tag: f.get("tag"), text: f.get("text") })
     });
     const created = await res.json();
     if (!res.ok) {
       if (res.status === 401) localStorage.removeItem('ra_session');
       throw new Error(created.error);
     }
     statePosts.unshift(escDeep(created));
     communityPage();
   } catch (err) {
     $("#postNotice").innerHTML = `<div class="notice">${esc(err.message === 'Failed to fetch' ? 'Não foi possível falar com o servidor. O backend está rodando?' : err.message)}</div>`;
   }
 };
}

function loginPage(signup=false){
 const content = $("#content");
 content.innerHTML=`<div class="form-card"><div class="eyebrow">BEM-VINDO À ARENA</div><h1>${signup?'CRIE SUA CONTA':'ENTRE NA ARENA'}</h1><p class="muted">${signup?'Monte seu perfil e prepare-se para competir.':'Acesse seu perfil e continue sua jornada.'}</p><form id="authForm">${signup?'<div class="field"><label>Nickname</label><input name="nick" required placeholder="Seu nome na arena"></div>':''}<div class="field"><label>E-mail</label><input name="email" type="email" required placeholder="voce@email.com"></div><div class="field"><label>Senha</label><input name="password" type="password" required minlength="6" placeholder="Mínimo de 6 caracteres"></div>${signup?`<div class="field"><label>Jogo principal</label><select name="game">${games.map(g=>`<option>${g.name}</option>`).join("")}</select></div>`:''}<button class="btn btn-primary">${signup?'Criar conta':'Entrar'}</button><div class="form-note">${signup?'Já tem uma conta? <a href="login.html" style="color:var(--lime)">Entrar</a>':'Ainda não tem conta? <a href="cadastro.html" style="color:var(--lime)">Cadastre-se</a>'}</div><div id="authNotice"></div></form></div>`;
 $("#authForm").onsubmit = async e => {
   e.preventDefault();
   const f = new FormData(e.target);
   const payload = Object.fromEntries(f.entries());
   const endpoint = signup ? '/auth/register' : '/auth/login';
   try {
     const res = await fetch(`${API_URL}${endpoint}`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(payload)
     });
     const data = await res.json();
     if (!res.ok) throw new Error(data.error);
     if (data.session) {
       localStorage.setItem('ra_session', JSON.stringify({
         access_token: data.session.access_token,
         expires_at: data.session.expires_at,
         profile: data.profile
       }));
       location.href = 'index.html';
     } else {
       $("#authNotice").innerHTML = `<div class="notice">${esc(data.message)}</div>`;
     }
   } catch (err) {
     $("#authNotice").innerHTML = `<div class="notice">Erro: ${esc(err.message === 'Failed to fetch' ? 'não foi possível falar com o servidor (o backend está rodando?)' : err.message)}</div>`;
   }
 };
}

function aboutPage(){
 const content = $("#content");
 content.innerHTML=head("CONHEÇA A PLATAFORMA","SOBRE A RIVALS ARENA","Um ponto de encontro para quem leva competição a sério.")+`<div class="hero hero-about"><div class="hero-copy"><div class="eyebrow">COMPITA · CONECTE-SE · CONQUISTE</div><h1>SUA JORNADA.<br><span>SUA ARENA.</span></h1><p>A Rivals Arena nasce para aproximar jogadores, equipes e comunidades em torno da paixão pelos esports.</p><a class="btn btn-primary" href="cadastro.html">Faça parte da arena ↗</a></div><img class="hero-logo" src="assets/logos/logo-hero.png" alt="Rivals Arena"></div><div class="about-grid"><article class="about-block"><div class="eyebrow">NOSSO OBJETIVO</div><h2>Mais do que jogar. Competir.</h2><p>Reunir em um só espaço pessoas que querem participar de campeonatos, acompanhar rankings, montar equipes e evoluir em seus jogos favoritos.</p></article><article class="about-block"><div class="eyebrow">NOSSA PROPOSTA</div><h2>Uma comunidade em movimento.</h2><p>Dar visibilidade a jogadores e times, organizar informações de partidas e incentivar uma experiência competitiva acessível e colaborativa.</p></article></div>`;
}

const renderers={home,championships:championshipsPage,"championship-detail":championshipDetail,teams:teamsPage,"team-detail":teamDetail,players:playersPage,matches:matchesPage,community:communityPage,login:()=>loginPage(false),signup:()=>loginPage(true),about:aboutPage};

(async function init() {
  await syncBackendData();
  document.querySelector("#app").innerHTML = nav();
  $("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  $("#globalSearch").addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const q = e.target.value.trim();
      if (q) location.href = `campeonatos.html?q=${encodeURIComponent(q)}`;
    }
  });
  const logoutBtn = $("#logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem('ra_session');
      location.reload();
    };
  }
  (renderers[page] || home)();
})();
