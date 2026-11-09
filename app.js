// Importações do Firebase v9 (SDK Modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue, set, push, remove, get, child, update, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
// ==========================================
// 1. CONFIGURAÇÃO DO FIREBASE
// COLOQUE SUAS CHAVES AQUI, MESTRE!
// ==========================================
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB5rYYzsbn7rSfh2Q7iv20VtmWcvUTySaA",
  authDomain: "turno-noturno.firebaseapp.com",
  databaseURL: "https://turno-noturno-default-rtdb.firebaseio.com",
  projectId: "turno-noturno",
  storageBucket: "turno-noturno.firebasestorage.app",
  messagingSenderId: "452104216659",
  appId: "1:452104216659:web:982293f3f30b372e1b26a6",
  measurementId: "G-YQVGM2LLHW"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const IMGBB_API_KEY = "1fd4d8fc1d8b3f9bb172de4e42dabe37";
// ==========================================
// 2. VARIÁVEIS GLOBAIS E ESTADOS
// ==========================================
let currentUser = "";
let userGrimoire = [];
let callbackJogoCarta = null;
let currentSpellId = null;
let isMasterAuthenticated = false;
let fatorKarma = 0;
let canalAtual = 'taverna';
let canalRolagemDestino = 'taverna';
let unsubscribeChat = null;
let jogadorSilenciado = false;
let intervaloMute = null;

// Variáveis para Menções e NPCs
let respondendoA = null;
let npcsSalvos = {};
// ==========================================
// 3. CONTROLE DE LOGIN / INTERFACE
// ==========================================
const DOM = {
    loginScreen: document.getElementById('login-screen'),
    appScreen: document.getElementById('app-screen'),
    usernameInput: document.getElementById('username-input'),
    userTitle: document.getElementById('user-title'),
    grid: document.getElementById('lista-efeitos'),
    searchInput: document.getElementById('search-input'),
    modalAdd: document.getElementById('modal-add'),
    modalView: document.getElementById('modal-view')
};
// Prevenção de erro: Verifica se o audio-modal existe antes de aplicar eventos
function corrigirAudioModal() {
    const audioModal = document.getElementById('audio-modal');
    if (!audioModal) return; 

    const closeAudioBtn = audioModal.querySelector('.close-btn') || document.getElementById('close-audio-modal');
    if (closeAudioBtn) {
        closeAudioBtn.onclick = () => {
            audioModal.style.display = 'none';
            const player = document.getElementById('audio-player-element');
            if (player) player.pause();
        };
    }
}
window.addEventListener('DOMContentLoaded', corrigirAudioModal);

const fileInput = document.getElementById('file-upload'); 
const previewContainer = document.getElementById('reply-preview'); 

if (fileInput && previewContainer) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        
        if (file.type.startsWith('video/')) {
            previewContainer.innerHTML = `
                <video src="${url}" class="chat-media video-preview" controls autoplay muted style="max-height: 100px;"></video>
                <button onclick="document.getElementById('file-upload').value=''; document.getElementById('reply-preview').innerHTML='';">X</button>
            `;
        } else if (file.type.startsWith('image/')) {
            previewContainer.innerHTML = `
                <img src="${url}" class="chat-media" style="max-height: 100px;" />
                <button onclick="document.getElementById('file-upload').value=''; document.getElementById('reply-preview').innerHTML='';">X</button>
            `;
        }
    });
}

window.onload = () => {
    const savedUser = localStorage.getItem('rpg_username');
    if (savedUser) login(savedUser);
};

function embaralharAcoes(texto) {
    let emFala = false;
    let resultado = "";
    const glitchChars = "¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿×÷#$@%&*";
    
    for (let i = 0; i < texto.length; i++) {
        let char = texto[i];
        if (char === '"' || char === "'") {
            emFala = !emFala;
            resultado += char;
            continue;
        }
        if (!emFala && char.match(/[a-zA-Z0-9áéíóúãõç]/i)) {
            resultado += glitchChars[Math.floor(Math.random() * glitchChars.length)];
        } else {
            resultado += char;
        }
    }
    return resultado;
}

function obterEstadoGeral(ficha) {
    if (!ficha) return 'saudavel';
    if (ficha.estadoFisico === 'desacordado') return 'desacordado';
    if (ficha.estadoMental === 'ansiedade' || ficha.estadoMental === 'insano' || ficha.estadoMental === 'fragmentado') return ficha.estadoMental;
    return ficha.estadoFisico || 'saudavel';
}
window.alternarPesquisaChat = function() {
    const campo = document.getElementById('input-pesquisa-chat');
    if (!campo) return;
    campo.classList.toggle('hidden');
    if (!campo.classList.contains('hidden')) campo.focus();
    else { campo.value = ''; campo.dispatchEvent(new Event('input')); }
};
document.getElementById('input-pesquisa-chat').addEventListener('input', (e) => {
    const termo = e.target.value.trim().toLocaleLowerCase('pt-BR');
    document.querySelectorAll('.chat-msg-wrapper').forEach(msg => {
        msg.style.display = !termo || msg.innerText.toLocaleLowerCase('pt-BR').includes(termo) ? 'flex' : 'none';
    });
});
let buscaTimer = null;
function normalizarBusca(valor) { return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim(); }
DOM.searchInput.addEventListener('input', () => {
    clearTimeout(buscaTimer);
    buscaTimer = setTimeout(() => {
        const termo = normalizarBusca(DOM.searchInput.value);
        renderizarCards(userGrimoire.filter(item => [item.nome,item.cor,item.receita,item.efeito]
            .some(value => normalizarBusca(value).includes(termo))));
    }, 100);
});

let suprimirInsanidadeVisual = false;
document.getElementById('btn-anti-glitch').addEventListener('click', () => {
    suprimirInsanidadeVisual = !suprimirInsanidadeVisual;
    const chatContainer = document.getElementById('chat-messages'); // ou a div principal do chat
    if (chatContainer) {
        chatContainer.classList.toggle('glitch-extremo', !suprimirInsanidadeVisual && obterEstadoGeral(fichaAtual) === 'fragmentado');
    }
});
// ==========================================
// 3. CRIAÇÃO DE CANAIS (COM APROVAÇÃO DO MESTRE) E SALAS PRIVADAS
// ==========================================
let canalPendenteAtual = null;

window.solicitarNovoCanal = function() {
    document.getElementById('modal-criar-sala').style.display = 'flex';
}

window.enviarSugestaoCanal = function() {
    const nome = document.getElementById('novo-canal-nome').value.trim();
    const privado = document.getElementById('novo-canal-privado').checked;
    const senha = document.getElementById('novo-canal-senha').value.trim();

    if (!nome) return alert("Dê um nome à sala.");

    push(ref(db, 'canais_pendentes'), {
        nome: nome,
        privado: privado,
        senha: senha || null,
        criador: currentUser,
        timestamp: Date.now()
    }).then(() => {
        alert("Sua sugestão foi enviada aos Deuses (Mestre). Aguarde aprovação.");
        document.getElementById('modal-criar-sala').style.display = 'none';
    });
}

// Mestre Escuta Canais Pendentes (Coloque isso na função liberarAcessoMestre)
function escutarCanaisPendentes() {
    onValue(ref(db, 'canais_pendentes'), (snapshot) => {
        const lista = document.getElementById('gm-pending-list');
        if (!lista) return;
        lista.replaceChildren();
        if (!snapshot.exists()) { lista.textContent = 'Nenhuma sala aguardando.'; return; }
        snapshot.forEach(item => {
            const canal = item.val() || {};
            const row = document.createElement('div'); row.className = 'gm-channel-row';
            const label = document.createElement('span'); label.textContent = `${canal.nome || 'Sala sem nome'} ${canal.privado ? '🔒' : ''} (por ${canal.criador || 'jogador'})`;
            const actions = document.createElement('div');
            const approve = document.createElement('button'); approve.className = 'btn-mystic compact'; approve.textContent = '✓ Aprovar';
            approve.onclick = () => window.aprovarCanal(item.key, canal.nome || '', !!canal.privado, canal.senha || '');
            const reject = document.createElement('button'); reject.className = 'btn-mystic compact'; reject.textContent = '✕ Recusar'; reject.onclick = () => window.negarCanal(item.key);
            actions.append(approve, reject); row.append(label, actions); lista.appendChild(row);
        });
    });
}

function renderizarAdministracaoCanais(snapshot) {
    const list = document.getElementById('gm-channel-admin-list');
    if (!list) return;
    list.replaceChildren();
    if (!snapshot || !snapshot.exists()) { list.textContent = 'Nenhuma sala.'; return; }
    snapshot.forEach(item => {
        const canal = item.val() || {};
        if (canal.aprovado !== true) return;
        const row = document.createElement('div'); row.className = 'gm-channel-row';
        const name = document.createElement('span'); name.textContent = `${canal.nome || item.key}${item.key === 'taverna' ? ' (padrão)' : ''}`;
        const del = document.createElement('button'); del.className = 'btn-mystic compact danger'; del.textContent = item.key === 'taverna' ? 'Padrão' : 'Excluir';
        del.disabled = item.key === 'taverna';
        del.title = item.key === 'taverna' ? 'A sala padrão não pode ser excluída' : 'Excluir sala e histórico';
        del.onclick = () => window.excluirCanal(item.key, canal.nome || item.key);
        row.append(name, del); list.appendChild(row);
    });
}

window.excluirCanal = async function(id, nome) {
    if (!['mestre', 'gm'].includes((currentUser || '').toLowerCase()) && !isMasterAuthenticated) return alert('Apenas o Mestre pode excluir salas.');
    if (id === 'taverna') return alert('A sala padrão não pode ser excluída.');
    if (!confirm(`Excluir “${nome}” e todo o histórico de mensagens dessa sala? Esta ação não pode ser desfeita.`)) return;
    try {
        await remove(ref(db, `canais/${id}`));
        await remove(ref(db, `mensagens/${id}`));
        const config = await get(ref(db, 'configuracoes/destino_rolagens'));
        if (config.val() === id) await set(ref(db, 'configuracoes/destino_rolagens'), 'taverna');
        if (canalAtual === id) mudarCanal('taverna', 'Taverna');
    } catch (err) { console.error(err); alert('Não foi possível excluir o canal. Verifique as permissões do Firebase.'); }
};

window.aprovarCanal = function(id_pendente, nome, privado, senha) {
    const id_canal = nome.toLowerCase().replace(/\s+/g, '-');
    
    // CORREÇÃO: Salvando diretamente no nó 'canais' para o chat conseguir enxergar
    set(ref(db, `canais/${id_canal}`), { 
        nome: nome, 
        privado: privado, 
        senha: senha || null,
        aprovado: true, // Garante que a sala já nasce visível aos jogadores
        criador: 'Mestre'
    }).then(() => {
        remove(ref(db, `canais_pendentes/${id_pendente}`));
        alert(`Sala "${nome}" criada com sucesso!`);
    });
}
window.negarCanal = function(id_pendente) {
    remove(ref(db, `canais_pendentes/${id_pendente}`));
}

// Desbloquear Sala Privada (Blur)
window.tentarDesbloquearSala = function() {
    const senhaDigitada = document.getElementById('input-tentativa-senha').value;
    // Checar no firebase se a senha bate com a do canalAtual
    get(ref(db, `canais_aprovados/${canalAtual}`)).then((snap) => {
        if(snap.exists() && snap.val().senha === senhaDigitada) {
            document.getElementById('chat-fundo').classList.remove('sala-trancada');
            document.getElementById('modal-senha-sala').style.display = 'none';
            // Salvar no localstorage para não pedir de novo na mesma sessão
            sessionStorage.setItem(`senha_${canalAtual}`, senhaDigitada);
        } else {
            alert("Senha Incorreta!");
        }
    });
}

// ==========================================
// 4. MÚSICA DE FUNDO COM LINK DO YOUTUBE
// ==========================================
let musicaCompartilhada = { tracks: [], index: 0, playing: false };
let ultimoEmbedMusica = '';
function usuarioEhMestreLocal() {
    if (typeof usuarioEhMestreDaMesa === 'function') return usuarioEhMestreDaMesa();
    return typeof currentUser !== 'undefined' && ['mestre','gm'].includes(String(currentUser || '').toLowerCase());
}
function analisarLinkMusica(url, titulo) {
    try {
        const u = new URL(url.trim());
        if (!['https:','http:'].includes(u.protocol)) return null;
        const host = u.hostname.replace(/^www\./, '').toLowerCase();
        if (['youtube.com','m.youtube.com','music.youtube.com','youtu.be','youtube-nocookie.com'].includes(host)) {
            const listId=u.searchParams.get('list');
            if(listId && /^[\w-]{10,80}$/.test(listId)) return {provider:'youtube-playlist',id:listId,title:titulo || 'Playlist do YouTube',url:u.href};
            let id = host === 'youtu.be' ? u.pathname.split('/').filter(Boolean)[0] : (u.searchParams.get('v') || u.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1]);
            if (!id || !/^[\w-]{11}$/.test(id)) return null;
            return { provider:'youtube', id, title:titulo || 'YouTube · ' + id, url:u.href };
        }
        if (host === 'open.spotify.com' || host === 'spotify.link') {
            const parts = u.pathname.split('/').filter(Boolean);
            const type = parts.find(p => ['track','playlist','album'].includes(p));
            const id = type ? parts[parts.indexOf(type)+1] : null;
            if (!type || !id || !/^[A-Za-z0-9]+$/.test(id)) return null;
            return { provider:'spotify', kind:type, id, title:titulo || `Spotify · ${type}`, url:u.href };
        }
    } catch (_) {}
    return null;
}
function isMasterRoleForAudio() { return usuarioEhMestreLocal(); }
function renderizarGerenciadorPlaylist() {
    const el = document.getElementById('playlist-edit-list');
    if (!el) return;
    el.innerHTML = '';
    const tracks = musicaCompartilhada.tracks || [];
    if (!tracks.length) { el.innerHTML = '<small class="playlist-empty">A playlist ainda está vazia.</small>'; return; }
    tracks.forEach((t,i) => {
        const row = document.createElement('div'); row.className = 'playlist-edit-row';
        const name = document.createElement('span'); name.textContent = `${i+1}. ${t.title || t.provider}`;
        row.appendChild(name);
        if (isMasterRoleForAudio()) {
            const up=document.createElement('button'); up.type='button'; up.textContent='↑'; up.title='Mover para cima'; up.onclick=()=>moverFaixaPlaylist(i,-1);
            const down=document.createElement('button'); down.type='button'; down.textContent='↓'; down.title='Mover para baixo'; down.onclick=()=>moverFaixaPlaylist(i,1);
            const del=document.createElement('button'); del.type='button'; del.textContent='×'; del.title='Remover'; del.onclick=()=>removerFaixaPlaylist(i);
            row.append(up,down,del);
        }
        el.appendChild(row);
    });
}
function renderizarPlayerMusica() {
    const panel=document.getElementById('site-music-player'), frame=document.getElementById('site-music-frame');
    if (!panel || !frame) return;
    const tracks=musicaCompartilhada.tracks || [];
    if (!tracks.length) { panel.style.display='none'; frame.src=''; ultimoEmbedMusica=''; return; }
    panel.style.display='block';
    const index=Math.max(0,Math.min(Number(musicaCompartilhada.index)||0,tracks.length-1));
    const track=tracks[index];
    const title=document.getElementById('music-current-title'); if(title) title.textContent=track.title || `${track.provider} · faixa ${index+1}`;
    const toggle=document.getElementById('music-toggle'); if(toggle) toggle.textContent=track.provider==='spotify' ? '▶ Controles Spotify' : (musicaCompartilhada.playing ? '⏸ Pausar' : '▶ Ativar som');
    let src='';
    if(track.provider==='youtube') src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(track.id)}?controls=1&rel=0&playsinline=1&autoplay=${musicaCompartilhada.playing ? '1':'0'}&enablejsapi=1`;
    if(track.provider==='youtube-playlist') src=`https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(track.id)}&controls=1&rel=0&playsinline=1&autoplay=${musicaCompartilhada.playing ? '1':'0'}&enablejsapi=1`; 
    if(track.provider==='spotify') src=`https://open.spotify.com/embed/${encodeURIComponent(track.kind || 'track')}/${encodeURIComponent(track.id)}?utm_source=generator&theme=0`;
    if(src && (ultimoEmbedMusica!==src || frame.src!==src)) { frame.src=src; ultimoEmbedMusica=src; }
}
onValue(ref(db, 'gm_settings/music_playlist'), snapshot => {
    musicaCompartilhada = snapshot.exists() ? (snapshot.val() || {tracks:[]}) : {tracks:[]};
    if (!Array.isArray(musicaCompartilhada.tracks)) musicaCompartilhada.tracks=[];
    renderizarGerenciadorPlaylist(); renderizarPlayerMusica();
});
window.sincronizarAudio = async function() {
    if (!isMasterRoleForAudio()) return alert('Somente o Mestre pode editar a playlist.');
    const input=document.getElementById('youtube-url'), title=document.getElementById('audio-track-title');
    const track=analisarLinkMusica(input?.value || '', title?.value?.trim() || '');
    if (!track) return alert('Link inválido. Use um link de faixa/playlist do YouTube ou Spotify.');
    const snap=await get(ref(db,'gm_settings/music_playlist'));
    const state=snap.val() || {tracks:[],index:0,playing:false};
    const tracks=Array.isArray(state.tracks)?state.tracks:[];
    tracks.push({...track, key:String(Date.now())});
    await set(ref(db,'gm_settings/music_playlist'),{...state,tracks,index:tracks.length-1,playing:false,updatedAt:Date.now()});
    if(input) input.value=''; if(title) title.value='';
};
window.removerFaixaPlaylist = async function(index) {
    if (!isMasterRoleForAudio()) return;
    const state={...musicaCompartilhada,tracks:[...(musicaCompartilhada.tracks||[])]};
    state.tracks.splice(index,1); state.index=Math.max(0,Math.min(state.index||0,state.tracks.length-1));
    if(!state.tracks.length) state.playing=false;
    await set(ref(db,'gm_settings/music_playlist'),state);
};
window.moverFaixaPlaylist = async function(index,delta) {
    if (!isMasterRoleForAudio()) return;
    const state={...musicaCompartilhada,tracks:[...(musicaCompartilhada.tracks||[])]}; const dest=index+delta;
    if(dest<0||dest>=state.tracks.length) return;
    [state.tracks[index],state.tracks[dest]]=[state.tracks[dest],state.tracks[index]];
    if(state.index===index) state.index=dest; else if(state.index===dest) state.index=index;
    await set(ref(db,'gm_settings/music_playlist'),state);
};
function atualizarFaixaMusica(delta) {
    const tracks=musicaCompartilhada.tracks||[]; if(!tracks.length) return;
    musicaCompartilhada.index=(Number(musicaCompartilhada.index||0)+delta+tracks.length)%tracks.length;
    musicaCompartilhada.playing=true; renderizarPlayerMusica();
    set(ref(db,'gm_settings/music_playlist'),{...musicaCompartilhada,updatedAt:Date.now()});
}
window.pararAudio = function() {
    musicaCompartilhada.playing=false; renderizarPlayerMusica();
    set(ref(db,'gm_settings/music_playlist'),{...musicaCompartilhada,playing:false,updatedAt:Date.now()});
};
document.getElementById('music-toggle')?.addEventListener('click', () => {
    const current=musicaCompartilhada.tracks?.[musicaCompartilhada.index||0];
    if(current?.provider==='spotify'){document.getElementById('site-music-frame')?.scrollIntoView({behavior:'smooth',block:'nearest'});return;}
    musicaCompartilhada.playing=!musicaCompartilhada.playing; renderizarPlayerMusica();
    set(ref(db,'gm_settings/music_playlist'),{...musicaCompartilhada,playing:musicaCompartilhada.playing,updatedAt:Date.now()});
});
document.getElementById('music-prev')?.addEventListener('click',()=>atualizarFaixaMusica(-1));
document.getElementById('music-next')?.addEventListener('click',()=>atualizarFaixaMusica(1));
document.getElementById('music-minimize')?.addEventListener('click',()=>document.getElementById('site-music-player')?.classList.toggle('collapsed'));

// ==========================================
// 5. CRIAÇÃO DE NPCs E FALAR COMO PLAYER (MESTRE)
// ==========================================
window.salvarNovoNPC = function() {
    const nome = document.getElementById('novo-npc-nome').value.trim();
    const foto = document.getElementById('novo-npc-foto').value.trim();
    
    if(!nome) return alert("O NPC precisa de um nome.");
    
    const idNpc = nome.toLowerCase().replace(/\s+/g, '_');
    
    set(ref(db, `npcs/${idNpc}`), { nome, foto }).then(() => {
        alert(`${nome} materializado com sucesso!`);
        document.getElementById('novo-npc-nome').value = "";
        document.getElementById('novo-npc-foto').value = "";
    });
}

// Preencher Dropdown de NPCs para o Mestre
onValue(ref(db, 'npcs'), (snapshot) => {
    const select = document.getElementById('select-npc-salvo');
    if(!select) return;
    
    select.innerHTML = '<option value="">👤 Falar como Mim Mesmo / Mestre</option>';
    if (snapshot.exists()) {
        Object.entries(snapshot.val()).forEach(([id, npc]) => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.dataset.foto = npc.foto; // Guarda a foto no dataset
            opt.innerText = `🎭 ${npc.nome}`;
            select.appendChild(opt);
        });
    }
});

// ==========================================
// 6. SISTEMA DE SILENCIAR (MUTE)
// ==========================================
window.silenciarJogador = function() {
    const alvo = document.getElementById('mute-player-name').value.trim().toLowerCase();
    const minutos = parseInt(document.getElementById('mute-time').value) || 1;
    
    if (!alvo) return;
    
    const desmuteTime = Date.now() + (minutos * 60000);
    set(ref(db, `silenciados/${alvo}`), { ate: desmuteTime }).then(() => {
        alert(`${alvo.toUpperCase()} foi silenciado por ${minutos} minutos.`);
        document.getElementById('mute-player-name').value = "";
    });
}

// O Cliente verifica constantemente se está mutado
// Envolva o ouvinte em uma função
function iniciarEscutaMute() {
    onValue(ref(db, `silenciados/${currentUser}`), (snapshot) => {
        const inputChat = document.getElementById('chat-input');
        const btnSend = document.getElementById('btn-send-chat');
        const warning = document.getElementById('mute-warning');
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (Date.now() < data.ate) {
                jogadorSilenciado = true;
                if(inputChat) inputChat.disabled = true;
                if(btnSend) btnSend.disabled = true;
                if(warning) warning.style.display = 'block';
                
                clearInterval(intervaloMute);
                intervaloMute = setInterval(() => {
                    const restante = Math.max(0, data.ate - Date.now());
                    if (restante <= 0) {
                        remove(ref(db, `silenciados/${currentUser}`));
                    } else {
                        const timerEl = document.getElementById('mute-timer');
                        if(timerEl) timerEl.innerText = new Date(restante).toISOString().substring(14, 19);
                    }
                }, 1000);
            } else {
                removerMute(inputChat, btnSend, warning);
            }
        } else {
            removerMute(inputChat, btnSend, warning);
        }
    });
}

function removerMute(inputChat, btnSend, warning) {
    jogadorSilenciado = false;
    inputChat.disabled = false;
    btnSend.disabled = false;
    warning.style.display = 'none';
    clearInterval(intervaloMute);
}
window.enviarMensagemChat = function(texto, tipoMensagem = 'chat', nomeNpc = null, forcarEnvioMestre = false) {
    if (!currentUser || !texto.trim()) return;

    let ficha = typeof fichaAtual !== 'undefined' ? fichaAtual : null;
    let estado = obterEstadoGeral(ficha);
    let fotoAtual = (ficha && ficha.avatares) ? (ficha.avatares[estado] || ficha.fotoPerfil || '') : '';

    if (estado === 'desacordado' && !forcarEnvioMestre) {
        alert("Você está DESACORDADO. Não pode falar ou realizar ações.");
        return;
    }
    
    let textoFinal = texto;

    let sanidade = (ficha && typeof ficha.sanidade !== 'undefined') ? Number(ficha.sanidade) : 100;
    if ((estado === 'fragmentado' || estado === 'insano' || sanidade < 30) && !forcarEnvioMestre) {
        textoFinal = embaralharInsanidade(textoFinal);
    }
    const canalDestino = (tipoMensagem === 'roll' && canalRolagemDestino) ? canalRolagemDestino : canalAtual;

    const novaMsg = {
        remetente: currentUser,
        falarComo: nomeNpc || null,
        texto: textoFinal,
        avatarUrl: fotoAtual,
        timestamp: Date.now(),
        tipo: tipoMensagem,
        corBalao: obterCorBalao(currentUser),
        respondendoA: respondendoA || null,
        editada: false
    };

    push(ref(db, `mensagens/${canalDestino}`), novaMsg)
        .then(() => {
            respondendoA = null;
            const input = document.getElementById('chat-input');
            if (input) input.value = '';
            rolarParaFundo();
        })
        .catch(err => console.error("Erro ao enviar mensagem:", err));
};

document.getElementById('btn-login').addEventListener('click', () => {
    const name = DOM.usernameInput.value.trim().toLowerCase();
    if (name) login(name);
});

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('rpg_username');
    location.reload();
});

function login(username) {
    currentUser = username;
    localStorage.setItem('rpg_username', currentUser);
    atualizarAcessoGrimorioMestre();
    carregarMesaHabilidades();
    carregarMesaCompartilhada();
    carregarMaoCartas();
    
    const displayedName=currentUser.charAt(0).toUpperCase()+currentUser.slice(1);
    DOM.userTitle.innerText = `Grimório de ${displayedName}`;
    const homeUser=document.getElementById('os-home-user');if(homeUser)homeUser.textContent=displayedName;
    carregarAparenciaJogador();
    document.getElementById('os-home-screen')?.classList.remove('hidden');
    document.querySelector('.os-app-window')?.classList.add('hidden');
    document.getElementById('btn-back-home')?.classList.add('hidden');
    DOM.loginScreen.classList.add('hidden');
    DOM.appScreen.classList.remove('hidden');
    
    const jogadoresAutorizados = ['mestre', 'gm', 'submestre_id']; 
    const btnGerenciarCanais = document.getElementById('btn-gm-chat-menu');

    if (jogadoresAutorizados.includes(currentUser.toLowerCase())) {
        btnGerenciarCanais.style.display = 'inline-block';
        btnGerenciarCanais.onclick = () => abrirModalGmChat(); 
        escutarCanaisPendentes();
    } else {
        btnGerenciarCanais.style.display = 'none'; 
    }

    if (currentUser.toLowerCase() === "mestre" || currentUser.toLowerCase() === "gm") { 
        const muralBoard = document.getElementById('gm-upload-board');
        if (muralBoard) muralBoard.classList.remove('hidden');
        const gmControls = document.getElementById("gm-controls");
        if (gmControls) gmControls.classList.remove("hidden");
        const cardPerfil = document.querySelector(".card-perfil");
        if (cardPerfil) cardPerfil.style.display = "none"; 
    } else {
        const gmControls = document.getElementById("gm-controls");
        if (gmControls) gmControls.classList.add("hidden");
        const cardPerfil = document.querySelector(".card-perfil");
        if (cardPerfil) cardPerfil.style.display = "block";
    }
  
    registrarLog("Adentrou o grimório.");
    carregarGrimorioDoFirebase();
    carregarInventarioDoFirebase();
    carregarFichaDoFirebase();
    
    atualizarAcessoOficinaRelogioYuki();
    iniciarEscutaAprovacoesTemporais();
    
    const acessoGM = ['mestre', 'gm'].includes(currentUser.toLowerCase());
    if (acessoGM) {
        onValue(ref(db, 'canais'), renderizarAdministracaoCanais);
        escutarCanaisPendentes();
    }
    // O mural antes era iniciado junto com o chat. Como a aba Chat foi removida,
    // iniciamos a leitura do mural diretamente no login.
    iniciarEscutaMuralUmaVez();
    iniciarEscutaMute();
}

// ==========================================
// 5. LÓGICA DO FIREBASE (Sincronização)
// ==========================================
function carregarGrimorioDoFirebase() {
    const grimorioRef = ref(db, 'grimoires/' + currentUser);
    
    onValue(grimorioRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            userGrimoire = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            renderizarCards(userGrimoire);
        } else {
            userGrimoire = [];
            renderizarCards(userGrimoire);
        }
    });
}

function renderizarCards(lista) {
    DOM.grid.innerHTML = "";
    const listaFinal = lista;

    const deckCounter = document.getElementById('deck-card-count');
    if (deckCounter) deckCounter.textContent = String(listaFinal.length);
    if(listaFinal.length === 0) {
        DOM.grid.innerHTML = "<p class='text-muted' style='grid-column: 1/-1;'>Nenhuma habilidade encontrada. Adicione cartas ao seu grimório para começar.</p>";
        renderizarMaoCartas();return;
    }

    listaFinal.forEach((ef) => {
        const div = document.createElement('div');
        div.className = `card skill-card ${ef.cor || 'mescla'}`;
        const tag = document.createElement('span'); tag.className = 'skill-card-type'; tag.textContent = String(ef.cor || 'arcana').toUpperCase();
        const title = document.createElement('h3'); title.textContent = ef.nome || 'Habilidade sem nome';
        const effect = document.createElement('p'); effect.textContent = ef.efeito || 'Toque para ver os detalhes da habilidade.';
        const footer = document.createElement('span'); footer.className = 'skill-card-cta'; footer.textContent = 'Carta da sua coleção';
        const actions=document.createElement('div');actions.className='skill-card-actions';
        const view=document.createElement('button');view.type='button';view.className='skill-card-view';view.textContent='Ver / usar';view.onclick=event=>{event.stopPropagation();abrirModalView(ef);};
        const inHand=maoCartaIds.includes(String(ef.id||''));
        const handButton=document.createElement('button');handButton.type='button';handButton.className=`place-card-button ${inHand?'in-hand':''}`;handButton.textContent=inHand?'✓ Na mão':'＋ Para a mão';handButton.onclick=event=>{event.stopPropagation();alternarCartaNaMao(ef);};
        actions.append(view,handButton);div.append(tag,title,effect,footer,actions);
        div.setAttribute('draggable',String(window.matchMedia('(pointer:fine)').matches));div.dataset.skillId=ef.id||'';
        div.ondragstart = (event) => { event.dataTransfer.setData('text/plain', String(ef.id || ef.nome)); event.dataTransfer.effectAllowed = 'copy'; div.classList.add('is-dragging'); };
        div.ondragend = () => div.classList.remove('is-dragging');
        div.onpointermove = (event) => { if (event.pointerType === 'mouse') { const r=div.getBoundingClientRect(); div.style.setProperty('--tilt-x', `${((event.clientY-r.top)/r.height-.5)*-5}deg`); div.style.setProperty('--tilt-y', `${((event.clientX-r.left)/r.width-.5)*6}deg`); } };
        div.onpointerleave = () => { div.style.removeProperty('--tilt-x'); div.style.removeProperty('--tilt-y'); };
        DOM.grid.appendChild(div);
    });
    renderizarMaoCartas();
}

// ==========================================
// 6. ADICIONAR / VER / APAGAR MAGIAS
// ==========================================
document.getElementById('btn-add-spell').onclick = () => DOM.modalAdd.style.display = 'flex';
document.getElementById('close-add-modal').onclick = () => DOM.modalAdd.style.display = 'none';
document.getElementById('close-view-modal').onclick = () => { callbackJogoCarta = null; DOM.modalView.style.display = 'none'; };

document.getElementById('btn-save-spell').onclick = () => {
    const nome = document.getElementById('new-nome').value;
    const cor = document.getElementById('new-cor').value;
    const receita = document.getElementById('new-receita').value;
    const efeito = document.getElementById('new-efeito').value;

    if (!nome || !efeito) return alert("Nome e Efeito são sagrados, não deixe em branco!");

    const novaMagiaRef = push(ref(db, 'grimoires/' + currentUser));
    set(novaMagiaRef, { nome, cor, receita, efeito }).then(() => {
        const cartaNova={id:novaMagiaRef.key,nome,cor,receita,efeito};userGrimoire=[cartaNova,...userGrimoire.filter(card=>String(card.id)!==String(cartaNova.id))];
        const entrouNaMao=maoCartaIds.length<LIMITE_MAO_CARTAS;if(entrouNaMao)alternarCartaNaMao(cartaNova);else renderizarCards(userGrimoire);
        DOM.modalAdd.style.display = 'none';
        document.getElementById('new-nome').value = "";
        document.getElementById('new-receita').value = "";
        document.getElementById('new-efeito').value = "";
        atualizarStatusMesa(entrouNaMao?'Nova carta salva e adicionada à sua mão.':'Nova carta salva; sua mão está cheia, troque uma carta para usá-la.','online');
    }).catch(error=>alert('Não foi possível salvar a carta. Verifique sua conexão e as regras do Firebase.'));
};

function atualizarPreviaFormulaHabilidade() {
    const out=document.getElementById('ability-formula-preview');if(!out)return;const sel=document.getElementById('ability-attribute');const op=document.getElementById('ability-operator')?.value||'+';const value=Number(sel?.value||0);const name=sel?.selectedOptions?.[0]?.dataset?.name||'Atributo';const sign=op==='-'?'−':'+';const shift=op==='-'?-value:value;out.textContent=`2D10 ${sign} ${name} (${value>=0?'+':''}${value}) · faixa ${2+shift}–${20+shift}`;
}
document.getElementById('ability-attribute')?.addEventListener('change',atualizarPreviaFormulaHabilidade);
document.getElementById('ability-operator')?.addEventListener('change',atualizarPreviaFormulaHabilidade);

function preencherAtributosRolagemHabilidade() {
    const select = document.getElementById('ability-attribute'); if (!select) return;
    select.replaceChildren();
    const attrs = fichaAtual?.atributos && typeof fichaAtual.atributos === 'object' ? fichaAtual.atributos : {};
    const entries = Object.entries(attrs).filter(([, value]) => Number.isFinite(Number(value)));
    if (!entries.length) { const opt = new Option('Sem atributo (0)', '0'); opt.dataset.name = 'Sem atributo'; select.appendChild(opt); atualizarPreviaFormulaHabilidade(); return; }
    entries.forEach(([name, raw], index) => { const val = Number(raw) || 0; const opt = new Option(`${name} (${val >= 0 ? '+' : ''}${val})`, String(val)); opt.dataset.name = name; if (index === 0) opt.selected = true; select.appendChild(opt); });
    atualizarPreviaFormulaHabilidade();
}

function abrirModalView(ef) {
    currentSpellId = ef.id;
    document.getElementById('view-titulo').innerText = ef.nome;
    document.getElementById('view-cor').innerText = ef.cor.toUpperCase();
    document.getElementById('view-receita').innerText = ef.receita;
    document.getElementById('view-efeito').innerText = ef.efeito;
    preencherAtributosRolagemHabilidade();
    
    let modalContent = document.querySelector('#modal-view .modal-content') || document.getElementById('view-efeito').parentNode;
    let btnAntigo = document.getElementById('btn-conjurar-magia');
    if (btnAntigo) btnAntigo.remove();
    
    const btnConjurar = document.createElement('button');
    btnConjurar.id = 'btn-conjurar-magia';
    btnConjurar.className = 'btn-mystic'; 
    btnConjurar.style.cssText = "background: #25d366; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%; margin-top: 10px;";
    btnConjurar.innerText = '✨ Usar habilidade';
    
    btnConjurar.onclick = async () => {
        const dadoA = Math.floor(Math.random() * 10) + 1;
        const dadoB = Math.floor(Math.random() * 10) + 1;
        const operador = document.getElementById('ability-operator')?.value || '+';
        const atributoSelect = document.getElementById('ability-attribute');
        const valorAtributo = Number(atributoSelect?.value || 0);
        const atributoNome = atributoSelect?.selectedOptions?.[0]?.dataset?.name || 'Sem atributo';
        const resultado = dadoA + dadoB + (operador === '-' ? -valorAtributo : valorAtributo);
        const sucesso = resultado >= 15 ? 'Sucesso completo' : resultado >= 10 ? 'Sucesso com complicação' : 'Falha';
        const usada = { nome: ef.nome || 'Habilidade', cor: ef.cor || 'arcana', efeito: ef.efeito || '', receita: ef.receita || '', dado: '2D10', dados: [dadoA, dadoB], operador, atributoNome, valorAtributo, resultado, sucesso, data: Date.now() };
        if (callbackJogoCarta) {
            const concluir = callbackJogoCarta; callbackJogoCarta = null;
            const jogou = await concluir(ef, usada);
            if (!jogou) return;
        }
        colocarHabilidadeNaMesa(usada);
        abrirResultadoHabilidade(usada);
        DOM.modalView.style.display = 'none';
    };
    
    modalContent.appendChild(btnConjurar);
    DOM.modalView.style.display = 'flex'; 
}

document.getElementById('btn-delete-spell').onclick = () => {
    if (confirm("Rasgar esta página é permanente. Tem certeza?")) {
        const magiaRef = ref(db, `grimoires/${currentUser}/${currentSpellId}`);
        remove(magiaRef).then(() => {
            DOM.modalView.style.display = 'none';
        });
    }
};


// ==========================================
// 7. SISTEMA DE TABS (Navegação)
// ==========================================
let menuSoundContext=null;
let menuSoundsEnabled=true;
try{menuSoundsEnabled=localStorage.getItem('grimorio-menu-sounds')!=='off';}catch{}
const menuSoundNotes={
    'tab-grimoire':392,'tab-mensagens':440,'tab-dice':494,'tab-calc':523,
    'tab-craft':587,'tab-yuki-workshop':659,'tab-perfil':740,'tab-mural':831,'tab-theme':880,'tab-gm':988
};
const accentPalette=['#a83244','#d16b35','#c5a746','#66864f','#3c928b','#4c79ad','#8060a0','#bd6482'];
function themeStorageKey(){return `grimorio-accent:${encodeURIComponent(String(currentUser||'guest').toLocaleLowerCase('pt-BR'))}`;}
function aplicarCorAparencia(color,persist=true){
    const safe=/^#[0-9a-f]{6}$/i.test(String(color))?String(color).toLowerCase():'#a83244';
    document.documentElement.style.setProperty('--user-accent',safe);document.documentElement.style.setProperty('--borda-ouro',safe);document.documentElement.style.setProperty('--borda-ouro-clara',safe);document.documentElement.style.setProperty('--cor-vermelha',safe);
    const picker=document.getElementById('theme-color-picker'),value=document.getElementById('theme-color-value');if(picker)picker.value=safe;if(value)value.textContent=safe.toUpperCase();
    document.querySelectorAll('.theme-swatch').forEach(button=>{const selected=button.dataset.color.toLowerCase()===safe;button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));});
    if(persist){try{localStorage.setItem(themeStorageKey(),safe);}catch{}const status=document.getElementById('theme-save-status');if(status)status.textContent=`Cor ${safe.toUpperCase()} aplicada e salva neste navegador.`;}
}
function carregarAparenciaJogador(){let color='#a83244';try{color=localStorage.getItem(themeStorageKey())||color;}catch{}aplicarCorAparencia(color,false);}
document.querySelectorAll('.theme-swatch').forEach(button=>button.addEventListener('click',()=>aplicarCorAparencia(button.dataset.color)));
document.getElementById('theme-color-picker')?.addEventListener('input',event=>aplicarCorAparencia(event.currentTarget.value));
function atualizarBotaoSomMenus(){const button=document.getElementById('btn-sound-toggle');if(!button)return;button.textContent=menuSoundsEnabled?'♫ Som ligado':'♫ Som mudo';button.setAttribute('aria-pressed',String(menuSoundsEnabled));button.setAttribute('aria-label',menuSoundsEnabled?'Silenciar sons dos menus':'Ativar sons dos menus');button.title=menuSoundsEnabled?'Silenciar sons dos menus':'Ativar sons dos menus';}
function tocarSomEntradaMenu(target){
    if(!menuSoundsEnabled)return;
    try{
        const AudioCtor=window.AudioContext||window.webkitAudioContext;if(!AudioCtor)return;
        menuSoundContext??=new AudioCtor();if(menuSoundContext.state==='suspended')menuSoundContext.resume();
        const now=menuSoundContext.currentTime,frequency=menuSoundNotes[target]||523;
        const oscillator=menuSoundContext.createOscillator(),gain=menuSoundContext.createGain();
        oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,now);oscillator.frequency.exponentialRampToValueAtTime(frequency*.94,now+.12);
        gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.025,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+.14);
        oscillator.connect(gain);gain.connect(menuSoundContext.destination);oscillator.start(now);oscillator.stop(now+.15);
    }catch(error){console.debug('Som de menu indisponível:',error);}
}
const soundToggle=document.getElementById('btn-sound-toggle');
 soundToggle?.addEventListener('click',()=>{menuSoundsEnabled=!menuSoundsEnabled;try{localStorage.setItem('grimorio-menu-sounds',menuSoundsEnabled?'on':'off');}catch{}atualizarBotaoSomMenus();});
atualizarBotaoSomMenus();
const phoneStatusTime=document.getElementById('phone-status-time'),desktopClock=document.getElementById('desktop-clock'),homeClock=document.getElementById('os-home-clock');
function horaSistemaOS(){return new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());}
function atualizarHoraSistemaOS(){const now=horaSistemaOS();if(phoneStatusTime)phoneStatusTime.textContent=now;if(desktopClock)desktopClock.textContent=now;if(homeClock)homeClock.textContent=now;}
atualizarHoraSistemaOS();window.setInterval(atualizarHoraSistemaOS,30000);
function entrarNoAplicativoOS(button){
    const target=button.getAttribute('data-target'),view=document.getElementById(target);if(!view)return;
    tocarSomEntradaMenu(target);
    document.querySelectorAll('.tab-btn').forEach(item=>item.classList.toggle('active',item===button));
    document.querySelectorAll('.tab-content').forEach(content=>content.classList.add('hidden'));
    view.classList.remove('hidden');document.getElementById('os-home-screen')?.classList.add('hidden');
    document.querySelector('.os-app-window')?.classList.remove('hidden');document.getElementById('btn-back-home')?.classList.remove('hidden');
    const label=button.querySelector('.app-menu-label')?.textContent.trim()||button.title||'Aplicativo';
    const title=document.getElementById('user-title'),windowTitle=document.getElementById('os-window-title');if(title)title.textContent=label;if(windowTitle)windowTitle.textContent=label;
    if(target==='tab-mensagens')window.abrirMensagensSite?.();
}
function voltarTelaInicialOS(){
    document.getElementById('os-app-window')?.classList.add('hidden');document.querySelector('.os-app-window')?.classList.add('hidden');
    document.getElementById('os-home-screen')?.classList.remove('hidden');document.getElementById('btn-back-home')?.classList.add('hidden');
    const name=String(currentUser||'').trim(),title=name?`Grimório de ${name.charAt(0).toUpperCase()+name.slice(1)}`:'Grimório Vivo';
    const titleNode=document.getElementById('user-title');if(titleNode)titleNode.textContent=title;
    const windowTitle=document.getElementById('os-window-title');if(windowTitle)windowTitle.textContent='Tela inicial';
}
document.querySelectorAll('.tab-btn').forEach(button=>button.addEventListener('click',()=>entrarNoAplicativoOS(button)));
['btn-back-home','btn-window-home','desktop-home-button'].forEach(id=>document.getElementById(id)?.addEventListener('click',voltarTelaInicialOS));

// Trilha ambiente local: começa no primeiro gesto (limitação de autoplay dos navegadores).
const backgroundTrack=document.getElementById('background-track'),musicToggle=document.getElementById('btn-music-toggle');
let backgroundMusicEnabled=true;
try{backgroundMusicEnabled=localStorage.getItem('grimorio-background-music')!=='off';}catch{}
if(backgroundTrack)backgroundTrack.volume=.28;
function atualizarBotaoTrilha(){if(!musicToggle)return;musicToggle.textContent=backgroundMusicEnabled?'♪ Trilha ligada':'♪ Trilha pausada';musicToggle.setAttribute('aria-pressed',String(backgroundMusicEnabled));musicToggle.setAttribute('aria-label',backgroundMusicEnabled?'Pausar trilha sonora de fundo':'Retomar trilha sonora de fundo');musicToggle.title=backgroundMusicEnabled?'Pausar trilha sonora de fundo':'Retomar trilha sonora de fundo';}
async function iniciarTrilhaDeFundo(){if(!backgroundMusicEnabled||!backgroundTrack||document.getElementById('app-screen')?.classList.contains('hidden'))return false;try{await backgroundTrack.play();return true;}catch(error){console.debug('A trilha aguarda uma interação do usuário:',error);return false;}}
async function interacaoIniciaTrilha(){if(await iniciarTrilhaDeFundo()){document.removeEventListener('pointerdown',interacaoIniciaTrilha);document.removeEventListener('keydown',interacaoIniciaTrilha);}}
document.addEventListener('pointerdown',interacaoIniciaTrilha);document.addEventListener('keydown',interacaoIniciaTrilha);
musicToggle?.addEventListener('click',async()=>{backgroundMusicEnabled=!backgroundMusicEnabled;try{localStorage.setItem('grimorio-background-music',backgroundMusicEnabled?'on':'off');}catch{}atualizarBotaoTrilha();if(backgroundMusicEnabled)await iniciarTrilhaDeFundo();else backgroundTrack?.pause();});
backgroundTrack?.addEventListener('error',()=>console.warn('A trilha local não pôde ser carregada.'));
atualizarBotaoTrilha();

// ==========================================
// 8. ROLADOR DE DADOS
// ==========================================
document.getElementById('btn-roll').addEventListener('click', () => {
    const diceDisplay = document.getElementById('dice-result');
    const logDisplay = document.getElementById('dice-log');
    
    const quantidade = parseInt(document.getElementById('dice-qtd').value) || 1;
    const sides = parseInt(document.getElementById('dice-type').value);
    const modSign = document.getElementById('mod-sign').value;
    const modValue = parseInt(document.getElementById('dice-mod').value) || 0;

    diceDisplay.classList.add('rolling');
    diceDisplay.innerText = "🎲";

    setTimeout(() => {
        diceDisplay.classList.remove('rolling');
        
        let somaRolagensPuras = 0;
        let resultadosIndividuais = [];
        
        for (let i = 0; i < quantidade; i++) {
            let roll = Math.floor(Math.random() * sides) + 1;
            resultadosIndividuais.push(roll);
            somaRolagensPuras += roll;
        }
        
        let somaComKarma = somaRolagensPuras + (fatorKarma * quantidade);
        const valorMinimo = quantidade;
        const valorMaximo = sides * quantidade;
        if (somaComKarma > valorMaximo) somaComKarma = valorMaximo;
        if (somaComKarma < valorMinimo) somaComKarma = valorMinimo;

        let totalFinal = somaComKarma;
        if (modSign === '+') {
            totalFinal += modValue;
        } else {
            totalFinal -= modValue;
        }

        diceDisplay.innerText = totalFinal;

        const detalheDados = quantidade > 1 ? `[${resultadosIndividuais.join(', ')}]` : `${resultadosIndividuais[0]}`;
        const textoMod = modValue !== 0 ? ` ${modSign} ${modValue}` : '';
        
        const logEntry = document.createElement('div');
        logEntry.innerText = `${quantidade}D${sides} rolou ${detalheDados}${textoMod} = ${totalFinal}`;
        logDisplay.prepend(logEntry);

        registrarLog(`Rolou ${quantidade}D${sides} e obteve o resultado ${totalFinal}`);

        const textoParaChat = `🎲 <strong>${currentUser.toUpperCase()}</strong> rolou ${quantidade}D${sides}${textoMod}<br>Detalhes: ${detalheDados} ➔ <strong>Resultado: ${totalFinal}</strong>`;
        // O resultado fica no painel de rolagens e no registro do Mestre; sem duplicação em chat.
    }, 400);
});

// ==========================================
// 9. CALCULADORA ARCANA
// ==========================================
document.getElementById('btn-calc').addEventListener('click', () => {
    const input = document.getElementById('calc-input').value;
    const resultDisplay = document.getElementById('calc-result');
    
    try {
        const result = new Function('return ' + input)();
        if(isNaN(result)) throw new Error("Inválido");
        resultDisplay.innerText = result;
    } catch (error) {
        resultDisplay.innerText = "Erro na Formulação";
    }
});

// ==========================================
// 10. COMPARTILHAMENTO MÍSTICO (WHATSAPP)
// ==========================================
document.getElementById('btn-share-dice').addEventListener('click', () => {
    const total = document.getElementById('dice-result').innerText;
    const logElements = document.getElementById('dice-log').children;
    let detalhe = logElements.length > 0 ? logElements[0].innerText : "";

    if (total === "-" || total === "🎲") {
        return alert("Role os dados antes de invocar o Zap, mestre!");
    }

    const texto = `🎲 *Rolagem do Destino de ${currentUser}* 🎲\n\nResultado Final: *${total}*\nDetalhes: _${detalhe}_\n\n🔮 _Enviado do Grimório Vivo_`;
    const zapUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(zapUrl, '_blank');
});

document.getElementById('btn-share-calc').addEventListener('click', () => {
    const resultado = document.getElementById('calc-result').innerText;
    const expressao = document.getElementById('calc-input').value;

    if (resultado === "-" || resultado === "Erro na Formulação" || expressao.trim() === "") {
        return alert("Realize um cálculo válido primeiro!");
    }

    const texto = `🧮 *Cálculo de Sistema (${currentUser})* 🧮\n\nEquação: ${expressao}\nResultado: *${resultado}*\n\n🔮 _Enviado do Grimório Vivo_`;
    const zapUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(zapUrl, '_blank');
});

// ==========================================
// SISTEMA DE AUDITORIA (LOG DO MESTRE)
// ==========================================
function registrarLog(acao) {
    if (!currentUser) return; 
    
    const logRef = push(ref(db, 'system_logs'));
    const dataAtual = new Date();
    const horaFormatada = `${dataAtual.getHours().toString().padStart(2, '0')}:${dataAtual.getMinutes().toString().padStart(2, '0')}`;
    
    set(logRef, {
        jogador: currentUser,
        acao: acao,
        hora: horaFormatada,
        timestamp: Date.now()
    });
}

// ==========================================
// AUTENTICAÇÃO DO MESTRE E EXIBIÇÃO DE LOGS
// ==========================================
const DOM_GM = {
    modalAuth: document.getElementById('modal-gm-auth'),
    passInput: document.getElementById('gm-password-input'),
    btnSubmit: document.getElementById('btn-submit-gm-auth'),
    closeModal: document.getElementById('close-gm-modal'),
    logContainer: document.getElementById('master-log-container'),
    authTitle: document.getElementById('gm-auth-title'),
    authDesc: document.getElementById('gm-auth-desc')
};

document.getElementById('btn-tab-gm').addEventListener('click', (e) => {
    if (!isMasterAuthenticated) {
        e.preventDefault();
        document.getElementById('tab-gm').classList.add('hidden');
        document.getElementById('btn-tab-gm').classList.remove('active');
        
        const dbRef = ref(db);
        get(child(dbRef, `gm_settings/password`)).then((snapshot) => {
            if (snapshot.exists()) {
                DOM_GM.authTitle.innerText = "O Selo do Mestre";
                DOM_GM.authDesc.innerText = "Digite a senha para acessar os registros.";
            } else {
                DOM_GM.authTitle.innerText = "Criar Selo do Mestre";
                DOM_GM.authDesc.innerText = "Primeiro acesso detectado. Defina a senha mestre.";
            }
            DOM_GM.modalAuth.style.display = 'flex';
        }).catch((error) => {
            console.error(error);
            alert("Erro nas correntes mágicas do banco de dados.");
        });
    }
});

DOM_GM.closeModal.onclick = () => DOM_GM.modalAuth.style.display = 'none';

DOM_GM.btnSubmit.addEventListener('click', () => {
    const inputPass = DOM_GM.passInput.value;
    if (!inputPass) return alert("A senha não pode ser um vazio.");

    const dbRef = ref(db);
    get(child(dbRef, `gm_settings/password`)).then((snapshot) => {
        if (snapshot.exists()) {
            if (snapshot.val() === inputPass) {
                liberarAcessoMestre();
            } else {
                alert("Senha incorreta. A magia o rejeita.");
            }
        } else {
            set(ref(db, 'gm_settings/password'), inputPass).then(() => {
                alert("Senha mestre forjada com sucesso!");
                liberarAcessoMestre();
            });
        }
    });
});

function liberarAcessoMestre() {
    isMasterAuthenticated = true;
    renderizarCards(userGrimoire);
    renderizarMesaCompartilhada();
    atualizarAcessoGrimorioMestre();
    DOM_GM.modalAuth.style.display = 'none';
    DOM_GM.passInput.value = "";
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById('btn-tab-gm').classList.add('active');
    document.getElementById('tab-gm').classList.remove('hidden');

    iniciarEscutaDeLogs();
    escutarCanaisPendentes();
}

function iniciarEscutaDeLogs() {
    const logsRef = ref(db, 'system_logs');
    onValue(logsRef, (snapshot) => {
        DOM_GM.logContainer.innerHTML = "";
        const data = snapshot.val();
        if (data) {
            const logsArray = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
            logsArray.forEach(log => {
                const div = document.createElement('div');
                div.className = 'log-entry';
                div.innerHTML = `<span class="log-time">[${log.hora}]</span> <span class="log-player">${log.jogador.toUpperCase()}</span>: ${log.acao}`;
                DOM_GM.logContainer.appendChild(div);
            });
        } else {
            DOM_GM.logContainer.innerHTML = "<p class='text-muted'>O Akasha está silencioso. Nenhum registro encontrado.</p>";
        }
    });
}

document.getElementById('btn-clear-log').addEventListener('click', () => {
    if (confirm("Isto apagará a história. Tem certeza, Mestre?")) {
        remove(ref(db, 'system_logs'));
    }
});

// ==========================================
// 12. SISTEMA DE INVENTÁRIO E FORJA DINÂMICA
// ==========================================
let userInventory = []; 
let listaDeMescla = []; 

function carregarInventarioDoFirebase() {
    if (!currentUser) return;
    
    const invRef = ref(db, 'inventory/' + currentUser);
    onValue(invRef, (snapshot) => {
        const data = snapshot.val();
        userInventory = [];
        if (data) {
            Object.keys(data).forEach(id => {
                userInventory.push({ id, ...data[id] });
            });
        }
        renderizarInventarioVisual(userInventory);
        if(document.getElementById('yuki-inventory-modal')?.open)renderizarInventarioPessoalYuki();
        renderizarPecasRelogioYuki();
    });
}

function renderizarInventarioVisual(itens) {
    const grid = document.getElementById('craft-inventory-grid');
    if (!grid) return;
    
    grid.innerHTML = "";
    
    if (itens.length === 0) {
        grid.innerHTML = "<p class='text-muted w-full text-center' style='grid-column: 1/-1;'>Nenhum material na bolsa. Clique em '+ Coletar Material Base' para adicionar ingredientes.</p>";
        return;
    }
    
    itens.forEach(item => {
        const icone = item.emoji ? item.emoji : "📦";
        const div = document.createElement('div');
        div.className = 'inv-item';
        div.innerHTML = `<div class="emoji">${icone}</div><div class="name">${item.nome}</div>`;
        div.onclick = () => selecionarParaForja(item, icone);
        grid.appendChild(div);
    });
    renderizarPecasRelogioYuki();
}

function selecionarParaForja(item, icone) {
    listaDeMescla.push({ ...item, emojiVisual: icone });
    renderizarListaDeMescla();
}

function renderizarListaDeMescla() {
    const container = document.getElementById('forja-lista');
    if (!container) return;
    
    container.innerHTML = "";
    
    listaDeMescla.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'item-na-forja';
        div.innerHTML = `${item.emojiVisual} ${item.nome} <button onclick="removerItemDaForja(${index})" style="background:none; border:none; color:#ff4444; cursor:pointer; font-weight:bold;">x</button>`;
        container.appendChild(div);
    });
    
    const statusEl = document.getElementById('status-forja');
    if (statusEl) {
        statusEl.innerText = listaDeMescla.length > 0 ? `Itens na forja: ${listaDeMescla.length}` : "Adicione itens do inventário para começar a mescla.";
    }
}

window.removerItemDaForja = function(index) {
    listaDeMescla.splice(index, 1);
    renderizarListaDeMescla();
}

document.getElementById('btn-craft-visual').addEventListener('click', () => {
    if (listaDeMescla.length < 2) return alert("Coloque pelo menos 2 materiais no caldeirão para mesclar!");
    
    const nomeItem = document.getElementById('craft-result-name').value.trim();
    const emojiItem = document.getElementById('craft-emoji-input').value.trim();

    if (!nomeItem || !emojiItem) return alert("Defina um nome e um emoji para o novo item!");

    document.getElementById('btn-craft-visual').disabled = true;

    iniciarAnimacaoMagica(() => {
        const receitaCombinada = listaDeMescla.map(i => i.nome).join(" + ");
        
        const novoItemRef = push(ref(db, 'inventory/' + currentUser));
        set(novoItemRef, { 
            nome: nomeItem, 
            emoji: emojiItem,
            criadoEm: Date.now(),
            receita: receitaCombinada
        }).then(() => {
            listaDeMescla.forEach(item => {
                if (item.id) remove(ref(db, `inventory/${currentUser}/${item.id}`));
            });

            if (typeof registrarLog === "function") {
                registrarLog(`Forjou o item [${emojiItem} ${nomeItem}] combinando ${listaDeMescla.length} ingredientes.`);
            }
            
            alert(`Item Criado! ${emojiItem} ${nomeItem} foi adicionado ao seu Inventário.`);
            
            listaDeMescla = [];
            renderizarListaDeMescla();
            document.getElementById('craft-result-name').value = "";
            document.getElementById('craft-emoji-input').value = "";
            document.getElementById('btn-craft-visual').disabled = false;
        });
    });
});

document.getElementById('btn-add-material').addEventListener('click', () => {
    const nome = prompt("Nome do Material ou Ingrediente (ex: Minério de Ferro):");
    if (!nome) return;
    const emoji = prompt("Ícone / Emoji do Material (ex: 🪨):") || "📦";

    const novoMaterialRef = push(ref(db, 'inventory/' + currentUser));
    set(novoMaterialRef, { 
        nome: nome, 
        emoji: emoji,
        criadoEm: Date.now()
    }).then(() => {
        if (typeof registrarLog === "function") registrarLog(`Adicionou ao Inventário: ${emoji} ${nome}`);
    });
});

function iniciarAnimacaoMagica(callbackFinal) {
    const canvas = document.getElementById('craft-canvas');
    if (!canvas) {
        callbackFinal();
        return;
    }
    const ctx = canvas.getContext('2d');
    const area = document.getElementById('crafting-area');
    
    canvas.width = area.clientWidth;
    canvas.height = area.clientHeight;
    
    const particles = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let animacaoAtiva = true;

    const listaContainer = document.getElementById('forja-lista');
    if (listaContainer) listaContainer.classList.add('forjando');

    for(let i = 0; i < 100; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            raio: Math.random() * 3 + 1,
            cor: `hsl(${Math.random() * 60 + 30}, 100%, 70%)`,
            velocidadeX: (Math.random() - 0.5) * 5,
            velocidadeY: (Math.random() - 0.5) * 5,
        });
    }

    function animar() {
        if (!animacaoAtiva) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
            ctx.fillStyle = p.cor;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.cor;
            ctx.fill();
            
            p.x += (centerX - p.x) * 0.05 + p.velocidadeX;
            p.y += (centerY - p.y) * 0.05 + p.velocidadeY;
        });

        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.random() * 50 + 20, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fill();

        requestAnimationFrame(animar);
    }

    animar();

    setTimeout(() => {
        animacaoAtiva = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (listaContainer) listaContainer.classList.remove('forjando');
        callbackFinal();
    }, 2000);
}

// ==========================================
// 14. BIBLIOTECA DE SISTEMAS E PERFIL DINÂMICO
// ==========================================
const BibliotecaSistemas = {
    "KULT": {
        nome: "KULT: Divindade Perdida",
        tipoDado: 10,
        quantidadeDados: 2,
        atributosBase: {
            "Vontade": 0, "Fortitude": 0, "Reflexos": 0, "Razão": 0,
            "Intuição": 0, "Percepção": 0, "Carisma": 0, "Alma": 0,"Violencia": 0,"Firmesa": 0
        },
        calcularHpMax: (atributos) => 10 + (atributos["Fortitude"] || 0),
        custoXpPorNivel: 10
    },
    "Personalizado": {
        nome: "Sistema Personalizado",
        tipoDado: 20,
        quantidadeDados: 1,
        atributosBase: { "Força": 0, "Destreza": 0, "Mente": 0 },
        calcularHpMax: (atributos) => 10 + (atributos["Força"] || 0),
        custoXpPorNivel: 10
    }
};

let fichaAtual = null;

function carregarFichaDoFirebase() {
    if (!currentUser) return;
    const fichaRef = ref(db, `characters/${currentUser}`);
    onValue(fichaRef, (snapshot) => {
      const data = snapshot.val();
    if (data) {
        fichaAtual = data;
        atualizarAcessoOficinaRelogioYuki();
       let estado = obterEstadoGeral(fichaAtual);
        // Substitua as linhas que usam document.body.classList
        const chatContainer = document.getElementById('chat-messages');
        if (estado === 'fragmentado' && chatContainer) {
            chatContainer.classList.add('glitch-extremo');
        } else if (chatContainer) {
        chatContainer.classList.remove('glitch-extremo');
      }
        renderizarPerfil();
        } else {
            const novaFicha = {
                nome: currentUser,
                sistema: "KULT",
                xp: 0,
                nivel: 1,
                ferimentos: { graves: 0, criticos: 0 },
                atributos: { ...BibliotecaSistemas["KULT"].atributosBase }
            };
            set(fichaRef, novaFicha);
        }
    });
}

function renderizarPerfil() {
    if (!fichaAtual) return;

    let estado = obterEstadoGeral(fichaAtual);
    let sys = BibliotecaSistemas[fichaAtual.sistema] || BibliotecaSistemas["KULT"];

    let styleFix = document.getElementById('style-fix-perfil');
    if (!styleFix) {
        styleFix = document.createElement('style');
        styleFix.id = 'style-fix-perfil';
        styleFix.innerHTML = `
           .chat-mensagem .avatar, .perfil-npc-icone { width: 65px !important; height: 65px !important; border-radius: 50%; object-fit: cover; }
           .btn-remover-efeitos-insano { background: #8b0000; color: white; padding: 5px; font-weight: bold; border-radius: 4px; border: none; cursor: pointer; display: none; margin-top: 5px; }
         `;
        document.head.appendChild(styleFix);
    }

    document.getElementById('nome-personagem').innerText = fichaAtual.nome.toUpperCase();
    document.getElementById('sistema-personagem').innerText = sys.nome;
    document.getElementById('display-xp').innerText = fichaAtual.xp;
  
    const medidorSanidade = document.getElementById('medidor-sanidade');
    if (medidorSanidade) {
        medidorSanidade.value = fichaAtual.sanidade ?? 100;
    }

    let painelFerimentos = document.getElementById('painel-ferimentos-jogador');
    if (!painelFerimentos) {
        const containerPerfil = document.querySelector('.card-perfil') || document.getElementById('app-screen');
        painelFerimentos = document.createElement('div');
        painelFerimentos.id = 'painel-ferimentos-jogador';
        containerPerfil.appendChild(painelFerimentos);
    }

    let fGraves = fichaAtual.ferimentos ? fichaAtual.ferimentos.graves : 0;
    let fCriticos = fichaAtual.ferimentos ? fichaAtual.ferimentos.criticos : 0;
    let penalidadeGrave = fGraves * -1;

    painelFerimentos.style.cssText = "margin: 10px 0; padding: 6px 10px; background: rgba(50,0,0,0.3); border: 1px solid #600; border-radius: 4px;";
    painelFerimentos.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
            <span>⚠️ Graves: <strong>${fGraves}/4</strong> ${fGraves > 0 ? `(Mod: ${penalidadeGrave})` : ''}</span>
            <span style="color: ${fCriticos > 0 ? '#ff4444' : 'inherit'}">💀 Críticos: <strong>${fCriticos}/1</strong></span>
        </div>
    `;

    let avatarLayers = [];
    if (fichaAtual.avatares) {
        if (fichaAtual.avatares['saudavel']) avatarLayers.push(fichaAtual.avatares['saudavel']);
        
        let eFisico = fichaAtual.estadoFisico || 'saudavel';
        let eMental = fichaAtual.estadoMental || 'sao';
        
        if (eFisico !== 'saudavel' && fichaAtual.avatares[eFisico]) avatarLayers.push(fichaAtual.avatares[eFisico]);
        if (eMental !== 'sao' && fichaAtual.avatares[eMental]) avatarLayers.push(fichaAtual.avatares[eMental]);
    }

    const containerFichaImg = document.getElementById('imagem-perfil-ficha');
    if (containerFichaImg) {
        containerFichaImg.style.position = 'relative';
        containerFichaImg.style.display = 'inline-block';
        containerFichaImg.style.width = '120px';
        containerFichaImg.style.height = '120px';
        containerFichaImg.replaceChildren();
        const placeholder = document.createElement('span');
        placeholder.textContent = String(fichaAtual.nome || currentUser || '✦').trim().slice(0, 1).toUpperCase() || '✦';
        placeholder.setAttribute('aria-label', 'Retrato indisponível; inicial do personagem');
        Object.assign(placeholder.style, {position:'absolute',inset:'0',display:'grid',placeItems:'center',borderRadius:'50%',border:'3px solid var(--borda-ouro)',background:'radial-gradient(circle at 30% 20%,#51493d,#171817 70%)',color:'var(--borda-ouro)',fontSize:'2rem',fontWeight:'800'});
        containerFichaImg.appendChild(placeholder);
        avatarLayers.forEach((camada, idx) => {
            const img = document.createElement('img');
            img.src = camada;
            img.className = 'avatar-destaque';
            Object.assign(img.style,{position:'absolute',inset:'0',width:'100%',height:'100%',margin:'0',objectFit:'contain',borderRadius:'50%',background:'transparent',pointerEvents:idx===0?'auto':'none'});
            if (idx === 0) { img.onclick = () => window.open(camada, '_blank', 'noopener'); img.title = 'Clique para ampliar'; }
            img.onerror = () => { img.remove(); console.warn('Retrato indisponível (a ficha continuará usando a inicial):', camada); };
            img.onload = () => { if (idx === 0) placeholder.style.display = 'none'; };
            containerFichaImg.appendChild(img);
        });
    }
    const areaUpar = document.getElementById('area-level-up');
    if (areaUpar) {
        if (fichaAtual.xp >= sys.custoXpPorNivel) {
            areaUpar.classList.remove('hidden');
        } else {
            areaUpar.classList.add('hidden');
        }
    }

    let painelAvatares = document.getElementById('painel-avatares-jogador');
    if (!painelAvatares) {
        const containerPerfil = document.querySelector('.card-perfil') || document.getElementById('app-screen');
        painelAvatares = document.createElement('div');
        painelAvatares.id = 'painel-avatares-jogador';
        painelAvatares.style.cssText = "margin: 15px 0; padding: 15px; background: rgba(0,0,0,0.5); border: 1px solid var(--borda-ouro); border-radius: 5px;";
        
       const estados = ['saudavel', 'ferido', 'grave', 'desacordado', 'ansiedade', 'insano', 'fragmentado'];
        
        let htmlInputs = `<h4 style="color: var(--borda-ouro); margin-top: 0;">Fotos de Perfil (Estados)</h4><div class="avatar-config-grid">`;
        estados.forEach(est => {
            htmlInputs += `
                <div>
                    <label style="font-size: 0.75rem; text-transform: capitalize;">${est}</label>
                    <div style="display: flex; gap: 5px; align-items: center;">
                        <input type="text" id="avatar-${est}" class="input-mystic w-full" placeholder="URL ou selecione">
                        <button type="button" class="btn-mystic btn-galeria" data-estado="${est}" style="padding: 8px 12px; cursor: pointer;" title="Escolher da galeria/dispositivo">📁</button>
                    </div>
                </div>
            `;
        });

        htmlInputs += `</div>
            <input type="file" id="input-arquivo-avatar" accept="image/*, video/*" style="display: none;">
            <button id="btn-salvar-avatares" class="btn-mystic w-full mt-15">Salvar Fotos</button>`;
        
        painelAvatares.innerHTML = htmlInputs;
        containerPerfil.appendChild(painelAvatares);

        let estadoSelecionadoParaUpload = null;
        const fileInputAvatar = document.getElementById('input-arquivo-avatar');

        painelAvatares.querySelectorAll('.btn-galeria').forEach(btn => {
            btn.onclick = (e) => {
                estadoSelecionadoParaUpload = e.currentTarget.getAttribute('data-estado');
                fileInputAvatar.click();
            };
        });

        fileInputAvatar.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file || !estadoSelecionadoParaUpload) return;

            const inputTarget = document.getElementById(`avatar-${estadoSelecionadoParaUpload}`);
            if (!inputTarget) return;

            const originalPlaceholder = inputTarget.placeholder;
            inputTarget.value = "";
            inputTarget.disabled = true;

            if (file.type.startsWith('video/')) {
                inputTarget.placeholder = "Processando vídeo... ⏳";
                if (file.size > 5 * 1024 * 1024) {
                    alert("O vídeo é muito pesado! Escolha um vídeo de até 5MB.");
                    inputTarget.disabled = false;
                    inputTarget.placeholder = originalPlaceholder;
                    e.target.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(uploadEvent) {
                    inputTarget.value = uploadEvent.target.result;
                    inputTarget.disabled = false;
                    inputTarget.placeholder = originalPlaceholder;
                };
                reader.readAsDataURL(file);
                return;
            }

            inputTarget.placeholder = "Enviando foto para a nuvem... ⏳";
            const formData = new FormData();
            formData.append("image", file);

            try {
                const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                
                if (data.success) {
                    inputTarget.value = data.data.url;
                } else {
                    alert("Falha no upload para a ImgBB.");
                }
            } catch (err) {
                alert("Falha de conexão.");
            }
            
            inputTarget.disabled = false;
            inputTarget.placeholder = originalPlaceholder;
            e.target.value = '';
        };

        document.getElementById('btn-salvar-avatares').onclick = () => {
            let avatares = {};
            estados.forEach(est => {
                const campo = document.getElementById(`avatar-${est}`);
                if (campo) avatares[est] = campo.value;
            });
            update(ref(db, `characters/${currentUser}`), { avatares })
                .then(() => alert('Fotos de perfil atualizadas!'))
                .catch(err => console.error("Erro ao salvar avatares:", err));
        };
    }

    if (fichaAtual.avatares) {
        ['saudavel', 'ferido', 'grave', 'desacordado','ansiedade', 'insano', 'fragmentado'].forEach(est => {
             const input = document.getElementById(`avatar-${est}`);
             if (input && fichaAtual.avatares[est]) input.value = fichaAtual.avatares[est];
        });
    }

    const container = document.getElementById('botoes-atributos');
    if (container) {
        container.style.cssText = "display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 5px;";
        container.innerHTML = "";
        
        for (let attr in fichaAtual.atributos) {
            const valorBase = fichaAtual.atributos[attr];
            const valorFinal = valorBase + penalidadeGrave;
            
            const btn = document.createElement('button');
            btn.className = "btn-rolagem-rapida";
            btn.style.cssText = "background: #2a2a2a; border: 1px solid #444; padding: 4px 2px; border-radius: 4px; color: white; cursor: pointer; font-size: 0.75rem; line-height: 1.1; text-align: center;";
            btn.innerText = `${attr}\n(${valorFinal >= 0 ? '+' : ''}${valorFinal})`;
            
            btn.onclick = () => {
                document.getElementById('dice-qtd').value = sys.quantidadeDados;
                document.getElementById('dice-type').value = sys.tipoDado;
                document.getElementById('dice-mod').value = Math.abs(valorFinal);
                document.getElementById('mod-sign').value = valorFinal >= 0 ? '+' : '-';
                
                document.getElementById('btn-roll').click();
                
                setTimeout(() => {
                    const resultadoApp = document.getElementById('dice-result').innerText;
                    const logElements = document.getElementById('dice-log').children;
                    let detalheLog = logElements.length > 0 ? logElements[0].innerText : `${sys.quantidadeDados}D${sys.tipoDado}`;
                    const textoChatFicha = `Teste de Atributo: ${attr} (${sys.nome})\nDetalhes: ${detalheLog}\n**${resultadoApp}**`;
                    
                    // Envia para o chat automaticamente
                    if (typeof window.enviarMensagemChat === "function") {
                        window.enviarMensagemChat(textoChatFicha, 'roll');
                    }

                    // Exibe a telinha flutuante
                    mostrarTelinhaRolagem(attr, resultadoApp, detalheLog);

                }, 450);
            };
            container.appendChild(btn);
        }
    }

    if (isMasterAuthenticated) {
        const gmControls = document.getElementById('gm-controls');
        if (gmControls) gmControls.classList.remove('hidden');
    }
  
    const containerEditor = document.getElementById('lista-editor-atributos');
    if (containerEditor) {
        containerEditor.innerHTML = '';
        if (fichaAtual.atributos) {
            for (const [nome, valor] of Object.entries(fichaAtual.atributos)) {
                adicionarLinhaEditor(nome, valor);
            }
        }
    }
}

const btnSalvarJson = document.getElementById('btn-salvar-json');
if (btnSalvarJson) {
    btnSalvarJson.onclick = async () => {
        const jsonText = document.getElementById('json-editor-ficha').value;
        try {
            const novaFichaParsed = JSON.parse(jsonText);
            if (!currentUser) return alert("Erro: Nenhum usuário logado!");
            const charRef = ref(db, `characters/${currentUser}`);
            await set(charRef, novaFichaParsed);
            alert("Ficha atualizada e salva com sucesso pelo editor JSON!");
            fichaAtual = novaFichaParsed;
            renderizarPerfil();
            if (typeof registrarLog === "function") {
                registrarLog(`${currentUser} atualizou sua ficha via editor JSON.`);
            }
        } catch (e) {
            alert("Erro de sintaxe no JSON! Verifique se esqueceu alguma chave ({ }), aspas (\") ou vírgula.\n\nDetalhe do erro: " + e.message);
        }
    };
}

const btnUparAttr = document.getElementById('btn-upar-atributo');
if (btnUparAttr) {
    btnUparAttr.onclick = () => {
        if (!fichaAtual) return;
        const sys = BibliotecaSistemas[fichaAtual.sistema];
        const atributoEscolhido = prompt(`Você subiu de nível! Digite o nome exato do atributo para aumentar +1:\n${Object.keys(fichaAtual.atributos).join(", ")}`);
        if (atributoEscolhido && fichaAtual.atributos[atributoEscolhido] !== undefined) {
            const novoXp = fichaAtual.xp - sys.custoXpPorNivel;
            const novoValorAttr = fichaAtual.atributos[atributoEscolhido] + 1;
            const novoNivel = fichaAtual.nivel + 1;
            update(ref(db, `characters/${currentUser}`), {
                xp: novoXp,
                nivel: novoNivel,
                [`atributos/${atributoEscolhido}`]: novoValorAttr
            }).then(() => alert(`${atributoEscolhido} aprimorado!`));
        } else {
            alert("Atributo inválido ou cancelado.");
        }
    };
}

// ==========================================
// 15. FERRAMENTAS DO MESTRE E QUADRO DE MISSÕES
// ==========================================
let jogadorAlvoGm = "";

async function atualizarListaAlvosGm() {
    const selectAlvo = document.getElementById('gm-select-alvo');
    if (!selectAlvo) return;

    try {
        const snapshot = await get(child(ref(db), 'characters'));
        selectAlvo.innerHTML = ""; 

        if (!snapshot.exists()) {
            selectAlvo.innerHTML = `<option value="">Nenhum personagem cadastrado</option>`;
            return;
        }

        const personagens = snapshot.val();
        Object.keys(personagens).forEach(id => {
            const char = personagens[id];
            const option = document.createElement('option');
            option.value = id; 
            option.innerText = char.nome ? char.nome.toUpperCase() : id.toUpperCase();
            selectAlvo.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar alvos para o GM:", error);
    }
}

document.getElementById('btn-gm-xp').onclick = async () => {
    const valor = parseInt(document.getElementById('gm-mod-valor').value);
    const alvo = document.getElementById('gm-select-alvo').value;

    if (!alvo) return alert("Selecione um jogador válido na lista!");
    if (isNaN(valor)) return alert("Digite um valor numérico válido no campo de modificação.");
    
    const charRef = ref(db, `characters/${alvo}`);
    const snapshot = await get(charRef);
    
    if (!snapshot.exists()) return alert(`O personagem não foi encontrado no Firebase.`);
    
    const dadosChar = snapshot.val();
    const qtdXp = Math.abs(valor);
    const novoXp = (dadosChar.xp || 0) + qtdXp; 
    
    update(charRef, { xp: novoXp }).then(() => {
        alert(`${qtdXp} XP concedido para ${alvo.toUpperCase()}. Total XP: ${novoXp}`);
        if (typeof registrarLog === "function") registrarLog(`GM concedeu ${qtdXp} XP para ${alvo}.`);
    });
};

const selectMental = document.getElementById('gm-select-estado-mental');
if (selectMental && !selectMental.querySelector('option[value="ansiedade"]')) {
    const opt = document.createElement('option');
    opt.value = "ansiedade";
    opt.innerText = "Ansiedade";
    // Insere logo antes de 'insano'
    selectMental.insertBefore(opt, selectMental.querySelector('option[value="insano"]'));
}

document.getElementById('btn-gm-mudar-estado').onclick = async () => {
    const alvo = document.getElementById('gm-select-alvo').value;
    const novoFisico = document.getElementById('gm-select-estado-fisico').value;
    const novoMental = document.getElementById('gm-select-estado-mental').value;
    
    if (!alvo) return alert("Selecione um alvo na lista!");
    
    update(ref(db, `characters/${alvo}`), { estadoFisico: novoFisico, estadoMental: novoMental }).then(() => {
        alert(`O estado de ${alvo.toUpperCase()} foi atualizado! Físico: ${novoFisico} | Mental: ${novoMental}`);
        if (typeof registrarLog === "function") registrarLog(`GM alterou o estado de ${alvo}.`);
        
        // Dispara aviso dramático no chat
        let msg = `⚠️ **ATUALIZAÇÃO DE ESTADO: ${alvo.toUpperCase()}**\nO corpo e a mente reagem ao ambiente...\nFísico: ➔ ${novoFisico.toUpperCase()}\nMental: ➔ ${novoMental.toUpperCase()}`;
        
        if (novoMental === 'ansiedade') {
            msg += `\n\n😰 *"O coração acelera, a respiração fica curta. O pavor invisível se instala na mente..."*`;
        } else if (novoMental === 'insano' || novoMental === 'fragmentado') {
            msg += `\n\n🧠 *"A mente vacila e as sombras sussurram. A loucura se aproxima..."*`;
        }
        
        if (typeof window.enviarMensagemChat === "function") window.enviarMensagemChat(msg, 'roll', 'O Mestre', true);
    });
};

document.getElementById('btn-gm-falar-player').onclick = () => {
    const alvo = document.getElementById('gm-select-alvo').value;
    if (!alvo) return alert("Selecione um alvo!");
    
    const texto = prompt(`Digite a mensagem que você quer enviar como se fosse ${alvo}:`);
    if (texto) {
        window.enviarMensagemChat(texto, 'chat', alvo, true); 
        if (typeof registrarLog === "function") registrarLog(`GM falou como se fosse o jogador ${alvo}.`);
    }
};

document.getElementById('btn-gm-ferimento').onclick = async () => {
    const alvo = document.getElementById('gm-select-alvo').value;
    const tipo = prompt("Qual tipo de ferimento deseja alterar? Digite: 'grave' ou 'critico'");
    const acao = prompt("Deseja 'adicionar' ou 'curar'?");

    if (!alvo) return alert("Selecione um jogador na lista do Mestre primeiro!");
    if (tipo !== 'grave' && tipo !== 'critico') return alert("Tipo inválido. Use 'grave' ou 'critico'.");

    const charRef = ref(db, `characters/${alvo}`);
    const snapshot = await get(charRef);
    if (!snapshot.exists()) return alert("Personagem não encontrado.");

    const dados = snapshot.val();
    let graves = dados.ferimentos ? dados.ferimentos.graves : 0;
    let criticos = dados.ferimentos ? dados.ferimentos.criticos : 0;

    if (acao === 'adicionar') {
        if (tipo === 'grave') {
            if (graves < 4) graves++;
            else { graves = 4; criticos++; alert(`⚠️ O limite de Ferimentos Graves estourou!`); }
        } else if (tipo === 'critico') {
            criticos++;
        }
    } else if (acao === 'curar') {
        if (tipo === 'grave' && graves > 0) graves--;
        if (tipo === 'critico' && criticos > 0) criticos--;
    }

    update(charRef, { ferimentos: { graves, criticos } }).then(() => {
        alert(`Ferimentos de ${alvo.toUpperCase()} atualizados!`);
        
        // Dispara aviso médico no chat
        let verbo = acao === 'adicionar' ? 'sofreu' : 'curou';
        let msg = `🩸 **ALERTA: ${alvo.toUpperCase()}**\nO personagem ${verbo} um ferimento ${tipo.toUpperCase()}!\nStatus ➔ Graves: ${graves}/4 | Críticos: ${criticos}/1`;
        if (acao === 'adicionar') msg += `\n\n⚠️ *"A dor consome a carne, o fôlego falta..."*`;
        if (typeof window.enviarMensagemChat === "function") window.enviarMensagemChat(msg, 'roll', 'O Mestre', true);
    });
};

const missoesRef = ref(db, 'quests');
onValue(missoesRef, (snapshot) => {
    const data = snapshot.val();
    const lista = document.getElementById('lista-missoes');
    if (!lista) return;
    
    lista.innerHTML = "";
    
    if (data) {
        Object.keys(data).forEach(key => {
            const m = data[key];
            const div = document.createElement('div');
            div.style.cssText = "padding: 5px; border-bottom: 1px solid #555; display: flex; justify-content: space-between;";
            
            let btnApagar = isMasterAuthenticated ? `<button onclick="apagarMissao('${key}')" style="color:red; background:none; border:none; cursor:pointer; font-weight:bold;">X</button>` : "";
            div.innerHTML = `<span>${m.texto}</span> ${btnApagar}`;
            lista.appendChild(div);
        });
    } else {
        lista.innerHTML = "<span style='color: #888;'>Nenhuma missão ativa no momento.</span>";
    }
});

document.getElementById('btn-add-missao').onclick = () => {
    const textoInput = document.getElementById('gm-missao-texto');
    const texto = textoInput.value.trim();
    if (texto) {
        push(ref(db, 'quests'), { texto, data: Date.now() }).then(() => {
            textoInput.value = "";
            if (typeof registrarLog === "function") registrarLog(`GM adicionou uma nova missão ao mural.`);
        });
    } else {
        alert("Escreva o texto da missão antes de fixá-la!");
    }
};

window.apagarMissao = function(key) {
    if (confirm("Deseja remover esta missão do mural?")) {
        remove(ref(db, `quests/${key}`));
    }
};

// ==========================================
// 16. IMPORTAÇÃO DE FICHA POR ARQUIVO (.TXT / .JSON)
// ==========================================
const inputUpload = document.getElementById('upload-ficha');
const statusImportacao = document.getElementById('status-importacao');

if (inputUpload) {
    inputUpload.addEventListener('change', function(evento) {
        const arquivo = evento.target.files[0];
        if (!arquivo) return;

        statusImportacao.innerText = "Lendo pergaminho místico...";
        const leitor = new FileReader();

        leitor.onload = function(e) {
            try {
                const fichaLida = JSON.parse(e.target.result);
                const fichaRef = ref(db, `characters/${currentUser}`);
                set(fichaRef, {
                    nome: currentUser, 
                    sistema: fichaLida.sistema || "Personalizado",
                    xp: fichaLida.xp || 0,
                    hpAtual: fichaLida.hpAtual || 10,
                    nivel: fichaLida.nivel || 1,
                    atributos: fichaLida.atributos || {}
                }).then(() => {
                    statusImportacao.innerText = "Ficha importada com sucesso!";
                    setTimeout(() => statusImportacao.innerText = "", 4000);
                });
                
            } catch (erro) {
                statusImportacao.innerText = "Erro: O pergaminho não tem a formatação mágica correta (JSON inválido).";
                console.error("Erro ao ler ficha:", erro);
            }
        };
        leitor.readAsText(arquivo);
    });
}

// ==========================================
// SINCRONIZAÇÃO AUTOMÁTICA DOS ALVOS DO MESTRE
// ==========================================
const selectAlvoGm = document.getElementById('gm-select-alvo');

if (selectAlvoGm) {
    const charactersRef = ref(db, 'characters');
    onValue(charactersRef, (snapshot) => {
        selectAlvoGm.innerHTML = '<option value="">Selecione um jogador...</option>';
        if (snapshot.exists()) {
            const personagens = snapshot.val();
            Object.keys(personagens).forEach(key => {
                const dados = personagens[key];
                const option = document.createElement('option');
                option.value = key;
                option.textContent = dados.nome ? dados.nome : key;
                selectAlvoGm.appendChild(option);
            });
        } else {
            selectAlvoGm.innerHTML = '<option value="">Nenhum personagem cadastrado</option>';
        }
    });
}

// ==========================================
// 17. EDITOR VISUAL DE ATRIBUTOS
// ==========================================
function adicionarLinhaEditor(nome = "", valor = 0) {
    const container = document.getElementById('lista-editor-atributos');
    if (!container) return; 
    
    const div = document.createElement('div');
    div.style.cssText = "display: flex; gap: 5px; align-items: center; width: 100%; margin-bottom: 5px;";

    div.innerHTML = `
        <input type="text" class="input-mystic nome-attr" value="${nome}" placeholder="Nome" style="flex: 2; min-width: 0; box-sizing: border-box; padding: 6px; font-size: 0.85rem;">
        <input type="number" class="input-mystic valor-attr" value="${valor}" placeholder="Valor" style="flex: 1; min-width: 0; box-sizing: border-box; text-align: center; padding: 6px; font-size: 0.85rem;">
        <button class="btn-remover-attr" style="background: #8b0000; color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-weight: bold; flex-shrink: 0;">X</button>
    `;

    div.querySelector('.btn-remover-attr').onclick = () => div.remove();
    container.appendChild(div);
}

const btnNovoAttr = document.getElementById('btn-novo-atributo');
if (btnNovoAttr) {
    btnNovoAttr.addEventListener('click', () => {
        adicionarLinhaEditor("", 0); 
    });
}

const btnSalvarEditor = document.getElementById('btn-salvar-editor');
if (btnSalvarEditor) {
    btnSalvarEditor.addEventListener('click', () => {
        if (!currentUser) return alert("Erro: Nenhum usuário logado!");

        const novosAtributos = {};
        const linhas = document.querySelectorAll('#lista-editor-atributos > div');
        
        linhas.forEach(linha => {
            const nome = linha.querySelector('.nome-attr').value.trim();
            const valor = parseInt(linha.querySelector('.valor-attr').value) || 0;
            if (nome) {
                novosAtributos[nome] = valor;
            }
        });

        set(ref(db, `characters/${currentUser}/atributos`), novosAtributos)
            .then(() => {
                alert("Atributos salvos com sucesso!");
                if (typeof registrarLog === "function") {
                    registrarLog(`${currentUser} atualizou seus atributos pelo Editor Visual.`);
                }
            })
            .catch(erro => alert("Erro ao salvar: " + erro));
    });
}

// ==========================================
// 18. MARCADOR DE QUALIDADE DE TINTA (DIÓGENES)
// ==========================================
// Oficina do Relógio de Bolso de Yuki
const yukiClockModules={
    fragmentado:{name:'Fragmentado',short:'Base',cost:3,ingredients:['Mola de Quartzo','Ampola Calmante'],description:'O mecanismo-base: dose calmante, rejuvenescimento breve, compartimento de peças, avanço de objetos e telecinese fraca para microinvenções.'},
    retrasar:{name:'Retrasar',short:'Recuo',cost:12,ingredients:['Mola de Recuo','Escapamento Inverso'],description:'Recua o espaço pessoal de Yuki e permite ao ponteiro de Retrasar desfazer a última alteração temporal aprovada, se o eco ainda não tiver mudado.'},
    retorno:{name:'Retorno',short:'Ponto marcado',cost:14,ingredients:['Agulha de Âncora','Cristal de Coordenadas'],description:'Salta Yuki para um lugar ou marco temporal que ele tenha registrado no relógio.'},
    alarme:{name:'Alarme',short:'Arma',cost:9,ingredients:['Bobina de Impacto','Pino de Percussão'],description:'Converte o relógio em arma e faz o mostrador disparar um alerta diante de uma interferência temporal.'},
    acelerador:{name:'Acelerador',short:'Avanço',cost:8,ingredients:['Pêndulo Rápido','Óleo de Quartzo'],description:'Acelera processos e pode propor a evolução de uma habilidade em outro grimório; a alteração só entra após aprovação do dono.'},
    estase:{name:'Estase',short:'Segundos imóveis',cost:7,ingredients:['Ampola de Segundos','Roda de Escape'],description:'Congela uma cópia temporal de uma carta para consulta. Não altera o grimório original.'},
    eco:{name:'Eco',short:'Cópia',cost:6,ingredients:['Lente de Eco','Fragmento de Memória'],description:'Traz uma cópia de uma carta observada para o grimório de Yuki, preservando o original.'},
    ancora:{name:'Âncora',short:'Marco',cost:5,ingredients:['Placa Cartográfica','Pino de Fixação'],description:'Guarda uma versão exata de uma carta como marco, para comparar e retornar a ela depois.'},
    desvio:{name:'Desvio',short:'Linha alternativa',cost:10,ingredients:['Prisma de Desvio','Mola Desalinhada'],description:'Cria um desvio editável em uma cópia e envia uma proposta reversível ao dono do grimório.'},
    fratura:{name:'Fratura',short:'Fragmentação',cost:11,ingredients:['Dente de Engrenagem','Cristal Trincado'],description:'Separa uma carta observada em uma variação temporal no grimório de Yuki; não toca na carta original.'},
    aurora:{name:'Aurora',short:'Despertar',cost:8,ingredients:['Prisma da Aurora','Mola do Amanhecer'],description:'Puxa a primeira luz do dia para iluminar uma área, despertar Yuki e revelar rastros temporais próximos.'},
    crepusculo:{name:'Crepúsculo',short:'Véu noturno',cost:8,ingredients:['Véu de Penumbra','Pêndulo do Ocaso'],description:'Projeta um véu de entardecer para ocultar Yuki por instantes ou destacar ecos que se movem na penumbra.'}
};
const yukiClockOrder=Object.keys(yukiClockModules);
const yukiClockBaseState=()=>({active:'fragmentado',activeSlot:0,slots:yukiClockOrder.map(module=>({module,fragmentedAction:'calm',actionNote:''})),markedPoint:'',diaryText:'',storedItems:[],timeReserve:100,deaths:0,modules:{fragmentado:{installedAt:0,level:1,components:[]}},actionNotes:{},bookmarks:{},echoes:{},lastAction:''});
let yukiClockState=yukiClockBaseState(),yukiClockLoadedFor='',yukiClockLoadToken=0,yukiClockRecipeSelectedType='',yukiTemporalBooks={},yukiTemporalSelected=null,temporalApprovalUnsubscribe=null,temporalRevisionUnsubscribe=null,temporalApprovalLoadedFor='',yukiTemporalRevisions={};
function usuarioEhYuki(){return String(currentUser||'').trim().toLocaleLowerCase('pt-BR')==='yuki'||String(fichaAtual?.nome||'').trim().toLocaleLowerCase('pt-BR')==='yuki';}
function atualizarAcessoOficinaRelogioYuki(){
    const panel=document.getElementById('yuki-clock-workshop'),nav=document.querySelector('.yuki-workshop-nav');if(!panel)return;
    const allowed=usuarioEhYuki();panel.classList.toggle('hidden',!allowed);nav?.classList.toggle('hidden',!allowed);if(!allowed)return;
    if(yukiClockLoadedFor===currentUser)return;
    yukiClockLoadedFor=currentUser;const token=++yukiClockLoadToken;
    get(ref(db,`characters/${currentUser}/relogioBolso`)).then(snapshot=>{
        if(token!==yukiClockLoadToken||!usuarioEhYuki())return;
        const saved=snapshot.val()||{},base=yukiClockBaseState(),savedSlots=Array.isArray(saved.slots)?saved.slots:Object.values(saved.slots||{}),legacySlot=Math.max(0,yukiClockOrder.indexOf(saved.active||'fragmentado'));
        const activeSlot=Math.max(0,Math.min(yukiClockOrder.length-1,Number.isInteger(Number(saved.activeSlot))?Number(saved.activeSlot):legacySlot));
        const slots=base.slots.map((fallback,index)=>{const old=savedSlots[index]||{},module=yukiClockModules[old.module]?old.module:fallback.module;return {...fallback,...old,module,fragmentedAction:old.fragmentedAction||'calm',actionNote:String(old.actionNote??saved.actionNotes?.[module]??'')};});
        yukiClockState={...base,...saved,activeSlot,slots,modules:{...base.modules,...(saved.modules||{})},actionNotes:saved.actionNotes||{},bookmarks:saved.bookmarks||{},echoes:saved.echoes||{},storedItems:saved.storedItems||[]};
        yukiClockState.active=yukiClockState.slots[activeSlot]?.module||'fragmentado';
        atualizarInterfaceRelogioYuki();renderizarPecasRelogioYuki();renderizarReceitasYuki();renderizarRevisoesTemporaisYuki();iniciarEscutaRevisoesTemporaisYuki();
        if(Number(yukiClockState.timeReserve)<=0)mostrarPopupRelogio('O tempo alcançou Yuki','O relógio parou. Ao continuar, Yuki morre e retorna ao início do ciclo; receitas e módulos ficam preservados.',true);
    }).catch(error=>{console.warn('Não foi possível carregar o relógio de Yuki:',error);exibirStatusRelogioYuki('O relógio não conseguiu sincronizar. Tente novamente mais tarde.');});
}
function salvarRelogioYuki(){if(!currentUser||!usuarioEhYuki())return Promise.resolve();return set(ref(db,`characters/${currentUser}/relogioBolso`),yukiClockState).catch(error=>{console.error('Falha ao salvar o relógio:',error);exibirStatusRelogioYuki('Não foi possível salvar a modificação do relógio.');});}
function atualizarBarraVitalYuki(){const value=Math.max(0,Math.min(100,Number(yukiClockState.timeReserve??100))),bar=document.getElementById('yuki-clock-life-bar'),label=document.getElementById('yuki-clock-life-value'),deaths=document.getElementById('yuki-clock-deaths');if(bar){bar.value=value;bar.classList.toggle('critical',value<=25);}if(label)label.textContent=String(value);if(deaths)deaths.textContent=String(yukiClockState.deaths||0);}
function rotuloHoraRelogioYuki(index){const n=((Number(index)%12)+12)%12;return String(n===0?12:n).padStart(2,'0');}
function obterSlotAtivoYuki(){const index=Math.max(0,Math.min(yukiClockOrder.length-1,Number(yukiClockState.activeSlot)||0));return yukiClockState.slots?.[index]||{module:yukiClockState.active||'fragmentado',fragmentedAction:'calm',actionNote:''};}
function obterNotaPosicaoYuki(index=yukiClockState.activeSlot){const slot=yukiClockState.slots?.[Number(index)];return String(slot?.actionNote??yukiClockState.actionNotes?.[slot?.module||yukiClockState.active]??'').trim();}
function renderizarPosicoesRelogioYuki(){
    document.querySelectorAll('.yuki-clock-sector').forEach(button=>{const index=Number(button.dataset.clockIndex),slot=yukiClockState.slots?.[index]||{module:yukiClockOrder[index]},type=slot.module,installed=!!yukiClockState.modules?.[type];button.classList.toggle('is-selected',index===Number(yukiClockState.activeSlot||0));button.classList.toggle('is-preview',false);button.classList.toggle('is-locked',!installed);button.title=`${rotuloHoraRelogioYuki(index)} → ${yukiClockModules[type].name}${installed?` · nível ${yukiClockState.modules[type].level||1}`:' · mecanismo não montado'}`;button.setAttribute('aria-label',`Hora ${rotuloHoraRelogioYuki(index)}: ${yukiClockModules[type].name}${installed?'':' (não montado)'}`);});
}
function atualizarAcaoProgramadaYuki(){const slot=obterSlotAtivoYuki(),type=slot.module||'fragmentado',note=obterNotaPosicaoYuki(),mode=document.getElementById('yuki-clock-mode-display'),settingsMode=document.getElementById('yuki-settings-mode-label'),action=document.getElementById('yuki-clock-main-action'),fragmentActions={calm:'Dose calmante',rejuvenate:'Rejuvenescer',advance:'Avançar um objeto',assemble:'Montar equipamento'},defaultAction=type==='fragmentado'?fragmentActions[slot.fragmentedAction||'calm']:yukiClockModules[type]?.short;if(mode)mode.textContent=yukiClockModules[type]?.name||'Fragmentado';if(settingsMode)settingsMode.textContent=`${rotuloHoraRelogioYuki(yukiClockState.activeSlot||0)} · ${yukiClockModules[type]?.name||'Fragmentado'}`;if(action)action.textContent=note?`Função: ${note}`:(defaultAction||'Pronto para acionar');}
function atualizarInterfaceRelogioYuki(){
    const active=document.getElementById('yuki-clock-active'),installed=document.getElementById('yuki-clock-module-list');if(!active)return;
    yukiClockState.activeSlot=Math.max(0,Math.min(yukiClockOrder.length-1,Number(yukiClockState.activeSlot)||0));yukiClockState.slots??=yukiClockBaseState().slots;
    const slot=obterSlotAtivoYuki(),type=slot.module||'fragmentado';yukiClockState.active=type;
    active.replaceChildren();yukiClockOrder.forEach(moduleType=>{const option=document.createElement('option');option.value=moduleType;option.textContent=`${rotuloHoraRelogioYuki(yukiClockOrder.indexOf(moduleType))} · ${yukiClockModules[moduleType].name}${yukiClockState.modules?.[moduleType]?` · Nv. ${yukiClockState.modules[moduleType].level||1}`:' · não montado'}`;option.disabled=!yukiClockState.modules?.[moduleType];active.appendChild(option);});active.value=type;
    const description=document.getElementById('yuki-clock-module-description');if(description){const module=yukiClockModules[type],level=yukiClockState.modules?.[type]?.level||1;description.textContent=yukiClockState.modules?.[type]?`${module.name} · ${module.short} · consumo ${Math.max(2,module.cost-(level-1)*2)}.`:`${module.name} · mecanismo ainda não montado; receita disponível.`;}
    const trigger=document.getElementById('yuki-clock-activate');if(trigger){trigger.disabled=!yukiClockState.modules?.[type];trigger.setAttribute('aria-label',yukiClockState.modules?.[type]?`Ativar ${yukiClockModules[type].name}, hora ${rotuloHoraRelogioYuki(yukiClockState.activeSlot)}`:`${yukiClockModules[type].name} ainda não montado`);}
    if(installed){installed.replaceChildren();yukiClockOrder.filter(moduleType=>yukiClockState.modules?.[moduleType]).forEach(moduleType=>{const item=document.createElement('p');item.className='yuki-module-chip';const parts=yukiClockState.modules[moduleType]?.components||[];item.textContent=`${yukiClockModules[moduleType].name} · Nv. ${yukiClockState.modules[moduleType].level||1}${parts.length?` · ${parts.map(part=>part.emoji||'⚙️').join(' + ')}`:' · mecanismo original'}`;installed.appendChild(item);});}
    const storage=document.getElementById('yuki-clock-storage');if(storage){storage.replaceChildren();const items=yukiClockState.storedItems||[];if(!items.length)storage.textContent='Vazio';else items.forEach(part=>{const item=document.createElement('p');item.className='yuki-module-chip';item.textContent=`${part.emoji||'⚙️'} ${part.nome||'Peça'}`;storage.appendChild(item);});}
    const mark=document.getElementById('yuki-clock-marked');if(mark)mark.textContent=yukiClockState.markedPoint?`Ponto marcado: ${yukiClockState.markedPoint}`:'Nenhum ponto de retorno marcado.';
    const needle=document.getElementById('yuki-clock-needle');if(needle)needle.style.transform=`translateX(-50%) rotate(${Number(yukiClockState.activeSlot||0)*30}deg)`;
    atualizarAcaoProgramadaYuki();renderizarPosicoesRelogioYuki();atualizarBarraVitalYuki();
}
function renderizarConfiguracaoNumerosRelogioYuki(){
    const host=document.getElementById('yuki-clock-slot-list');if(!host)return;host.replaceChildren();
    const actions=[['calm','Dose calmante'],['rejuvenate','Rejuvenescer'],['advance','Avançar objeto'],['assemble','Montar equipamento']];
    yukiClockOrder.forEach((fallback,index)=>{const slot=yukiClockState.slots?.[index]||{module:fallback,fragmentedAction:'calm',actionNote:''},type=slot.module||fallback,details=document.createElement('details');details.className='yuki-slot-config';details.dataset.slotIndex=String(index);details.open=index===Number(yukiClockState.activeSlot||0);if(details.open)details.classList.add('is-current');
        const summary=document.createElement('summary');summary.className='yuki-slot-summary';summary.innerHTML=`<b>${rotuloHoraRelogioYuki(index)}</b><span>${yukiClockModules[type].name}</span><small>${yukiClockState.modules?.[type]?'Montado':'Receita necessária'}</small>`;
        const fields=document.createElement('div');fields.className='yuki-slot-fields';
        const moduleLabel=document.createElement('label');moduleLabel.textContent='Função desta hora';const moduleSelect=document.createElement('select');moduleSelect.className='input-mystic';moduleSelect.dataset.slotModule='';yukiClockOrder.forEach(moduleType=>{const option=document.createElement('option');option.value=moduleType;option.textContent=yukiClockModules[moduleType].name+(yukiClockState.modules?.[moduleType]?'':' · precisa montar');option.selected=moduleType===type;moduleSelect.appendChild(option);});moduleLabel.appendChild(moduleSelect);fields.appendChild(moduleLabel);
        if(type==='fragmentado'){const actionLabel=document.createElement('label');actionLabel.textContent='Ação do Fragmentado';const actionSelect=document.createElement('select');actionSelect.className='input-mystic';actionSelect.dataset.slotFragmentAction='';actions.forEach(([value,label])=>{const option=document.createElement('option');option.value=value;option.textContent=label;option.selected=value===(slot.fragmentedAction||'calm');actionSelect.appendChild(option);});actionLabel.appendChild(actionSelect);fields.appendChild(actionLabel);}
        const noteLabel=document.createElement('label');noteLabel.textContent='Nota opcional';const note=document.createElement('input');note.type='text';note.className='input-mystic';note.maxLength=180;note.placeholder='Lembrete para esta hora';note.value=String(slot.actionNote??'');note.dataset.slotNote='';noteLabel.appendChild(note);fields.appendChild(noteLabel);
        details.append(summary,fields);host.appendChild(details);
    });
}
function renderizarReceitasYuki(){
    const list=document.getElementById('yuki-clock-recipe-list');if(!list)return;list.replaceChildren();
    yukiClockOrder.forEach(type=>{const recipe=yukiClockModules[type],installed=yukiClockState.modules[type],card=document.createElement('article');card.className=`yuki-recipe-card ${installed?'is-built':''} recipe-${type}`;const heading=document.createElement('b');heading.textContent=recipe.name;const status=document.createElement('small');status.textContent=installed?`Montado · nível ${installed.level||1}`:type==='fragmentado'?'Mecanismo-base':'Receita disponível';const ingredients=document.createElement('span');ingredients.textContent=recipe.ingredients.join(' + ');const button=document.createElement('button');button.type='button';button.className='yuki-recipe-open';button.textContent=installed?(type==='fragmentado'?'Ver / evoluir':'Ver / evoluir'):type==='fragmentado'?'Ver receita-base':'Abrir receita';button.addEventListener('click',()=>abrirReceitaRelogioYuki(type));card.append(heading,status,ingredients,button);list.appendChild(card);});
}
function abrirReceitaRelogioYuki(type){
    if(!yukiClockModules[type])return;yukiClockRecipeSelectedType=type;const recipe=yukiClockModules[type],title=document.getElementById('yuki-recipe-title'),description=document.getElementById('yuki-recipe-description'),ingredients=document.getElementById('yuki-recipe-ingredients'),button=document.getElementById('yuki-clock-install');
    if(title)title.textContent=`${recipe.name} · receita de montagem`;if(description)description.textContent=recipe.description;if(ingredients){ingredients.replaceChildren();recipe.ingredients.forEach(name=>{const chip=document.createElement('span');chip.className='yuki-ingredient-chip';chip.textContent=name;ingredients.appendChild(chip);});}
    if(button){button.textContent=yukiClockState.modules[type]?`Evoluir para nível ${(yukiClockState.modules[type].level||1)+1}`:'Montar este relógio';button.disabled=(yukiClockState.modules[type]?.level||0)>=3;}
    renderizarPecasRelogioYuki();document.getElementById('yuki-recipe-modal')?.showModal();
}
function renderizarPecasRelogioYuki(){
    const list=document.getElementById('yuki-clock-parts-list');if(!list)return;list.replaceChildren();if(!usuarioEhYuki())return;
    const recipe=yukiClockModules[yukiClockRecipeSelectedType];if(!userInventory.length){const note=document.createElement('p');note.className='text-muted';note.textContent='A bolsa está vazia. Adicione as peças pedidas na Forja & Inventário.';list.appendChild(note);return;}
    userInventory.forEach(item=>{const label=document.createElement('label');label.className='yuki-part-choice';const input=document.createElement('input');input.type='checkbox';input.dataset.clockItem=item.id;const required=recipe?.ingredients.some(name=>name.toLocaleLowerCase('pt-BR')===String(item.nome||'').toLocaleLowerCase('pt-BR'));input.disabled=!required;const text=document.createElement('span');text.textContent=`${item.emoji||'⚙️'} ${item.nome||'Peça sem nome'}${required?' · ingrediente':' · não corresponde à receita'}`;label.classList.toggle('is-recipe-part',!!required);label.append(input,text);list.appendChild(label);});
}
function renderizarPecasCompartimentoYuki(){
    const list=document.getElementById('yuki-storage-parts-list');if(!list)return;list.replaceChildren();if(!userInventory.length){const note=document.createElement('p');note.className='text-muted';note.textContent='A bolsa está vazia.';list.appendChild(note);return;}
    userInventory.forEach(item=>{const label=document.createElement('label');label.className='yuki-part-choice is-recipe-part';const input=document.createElement('input');input.type='checkbox';input.dataset.clockItem=item.id;const text=document.createElement('span');text.textContent=`${item.emoji||'⚙️'} ${item.nome||'Peça sem nome'}`;label.append(input,text);list.appendChild(label);});
}
function exibirStatusRelogioYuki(message){const status=document.getElementById('yuki-clock-status');if(status)status.textContent=message;}
function mostrarPopupRelogio(title,message,isDeath=false){const dialog=document.getElementById('yuki-clock-popup');if(!dialog)return;const heading=document.getElementById('yuki-popup-title'),body=document.getElementById('yuki-popup-message'),kicker=document.getElementById('yuki-popup-kicker'),button=document.getElementById('yuki-popup-continue');if(heading)heading.textContent=title;if(body)body.textContent=message;if(kicker)kicker.textContent=isDeath?'FIM DE CICLO · RETORNO TEMPORAL':'PULSO TEMPORAL';dialog.classList.toggle('is-death',isDeath);dialog.dataset.death=isDeath?'true':'false';if(button)button.textContent=isDeath?'Reiniciar ciclo':'Continuar';if(!dialog.open)dialog.showModal();}
function reiniciarCicloYuki(){yukiClockState={...yukiClockState,timeReserve:100,deaths:(Number(yukiClockState.deaths)||0)+1,active:'fragmentado',markedPoint:'',lastAction:'Yuki morreu e o relógio o devolveu ao início do ciclo.'};salvarRelogioYuki();atualizarInterfaceRelogioYuki();exibirStatusRelogioYuki('Yuki voltou ao Fragmentado. As receitas, os módulos e as peças guardadas sobreviveram ao reinício.');}
function gastarTempoYuki(type){const module=yukiClockModules[type]||yukiClockModules.fragmentado,level=yukiClockState.modules[type]?.level||1,cost=Math.max(2,module.cost-(level-1)*2),remaining=Math.max(0,Number(yukiClockState.timeReserve??100)-cost);yukiClockState.timeReserve=remaining;atualizarBarraVitalYuki();salvarRelogioYuki();if(remaining<=0){mostrarPopupRelogio('O tempo alcançou Yuki','A reserva vital chegou a zero. Yuki morre; o Fragmentado o reiniciará quando você continuar. Módulos e receitas não serão apagados.',true);return false;}return true;}
function concluirAcaoRelogioYuki(type,description,prepaid=false){
    if(!prepaid&&!gastarTempoYuki(type))return;yukiClockState.lastAction={type,description,at:Date.now()};salvarRelogioYuki();renderizarRevisoesTemporaisYuki();exibirStatusRelogioYuki(description);if(typeof registrarLog==='function')registrarLog(`Yuki / ${yukiClockModules[type].name}: ${description}`);mostrarPopupRelogio(yukiClockModules[type].name,description,false);
    const workshop=document.getElementById('yuki-clock-workshop');if(workshop){workshop.classList.remove('clock-pulse');void workshop.offsetWidth;workshop.classList.add('clock-pulse');}
}
function atualizarInterfaceTimelineYuki(){
    const owner=document.getElementById('yuki-timeline-owner');if(!owner)return;const previous=owner.value;owner.replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='Escolha uma linha temporal';owner.appendChild(empty);
    Object.keys(yukiTemporalBooks).sort((a,b)=>a.localeCompare(b,'pt-BR')).forEach(user=>{const option=document.createElement('option');option.value=user;option.textContent=user===currentUser?`${user} · seu grimório`:`${user} · eco consultável`;owner.appendChild(option);});if(yukiTemporalBooks[previous])owner.value=previous;renderizarCartasTimelineYuki();
}
async function carregarLinhasTemporaisYuki(){
    const target=document.getElementById('yuki-timeline-cards');if(target)target.innerHTML='<p class="text-muted">Lendo ecos dos grimórios…</p>';
    try{const snap=await get(ref(db,'grimoires'));yukiTemporalBooks=snap.val()||{};atualizarInterfaceTimelineYuki();const owners=document.getElementById('yuki-timeline-owner');if(owners&&!owners.value&&yukiTemporalBooks[currentUser]){owners.value=currentUser;renderizarCartasTimelineYuki();}exibirStatusRelogioYuki('Linhas temporais carregadas como cópias de consulta; alterações alheias exigem aprovação.');}
    catch(error){console.error('Falha ao observar grimórios:',error);if(target)target.textContent='Não foi possível carregar as linhas temporais.';}
}
function renderizarCartasTimelineYuki(){
    const owner=document.getElementById('yuki-timeline-owner')?.value,container=document.getElementById('yuki-timeline-cards');if(!container)return;container.replaceChildren();yukiTemporalSelected=null;document.getElementById('yuki-temporal-editor')?.classList.add('hidden');
    const book=yukiTemporalBooks[owner];if(!owner||!book){const note=document.createElement('p');note.className='text-muted';note.textContent='Escolha um jogador com grimório para ver os ecos.';container.appendChild(note);return;}
    Object.entries(book).forEach(([id,card])=>{const button=document.createElement('button');button.type='button';button.className='yuki-timeline-card';const title=document.createElement('b');title.textContent=card.nome||'Carta sem nome';const effect=document.createElement('small');effect.textContent=card.efeito||'Sem descrição';button.append(title,effect);button.addEventListener('click',()=>selecionarCartaTimelineYuki(owner,id,card));container.appendChild(button);});if(!Object.keys(book).length){const note=document.createElement('p');note.className='text-muted';note.textContent='Este grimório está vazio.';container.appendChild(note);}
}
function selecionarCartaTimelineYuki(owner,id,card){yukiTemporalSelected={owner,id,card:{...card}};const panel=document.getElementById('yuki-temporal-editor');panel?.classList.remove('hidden');const title=document.getElementById('yuki-temporal-card-title'),before=document.getElementById('yuki-temporal-card-before');if(title)title.textContent=`${card.nome||'Carta'} · eco de ${owner}`;if(before)before.textContent=`Versão observada: ${card.efeito||'sem descrição'}`;const name=document.getElementById('yuki-temporal-name'),effect=document.getElementById('yuki-temporal-effect'),recipe=document.getElementById('yuki-temporal-recipe');if(name)name.value=card.nome||'';if(effect)effect.value=card.efeito||'';if(recipe)recipe.value=card.receita||'';}
function obterEdicaoTemporal(){if(!yukiTemporalSelected)return null;return {...yukiTemporalSelected.card,nome:document.getElementById('yuki-temporal-name')?.value.trim()||'',efeito:document.getElementById('yuki-temporal-effect')?.value.trim()||'',receita:document.getElementById('yuki-temporal-recipe')?.value.trim()||''};}
function normalizarVersaoTemporal(value){if(Array.isArray(value))return value.map(normalizarVersaoTemporal);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,normalizarVersaoTemporal(value[key])]));return value;}
function mesmasVersoesTemporais(a,b){return JSON.stringify(normalizarVersaoTemporal(a||{}))===JSON.stringify(normalizarVersaoTemporal(b||{}));}
async function proporDesvioTemporalYuki(){
    if(!yukiTemporalSelected)return exibirStatusRelogioYuki('Selecione uma carta de um grimório primeiro.');const type=document.getElementById('yuki-clock-active')?.value||'fragmentado';if(!['desvio','acelerador'].includes(type))return exibirStatusRelogioYuki('Ative Desvio ou Acelerador para escrever uma alteração temporal.');
    const after=obterEdicaoTemporal(),before=yukiTemporalSelected.card;if(!after.nome||!after.efeito)return exibirStatusRelogioYuki('A carta precisa manter nome e efeito.');if(JSON.stringify(before)===JSON.stringify(after))return exibirStatusRelogioYuki('Nenhuma alteração foi feita no eco.');
    if(!gastarTempoYuki(type))return;
    if(yukiTemporalSelected.owner===currentUser){
        const revisionRef=push(ref(db,`temporalRevisions/${currentUser}/${currentUser}`)),revision={targetUser:currentUser,cardId:yukiTemporalSelected.id,before,after,fromUser:currentUser,createdAt:Date.now(),status:'live',requestId:revisionRef.key};
        try{const patch={};patch[`grimoires/${currentUser}/${yukiTemporalSelected.id}`]=after;patch[`temporalRevisions/${currentUser}/${currentUser}/${revisionRef.key}`]=revision;await update(ref(db),patch);yukiTemporalBooks[currentUser][yukiTemporalSelected.id]=after;renderizarCartasTimelineYuki();renderizarRevisoesTemporaisYuki();exibirStatusRelogioYuki('Desvio aplicado ao seu grimório. O Relógio guardou a versão anterior para Retrasar.');mostrarPopupRelogio('Desvio ancorado','Sua própria carta foi alterada e a versão anterior ficou reversível pelo Relógio de retrasar.');}catch(error){console.error(error);exibirStatusRelogioYuki('Não foi possível salvar o desvio.');}return;
    }
    const requestRef=push(ref(db,`temporalRequests/${yukiTemporalSelected.owner}`)),request={requestId:requestRef.key,fromUser:currentUser,targetUser:yukiTemporalSelected.owner,cardId:yukiTemporalSelected.id,before,after,clockType:type,status:'pending',createdAt:Date.now()};
    try{await set(requestRef,request);exibirStatusRelogioYuki(`Proposta enviada a ${yukiTemporalSelected.owner}; o grimório original não mudou.`);mostrarPopupRelogio('Eco enviado para aprovação',`${yukiTemporalSelected.owner} precisa aprovar a alteração. Se aceita, Yuki poderá revertê-la com Retrasar, desde que ninguém edite a carta depois.`);}catch(error){console.error(error);exibirStatusRelogioYuki('Não foi possível enviar a proposta.');}
}
async function ecoarCartaGrimorioYuki(fraturar=false,charge=true){
    if(!yukiTemporalSelected)return exibirStatusRelogioYuki('Selecione uma carta no Arquivo Temporal primeiro.');const type=fraturar?'fratura':'eco';if(document.getElementById('yuki-clock-active')?.value!==type)return exibirStatusRelogioYuki(`Ative o módulo ${yukiClockModules[type].name} antes de trazer o eco.`);if(charge&&!gastarTempoYuki(type))return;
    const source=yukiTemporalSelected.card,copy={...source,nome:fraturar?`Fragmento: ${source.nome||'Carta'}`:`Eco: ${source.nome||'Carta'}`,efeito:fraturar?`${source.efeito||''}\n\n[Fragmento temporal: versão incompleta.]`:source.efeito||'',ecoDe:{jogador:yukiTemporalSelected.owner,carta:yukiTemporalSelected.id},criadoEm:Date.now()};delete copy.id;
    try{await set(push(ref(db,`grimoires/${currentUser}`)),copy);const note=obterNotaPosicaoYuki();concluirAcaoRelogioYuki(type,`${yukiClockModules[type].name} trouxe uma cópia de “${source.nome||'carta'}” ao grimório de Yuki.${note?` Instrução programada: ${note}.`:''}`,charge);}
    catch(error){console.error(error);exibirStatusRelogioYuki('Não foi possível materializar a cópia temporal.');}
}
async function ativarRelogioYuki(){
    const type=obterSlotAtivoYuki().module||'fragmentado',module=yukiClockModules[type];if(!module)return;let description='',target=document.getElementById('yuki-clock-target')?.value.trim()||'';
    if(type==='fragmentado'){
        const action=obterSlotAtivoYuki().fragmentedAction||'calm';const actions={calm:'O Fragmentado libera uma dose calmante para Yuki.',rejuvenate:'O relógio puxa o tempo de Yuki alguns instantes para trás e o rejuvenesce brevemente.',advance:`O Fragmentado acelera o tempo de ${target||'um objeto escolhido'} para facilitar uma criação.`,assemble:`A telecinese fraca do Fragmentado reúne peças e monta ${target||'um equipamento minúsculo'}.`};if(['advance','assemble'].includes(action)&&!target)return exibirStatusRelogioYuki('Diga qual objeto ou equipamento o relógio deve manipular.');description=actions[action]||actions.calm;
    }else if(type==='retrasar')description='O espaço pessoal de Yuki volta alguns segundos para trás. A ação não apaga eventos de outros jogadores; use Retrasar na lista de revisões para desfazer uma carta aprovada.';
    else if(type==='retorno'){if(!yukiClockState.markedPoint)return exibirStatusRelogioYuki('Marque um ponto de retorno antes do salto.');description=`O ponteiro prende Yuki ao ponto temporal: ${yukiClockState.markedPoint}.`;}
    else if(type==='alarme')description='O Relógio alarme se desdobra em uma arma; o mostrador vibra como aviso de interferência.';
    else if(type==='aurora')description=`A Aurora abre uma faixa de luz do amanhecer ${target?`sobre ${target}`:'ao redor de Yuki'}, iluminando o lugar e revelando rastros temporais.`;
    else if(type==='crepusculo')description=`O Crepúsculo estende um véu de penumbra ${target?`sobre ${target}`:'ao redor de Yuki'}, ocultando movimentos e destacando ecos.`;
    else if(type==='acelerador'){if(!yukiTemporalSelected)return exibirStatusRelogioYuki('Escolha uma carta no Arquivo Temporal antes de usar o Acelerador.');document.getElementById('yuki-temporal-editor')?.scrollIntoView({behavior:'smooth',block:'center'});const note=obterNotaPosicaoYuki();mostrarPopupRelogio('Acelerador preparado',`Edite o eco selecionado e envie a proposta. A reserva será consumida ao enviar; o dono precisa aprovar.${note?` Plano deste ponteiro: ${note}.`:''}`);return;}
    else if(type==='estase'){
        if(!yukiTemporalSelected)return exibirStatusRelogioYuki('Selecione uma carta no Arquivo Temporal para congelar o seu eco.');const id=`${Date.now()}`;yukiClockState.echoes={...(yukiClockState.echoes||{}),[id]:{owner:yukiTemporalSelected.owner,cardId:yukiTemporalSelected.id,card:yukiTemporalSelected.card,savedAt:Date.now()}};description=`Estase congelou uma cópia de “${yukiTemporalSelected.card.nome||'carta'}”. O grimório original permanece intacto.`;
    }else if(type==='eco'){return ecoarCartaGrimorioYuki(false,true);}
    else if(type==='ancora'){
        if(!yukiTemporalSelected)return exibirStatusRelogioYuki('Selecione uma carta no Arquivo Temporal para criar uma âncora.');const id=`${Date.now()}`;yukiClockState.bookmarks={...(yukiClockState.bookmarks||{}),[id]:{owner:yukiTemporalSelected.owner,cardId:yukiTemporalSelected.id,card:yukiTemporalSelected.card,savedAt:Date.now()}};description=`Âncora guardou a versão de “${yukiTemporalSelected.card.nome||'carta'}” como marco temporal.`;
    }else if(type==='desvio'){
        if(!yukiTemporalSelected)return exibirStatusRelogioYuki('Selecione uma carta e prepare um desvio reversível no Arquivo Temporal.');document.getElementById('yuki-temporal-editor')?.scrollIntoView({behavior:'smooth',block:'center'});const note=obterNotaPosicaoYuki();mostrarPopupRelogio('Desvio preparado',`A cópia temporal está pronta para edição. A reserva será consumida ao enviar a proposta; o dono decide se a aceita.${note?` Plano deste ponteiro: ${note}.`:''}`);return;
    }else if(type==='fratura'){
        if(!yukiTemporalSelected)return exibirStatusRelogioYuki('Selecione uma carta para fraturar uma cópia no seu grimório.');return ecoarCartaGrimorioYuki(true,true);
    }
    const programmedNote=obterNotaPosicaoYuki();if(programmedNote)description+=` Instrução programada: ${programmedNote}.`;
    if(!gastarTempoYuki(type))return; yukiClockState.lastAction={type,description,at:Date.now()};salvarRelogioYuki();renderizarRevisoesTemporaisYuki();exibirStatusRelogioYuki(description);if(typeof registrarLog==='function')registrarLog(`Yuki / ${module.name}: ${description}`);mostrarPopupRelogio(module.name,description,false);const workshop=document.getElementById('yuki-clock-workshop');if(workshop){workshop.classList.remove('clock-pulse');void workshop.offsetWidth;workshop.classList.add('clock-pulse');}
}
function instalarPecasNoRelogioYuki(){
    const type=yukiClockRecipeSelectedType,recipe=yukiClockModules[type];if(!recipe)return exibirStatusRelogioYuki('Abra primeiro uma receita específica.');
    if((yukiClockState.modules[type]?.level||0)>=3)return exibirStatusRelogioYuki('Este mecanismo já atingiu o nível máximo.');
    const selected=[...document.querySelectorAll('#yuki-clock-parts-list input[data-clock-item]:checked')],parts=selected.map(input=>userInventory.find(item=>String(item.id)===input.dataset.clockItem)).filter(Boolean),required=recipe.ingredients.map(name=>name.toLocaleLowerCase('pt-BR')).sort(),actual=parts.map(part=>String(part.nome||'').toLocaleLowerCase('pt-BR')).sort();
    if(actual.length!==required.length||actual.some((name,index)=>name!==required[index]))return exibirStatusRelogioYuki(`A receita ${recipe.name} precisa exatamente de: ${recipe.ingredients.join(' + ')}.`);
    const next={...yukiClockState,modules:{...yukiClockState.modules},active:type};const existing=next.modules[type]||{};next.modules[type]={installedAt:existing.installedAt||Date.now(),level:Math.min(3,(existing.level||0)+1),components:[...(existing.components||[]),...parts.map(({id,nome,emoji})=>({id,nome:nome||'Peça',emoji:emoji||'⚙️'}))]};
    const patch={[`characters/${currentUser}/relogioBolso`]:next};parts.forEach(part=>{patch[`inventory/${currentUser}/${part.id}`]=null;});
    update(ref(db),patch).then(()=>{yukiClockState=next;const used=new Set(parts.map(part=>String(part.id)));userInventory=userInventory.filter(item=>!used.has(String(item.id)));renderizarInventarioVisual(userInventory);atualizarInterfaceRelogioYuki();renderizarReceitasYuki();renderizarPecasRelogioYuki();const dialog=document.getElementById('yuki-recipe-modal');if(dialog?.open)dialog.close();const message=`${recipe.name} montado no nível ${next.modules[type].level}. As peças da receita foram consumidas.`;exibirStatusRelogioYuki(message);mostrarPopupRelogio('Mecanismo integrado',message);if(typeof registrarLog==='function')registrarLog(`Yuki montou ${recipe.name} nível ${next.modules[type].level}.`);}).catch(error=>{console.error('Falha ao integrar peças no relógio:',error);exibirStatusRelogioYuki('As peças não puderam ser integradas. Nenhum material foi removido.');});
}
function guardarPecasNoCompartimentoYuki(listId='yuki-clock-parts-list',dialogId='yuki-recipe-modal'){
    const selected=[...document.querySelectorAll(`#${listId} input[data-clock-item]:checked`)],parts=selected.map(input=>userInventory.find(item=>String(item.id)===input.dataset.clockItem)).filter(Boolean);if(!parts.length)return exibirStatusRelogioYuki('Selecione ao menos uma peça para guardar.');
    const oldIds=new Set((yukiClockState.storedItems||[]).map(item=>String(item.id)));if(parts.some(part=>oldIds.has(String(part.id))))return exibirStatusRelogioYuki('Uma ou mais peças já estão no compartimento.');
    const next={...yukiClockState,storedItems:[...(yukiClockState.storedItems||[]),...parts.map(({id,nome,emoji})=>({id,nome:nome||'Peça',emoji:emoji||'⚙️'}))]},patch={[`characters/${currentUser}/relogioBolso`]:next};parts.forEach(part=>{patch[`inventory/${currentUser}/${part.id}`]=null;});
    update(ref(db),patch).then(()=>{yukiClockState=next;const used=new Set(parts.map(part=>String(part.id)));userInventory=userInventory.filter(item=>!used.has(String(item.id)));renderizarInventarioVisual(userInventory);renderizarPecasRelogioYuki();atualizarInterfaceRelogioYuki();const dialog=document.getElementById(dialogId);if(dialog?.open)dialog.close();mostrarPopupRelogio('Compartimento selado',`${parts.length} peça(s) guardada(s) no Fragmentado.`);}).catch(error=>{console.error('Falha ao guardar peças no relógio:',error);exibirStatusRelogioYuki('Não foi possível guardar as peças; nada foi removido.');});
}

async function abrirArquivoTemporalYuki(){await carregarLinhasTemporaisYuki();}

async function aprovarPropostaTemporal(requestId,request){
    if((request.targetUser!==currentUser&&!usuarioEhMestreDaMesa())||request.status!=='pending')return;const cardRef=ref(db,`grimoires/${request.targetUser}/${request.cardId}`),snap=await get(cardRef);if(!snap.exists()){exibirStatusRelogioYuki('A carta original não existe mais; a proposta não foi aplicada.');return;}const live=snap.val(),before=request.before||{};if(!mesmasVersoesTemporais(live,before)){await update(ref(db),{[`temporalRequests/${request.targetUser}/${requestId}/status`]:'conflict',[`temporalRequests/${request.targetUser}/${requestId}/updatedAt`]:Date.now()});return;}
    const revision={requestId,targetUser:request.targetUser,cardId:request.cardId,fromUser:request.fromUser,before:live,after:request.after,approvedAt:Date.now(),status:'live'};const patch={};patch[`grimoires/${request.targetUser}/${request.cardId}`]=request.after;patch[`temporalRequests/${request.targetUser}/${requestId}/status`]='approved';patch[`temporalRequests/${request.targetUser}/${requestId}/approvedAt`]=Date.now();patch[`temporalRevisions/${request.fromUser}/${request.targetUser}/${requestId}`]=revision;await update(ref(db),patch);
}
async function responderPropostaTemporal(requestId,request,approve){
    if(!approve){await update(ref(db),{[`temporalRequests/${request.targetUser}/${requestId}/status`]:'rejected',[`temporalRequests/${request.targetUser}/${requestId}/respondedAt`]:Date.now()});return;}
    try{await aprovarPropostaTemporal(requestId,request);}catch(error){console.error('Falha ao responder à proposta temporal:',error);alert('Não foi possível concluir a resposta.');}
}
function iniciarEscutaAprovacoesTemporais(){
    if(!currentUser||temporalApprovalLoadedFor===currentUser)return;temporalApprovalLoadedFor=currentUser;if(temporalApprovalUnsubscribe)temporalApprovalUnsubscribe();const master=usuarioEhMestreDaMesa(),path=master?'temporalRequests':`temporalRequests/${currentUser}`;temporalApprovalUnsubscribe=onValue(ref(db,path),snapshot=>{const raw=snapshot.val()||{},pending=[];if(master){Object.entries(raw).forEach(([target,requests])=>Object.entries(requests||{}).forEach(([id,item])=>{if(item?.status==='pending')pending.push({id,request:item});}));}else Object.entries(raw).forEach(([id,item])=>{if(item?.status==='pending')pending.push({id,request:item});});const panel=document.getElementById('temporal-approval-panel'),list=document.getElementById('temporal-approval-list');if(!panel||!list)return;list.replaceChildren();panel.classList.toggle('hidden',!pending.length);pending.forEach(({id,request})=>{const card=document.createElement('article');card.className='temporal-approval-card';const title=document.createElement('h3');title.textContent=`${request.fromUser} propõe alterar “${request.before?.nome||'carta'}” de ${request.targetUser}`;const oldText=document.createElement('p');oldText.textContent=`Antes: ${request.before?.efeito||'—'}`;const newText=document.createElement('p');newText.textContent=`Depois: ${request.after?.efeito||'—'}`;const actions=document.createElement('div');actions.className='yuki-clock-actions';const yes=document.createElement('button');yes.type='button';yes.className='btn-mystic';yes.textContent='Aprovar alteração';yes.addEventListener('click',()=>responderPropostaTemporal(id,request,true));const no=document.createElement('button');no.type='button';no.className='btn-mystic small';no.textContent='Recusar';no.addEventListener('click',()=>responderPropostaTemporal(id,request,false));actions.append(yes,no);card.append(title,oldText,newText,actions);list.appendChild(card);});});
}
function iniciarEscutaRevisoesTemporaisYuki(){if(temporalRevisionUnsubscribe)temporalRevisionUnsubscribe();temporalRevisionUnsubscribe=onValue(ref(db,`temporalRevisions/${currentUser}`),snapshot=>{yukiTemporalRevisions=snapshot.val()||{};renderizarRevisoesTemporaisYuki();});}
function renderizarRevisoesTemporaisYuki(){
    const host=document.getElementById('yuki-temporal-revisions');if(host){host.replaceChildren();const all=yukiTemporalRevisions||{};let revisions=[];Object.entries(all).forEach(([target,items])=>Object.entries(items||{}).forEach(([id,revision])=>{if(revision?.status==='live')revisions.push({target,id,revision});}));if(!revisions.length){const note=document.createElement('p');note.className='text-muted';note.textContent='Nenhum eco aprovado ainda.';host.appendChild(note);}else revisions.forEach(({target,id,revision})=>{const card=document.createElement('article');card.className='yuki-revision-card';const text=document.createElement('p');text.textContent=`${target} · ${revision.before?.nome||'carta'}: ${revision.before?.efeito||'—'} → ${revision.after?.efeito||'—'}`;const button=document.createElement('button');button.type='button';button.className='btn-mystic small';button.textContent='Retrasar / restaurar';button.disabled=document.getElementById('yuki-clock-active')?.value!=='retrasar';button.title=button.disabled?'Ative o Relógio de retrasar primeiro.':'';button.addEventListener('click',()=>reverterRevisaoTemporalYuki(target,id,revision));card.append(text,button);host.appendChild(card);});}
    const snapshots=document.getElementById('yuki-temporal-snapshots');if(snapshots){snapshots.replaceChildren();const records=[...Object.entries(yukiClockState.bookmarks||{}).map(([id,item])=>({id,item,kind:'Âncora'})),...Object.entries(yukiClockState.echoes||{}).map(([id,item])=>({id,item,kind:'Estase'}))];if(!records.length){const note=document.createElement('p');note.className='text-muted';note.textContent='Nenhum marco temporal guardado.';snapshots.appendChild(note);}else records.forEach(({id,item,kind})=>{const row=document.createElement('p');row.className='yuki-snapshot-row';row.textContent=`${kind} · ${item.card?.nome||'carta'} · linha de ${item.owner||currentUser} · ${new Date(item.savedAt||Number(id)).toLocaleString('pt-BR')}`;snapshots.appendChild(row);});}
}
async function reverterRevisaoTemporalYuki(target,id,revision){if(document.getElementById('yuki-clock-active')?.value!=='retrasar')return exibirStatusRelogioYuki('Ative o Relógio de retrasar para reverter esta carta.');if(!gastarTempoYuki('retrasar'))return;const cardRef=ref(db,`grimoires/${target}/${revision.cardId}`),snap=await get(cardRef);if(!snap.exists())return exibirStatusRelogioYuki('A carta já não existe; não foi sobrescrita.');const live=snap.val();if(!mesmasVersoesTemporais(live,revision.after))return exibirStatusRelogioYuki('A carta mudou depois da aprovação; reversão automática bloqueada para preservar a edição mais recente.');const patch={};patch[`grimoires/${target}/${revision.cardId}`]=revision.before;patch[`temporalRevisions/${currentUser}/${target}/${id}/status`]='reverted';patch[`temporalRevisions/${currentUser}/${target}/${id}/revertedAt`]=Date.now();if(revision.fromUser!==revision.targetUser)patch[`temporalRequests/${target}/${id}/status`]='reverted';try{await update(ref(db),patch);await carregarLinhasTemporaisYuki();mostrarPopupRelogio('Linha restaurada',`A carta de ${target} voltou à versão anterior.`);}catch(error){console.error(error);exibirStatusRelogioYuki('Não foi possível restaurar esta linha temporal.');}}
function selecionarPosicaoRelogioYuki(index){
    const slotIndex=((Number(index)%yukiClockOrder.length)+yukiClockOrder.length)%yukiClockOrder.length;const slot=yukiClockState.slots?.[slotIndex]||{module:yukiClockOrder[slotIndex]},type=slot.module||yukiClockOrder[slotIndex];
    yukiClockState.activeSlot=slotIndex;yukiClockState.active=type;const active=document.getElementById('yuki-clock-active');if(active)active.value=type;atualizarInterfaceRelogioYuki();salvarRelogioYuki();
    if(!yukiClockState.modules[type])exibirStatusRelogioYuki(`Hora ${rotuloHoraRelogioYuki(slotIndex)} está ligada a ${yukiClockModules[type].name}, mas esse mecanismo ainda não foi montado.`);
    abrirPopupFuncaoRelogioYuki(slotIndex);
}
let yukiQuickCardOptions=[];
function obterDescricaoFuncaoSlotYuki(index){const slot=yukiClockState.slots?.[index]||{},type=slot.module||yukiClockOrder[index],actions={calm:'Dose calmante',rejuvenate:'Rejuvenescer Yuki',advance:'Avançar um objeto',assemble:'Montar equipamento'};return type==='fragmentado'?actions[slot.fragmentedAction||'calm']:yukiClockModules[type]?.short||'Ativar mecanismo';}
function abrirPopupFuncaoRelogioYuki(index){const i=Math.max(0,Math.min(yukiClockOrder.length-1,Number(index)||0)),slot=yukiClockState.slots?.[i]||{},type=slot.module||yukiClockOrder[i],module=yukiClockModules[type],installed=!!yukiClockState.modules[type],needsCard=['acelerador','estase','eco','ancora','desvio','fratura'].includes(type),needsEdit=['acelerador','desvio'].includes(type),targetWrap=document.getElementById('yuki-function-target-wrap'),cardArea=document.getElementById('yuki-function-card-area'),editArea=document.getElementById('yuki-function-edit-area'),title=document.getElementById('yuki-function-title'),description=document.getElementById('yuki-function-description'),assigned=document.getElementById('yuki-function-assigned'),run=document.getElementById('yuki-function-run'),recipe=document.getElementById('yuki-function-recipe'),target=document.getElementById('yuki-function-target'),status=document.getElementById('yuki-function-status');
    if(title)title.textContent=`${rotuloHoraRelogioYuki(i)} · ${module.name}`;if(description)description.textContent=module.description;if(assigned)assigned.textContent=`Função desta hora: ${obterDescricaoFuncaoSlotYuki(i)}${slot.actionNote?` · Nota: ${slot.actionNote}`:''}`;
    const needsTarget=type==='retorno'||type==='aurora'||type==='crepusculo'||(type==='fragmentado'&&['advance','assemble'].includes(slot.fragmentedAction));targetWrap?.classList.toggle('hidden',!needsTarget);if(target){target.value=type==='retorno'?(yukiClockState.markedPoint||''):(document.getElementById('yuki-clock-target')?.value||'');if(targetWrap?.firstChild)targetWrap.firstChild.textContent=type==='retorno'?'Ponto de retorno':'Alvo ou local';}
    cardArea?.classList.toggle('hidden',!needsCard);editArea?.classList.toggle('hidden',!needsEdit);if(status)status.textContent=installed?(needsCard&&!yukiTemporalSelected?'Escolha uma carta aqui para continuar.':'Pronto. Pressionar “Fazer agora” executa a função.'):'Este mecanismo ainda não foi montado.';
    if(run)run.disabled=!installed||(needsCard&&!yukiTemporalSelected);if(recipe)recipe.classList.toggle('hidden',installed);if(recipe)recipe.textContent=`Abrir receita de ${module.name}`;
    if(needsEdit&&yukiTemporalSelected){document.getElementById('yuki-function-edit-name').value=yukiTemporalSelected.card?.nome||'';document.getElementById('yuki-function-edit-effect').value=yukiTemporalSelected.card?.efeito||'';document.getElementById('yuki-function-edit-recipe').value=yukiTemporalSelected.card?.receita||'';}
    if(needsCard&&yukiTemporalBooks&&Object.keys(yukiTemporalBooks).length)popularCartasPopupFuncaoYuki();
    const modal=document.getElementById('yuki-function-modal');if(modal&&!modal.open)modal.showModal();
}
function popularCartasPopupFuncaoYuki(){const select=document.getElementById('yuki-function-card-select');if(!select)return;yukiQuickCardOptions=[];select.replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='Escolha uma carta observada';select.appendChild(empty);Object.keys(yukiTemporalBooks||{}).sort((a,b)=>a.localeCompare(b,'pt-BR')).forEach(owner=>Object.entries(yukiTemporalBooks[owner]||{}).forEach(([id,card])=>{const index=yukiQuickCardOptions.push({owner,id,card})-1,option=document.createElement('option');option.value=String(index);option.textContent=`${owner} · ${card.nome||'Carta sem nome'}`;if(yukiTemporalSelected?.owner===owner&&yukiTemporalSelected?.id===id)option.selected=true;select.appendChild(option);}));}
async function carregarCartasPopupFuncaoYuki(){const button=document.getElementById('yuki-function-load-cards'),status=document.getElementById('yuki-function-status');if(button){button.disabled=true;button.textContent='Carregando…';}await carregarLinhasTemporaisYuki();popularCartasPopupFuncaoYuki();if(button){button.disabled=false;button.textContent='Atualizar cartas';}if(status)status.textContent=yukiQuickCardOptions.length?`${yukiQuickCardOptions.length} carta(s) disponíveis; escolha uma para esta função.`:'Não encontrei cartas nos grimórios carregados.';}
function fecharPopupFuncaoYuki(){document.getElementById('yuki-function-modal')?.close();}
async function executarFuncaoPopupYuki(){const type=obterSlotAtivoYuki().module||'fragmentado',needsCard=['acelerador','estase','eco','ancora','desvio','fratura'].includes(type),targetValue=document.getElementById('yuki-function-target')?.value.trim()||'';if(!yukiClockState.modules[type])return;if(needsCard&&!yukiTemporalSelected){const status=document.getElementById('yuki-function-status');if(status)status.textContent='Escolha uma carta temporal antes de continuar.';return;}const target=document.getElementById('yuki-clock-target');if(target)target.value=targetValue;
    if(type==='retorno'&&targetValue){yukiClockState.markedPoint=targetValue;await salvarRelogioYuki();atualizarInterfaceRelogioYuki();}
    if(['acelerador','desvio'].includes(type)){const name=document.getElementById('yuki-temporal-name'),effect=document.getElementById('yuki-temporal-effect'),recipe=document.getElementById('yuki-temporal-recipe');if(name)name.value=document.getElementById('yuki-function-edit-name')?.value.trim()||'';if(effect)effect.value=document.getElementById('yuki-function-edit-effect')?.value.trim()||'';if(recipe)recipe.value=document.getElementById('yuki-function-edit-recipe')?.value.trim()||'';fecharPopupFuncaoYuki();await proporDesvioTemporalYuki();return;}
    fecharPopupFuncaoYuki();await ativarRelogioYuki();}
document.getElementById('yuki-function-close')?.addEventListener('click',fecharPopupFuncaoYuki);
document.getElementById('yuki-function-modal')?.addEventListener('click',event=>{if(event.target===event.currentTarget)fecharPopupFuncaoYuki();});
document.getElementById('yuki-function-load-cards')?.addEventListener('click',carregarCartasPopupFuncaoYuki);
document.getElementById('yuki-function-card-select')?.addEventListener('change',event=>{const card=yukiQuickCardOptions[Number(event.target.value)];if(card){selecionarCartaTimelineYuki(card.owner,card.id,card.card);const type=obterSlotAtivoYuki().module;if(['acelerador','desvio'].includes(type)){document.getElementById('yuki-function-edit-name').value=card.card.nome||'';document.getElementById('yuki-function-edit-effect').value=card.card.efeito||'';document.getElementById('yuki-function-edit-recipe').value=card.card.receita||'';}}else yukiTemporalSelected=null;const type=obterSlotAtivoYuki().module,needsCard=['acelerador','estase','eco','ancora','desvio','fratura'].includes(type),installed=!!yukiClockState.modules[type];document.getElementById('yuki-function-run').disabled=!installed||(needsCard&&!yukiTemporalSelected);const status=document.getElementById('yuki-function-status');if(status)status.textContent=yukiTemporalSelected?`Selecionada: ${yukiTemporalSelected.card.nome||'Carta sem nome'} · ${yukiTemporalSelected.owner}`:'Escolha uma carta para continuar.';});
document.getElementById('yuki-function-run')?.addEventListener('click',executarFuncaoPopupYuki);
document.getElementById('yuki-function-recipe')?.addEventListener('click',()=>{const type=obterSlotAtivoYuki().module;fecharPopupFuncaoYuki();abrirReceitaRelogioYuki(type);});
function anguloToqueRelogioYuki(event,face){const rect=face.getBoundingClientRect(),dx=event.clientX-(rect.left+rect.width/2),dy=event.clientY-(rect.top+rect.height/2);return (Math.atan2(dy,dx)*180/Math.PI+90+360)%360;}
function previewAnguloRelogioYuki(angle){const normalized=((angle%360)+360)%360,index=Math.round(normalized/30)%yukiClockOrder.length,needle=document.getElementById('yuki-clock-needle'),type=yukiClockState.slots?.[index]?.module||yukiClockOrder[index];if(needle)needle.style.transform=`translateX(-50%) rotate(${normalized}deg)`;document.querySelectorAll('.yuki-clock-sector').forEach(button=>button.classList.toggle('is-preview',Number(button.dataset.clockIndex)===index));const status=document.getElementById('yuki-clock-main-action');if(status&&type)status.textContent=yukiClockState.modules[type]?`Ponteiro: ${rotuloHoraRelogioYuki(index)} · ${yukiClockModules[type].name}`:`${yukiClockModules[type].name} · ainda não montado`;}
let yukiPointerTracking=null;
const yukiClockFace=document.querySelector('.yuki-clock-face-hero');
yukiClockFace?.addEventListener('pointerdown',event=>{if(event.target.closest('.yuki-clock-sector,#yuki-clock-activate'))return;event.preventDefault();yukiPointerTracking={pointerId:event.pointerId,angle:anguloToqueRelogioYuki(event,yukiClockFace)};yukiClockFace.classList.add('is-dragging');yukiClockFace.setPointerCapture?.(event.pointerId);previewAnguloRelogioYuki(yukiPointerTracking.angle);});
yukiClockFace?.addEventListener('pointermove',event=>{if(!yukiPointerTracking||yukiPointerTracking.pointerId!==event.pointerId)return;yukiPointerTracking.angle=anguloToqueRelogioYuki(event,yukiClockFace);previewAnguloRelogioYuki(yukiPointerTracking.angle);});
yukiClockFace?.addEventListener('pointerup',event=>{if(!yukiPointerTracking||yukiPointerTracking.pointerId!==event.pointerId)return;const index=Math.round(yukiPointerTracking.angle/30)%yukiClockOrder.length;yukiPointerTracking=null;yukiClockFace.classList.remove('is-dragging');selecionarPosicaoRelogioYuki(index);});
yukiClockFace?.addEventListener('pointercancel',()=>{yukiPointerTracking=null;yukiClockFace.classList.remove('is-dragging');atualizarInterfaceRelogioYuki();});
document.getElementById('yuki-clock-active')?.addEventListener('change',event=>{yukiClockState.active=event.target.value;atualizarInterfaceRelogioYuki();salvarRelogioYuki();renderizarRevisoesTemporaisYuki();});
let yukiActionNoteSaveTimer=null;
const yukiSlotConfigList=document.getElementById('yuki-clock-slot-list');
yukiSlotConfigList?.addEventListener('change',event=>{const row=event.target.closest('[data-slot-index]');if(!row)return;const index=Number(row.dataset.slotIndex),slot=yukiClockState.slots[index];if(!slot)return;if(event.target.matches('[data-slot-module]')){slot.module=event.target.value;if(index===Number(yukiClockState.activeSlot||0))yukiClockState.active=slot.module;atualizarInterfaceRelogioYuki();renderizarConfiguracaoNumerosRelogioYuki();salvarRelogioYuki();exibirStatusRelogioYuki(`Hora ${rotuloHoraRelogioYuki(index)} agora aciona ${yukiClockModules[slot.module].name}.`);}else if(event.target.matches('[data-slot-fragment-action]')){slot.fragmentedAction=event.target.value;if(index===Number(yukiClockState.activeSlot||0))atualizarAcaoProgramadaYuki();salvarRelogioYuki();}});
yukiSlotConfigList?.addEventListener('input',event=>{if(!event.target.matches('[data-slot-note]'))return;const row=event.target.closest('[data-slot-index]'),index=Number(row?.dataset.slotIndex),slot=yukiClockState.slots[index];if(!slot)return;slot.actionNote=event.target.value.trim();if(index===Number(yukiClockState.activeSlot||0))atualizarAcaoProgramadaYuki();clearTimeout(yukiActionNoteSaveTimer);yukiActionNoteSaveTimer=setTimeout(salvarRelogioYuki,450);});
yukiSlotConfigList?.addEventListener('change',event=>{if(event.target.matches('[data-slot-note]')){clearTimeout(yukiActionNoteSaveTimer);salvarRelogioYuki();}});
document.querySelectorAll('.yuki-clock-sector').forEach(button=>button.addEventListener('click',event=>{event.stopPropagation();selecionarPosicaoRelogioYuki(Number(button.dataset.clockIndex));}));
document.getElementById('yuki-clock-activate')?.addEventListener('click',event=>{if(event.target.closest('.yuki-clock-sector'))return;ativarRelogioYuki();});
document.getElementById('yuki-clock-activate')?.addEventListener('keydown',event=>{if(event.target===event.currentTarget&&(event.key==='Enter'||event.key===' ')){event.preventDefault();ativarRelogioYuki();}});
document.getElementById('yuki-settings-open')?.addEventListener('click',()=>{atualizarInterfaceRelogioYuki();renderizarConfiguracaoNumerosRelogioYuki();document.getElementById('yuki-clock-settings-modal')?.classList.remove('hidden');document.getElementById('yuki-settings-close')?.focus();});
let yukiDiarySaveTimer=null;
function renderizarInventarioPessoalYuki(){const host=document.getElementById('yuki-inventory-items'),summary=document.getElementById('yuki-inventory-summary');if(!host)return;host.replaceChildren();if(summary)summary.textContent=`${userInventory.length} ${userInventory.length===1?'item':'itens'} na bolsa pessoal.`;if(!userInventory.length){const empty=document.createElement('p');empty.className='text-muted';empty.textContent='A bolsa está vazia.';host.appendChild(empty);return;}userInventory.forEach(item=>{const row=document.createElement('article');row.className='yuki-inventory-row';const icon=document.createElement('span');icon.textContent=item.emoji||'◇';const name=document.createElement('b');name.textContent=item.nome||'Item sem nome';const meta=document.createElement('small');meta.textContent=[item.tipo,item.quantidade?`×${item.quantidade}`:''].filter(Boolean).join(' · ')||'Pertence a Yuki';row.append(icon,name,meta);host.appendChild(row);});}
document.getElementById('yuki-open-inventory')?.addEventListener('click',()=>{renderizarInventarioPessoalYuki();document.getElementById('yuki-inventory-modal')?.showModal();});
document.getElementById('yuki-inventory-close')?.addEventListener('click',()=>document.getElementById('yuki-inventory-modal')?.close());
document.getElementById('yuki-inventory-modal')?.addEventListener('click',event=>{if(event.target===event.currentTarget)event.currentTarget.close();});
document.getElementById('yuki-open-diary')?.addEventListener('click',()=>{const input=document.getElementById('yuki-diary-text');if(input)input.value=yukiClockState.diaryText||'';document.getElementById('yuki-diary-modal')?.showModal();});
function salvarDiarioYuki(){const input=document.getElementById('yuki-diary-text'),status=document.getElementById('yuki-diary-save-status');if(!input)return;yukiClockState.diaryText=input.value;yukiClockState.diaryUpdatedAt=Date.now();if(status)status.textContent='Salvando…';salvarRelogioYuki().then(()=>{if(status)status.textContent='Diário salvo';});}
document.getElementById('yuki-diary-text')?.addEventListener('input',()=>{const status=document.getElementById('yuki-diary-save-status');if(status)status.textContent='Alterações pendentes…';clearTimeout(yukiDiarySaveTimer);yukiDiarySaveTimer=setTimeout(salvarDiarioYuki,700);});
document.getElementById('yuki-diary-save')?.addEventListener('click',salvarDiarioYuki);
document.getElementById('yuki-diary-close')?.addEventListener('click',()=>{clearTimeout(yukiDiarySaveTimer);if(document.getElementById('yuki-diary-text')?.value!==yukiClockState.diaryText)salvarDiarioYuki();document.getElementById('yuki-diary-modal')?.close();});
document.getElementById('yuki-diary-modal')?.addEventListener('click',event=>{if(event.target===event.currentTarget)event.currentTarget.close();});
yukiSlotConfigList?.addEventListener('click',event=>{const summary=event.target.closest('summary');if(!summary)return;const current=summary.closest('details');yukiSlotConfigList.querySelectorAll('details[open]').forEach(item=>{if(item!==current)item.open=false;});});
document.getElementById('yuki-settings-close')?.addEventListener('click',()=>document.getElementById('yuki-clock-settings-modal')?.classList.add('hidden'));
document.getElementById('yuki-clock-settings-modal')?.addEventListener('click',event=>{if(event.target===event.currentTarget)event.currentTarget.classList.add('hidden');});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.querySelector('dialog[open]'))document.getElementById('yuki-clock-settings-modal')?.classList.add('hidden');});
document.getElementById('yuki-clock-install')?.addEventListener('click',instalarPecasNoRelogioYuki);
document.getElementById('yuki-clock-store-parts')?.addEventListener('click',guardarPecasNoCompartimentoYuki);
document.getElementById('yuki-clock-open-storage')?.addEventListener('click',()=>{renderizarPecasCompartimentoYuki();document.getElementById('yuki-storage-modal')?.showModal();});
document.getElementById('yuki-storage-confirm')?.addEventListener('click',()=>guardarPecasNoCompartimentoYuki('yuki-storage-parts-list','yuki-storage-modal'));
document.getElementById('yuki-storage-close')?.addEventListener('click',()=>document.getElementById('yuki-storage-modal')?.close());
document.getElementById('yuki-storage-modal')?.addEventListener('click',event=>{if(event.target===event.currentTarget)event.currentTarget.close();});
document.getElementById('yuki-clock-mark')?.addEventListener('click',()=>{const point=document.getElementById('yuki-clock-target')?.value.trim();if(!point)return exibirStatusRelogioYuki('Escreva o nome ou descrição do ponto a marcar.');if(!yukiClockState.modules.retorno)return exibirStatusRelogioYuki('Monte primeiro o Relógio retorno para marcar um ponto.');if(!gastarTempoYuki('retorno'))return;yukiClockState.markedPoint=point;salvarRelogioYuki();atualizarInterfaceRelogioYuki();mostrarPopupRelogio('Ponto ancorado',`Retorno registrado: ${point}.`);});
document.getElementById('yuki-clock-load-grimoires')?.addEventListener('click',carregarLinhasTemporaisYuki);
document.getElementById('yuki-timeline-owner')?.addEventListener('change',renderizarCartasTimelineYuki);
document.getElementById('yuki-temporal-propose')?.addEventListener('click',proporDesvioTemporalYuki);
document.getElementById('yuki-temporal-clone')?.addEventListener('click',()=>ecoarCartaGrimorioYuki(false,true));
document.getElementById('yuki-recipe-close')?.addEventListener('click',()=>document.getElementById('yuki-recipe-modal')?.close());
document.getElementById('yuki-popup-continue')?.addEventListener('click',()=>{const dialog=document.getElementById('yuki-clock-popup'),death=dialog?.dataset.death==='true';if(dialog?.open)dialog.close();if(death)reiniciarCicloYuki();});
document.getElementById('yuki-recipe-modal')?.addEventListener('click',event=>{if(event.target===event.currentTarget)event.currentTarget.close();});
document.getElementById('yuki-clock-popup')?.addEventListener('click',event=>{if(event.target===event.currentTarget&&event.currentTarget.dataset.death!=='true')event.currentTarget.close();});

// Oficina do Relógio de Bolso de Yuki (definição abaixo da rotina de inventário).

// ==========================================
// 20. SISTEMA VTT AVANÇADO (API, CHAT, NPCS E MURAL)
// ==========================================

function iniciarChatAvancado() {
    const isGM = (currentUser.toLowerCase() === 'mestre' || currentUser.toLowerCase() === 'gm');
    if (isGM) {
        document.getElementById('btn-gm-chat-menu').classList.remove('hidden');
        document.getElementById('gm-upload-board').classList.remove('hidden');
        escutarNpcsSalvos();
        escutarCanaisPendentes();
        onValue(ref(db, 'canais'), renderizarAdministracaoCanais);
    }

    update(ref(db, 'canais/taverna'), { nome: 'Taverna', aprovado: true, criador: 'Sistema' });

    onValue(ref(db, 'configuracoes/destino_rolagens'), (snapshot) => {
        if (snapshot.exists()) {
            canalRolagemDestino = snapshot.val();
            if (isGM) {
                const gmSelect = document.getElementById('gm-roll-dest');
                if(gmSelect) gmSelect.value = canalRolagemDestino;
            }
        }
    });

    onValue(ref(db, 'gm_settings/chat_bg'), (snapshot) => {
        const bgContainer = document.getElementById('chat-fundo');
        if(snapshot.exists() && snapshot.val() !== "") {
            bgContainer.style.backgroundImage = `url('${snapshot.val()}')`;
        } else {
            bgContainer.style.backgroundImage = "none";
        }
    });

    onValue(ref(db, 'configuracoes/audio_ambiente'), (snapshot) => {
        const urlEmbed = snapshot.val();
        const container = document.getElementById('global-audio-container');
        const iframe = document.getElementById('youtube-player');
        if (urlEmbed) {
            container.style.display = 'block';
            if (iframe.src !== urlEmbed) iframe.src = urlEmbed;
        } else {
            container.style.display = 'none';
            iframe.src = "";
        }
    });

    

    onValue(ref(db, 'canais'), (snapshot) => {
        const lista = document.getElementById('channel-list');
        lista.innerHTML = "";
        const canaisPendentes = document.getElementById('gm-pending-list');
        const gmSelect = document.getElementById('gm-roll-dest');
        
        if(isGM) {
            canaisPendentes.innerHTML = ""; 
            gmSelect.innerHTML = ""; 
        }

        snapshot.forEach(child => {
            const canal = { id: child.key, ...child.val() };
            
            if (isGM && canal.aprovado) {
                const option = document.createElement('option');
                option.value = canal.id; option.text = canal.nome;
                gmSelect.appendChild(option);
            }
            if (!canal.aprovado && isGM) {
                canaisPendentes.innerHTML += `<button onclick="aprovarFirebase('canais/${canal.id}')" class="btn-mystic" style="font-size:0.7rem; background:#aa8800; margin:2px;">Aprovar: ${canal.nome}</button>`;
            }
            if (canal.aprovado || (canal.criador || '').toLowerCase() === currentUser.toLowerCase() || isGM) {
                const btn = document.createElement('button');
                btn.className = `channel-btn ${canal.id === canalAtual ? 'active' : ''}`;
                btn.innerText = canal.aprovado ? `# ${canal.nome}` : `⏳ ${canal.nome}`;
                btn.dataset.channelId = canal.id;
                btn.onclick = () => {
                    if(!canal.aprovado && !isGM) return alert("Aguarde o Mestre aprovar.");
                    mudarCanal(canal.id, canal.nome);
                };
                lista.appendChild(btn);
            }
        });
        if(isGM) gmSelect.value = canalRolagemDestino;
    });

    mudarCanal('taverna', 'Taverna');
    escutarMuralFitas();
}
window.aprovarFirebase = function(caminhoFirebase) {
    update(ref(db, caminhoFirebase), { aprovado: true })
        .then(() => alert("Sala aprovada e aberta para os jogadores!"))
        .catch(err => alert("Erro ao aprovar pelas correntes místicas: " + err));
}
window.abrirModalGmChat = function() { document.getElementById('modal-gm-chat-controls').style.display = 'flex'; }
window.fecharModalGmChat = function() { document.getElementById('modal-gm-chat-controls').style.display = 'none'; }

window.alterarFundoChat = function() {
    const bgUrl = document.getElementById('input-chat-bg').value.trim();
    set(ref(db, 'gm_settings/chat_bg'), bgUrl).then(() => {
        alert(bgUrl ? "Cenário Aplicado!" : "Cenário Removido!");
    });
}

function escutarNpcsSalvos() {
    onValue(ref(db, 'npcs'), (snapshot) => {
        const select = document.getElementById('select-npc-salvo');
        select.innerHTML = '<option value="">👤 Falar como Mim Mesmo</option>';
        if(snapshot.exists()) {
            npcsSalvos = snapshot.val();
            Object.keys(npcsSalvos).forEach(id => {
                select.innerHTML += `<option value="${id}">${npcsSalvos[id].nome}</option>`;
            });
        }
    });
}

window.salvarNovoNPC = function() {
    const nome = document.getElementById('novo-npc-nome').value.trim();
    const foto = document.getElementById('novo-npc-foto').value.trim();
    if(!nome) return alert("O NPC precisa ter um nome sagrado.");
    
    const npcId = nome.toLowerCase().replace(/\s+/g, '_');
    set(ref(db, `npcs/${npcId}`), { nome, foto }).then(() => {
        document.getElementById('novo-npc-nome').value = "";
        document.getElementById('novo-npc-foto').value = "";
        alert(`${nome} materializado com sucesso!`);
        setTimeout(() => document.getElementById('select-npc-salvo').value = npcId, 500);
    });
}

function configurarUploadImgBB(idFileInput, idTextInput) {
    const fileInput = document.getElementById(idFileInput);
    if (!fileInput) return;

    fileInput.setAttribute('accept', ['upload-mural', 'upload-midia'].includes(idFileInput) ? 'image/*, video/*' : 'image/*');

    fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const textInput = document.getElementById(idTextInput);
        const originalPlaceholder = textInput.placeholder;
        textInput.value = "";
        textInput.disabled = true;

        if (file.type.startsWith('video/')) {
            textInput.placeholder = "Processando vídeo... ⏳";
            
            if (file.size > 5 * 1024 * 1024) {
                alert("O vídeo é maior que 5MB. A magia não suporta arquivos tão pesados. Hospede no Drive/YouTube e cole o link!");
                textInput.disabled = false;
                textInput.placeholder = originalPlaceholder;
                e.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(uploadEvent) {
                textInput.value = uploadEvent.target.result;
                textInput.disabled = false;
                textInput.placeholder = originalPlaceholder;
            };
            reader.readAsDataURL(file);
            return;
        }

        textInput.placeholder = "Fazendo upload mágico para a nuvem... ⏳";
        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            if(data.success) {
                textInput.value = data.data.url; 
            } else {
                alert("Falha na magia de upload da ImgBB.");
            }
        } catch (err) {
            alert("As correntes místicas (Conexão) falharam.");
        }
        
        textInput.disabled = false;
        textInput.placeholder = originalPlaceholder;
        e.target.value = ''; 
    });
}
configurarUploadImgBB('upload-midia', 'chat-input');        
configurarUploadImgBB('upload-mural', 'link-arquivo');      
configurarUploadImgBB('upload-chat-bg', 'input-chat-bg');   
configurarUploadImgBB('upload-npc-foto', 'novo-npc-foto');  

window.setarResposta = function(nomeUsuario) {
    respondendoA = nomeUsuario;
    document.getElementById('reply-user').innerText = nomeUsuario.toUpperCase();
    document.getElementById('reply-preview').classList.remove('hidden');
    document.getElementById('chat-input').focus();
}

window.cancelarResposta = function() {
    respondendoA = null;
    document.getElementById('reply-preview').classList.add('hidden');
}

let contagemMensagensPorCanal = {};
function mudarCanal(idCanal, nomeCanal) {
    canalAtual = idCanal;
    document.querySelectorAll('.channel-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.innerText.includes(nomeCanal)) btn.classList.add('active');
    });

    if (unsubscribeChat) unsubscribeChat();
    
   unsubscribeChat = onValue(ref(db, `mensagens/${canalAtual}`), (snapshot) => {
    const data = snapshot.val();
    const container = document.getElementById('chat-messages');
    if (!container) return;
    container.innerHTML = ""; 
    
    const isGM = (currentUser.toLowerCase() === 'mestre' || currentUser.toLowerCase() === 'gm');
    const mensagens = [];
    snapshot.forEach(child => { mensagens.push({ id: child.key, ...child.val() }); });
    const quantidadeAnterior = contagemMensagensPorCanal[canalAtual] ?? mensagens.length;
    const novas = mensagens.slice(quantidadeAnterior);
    contagemMensagensPorCanal[canalAtual] = mensagens.length;
    const novasDeOutros = novas.filter(m => (m.remetente || '').toLowerCase() !== currentUser.toLowerCase());
    const mençõesNovas = novasDeOutros.filter(m => String(m.texto || '').toLocaleLowerCase('pt-BR').includes(`@${currentUser.toLocaleLowerCase('pt-BR')}`) || String(m.replyTo || '').toLowerCase() === currentUser.toLowerCase());
    // Notificações do chat desativadas: a interface de chat foi retirada da navegação.
    if (novasDeOutros.length) {
        const ultima = novasDeOutros[novasDeOutros.length - 1];
        document.title = `🔔 Nova mensagem — ${ultima.remetente || 'Chat'}`;
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(`Mensagem de ${ultima.remetente || 'alguém'}`, { body: String(ultima.texto || '').replace(/<[^>]*>/g, '').slice(0, 120) });
        }
        try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value = 740; gain.gain.setValueAtTime(0.0001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22); osc.start(); osc.stop(ctx.currentTime + 0.23); } catch (_) {}
    }
    mensagens.forEach(msg => {
        let tipo = 'other';
        const remetenteRaw = msg.remetente || 'Sistema';
        let nomeExibicao = remetenteRaw.toUpperCase();

        if (msg.tipo === 'roll') { 
            tipo = 'roll'; 
            nomeExibicao = '🎲 DADOS'; 
        } else if (msg.tipo === 'npc') { 
            tipo = 'npc'; 
            nomeExibicao = (msg.npcData && msg.npcData.nome) ? msg.npcData.nome.toUpperCase() : 'NPC'; 
        } else if (remetenteRaw.toLowerCase() === currentUser.toLowerCase()) { 
            tipo = 'mine'; 
        } else if (remetenteRaw.toLowerCase() === 'mestre' || remetenteRaw.toLowerCase() === 'gm') { 
            tipo = 'gm'; 
            nomeExibicao = '👑 MESTRE'; 
        }
        
        const hora = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';
        
        const textoUpper = (msg.texto || '').toUpperCase();
        const foiMarcado = textoUpper.includes(`@${currentUser.toUpperCase()}`) || (msg.replyTo && msg.replyTo.toUpperCase() === currentUser.toUpperCase());
        const htmlBolinha = foiMarcado ? `<div class="notificacao-marcado"></div>` : '';
        const htmlReply = msg.replyTo ? `<div class="reply-badge">↳ Respondendo a ${msg.replyTo.toUpperCase()}</div>` : '';
        let htmlAvatar = '';
        if (tipo === 'npc' && msg.npcData && msg.npcData.foto) {
            htmlAvatar = `<img src="${msg.npcData.foto}" class="chat-avatar-img" alt="NPC">`;
        } else if (msg.avatarLayers && Array.isArray(msg.avatarLayers) && msg.avatarLayers.length > 0) {
            htmlAvatar = `<div class="chat-avatar-container" style="position: relative; width: 45px; height: 45px; flex-shrink: 0;">`;
            msg.avatarLayers.forEach((layerUrl, index) => {
                htmlAvatar += `<img src="${layerUrl}" class="chat-avatar-layer" style="position: absolute; top:0; left:0; width:100%; height:100%; z-index: ${index + 1}; object-fit: cover; border-radius: 50%;">`;
            });
            htmlAvatar += `</div>`;
        } else if (msg.avatarUrl) {
            htmlAvatar = `<img src="${msg.avatarUrl}" class="chat-avatar-img" alt="Avatar">`;
        } else if (tipo !== 'roll' && tipo !== 'gm') {
            htmlAvatar = `<img src="https://i.imgur.com/z4bK9V3.png" class="chat-avatar-img" alt="Avatar">`;
        }

       let textoRenderizado = formatarTextoChat(msg.texto || '');
        const mediaLink = String(msg.texto || '').trim();
        if (/^data:image\/(png|jpeg|gif|webp);base64,/i.test(mediaLink)) {
            textoRenderizado = `<a href="${mediaLink}" target="_blank" rel="noopener"><img src="${mediaLink}" class="chat-media" alt="Imagem enviada" loading="lazy"></a>`;
        } else if (/^data:video\/(mp4|webm|ogg);base64,/i.test(mediaLink)) {
            textoRenderizado = `<video src="${mediaLink}" class="chat-media" controls playsinline preload="metadata"></video>`;
        } else {
            try {
                const u = new URL(mediaLink);
                if (['http:', 'https:'].includes(u.protocol) && /\.(png|jpe?g|gif|webp|avif)$/i.test(u.pathname)) textoRenderizado = `<a href="${u.href}" target="_blank" rel="noopener"><img src="${u.href}" class="chat-media" alt="Imagem enviada" loading="lazy"></a>`;
                else if (['http:', 'https:'].includes(u.protocol) && /\.(mp4|webm|ogg|mov)$/i.test(u.pathname)) textoRenderizado = `<video src="${u.href}" class="chat-media" controls playsinline preload="metadata"></video>`;
            } catch (_) {}
        }

        let htmlBalao = `${htmlBolinha}`; 
        htmlBalao += `<div style="overflow:hidden; flex: 1;">`;
        htmlBalao += `<span class="chat-header">${nomeExibicao} <span style="color:#666; font-size:0.65rem;">(${hora})</span></span>`;
        htmlBalao += `${htmlReply} <div>${textoRenderizado} ${msg.editada ? '<span class="msg-editada">(editada)</span>' : ''}</div>`;

        if (tipo !== 'roll') {
            htmlBalao += `<div class="msg-actions">`;
            if (tipo !== 'mine') {
                htmlBalao += `<span onclick="setarResposta('${remetenteRaw}')">↩️ Responder</span>`;
            }
            if (remetenteRaw.toLowerCase() === currentUser.toLowerCase() || isGM) {
                htmlBalao += `<span onclick="editarMensagem('${msg.id}', '${(msg.texto || '').replace(/'/g, "\\'")}')">✏️ Edit</span>`;
                htmlBalao += `<span onclick="apagarMensagem('${msg.id}')">🗑️ Del</span>`;
            }
            htmlBalao += `</div>`;
        }
        htmlBalao += `</div>`;

        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg-wrapper ${tipo}${foiMarcado ? ' msg-marcada' : ''}`;
        msgDiv.dataset.messageId = msg.id;
        msgDiv.innerHTML = htmlAvatar + `<div class="chat-msg ${tipo}">${htmlBalao}</div>`;

        container.appendChild(msgDiv);
    });

    container.scrollTop = container.scrollHeight;
});
}

// ==========================================
// E. ENVIO DE MENSAGENS COMPLETO
// ==========================================
let ultimoEnterTime = 0;

window.enviarMensagemCompleta = function() {
    if (jogadorSilenciado) return;
    const input = document.getElementById('chat-input');
    const texto = input.value.trim();
    if (!texto || !currentUser) return;

    const npcSelect = document.getElementById('select-npc-salvo');
    const npcAtivoId = npcSelect ? npcSelect.value : null;
    let dadosNpc = null;

    if (npcAtivoId && npcsSalvos[npcAtivoId]) {
        dadosNpc = npcsSalvos[npcAtivoId];
    }

    let avatarLayers = [];
    if (typeof fichaAtual !== 'undefined' && fichaAtual && fichaAtual.avatares) {
        if (fichaAtual.avatares['saudavel']) avatarLayers.push(fichaAtual.avatares['saudavel']);

        let eFisico = fichaAtual.estadoFisico || 'saudavel';
        let eMental = fichaAtual.estadoMental || 'sao';

        if (eFisico !== 'saudavel' && fichaAtual.avatares[eFisico]) avatarLayers.push(fichaAtual.avatares[eFisico]);
        if (eMental !== 'sao' && fichaAtual.avatares[eMental]) avatarLayers.push(fichaAtual.avatares[eMental]);
    }

    if (dadosNpc && dadosNpc.foto) {
        avatarLayers = [dadosNpc.foto];
    }

    push(ref(db, `mensagens/${canalAtual}`), {
        remetente: currentUser,
        tipo: dadosNpc ? 'npc' : 'chat',
        npcData: dadosNpc,
        texto: texto,
        replyTo: respondendoA,
        avatarUrl: avatarLayers[0] || '',
        avatarLayers: avatarLayers,
        timestamp: Date.now(),
        editada: false
    });

    input.value = "";
    cancelarResposta();
}

const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send-chat');

if (chatInput) {
    chatInput.addEventListener('keydown', function(e) {
        if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
        const now = Date.now();
        if (now - ultimoEnterTime <= 650 && this.value.trim()) {
            e.preventDefault();
            // Remove newline inserted by first Enter, then send exactly once.
            const text = this.value.replace(/\n+$/, '').trim();
            ultimoEnterTime = 0;
            this.value = text;
            window.enviarMensagemCompleta();
        } else {
            ultimoEnterTime = now;
            // Let the first Enter insert a newline. If no second Enter follows, keep the newline.
        }
    });
    chatInput.addEventListener('input', () => { if (!chatInput.value) ultimoEnterTime = 0; });
}



// ==========================================
// F. MURAL DE FITAS (ARQUIVOS DO MESTRE)
// ==========================================
window.postarArquivoMestre = function() {
    const titulo = document.getElementById('titulo-arquivo').value.trim();
    const link = document.getElementById('link-arquivo').value.trim();
    if(!titulo || !link) return alert("Preencha título e link do artefato!");
    const linkSeguro = /^data:(image\/(png|jpeg|gif|webp)|video\/(mp4|webm|ogg));base64,/i.test(link);
    if (!linkSeguro) { try { const u = new URL(link); if (!["http:", "https:"].includes(u.protocol)) throw new Error(); } catch { return alert("Informe um link http(s) válido ou um arquivo de imagem/vídeo compatível."); } }
    
    push(ref(db, 'tapes'), { titulo, link, data: Date.now(), autor: currentUser }).then(() => {
        document.getElementById('titulo-arquivo').value = "";
        document.getElementById('link-arquivo').value = "";
        alert("Fita arquivada no mural com sucesso!");
    });
};

window.apagarArquivoMural = function(id) {
    if(confirm("Deseja destruir esta fita?")) remove(ref(db, `tapes/${id}`));
}

// ==========================================
// G. FORMATAÇÃO DE TEXTO DO CHAT E FUNÇÕES AUXILIARES FALTANTES
// ==========================================
function formatarTextoChat(texto) {
    if (!texto) return '';
    let value = String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // WhatsApp-style: fenced/inline monospace, bold, italic, strikethrough, quote, bullets, numbered lists.
    value = value.replace(/```([\s\S]+?)```/g, '<code class="wa-mono">$1</code>');
    value = value.replace(/`([^`\n]+)`/g, '<code class="wa-mono">$1</code>');
    value = value.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');
    value = value.replace(/_([^_\n]+)_/g, '<em>$1</em>');
    value = value.replace(/~([^~\n]+)~/g, '<del>$1</del>');
    value = value.replace(/^&gt;\s?(.*)$/gm, '<blockquote class="wa-quote">$1</blockquote>');
    value = value.replace(/^[-•]\s+(.+)$/gm, '<span class="wa-bullet">• $1</span>');
    value = value.replace(/^\d+[.)]\s+(.+)$/gm, '<span class="wa-numbered">$&</span>');
    return value.replace(/\n/g, '<br>');
}

function rolarParaFundo() {
    const container = document.getElementById('chat-messages');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

function embaralharInsanidade(texto) {
    return embaralharAcoes(texto);
}

function obterCorBalao(user) {
    // Retorna uma cor padrão se não houver um sistema de cores implementado ainda
    return "#333333";
}

window.editarMensagem = function(id, textoAtual) {
    const novoTexto = prompt("Edite sua mensagem:", textoAtual);
    if (novoTexto !== null && novoTexto.trim() !== "") {
        update(ref(db, `mensagens/${canalAtual}/${id}`), {
            texto: novoTexto.trim(),
            editada: true
        }).catch(err => console.error("Erro ao editar:", err));
    }
}

window.apagarMensagem = function(id) {
    if (confirm("Tem certeza que deseja apagar esta mensagem?")) {
        remove(ref(db, `mensagens/${canalAtual}/${id}`));
    }
}

function obterPreviewArquivo(link, titulo) {
    let url; try { url = new URL(link); } catch { return document.createTextNode('Link inválido'); }
    if (url.protocol === 'data:' && /^data:image\/(png|jpeg|gif|webp);base64,/i.test(link)) { const im = document.createElement('img'); im.src = link; im.alt = titulo; im.className = 'media-preview'; return im; }
    if (url.protocol === 'data:' && /^data:video\/(mp4|webm|ogg);base64,/i.test(link)) { const v = document.createElement('video'); v.src = link; v.controls = true; v.playsInline = true; v.className = 'media-preview'; return v; }
    if (!['http:', 'https:'].includes(url.protocol)) return document.createTextNode('Link não permitido');
    const lower = url.pathname.toLowerCase();
    if (/\.(png|jpe?g|gif|webp|avif)$/.test(lower)) {
        const img = document.createElement('img'); img.src = url.href; img.alt = titulo; img.loading = 'lazy'; img.className = 'media-preview'; img.onerror = () => { const fallback = document.createElement('a'); fallback.href = url.href; fallback.target = '_blank'; fallback.rel = 'noopener noreferrer'; fallback.textContent = `Imagem indisponível no servidor externo — abrir link ↗`; img.replaceWith(fallback); }; return img;
    }
    if (/\.(mp4|webm|ogg|mov)$/.test(lower)) {
        const video = document.createElement('video'); video.src = url.href; video.controls = true; video.preload = 'metadata'; video.className = 'media-preview'; return video;
    }
    let embedUrl = '';
    if (/(^|\.)youtu\.be$|youtube\.com$/.test(url.hostname)) {
        const id = url.hostname.includes('youtu.be') ? url.pathname.split('/').filter(Boolean)[0] : (url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop());
        if (id && /^[\w-]{6,}$/.test(id)) embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;
    } else if (url.hostname.endsWith('vimeo.com')) {
        const id = url.pathname.split('/').filter(Boolean).pop();
        if (id && /^\d+$/.test(id)) embedUrl = `https://player.vimeo.com/video/${id}`;
    } else if (url.hostname.endsWith('drive.google.com') || url.hostname.endsWith('docs.google.com')) {
        const match = url.pathname.match(/\/file\/d\/([^/]+)/) || url.pathname.match(/\/document\/d\/([^/]+)/);
        const id = match?.[1] || url.searchParams.get('id');
        if (id) embedUrl = `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`;
    }
    if (embedUrl) {
        const wrap = document.createElement('div'); wrap.className = 'video-embed-wrap';
        const frame = document.createElement('iframe'); frame.src = embedUrl; frame.title = titulo; frame.allow = 'fullscreen; picture-in-picture'; frame.loading = 'lazy'; frame.referrerPolicy = 'strict-origin-when-cross-origin'; frame.className = 'media-preview video-frame';
        wrap.appendChild(frame);
        const fallback = document.createElement('a'); fallback.href = url.href; fallback.target = '_blank'; fallback.rel = 'noopener noreferrer'; fallback.textContent = 'Se o player for bloqueado, abrir o vídeo em nova aba ↗'; wrap.appendChild(fallback);
        return wrap;
    }
    const linkEl = document.createElement('a'); linkEl.href = url.href; linkEl.target = '_blank'; linkEl.rel = 'noopener noreferrer'; linkEl.textContent = `📎 Abrir arquivo: ${titulo}`; return linkEl;
}

let unsubscribeMural = null;
function iniciarEscutaMuralUmaVez() {
    if (unsubscribeMural) return;
    escutarMuralFitas();
}

function escutarMuralFitas() {
    const containerInicial = document.getElementById('mural-fitas-container');
    if (!containerInicial) return;
    containerInicial.innerHTML = "<span class='text-muted'>Carregando arquivos…</span>";
    unsubscribeMural = onValue(ref(db, 'tapes'), (snapshot) => {
        const container = document.getElementById('mural-fitas-container');
        if (!container) return;
        container.replaceChildren();
        if (!snapshot.exists()) { container.innerHTML = "<span class='text-muted'>Mural vazio.</span>"; return; }
        snapshot.forEach(item => {
            const fita = item.val() || {};
            const card = document.createElement('article'); card.className = 'fita-item';
            const title = document.createElement('h3'); title.textContent = fita.titulo || 'Arquivo sem título'; card.appendChild(title);
            card.appendChild(obterPreviewArquivo(fita.link || '', fita.titulo || 'Arquivo'));
            const date = document.createElement('small'); date.textContent = fita.data ? new Date(fita.data).toLocaleString('pt-BR') : ''; card.appendChild(date);
            if (['mestre', 'gm'].includes((currentUser || '').toLowerCase()) || fita.autor === currentUser) {
                const del = document.createElement('button'); del.className = 'btn-mystic compact danger'; del.textContent = 'Excluir'; del.onclick = () => window.apagarArquivoMural(item.key); card.appendChild(del);
            }
            container.appendChild(card);
        });
    }, (error) => {
        console.error('Falha ao carregar o mural de arquivos:', error);
        const container = document.getElementById('mural-fitas-container');
        if (container) container.innerHTML = "<p class='text-muted'>Não foi possível carregar os arquivos. Confira a conexão e as regras de leitura do Firebase.</p>";
    });
}

window.aprovarFirebase = function(path) {
    update(ref(db, path), { aprovado: true }).then(() => {
        alert("Aprovado com sucesso!");
    });
}

// ==========================================
// 20. MODAL DE RESULTADO DE ATRIBUTO
// ==========================================
function mostrarTelinhaRolagem(atributo, resultado, detalhe) {
    // Remove o modal se já existir um aberto
    let modalExistente = document.getElementById('modal-rolagem-attr');
    if (modalExistente) modalExistente.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-rolagem-attr';
    
    // Estilização do modal via CSS inline
    modal.style.cssText = `
        position: fixed; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -50%); 
        background: rgba(20, 20, 20, 0.98); 
        border: 2px solid #c9b037; 
        padding: 25px; 
        border-radius: 8px; 
        z-index: 9999; 
        color: white; 
        text-align: center; 
        min-width: 280px; 
        box-shadow: 0 0 25px rgba(0,0,0,0.9); 
        font-family: sans-serif;
    `;

    // Configuração do texto para o WhatsApp
    const textoZap = `🎲 *Teste de ${atributo} (${currentUser})* 🎲\n\nResultado Final: *${resultado}*\nDetalhes: _${detalhe}_\n\n🔮 _Enviado do Grimório Vivo_`;
    const urlZap = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoZap)}`;

    modal.innerHTML = `
        <h3 style="color: #c9b037; margin-top: 0; margin-bottom: 15px;">Teste de ${atributo}</h3>
        <div style="font-size: 4rem; font-weight: bold; margin: 15px 0; text-shadow: 0 0 15px rgba(201, 176, 55, 0.6);">${resultado}</div>
        <p style="font-size: 0.9rem; color: #ccc; margin-bottom: 15px;">${detalhe}</p>
        <p style="font-size: 0.85rem; color: #4CAF50; font-weight: bold;">✅ Enviado ao Akasha (Chat)!</p>
        
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 25px;">
            <button onclick="window.open('${urlZap}', '_blank')" style="background: #25D366; color: white; border: none; padding: 12px; border-radius: 4px; cursor: pointer; font-weight: bold; flex: 1;">
                📱 Enviar WhatsApp
            </button>
            <button onclick="this.parentElement.parentElement.remove()" style="background: #333; color: white; border: 1px solid #555; padding: 12px 20px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                Fechar
            </button>
        </div>
    `;

    document.body.appendChild(modal);
}
// ==========================================
// 21. CONTROLE DINÂMICO DE SANIDADE (GM)
// ==========================================
function injetarBotaoSanidadeGM() {
    // Tenta injetar apenas quando o painel do GM for ativado
    const gmControls = document.getElementById('gm-controls');
    if (gmControls && !document.getElementById('btn-gm-sanidade')) {
        const btnSanidade = document.createElement('button');
        btnSanidade.id = 'btn-gm-sanidade';
        btnSanidade.className = 'btn-mystic';
        btnSanidade.style.cssText = 'background: #4B0082; color: white; width: 100%; padding: 10px; margin-top: 10px; border-radius: 4px; border: 1px solid #9932CC; font-weight: bold; cursor: pointer;';
        btnSanidade.innerText = '🧠 Alterar Sanidade';
        
        btnSanidade.onclick = async () => {
            const alvo = document.getElementById('gm-select-alvo').value;
            if (!alvo) return alert("Selecione um alvo na lista!");
            
            const charRef = ref(db, `characters/${alvo}`);
            const snapshot = await get(charRef);
            if (!snapshot.exists()) return alert("Personagem não encontrado.");
            
            const dados = snapshot.val();
            const sanidadeAtual = dados.sanidade !== undefined ? dados.sanidade : 100;
            
            const inputNovo = prompt(`A Sanidade atual de ${alvo.toUpperCase()} é ${sanidadeAtual}.\nDigite o novo valor (0 a 100):`, sanidadeAtual);
            
            if (inputNovo !== null && !isNaN(inputNovo) && inputNovo !== "") {
                let valorFinal = parseInt(inputNovo);
                if (valorFinal < 0) valorFinal = 0;
                if (valorFinal > 100) valorFinal = 100;
                
                update(charRef, { sanidade: valorFinal }).then(() => {
                    alert(`Sanidade de ${alvo.toUpperCase()} alterada para ${valorFinal}/100.`);
                    
                    let msg = `🧠 **SANIDADE ALTERADA: ${alvo.toUpperCase()}**\nO limite mental de ${alvo.toUpperCase()} mudou para ${valorFinal}/100.`;
                    if (valorFinal <= 30) {
                        msg += `\n\n⚠️ *"As barreiras da mente se partem. Os piores pesadelos começam a vazar para a realidade..."*`;
                    }
                    if (typeof window.enviarMensagemChat === "function") window.enviarMensagemChat(msg, 'roll', 'O Mestre', true);
                });
            }
        };
        
        gmControls.appendChild(btnSanidade);
    }
}

// Observa mudanças para injetar o botão de sanidade quando o GM logar
setInterval(injetarBotaoSanidadeGM, 2000);
window.abrirMenuCanais = function() {
    abrirModalGmChat();
};

window.gerenciarCanalGm = function() {
    if (!['mestre', 'gm'].includes((currentUser || '').toLowerCase()) && !isMasterAuthenticated) {
        alert('Somente o Mestre pode administrar os canais.');
        return;
    }
    abrirModalGmChat();
};

window.abrirModalAudio = function() {
    document.getElementById('audio-modal').style.display = 'flex';
};

window.fecharModalAudio = function() {
    document.getElementById('audio-modal').style.display = 'none';
};

// Define para qual canal os resultados dos dados serão enviados.
// Essa função é chamada pelo onchange do seletor do Mestre no HTML.
window.mudarDestinoRolagens = async function(canalId) {
    const select = document.getElementById('gm-roll-dest');
    if (!canalId) return;

    try {
        const canalSnapshot = await get(ref(db, `canais/${canalId}`));
        if (!canalSnapshot.exists() || canalSnapshot.val().aprovado !== true) {
            if (select) select.value = canalRolagemDestino;
            alert('Esse canal não existe ou ainda não foi aprovado.');
            return;
        }

        await set(ref(db, 'configuracoes/destino_rolagens'), canalId);
        canalRolagemDestino = canalId;
    } catch (error) {
        console.error('Não foi possível salvar o canal das rolagens:', error);
        if (select) select.value = canalRolagemDestino;
        alert('Falha ao salvar o destino das rolagens. Verifique a conexão e as regras do Firebase.');
    }
};

// Restaura o título e limpa o indicador ao voltar para o site/chat.
document.addEventListener('visibilitychange', () => { if (!document.hidden) { document.title = 'O Grimório Vivo'; } });

// ==========================================
// MESA DE HABILIDADES
// ==========================================
let cartasNaMesa = [];
let mesaOwnerConectado = '';
const CAMINHO_MESA_GRUPO = 'mesas/grimorio/mesaAtiva/cartas';
const CAMINHO_ESTADO_PARTIDA = 'mesas/grimorio/mesaAtiva/estado';
const CAMINHO_RAIZ_PARTIDA = 'mesas/grimorio/mesaAtiva';
const CACHE_MESA_GRUPO = 'grimorio-mesa-compartilhada-v1';
let cartasMesaCompartilhada = [];
let pararEscutaMesaCompartilhada = null;
let pararEscutaEstadoPartida = null;
let estadoPartidaCartas = { status:'preparacao', ordem:[], turno:0, indice:0, jogadorAtivo:'', cartaJogada:false, corTopo:'' };
let maoCartaIds = [];
let pararEscutaMao = null;
const LIMITE_MAO_CARTAS = 5;
function usuarioEhMestreDaMesa() { return ['mestre','gm','submestre_id'].includes((currentUser||'').toLowerCase()) || isMasterAuthenticated; }
function chaveCacheMao() { return `grimorio-mao-${currentUser||'visitante'}`; }
function caminhoMaoFirebase() { return `characters/${currentUser}/maoCartas`; }
function salvarMaoCartas() { try { localStorage.setItem(chaveCacheMao(),JSON.stringify(maoCartaIds)); } catch {} }
function persistirMaoCartas() { salvarMaoCartas(); const mapa=Object.fromEntries(maoCartaIds.map(id=>[id,true])); if(currentUser)set(ref(db,caminhoMaoFirebase()),mapa).catch(error=>console.warn('Mão guardada localmente; Firebase recusou a sincronização:',error)); renderizarMaoCartas();renderizarCards(userGrimoire); }
function carregarMaoCartas() { try { const cache=JSON.parse(localStorage.getItem(chaveCacheMao())||'[]');maoCartaIds=Array.isArray(cache)?cache.map(String):[]; } catch {maoCartaIds=[];} renderizarMaoCartas(); if(pararEscutaMao)pararEscutaMao(); if(!currentUser)return; pararEscutaMao=onValue(ref(db,caminhoMaoFirebase()),snapshot=>{const data=snapshot.val(); if(data&&typeof data==='object'){maoCartaIds=Array.isArray(data)?data.map(String):Object.keys(data).filter(id=>data[id]);salvarMaoCartas();} else if(maoCartaIds.length){persistirMaoCartas();}renderizarMaoCartas();renderizarCards(userGrimoire);},error=>console.warn('Mão sincronizada apenas neste dispositivo:',error)); }
function alternarCartaNaMao(carta) { const id=String(carta.id||'');if(!id)return;const index=maoCartaIds.indexOf(id);if(index>=0)maoCartaIds.splice(index,1);else{if(maoCartaIds.length>=LIMITE_MAO_CARTAS){const feedback=document.getElementById('hand-feedback');if(feedback)feedback.textContent='Sua mão está cheia. Retire uma carta antes de trocar.';atualizarStatusMesa('Mão cheia · retire uma carta antes de adicionar outra.','offline');return;}maoCartaIds.push(id);}persistirMaoCartas(); }
function removerCartaDaMao(id) { maoCartaIds=maoCartaIds.filter(item=>item!==String(id));persistirMaoCartas(); }
function renderizarMaoCartas() { const hand=document.getElementById('hand-cards'),preview=document.getElementById('hand-preview');const cards=maoCartaIds.map(id=>userGrimoire.find(card=>String(card.id)===id)).filter(Boolean);const count=`${maoCartaIds.length}/${LIMITE_MAO_CARTAS}`;['hand-summary-count','hand-count-large'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=count;});const tabCount=document.getElementById('hand-tab-count');if(tabCount)tabCount.textContent=String(maoCartaIds.length);if(preview){preview.replaceChildren();preview.classList.add('card-fan');if(!cards.length){const p=document.createElement('p');p.className='fan-empty';p.textContent='Abra o grimório e escolha até cinco cartas.';preview.appendChild(p);}cards.slice(0,LIMITE_MAO_CARTAS).forEach((card,i,arr)=>{const button=document.createElement('button');button.type='button';button.className=`hand-fan-card ${String(card.cor||'mescla').toLowerCase()}`;button.textContent=card.nome||'Carta';button.title=`${card.nome||'Carta'} · toque para ver/usar ou arraste até seu lado da mesa`;button.draggable=true;button.dataset.cardId=String(card.id||card.nome);const offset=(i-(arr.length-1)/2)*35;button.style.left=`calc(50% + ${offset}px)`;button.style.transform=`translateX(-50%) rotate(${(i-(arr.length-1)/2)*7}deg)`;button.style.zIndex=String(i+1);button.addEventListener('dragstart',e=>{e.dataTransfer?.setData('text/plain',String(card.id||card.nome));if(e.dataTransfer)e.dataTransfer.effectAllowed='move';});button.addEventListener('click',()=>{if(Date.now()<(button._suppressClickUntil||0))return;abrirModalView(card);});configurarArrasteToqueDaMao(button,card);preview.appendChild(button);});}if(!hand)return;hand.replaceChildren();if(!cards.length){const empty=document.createElement('p');empty.className='hand-empty';empty.textContent='Sua mão está vazia. Abra “Coleção” e adicione cartas; você pode trocar a seleção quando quiser.';hand.appendChild(empty);return;}cards.forEach(card=>{const article=document.createElement('article');article.className=`hand-card ${card.cor||'mescla'}`;const badge=document.createElement('span');badge.className='hand-card-color';badge.textContent=(card.cor||'arcana').toUpperCase();const title=document.createElement('h4');title.textContent=card.nome||'Carta';const effect=document.createElement('p');effect.textContent=card.efeito||'';const actions=document.createElement('div');actions.className='hand-card-actions';const view=document.createElement('button');view.type='button';view.textContent='Ver / usar';view.onclick=()=>abrirModalView(card);const place=document.createElement('button');place.type='button';place.textContent=usuarioEhMestreDaMesa()?'Preparar evento':'Jogar carta';place.onclick=()=>usuarioEhMestreDaMesa()?colocarCartaNaMesaCompartilhada(card):jogarCartaDaMao(card);const swap=document.createElement('button');swap.type='button';swap.className='hand-remove';swap.textContent='Trocar';swap.title='Retirar esta carta da mão';swap.onclick=()=>removerCartaDaMao(card.id);actions.append(view,place,swap);article.append(badge,title,effect,actions);hand.appendChild(article);}); }
function atualizarStatusMesa(texto, estado='') { const el=document.getElementById('shared-table-status'); if(el){el.textContent=texto;el.dataset.state=estado;} }
function salvarCacheMesaCompartilhada() { try { localStorage.setItem(CACHE_MESA_GRUPO,JSON.stringify(cartasMesaCompartilhada)); } catch {} }
function carregarMesaCompartilhada() {
    try { const cache=JSON.parse(localStorage.getItem(CACHE_MESA_GRUPO)||'[]'); if(Array.isArray(cache)){cartasMesaCompartilhada=cache;renderizarMesaCompartilhada();} } catch {}
    if(pararEscutaMesaCompartilhada) pararEscutaMesaCompartilhada();
    atualizarStatusMesa('Conectando à mesa…','connecting');
    pararEscutaMesaCompartilhada=onValue(ref(db,CAMINHO_MESA_GRUPO),snapshot=>{
        const data=snapshot.val()||{};
        cartasMesaCompartilhada=Object.entries(data).map(([id,card])=>({...card,id})).sort((a,b)=>(a.criadaEm||0)-(b.criadaEm||0));
        salvarCacheMesaCompartilhada();renderizarMesaCompartilhada();atualizarStatusMesa('● Ao vivo · compartilhada','online');
    },error=>{
        console.warn('Não foi possível sincronizar a mesa compartilhada:',error);
        try { const cache=JSON.parse(localStorage.getItem(CACHE_MESA_GRUPO)||'[]');cartasMesaCompartilhada=Array.isArray(cache)?cache:[]; } catch {cartasMesaCompartilhada=[];}
        renderizarMesaCompartilhada();atualizarStatusMesa('Offline · mesa local neste aparelho','offline');
    });
    if(pararEscutaEstadoPartida)pararEscutaEstadoPartida();
    pararEscutaEstadoPartida=onValue(ref(db,CAMINHO_ESTADO_PARTIDA),snapshot=>{estadoPartidaCartas=snapshot.val()||{status:'preparacao',ordem:[],turno:0,indice:0,jogadorAtivo:'',cartaJogada:false,corTopo:''};renderizarEstadoTurno();},error=>{console.warn('Estado dos turnos não sincronizado:',error);renderizarEstadoTurno();});
}
function renderizarEstadoTurno(){
    const state=estadoPartidaCartas||{},ongoing=state.status==='em_andamento',activeId=state.jogadorAtivo||'',active=(state.ordem||[]).find(item=>(item.id||item)===activeId),name=active?.nome||activeId||'Aguardando o Mestre';
    const nameEl=document.getElementById('active-player-name'),detail=document.getElementById('turn-detail'),end=document.getElementById('btn-end-turn'),draw=document.getElementById('btn-draw-card');
    if(nameEl)nameEl.textContent=ongoing?name:'Aguardando o Mestre';
    if(detail)detail.textContent=ongoing?`Turno ${state.turno||1} · ${state.cartaJogada?'Ação feita · encerre o turno.':state.corTopo?`Cor ativa: ${state.corTopo} · jogue da mão ou compre.`:'Jogue uma carta ou compre 1.'}`:'O Mestre inicia e define a ordem dos jogadores.';
    const top=document.getElementById('top-card-display');if(top){top.replaceChildren();const activeCard=state.cartaAtiva;if(activeCard){top.className=`top-card-display ${activeCard.cor||'mescla'}`;const icon=document.createElement('span');icon.textContent=activeCard.cor==='vermelha'?'🔥':activeCard.cor==='azul'?'🌊':activeCard.cor==='amarela'?'☀️':'✦';const title=document.createElement('b');title.textContent=activeCard.nome||'Carta';const owner=document.createElement('em');owner.textContent=`${activeCard.jogador||''} · ${activeCard.resultado??''}`;top.append(icon,title,owner);}else{top.className='top-card-display';const icon=document.createElement('span');icon.textContent='?';const title=document.createElement('b');title.textContent=ongoing?'Aguardando jogada':'Sem carta';const owner=document.createElement('em');owner.textContent=state.corTopo?`Cor ativa · ${state.corTopo}`:'Jogue para abrir a pilha';top.append(icon,title,owner);}}
    const canControl=ongoing&&(usuarioEhMestreDaMesa()||activeId===currentUser);
    if(end){end.disabled=!canControl;end.textContent=usuarioEhMestreDaMesa()?'Avançar turno':'Encerrar turno';}
    if(draw)draw.disabled=!ongoing||activeId!==currentUser||!!state.cartaJogada||maoCartaIds.length>=LIMITE_MAO_CARTAS;
    const gmFeedback=document.getElementById('master-game-feedback');if(gmFeedback&&ongoing)gmFeedback.textContent=`Turno ${state.turno||1} · ${name} joga agora${state.corTopo?` · cor ativa ${state.corTopo}`:''}.`;
}
async function iniciarPartidaDeCartas(){
    const feedback=document.getElementById('master-game-feedback');const say=t=>{if(feedback)feedback.textContent=t;};if(!usuarioEhMestreDaMesa())return;
    try{const snap=await get(ref(db,'characters')),raw=snap.val()||{},gmIds=new Set(['mestre','gm','submestre_id']);const order=Object.entries(raw).filter(([id])=>!gmIds.has(id.toLowerCase())).map(([id,char])=>({id,nome:char.nome||id}));
        if(!order.length)return say('Cadastre as fichas dos jogadores antes de iniciar a partida.');
        const old=await get(ref(db,CAMINHO_MESA_GRUPO)),existing=old.val()||{},masterCards=Object.fromEntries(Object.entries(existing).filter(([,card])=>card.lado==='mestre'));
        if(Object.keys(existing).some(([,card])=>card.lado==='jogadores')&&!confirm('Iniciar nova partida? As jogadas anteriores dos jogadores serão recolhidas; os eventos do Mestre ficam.'))return;
        await set(ref(db,CAMINHO_MESA_GRUPO),masterCards);
        const game={status:'em_andamento',ordem:order,indice:0,jogadorAtivo:order[0].id,turno:1,cartaJogada:false,corTopo:'',cartaAtiva:null,ultimaCarta:'',ultimoJogador:'',ultimaAcao:'inicio',idPartida:String(Date.now())};
        await set(ref(db,CAMINHO_ESTADO_PARTIDA),game);cartasMesaCompartilhada=Object.entries(masterCards).map(([id,card])=>({...card,id}));renderizarMesaCompartilhada();estadoPartidaCartas=game;renderizarEstadoTurno();say(`Partida iniciada. Primeiro turno: ${order[0].nome}.`);
    }catch(error){console.error(error);say('Não foi possível iniciar. Confira as permissões Firebase da mesa compartilhada.');}
}
async function encerrarTurnoPartida(){
    const result=await runTransaction(ref(db,CAMINHO_ESTADO_PARTIDA),current=>{if(!current||current.status!=='em_andamento')return;const order=current.ordem||[];if(!order.length)return;const active=current.jogadorAtivo;if(!usuarioEhMestreDaMesa()&&active!==currentUser)return;const index=Math.max(0,Number(current.indice)||0),next=(index+1)%order.length,nextId=order[next]?.id||order[next];return {...current,indice:next,jogadorAtivo:nextId,turno:(Number(current.turno)||1)+(next===0?1:0),cartaJogada:false,ultimaAcao:'turno encerrado'};});
    if(!result.committed){atualizarStatusMesa('Não é sua vez de encerrar o turno.','offline');return false;}estadoPartidaCartas=result.snapshot.val();renderizarEstadoTurno();return true;
}
async function comprarCartaDoBaralho(){
    if(estadoPartidaCartas.status!=='em_andamento'||estadoPartidaCartas.jogadorAtivo!==currentUser||estadoPartidaCartas.cartaJogada)return;
    if(maoCartaIds.length>=LIMITE_MAO_CARTAS)return atualizarStatusMesa('Sua mão está cheia. Jogue ou troque uma carta.','offline');
    const options=userGrimoire.filter(card=>card.id&&!maoCartaIds.includes(String(card.id)));if(!options.length)return atualizarStatusMesa('Não há cartas disponíveis na coleção para comprar.','offline');
    const carta=options[Math.floor(Math.random()*options.length)];
    const result=await runTransaction(ref(db,CAMINHO_ESTADO_PARTIDA),current=>{if(!current||current.status!=='em_andamento'||current.jogadorAtivo!==currentUser||current.cartaJogada)return;return {...current,cartaJogada:true,ultimaAcao:`${currentUser} comprou uma carta`};});
    if(!result.committed)return atualizarStatusMesa('O turno mudou antes da compra.','offline');
    maoCartaIds.push(String(carta.id));persistirMaoCartas();estadoPartidaCartas=result.snapshot.val();renderizarEstadoTurno();atualizarStatusMesa(`${carta.nome} comprada. Turno encerrado.`,'online');await encerrarTurnoPartida();
}
function jogarCartaDaMao(carta){
    const state=estadoPartidaCartas;if(state.status!=='em_andamento')return atualizarStatusMesa('A partida ainda não começou. Aguarde o Mestre.','offline');
    if(state.jogadorAtivo!==currentUser)return atualizarStatusMesa(`Ainda não é sua vez. Jogador ativo: ${state.jogadorAtivo}.`,'offline');
    if(state.cartaJogada)return atualizarStatusMesa('Você já jogou neste turno. Encerre o turno.','offline');
    if(state.corTopo&&!['mescla','preta','branca'].includes(carta.cor)&&carta.cor!==state.corTopo)return atualizarStatusMesa(`A cor ativa é ${state.corTopo}. Jogue uma carta dessa cor ou uma coringa.`, 'offline');
    if(!maoCartaIds.includes(String(carta.id)))return atualizarStatusMesa('Essa carta não está na sua mão.','offline');
    callbackJogoCarta=(original,rolagem)=>registrarJogadaDeCarta(original,rolagem);abrirModalView(carta);
}
async function registrarJogadaDeCarta(carta,rolagem){
    const key=push(ref(db,CAMINHO_MESA_GRUPO)).key,wild=['mescla','preta','branca'].includes(carta.cor),played={id:key,sourceId:String(carta.id),nome:carta.nome||'Carta',cor:carta.cor||'mescla',efeito:carta.efeito||'',receita:carta.receita||'',lado:'jogadores',jogador:currentUser,criadaEm:Date.now(),tipoCartao:'jogada',resultado:rolagem.resultado,sucesso:rolagem.sucesso,dados:rolagem.dados,operador:rolagem.operador,atributoNome:rolagem.atributoNome,valorAtributo:rolagem.valorAtributo};
    const result=await runTransaction(ref(db,CAMINHO_RAIZ_PARTIDA),root=>{if(!root||!root.estado||root.estado.status!=='em_andamento')return;const state=root.estado;if(state.jogadorAtivo!==currentUser||state.cartaJogada)return;if(state.corTopo&&!wild&&carta.cor!==state.corTopo)return;const cards={...(root.cartas||{}),[key]:played};const newState={...state,cartaJogada:true,corTopo:wild?'':carta.cor,cartaAtiva:{nome:carta.nome||'Carta',cor:carta.cor||'mescla',jogador:currentUser,resultado:rolagem.resultado,sucesso:rolagem.sucesso},ultimaCarta:carta.nome||'Carta',ultimoJogador:currentUser,ultimaAcao:'jogada'};return {...root,cartas:cards,estado:newState};});
    if(!result.committed){atualizarStatusMesa('A jogada não foi aceita: turno ou cor mudou. A carta continua na mão.','offline');return false;}
    maoCartaIds=maoCartaIds.filter(id=>id!==String(carta.id));persistirMaoCartas();estadoPartidaCartas=result.snapshot.val()?.estado||estadoPartidaCartas;renderizarEstadoTurno();atualizarStatusMesa(`${carta.nome} jogada por ${currentUser}. Encerre o turno.`,'online');return true;
}
function colocarCartaNaMesaCompartilhada(carta,ladoSolicitado=null,ignorarMao=false) {
    if(!currentUser)return;
    if(!ignorarMao&&!maoCartaIds.includes(String(carta.id||''))){atualizarStatusMesa('Essa carta não está na sua mão. Escolha-a no grimório primeiro.','offline');return;}
    const ladoPermitido=usuarioEhMestreDaMesa()?'mestre':'jogadores',side=ladoSolicitado||ladoPermitido;
    if(side!==ladoPermitido){atualizarStatusMesa('Cada participante coloca cartas no seu lado.','offline');return;}
    const node=ref(db,CAMINHO_MESA_GRUPO),key=push(node).key;
    const card={id:key,sourceId:String(carta.id||''),nome:String(carta.nome||'Carta sem nome'),cor:String(carta.cor||'mescla'),receita:String(carta.receita||''),efeito:String(carta.efeito||''),lado:side,jogador:currentUser,criadaEm:Date.now(),tipoCartao:carta.tipoCartao||'',alvoTipo:carta.alvoTipo||'',alvoId:carta.alvoId||'',alvoNome:carta.alvoNome||'',marcadorTipo:carta.marcadorTipo||'nenhum',marcadorValor:Number(carta.marcadorValor)||0,marcadorAplicado:false};
    cartasMesaCompartilhada.push(card);salvarCacheMesaCompartilhada();renderizarMesaCompartilhada();
    set(ref(db,`${CAMINHO_MESA_GRUPO}/${key}`),card).then(()=>atualizarStatusMesa('● Ao vivo · compartilhada','online')).catch(error=>{console.warn('Falha ao colocar carta na mesa Firebase:',error);atualizarStatusMesa('Não sincronizou · confira as regras do Firebase','offline');});
}
function retirarCartaDaMesa(id) {
    const card=cartasMesaCompartilhada.find(item=>item.id===id);if(!card)return;
    if(card.jogador!==currentUser&&!usuarioEhMestreDaMesa())return;
    cartasMesaCompartilhada=cartasMesaCompartilhada.filter(item=>item.id!==id);salvarCacheMesaCompartilhada();renderizarMesaCompartilhada();
    remove(ref(db,`${CAMINHO_MESA_GRUPO}/${id}`)).catch(error=>{console.warn('Falha ao retirar carta compartilhada:',error);atualizarStatusMesa('Não foi possível sincronizar a retirada','offline');});
}
function renderizarMesaCompartilhada() {
    const lanes={jogadores:document.getElementById('mesa-jogadores'),mestre:document.getElementById('mesa-mestre')};if(!lanes.jogadores||!lanes.mestre)return;
    for(const [side,lane] of Object.entries(lanes)){
        const cards=cartasMesaCompartilhada.filter(card=>(card.lado||'jogadores')===side);lane.replaceChildren();
        const count=document.getElementById(side==='jogadores'?'player-table-count':'gm-table-count');if(count)count.textContent=`${cards.length} ${cards.length===1?'carta':'cartas'}`;
        if(!cards.length){const empty=document.createElement('p');empty.className='table-empty';empty.textContent=side==='jogadores'?'Aguardando cartas dos jogadores…':'Aguardando as cartas do Mestre…';lane.appendChild(empty);continue;}
        cards.forEach(card=>{const article=document.createElement('article');article.className=`table-card ${card.cor||'mescla'}`;
            const top=document.createElement('div');top.className='table-card-top';const color=document.createElement('span');color.className='table-card-color';color.textContent=(card.cor||'arcana').toUpperCase();const owner=document.createElement('small');owner.textContent=side==='mestre'?`MESTRE · ${card.jogador||''}`:card.jogador||'Jogador';top.append(color,owner);if(card.tipoCartao){const type=document.createElement('span');type.className=`table-card-kind ${card.tipoCartao}`;type.textContent=card.tipoCartao==='ataque'?'ATAQUE':'PROBLEMA';article.appendChild(type);}
            const title=document.createElement('h3');title.textContent=card.nome||'Carta';const effect=document.createElement('p');effect.textContent=card.efeito||'Sem descrição.';article.append(top,title,effect);if(side==='jogadores'&&card.resultado!==undefined){const roll=document.createElement('small');roll.className='table-card-roll';roll.textContent=`2D10 · ${(card.dados||[]).join('+')} = ${card.resultado} · ${card.sucesso||''}`;article.appendChild(roll);}
            if(card.receita){const recipe=document.createElement('small');recipe.className='table-card-recipe';recipe.textContent=`Receita · ${card.receita}`;article.appendChild(recipe);}
            if((card.lado==='mestre'&&(card.jogador===currentUser||usuarioEhMestreDaMesa()))||(card.lado==='jogadores'&&estadoPartidaCartas.status!=='em_andamento'&&(card.jogador===currentUser||usuarioEhMestreDaMesa()))){const removeButton=document.createElement('button');removeButton.type='button';removeButton.className='table-card-remove';removeButton.textContent='Recolher';removeButton.onclick=()=>retirarCartaDaMesa(card.id);article.appendChild(removeButton);}
            if(side==='mestre'&&card.alvoNome){const target=document.createElement('small');target.className='table-card-target';target.textContent=`Alvo · ${card.alvoTipo==='npc'?'NPC':'Jogador'}: ${card.alvoNome}`;article.appendChild(target);}
            if(side==='mestre'&&card.marcadorTipo&&card.marcadorTipo!=='nenhum'){const marker=document.createElement('span');marker.className='table-card-marker';marker.textContent=card.marcadorAplicado?'Marca aplicada ✓':rotuloMarcadorCarta(card.marcadorTipo,card.marcadorValor);article.appendChild(marker);if(usuarioEhMestreDaMesa()&&card.alvoId&&!card.marcadorAplicado){const apply=document.createElement('button');apply.type='button';apply.className='table-card-apply';apply.textContent='Aplicar marca';apply.onclick=()=>aplicarMarcadorDaCarta(card.id);article.appendChild(apply);}}
            lane.appendChild(article);
        });
    }
    renderizarMaoCartas();
}
function rotuloMarcadorCarta(tipo,valor=0){if(tipo==='ferimento_grave')return 'Marca · ferimento grave';if(tipo==='ferimento_critico')return 'Marca · ferimento crítico';if(tipo==='sanidade')return `Marca · −${valor||0} sanidade`;return '';}
async function aplicarMarcadorDaCarta(id){
    if(!usuarioEhMestreDaMesa())return;
    const card=cartasMesaCompartilhada.find(item=>item.id===id);if(!card||!card.alvoId||!card.marcadorTipo||card.marcadorTipo==='nenhum'||card.marcadorAplicado)return;
    const collection=card.alvoTipo==='npc'?'npcs':'characters',targetRef=ref(db,`${collection}/${card.alvoId}`);
    try{const snapshot=await get(targetRef);if(!snapshot.exists())throw new Error('O alvo não existe mais.');const target=snapshot.val()||{},fer=target.ferimentos||{};const patch={};
        if(card.marcadorTipo==='ferimento_grave'){let graves=Number(fer.graves)||0,criticos=Number(fer.criticos)||0;if(graves<4)graves++;else criticos++;patch.ferimentos={...fer,graves,criticos};}
        if(card.marcadorTipo==='ferimento_critico')patch.ferimentos={...fer,criticos:(Number(fer.criticos)||0)+1};
        if(card.marcadorTipo==='sanidade'){const dano=Math.max(1,Math.min(100,Number(card.marcadorValor)||1));patch.sanidade=Math.max(0,(Number.isFinite(Number(target.sanidade))?Number(target.sanidade):100)-dano);}
        await update(targetRef,patch);await update(ref(db,`${CAMINHO_MESA_GRUPO}/${id}`),{marcadorAplicado:true,marcadorAplicadoPor:currentUser,marcadorAplicadoEm:Date.now()});
        atualizarStatusMesa(`Marca aplicada em ${card.alvoNome||card.alvoId}.`,'online');if(typeof registrarLog==='function')registrarLog(`Mestre aplicou ${rotuloMarcadorCarta(card.marcadorTipo,card.marcadorValor)} em ${card.alvoNome||card.alvoId}.`);
    }catch(error){console.error(error);atualizarStatusMesa('Falha ao aplicar marca · confira o Firebase','offline');}
}
async function atualizarAlvosDoMestre(){
    const select=document.getElementById('gm-card-target');if(!select)return;select.replaceChildren(new Option('Carregando alvos…',''));
    const type=document.getElementById('gm-card-target-kind')?.value||'jogador',path=type==='npc'?'npcs':'characters';
    try{const snapshot=await get(ref(db,path)),data=snapshot.val()||{};select.replaceChildren();const entries=Object.entries(data);if(!entries.length){select.add(new Option(type==='npc'?'Nenhum NPC cadastrado':'Nenhum personagem cadastrado',''));return;}entries.forEach(([id,item])=>select.add(new Option(item.nome||id,id)));}catch(error){console.warn('Falha ao carregar alvos do Mestre',error);select.replaceChildren(new Option('Não foi possível carregar',''));}
}
function atualizarAcessoGrimorioMestre(){const allowed=usuarioEhMestreDaMesa();document.getElementById('grimoire-master-tab')?.classList.toggle('hidden',!allowed);document.getElementById('btn-open-master-tools')?.classList.toggle('hidden',!allowed);}
function abrirPopupGrimorio(pane='mao'){const overlay=document.getElementById('popup-grimoire');if(!overlay)return;overlay.classList.remove('hidden');atualizarAcessoGrimorioMestre();trocarAbaGrimorio(pane);renderizarMaoCartas();}
function fecharPopupGrimorio(){document.getElementById('popup-grimoire')?.classList.add('hidden');}
function trocarAbaGrimorio(pane){if(pane==='mestre'&&!usuarioEhMestreDaMesa())pane='mao';document.querySelectorAll('[data-grimoire-tab]').forEach(button=>button.classList.toggle('active',button.dataset.grimoireTab===pane));document.querySelectorAll('.grimoire-pane').forEach(section=>section.classList.toggle('hidden',section.id!==`grimoire-pane-${pane}`));if(pane==='mestre')atualizarAlvosDoMestre();if(pane==='mao')renderizarMaoCartas();}
async function criarEventoDoMestre(){
    const feedback=document.getElementById('gm-card-feedback');const say=text=>{if(feedback)feedback.textContent=text;};
    if(!usuarioEhMestreDaMesa())return say('Apenas o Mestre pode preparar cartas de ataque ou problema.');
    const name=document.getElementById('gm-card-name').value.trim(),effect=document.getElementById('gm-card-effect').value.trim(),targetId=document.getElementById('gm-card-target').value,targetType=document.getElementById('gm-card-target-kind').value,kind=document.getElementById('gm-card-kind').value,marker=document.getElementById('gm-card-marker').value,amount=Math.max(1,Math.min(100,Number(document.getElementById('gm-sanity-amount').value)||5));
    if(!name)return say('Dê um nome para a carta.');if(!targetId)return say('Escolha um jogador ou NPC como alvo.');
    const alvoSnap=await get(ref(db,`${targetType==='npc'?'npcs':'characters'}/${targetId}`));if(!alvoSnap.exists())return say('O alvo selecionado não foi encontrado.');
    const targetName=alvoSnap.val().nome||targetId,carta={nome:name,cor:kind==='ataque'?'vermelha':'mescla',receita:kind==='ataque'?'Evento do Mestre · Ataque':'Evento do Mestre · Problema',efeito:effect||'Uma nova complicação atravessa a cena.',tipoCartao:kind,alvoTipo:targetType,alvoId:targetId,alvoNome:targetName,marcadorTipo:marker,marcadorValor:marker==='sanidade'?amount:0};
    try{const newRef=push(ref(db,`grimoires/${currentUser}`));await set(newRef,{...carta,tipoCartao:kind,alvoTipo:targetType,alvoId:targetId,alvoNome:targetName,marcadorTipo:marker,marcadorValor:carta.marcadorValor});const full={...carta,id:newRef.key};userGrimoire=[full,...userGrimoire.filter(item=>String(item.id)!==String(full.id))];renderizarCards(userGrimoire);colocarCartaNaMesaCompartilhada(full,'mestre',true);document.getElementById('gm-card-name').value='';document.getElementById('gm-card-effect').value='';say(`“${name}” foi criada e preparada para ${targetName}.`);}catch(error){console.error(error);say('Falha ao salvar. Verifique conexão e permissões do Firebase.');}
}

function chaveMesa() { return `mesa-habilidades-${currentUser || 'visitante'}`; }
function caminhoMesaFirebase() { return `characters/${currentUser}/habilidadesUsadas`; }
function salvarCacheMesa() { try { localStorage.setItem(chaveMesa(), JSON.stringify(cartasNaMesa)); } catch (e) { console.warn('Cache local da mesa indisponível', e); } }
function carregarMesaHabilidades() {
    try { cartasNaMesa = JSON.parse(localStorage.getItem(chaveMesa()) || '[]'); } catch { cartasNaMesa = []; }
    renderizarMesaHabilidades();
    if (!currentUser || mesaOwnerConectado === currentUser) return;
    mesaOwnerConectado = currentUser;
    onValue(ref(db, caminhoMesaFirebase()), snapshot => {
        const remote = [];
        snapshot.forEach(row => remote.push({ id: row.key, ...row.val() }));
        if (remote.length) {
            const ids = new Set(remote.map(x => x.id));
            const localOnly = cartasNaMesa.filter(x => x.id && !ids.has(x.id));
            cartasNaMesa = [...remote, ...localOnly].sort((a,b) => (b.data || 0) - (a.data || 0));
            salvarCacheMesa(); renderizarMesaHabilidades();
            // Envia registros locais que ainda não chegaram ao banco após uma queda de conexão.
            localOnly.forEach(x => set(ref(db, `${caminhoMesaFirebase()}/${x.id}`), x).catch(()=>{}));
        } else if (cartasNaMesa.length) {
            // Migra os registros que já existiam no navegador para a ficha persistente.
            cartasNaMesa.forEach(x => { const id = x.id || push(ref(db, caminhoMesaFirebase())).key; x.id = id; set(ref(db, `${caminhoMesaFirebase()}/${id}`), x).catch(()=>{}); });
            salvarCacheMesa();
        }
    }, error => console.warn('A mesa ficou salva neste dispositivo; sincronização Firebase indisponível:', error));
}
function colocarHabilidadeNaMesa(habilidade) {
    const refRegistro = push(ref(db, caminhoMesaFirebase()));
    const registro = { ...habilidade, id: refRegistro.key, jogador: currentUser };
    cartasNaMesa.unshift(registro);
    salvarCacheMesa(); renderizarMesaHabilidades();
    set(refRegistro, registro).catch(error => console.error('Não foi possível sincronizar o uso; mantido no navegador:', error));
}
function renderizarMesaHabilidades() {
    const mesa = document.getElementById('campo-batalha'); if (!mesa) return;
    mesa.replaceChildren();
    if (!cartasNaMesa.length) { const empty = document.createElement('p'); empty.className = 'text-muted board-empty'; empty.textContent = 'Use uma carta do grimório para registrá-la permanentemente nesta mesa.'; mesa.appendChild(empty); return; }
    cartasNaMesa.forEach(carta => {
        const item = document.createElement('article'); item.className = `played-card ${carta.cor || 'mescla'}`;
        const heading = document.createElement('div'); heading.className = 'played-card-head';
        const name = document.createElement('h3'); name.textContent = carta.nome;
        const die = document.createElement('span'); die.className = 'die-chip'; die.textContent = `${carta.dado || '2D10'} [${(carta.dados || []).join('+')}] · ${carta.resultado}`;
        heading.append(name, die);
        const effect = document.createElement('p'); effect.textContent = carta.efeito;
        const tools = document.createElement('div'); tools.className = 'played-card-tools';
        const share = document.createElement('button'); share.className = 'btn-mystic small'; share.textContent = 'WhatsApp ↗'; share.onclick = () => compartilharHabilidade(carta);
        tools.append(share); item.append(heading, effect, tools); mesa.appendChild(item);
    });
}

function textoHabilidade(c) {
    return `✨ ${c.nome}\nTipo: ${String(c.cor || 'Arcana').toUpperCase()}\nKULT: 2D10 [${(c.dados || []).join(' + ')}] ${c.operador || '+'} ${c.valorAtributo ?? 0} (${c.atributoNome || 'Atributo'}) = ${c.resultado} — ${c.sucesso || ''}\n\n${c.efeito}\n\n— O Grimório Vivo`;
}
function compartilharHabilidade(c) { window.open(`https://wa.me/?text=${encodeURIComponent(textoHabilidade(c))}`, '_blank', 'noopener'); }
function abrirResultadoHabilidade(c) {
    document.getElementById('ability-use-title').textContent = c.nome;
    document.getElementById('ability-use-type').textContent = `${String(c.cor || 'Arcana').toUpperCase()} · KULT 2D10`;
    document.getElementById('ability-use-description').textContent = c.efeito;
    document.getElementById('ability-use-result').textContent = `${c.resultado}`;
    document.getElementById('ability-use-detail').textContent = `${c.dados[0]} + ${c.dados[1]} ${c.operador} ${c.valorAtributo} (${c.atributoNome}) · ${c.sucesso} · ${new Date(c.data).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`;
    document.getElementById('ability-share-whatsapp').onclick = () => compartilharHabilidade(c);
    document.getElementById('ability-use-modal').style.display = 'flex';
}
function fecharResultadoHabilidade() { const m = document.getElementById('ability-use-modal'); if (m) m.style.display = 'none'; }
document.getElementById('ability-use-close')?.addEventListener('click', fecharResultadoHabilidade);
document.getElementById('ability-use-ok')?.addEventListener('click', fecharResultadoHabilidade);
document.getElementById('ability-use-modal')?.addEventListener('click', e => { if (e.target.id === 'ability-use-modal') fecharResultadoHabilidade(); });

// Grimório popup: mão privada, coleção, criação e ferramentas de Mestre.
document.getElementById('btn-open-grimoire')?.addEventListener('click',()=>abrirPopupGrimorio('mao'));
document.getElementById('btn-open-master-tools')?.addEventListener('click',()=>abrirPopupGrimorio('mestre'));
document.getElementById('close-grimoire')?.addEventListener('click',fecharPopupGrimorio);
document.getElementById('popup-grimoire')?.addEventListener('click',event=>{if(event.target.id==='popup-grimoire')fecharPopupGrimorio();});
document.querySelectorAll('[data-grimoire-tab]').forEach(button=>button.addEventListener('click',()=>trocarAbaGrimorio(button.dataset.grimoireTab)));
document.getElementById('btn-standard-create')?.addEventListener('click',()=>{trocarAbaGrimorio('colecao');document.getElementById('btn-add-spell')?.click();});
document.getElementById('gm-card-target-kind')?.addEventListener('change',atualizarAlvosDoMestre);
document.getElementById('gm-card-marker')?.addEventListener('change',event=>document.getElementById('gm-sanity-amount-wrap')?.classList.toggle('hidden',event.target.value!=='sanidade'));
document.getElementById('btn-create-master-event')?.addEventListener('click',criarEventoDoMestre);
document.getElementById('btn-start-card-game')?.addEventListener('click',iniciarPartidaDeCartas);
document.getElementById('btn-end-turn')?.addEventListener('click',encerrarTurnoPartida);
document.getElementById('btn-draw-card')?.addEventListener('click',comprarCartaDoBaralho);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.getElementById('popup-grimoire')?.classList.contains('hidden'))fecharPopupGrimorio();});

// Arraste desktop: soltar uma carta sobre a mesa abre sua ficha de uso; no celular, toque na carta.
(() => {
    const mesa=document.getElementById('campo-batalha'); if(!mesa)return;
    mesa.addEventListener('dragover',e=>{e.preventDefault();mesa.classList.add('drop-ready');});
    mesa.addEventListener('dragleave',e=>{if(!mesa.contains(e.relatedTarget))mesa.classList.remove('drop-ready');});
    mesa.addEventListener('drop',e=>{e.preventDefault();const lane=e.target.closest?.('[data-table-side]');if(lane)return;mesa.classList.remove('drop-ready');const id=e.dataTransfer?.getData('text/plain');const ability=userGrimoire.find(x=>String(x.id||x.nome)===id);if(ability){if(usuarioEhMestreDaMesa())colocarCartaNaMesaCompartilhada(ability,'mestre');else jogarCartaDaMao(ability);}});
    document.querySelectorAll('[data-table-side]').forEach(lane=>{lane.addEventListener('dragover',e=>{e.preventDefault();lane.classList.add('drop-ready');});lane.addEventListener('dragleave',e=>{if(!lane.contains(e.relatedTarget))lane.classList.remove('drop-ready');});lane.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();lane.classList.remove('drop-ready');const id=e.dataTransfer?.getData('text/plain');const ability=userGrimoire.find(x=>String(x.id||x.nome)===id);if(ability){if(lane.dataset.tableSide==='mestre'){if(usuarioEhMestreDaMesa())colocarCartaNaMesaCompartilhada(ability,'mestre');else alert('Essa área é reservada ao Mestre.');}else if(usuarioEhMestreDaMesa())colocarCartaNaMesaCompartilhada(ability,'jogadores');else jogarCartaDaMao(ability);}});});
})();


// Estúdio de composição para WhatsApp: prévia, identidade, formatação e vocabulário.
let siteMessageNpcs={},siteMessageProfile={},messageBannerFile=null,messageBannerSignature='',messageBannerTimer=null,messageBannerRenderToken=0,messageBannerHasPhoto=false;
const siteMessageThemes={violet:'#bda2ff',gold:'#e2c16b',teal:'#76c9ad',rose:'#d89daf',ice:'#87b9df'};
const siteMessageKinds={mista:'FALA + AÇÃO',fala:'FALA',acao:'AÇÃO',pensamento:'PENSAMENTO',pedido:'PEDIDO',duvida:'DÚVIDA',sussurro:'SUSSURRO',narracao:'NARRAÇÃO'};
const siteMessageToneIcons={alegre:'☀️',tenso:'⚡',triste:'🌧️',ironico:'😏',sombrio:'🌑'};
function safeMessageKey(value){return encodeURIComponent(String(value||'').trim().toLowerCase()).replace(/[.#$\[\]\/]/g,'_');}
function obterPerfilVozAtiva(){const voice=document.getElementById('message-persona')?.value||'self';if(voice.startsWith('npc:'))return siteMessageNpcs[voice.slice(4)]||{};return siteMessageProfile||(typeof fichaAtual!=='undefined'?fichaAtual:{})||{};}
function obterCamadasRetratoPerfil(profile={}){const avatares=profile.avatares||{},camadas=[];if(avatares.saudavel)camadas.push(avatares.saudavel);const fisico=profile.estadoFisico||'saudavel',mental=profile.estadoMental||'sao';if(fisico!=='saudavel'&&avatares[fisico])camadas.push(avatares[fisico]);if(mental!=='sao'&&avatares[mental])camadas.push(avatares[mental]);if(!camadas.length){const fallback=avatares[typeof obterEstadoGeral==='function'?obterEstadoGeral(profile):(profile.estado||'')]||profile.fotoPerfil||profile.foto||profile.avatarUrl||'';if(fallback)camadas.push(fallback);}return [...new Set(camadas.filter(Boolean))];}
function obterRetratoPerfil(profile={}){return obterCamadasRetratoPerfil(profile)[0]||'';}
function obterCamadasRetratoAtivo(profile={},option=null,manualUrl=''){if(manualUrl)return [manualUrl];const profileLayers=obterCamadasRetratoPerfil(profile);if(profileLayers.length)return profileLayers;const fallback=option?.dataset.avatar||'';return fallback?[fallback]:[];}
function atualizarVozesMensagens(nomeAtual=''){
    const select=document.getElementById('message-persona');if(!select)return;const old=select.value;select.replaceChildren();
    const selfName=siteMessageProfile.nome||nomeAtual||currentUser||'Minha personagem';const self=document.createElement('option');self.value='self';self.dataset.speaker=selfName;self.dataset.avatar=obterRetratoPerfil(siteMessageProfile);self.dataset.avatarLayers=JSON.stringify(obterCamadasRetratoPerfil(siteMessageProfile));self.textContent=`✨ ${selfName} · minha voz`;select.appendChild(self);
    Object.entries(siteMessageNpcs).filter(([,npc])=>npc&&typeof npc==='object').sort((a,b)=>(a[1].nome||a[0]).localeCompare(b[1].nome||b[0],'pt-BR')).forEach(([id,npc])=>{const option=document.createElement('option');option.value=`npc:${id}`;option.dataset.speaker=npc.nome||id;option.dataset.avatar=npc.foto||npc.fotoPerfil||'';option.dataset.avatarLayers=JSON.stringify(obterCamadasRetratoPerfil(npc));option.textContent=`🎭 ${npc.nome||id} · NPC`;select.appendChild(option);});
    if([...select.options].some(option=>option.value===old))select.value=old;
}
const bannerBackgroundColors={noite:'#14201d',floresta:'#13231a',pergaminho:'#3c2f20',brasa:'#291716',liso:'#17191b'};
const bannerFontFamilies={cinzel:"'Cinzel', Georgia, serif",serif:"Georgia, 'Times New Roman', serif",sans:"Arial, Helvetica, sans-serif",typewriter:"'Courier New', monospace"};
function obterAparenciaBanner(theme=document.getElementById('message-theme')?.value||'violet'){
    const accent=document.getElementById('banner-accent-color')?.value||siteMessageThemes[theme]||siteMessageThemes.violet;
    const bgColor=document.getElementById('banner-bg-color')?.value||bannerBackgroundColors.noite;
    const textColor=document.getElementById('banner-text-color')?.value||'#f4efe4';
    const background=document.getElementById('banner-background')?.value||'noite';
    const layout=document.getElementById('banner-layout')?.value||'lateral';
    const font=document.getElementById('banner-font')?.value||'cinzel';
    const ornament=document.getElementById('banner-ornament')?.value||'ornate';
    return {accent,bgColor,textColor,background,layout,font,ornament,fontFamily:bannerFontFamilies[font]||bannerFontFamilies.cinzel};
}
function chaveAparenciaBanner(){return `message-banner-style:${currentUser}`;}
function salvarAparenciaBanner(){const style=obterAparenciaBanner();try{localStorage.setItem(chaveAparenciaBanner(),JSON.stringify(style));}catch(_){}atualizarPreviaMensagemSite();}
function carregarAparenciaBanner(theme='violet'){
    let saved={};try{saved=JSON.parse(localStorage.getItem(chaveAparenciaBanner())||'{}');}catch(_){}
    const setValue=(id,value)=>{const el=document.getElementById(id);if(el&&value)el.value=value;};
    setValue('banner-background',saved.background||'noite');setValue('banner-layout',saved.layout||'lateral');setValue('banner-font',saved.font||'cinzel');setValue('banner-ornament',saved.ornament||'ornate');
    setValue('banner-accent-color',saved.accent||siteMessageThemes[theme]||siteMessageThemes.violet);setValue('banner-bg-color',saved.bgColor||bannerBackgroundColors[saved.background||'noite']);setValue('banner-text-color',saved.textColor||'#f4efe4');
}
function chaveIdentidadeMensagem(){return `message-identity:${currentUser}:${safeMessageKey(document.getElementById('message-persona')?.value||'self')}`;}
function atualizarRetratoPreview(urls,name){const el=document.getElementById('message-avatar-preview');if(!el)return;el.replaceChildren();const layers=(Array.isArray(urls)?urls:[urls]).filter(url=>url&&/^(https?:\/\/|data:image\/)/i.test(url));el.style.position='relative';if(layers.length){layers.forEach((url,index)=>{const img=document.createElement('img');img.src=url;img.alt=index===layers.length-1?`Retrato de ${name||'personagem'}`:'';img.loading='lazy';img.style.position='absolute';img.style.inset='0';img.style.width='100%';img.style.height='100%';img.style.objectFit='contain';img.style.pointerEvents='none';el.appendChild(img);});}else{const fallback=document.createElement('span');fallback.textContent=String(name||'✧').trim().slice(0,1).toUpperCase()||'✧';el.appendChild(fallback);}}
function carregarIdentidadeMensagem(){
    const profile=obterPerfilVozAtiva(),option=document.getElementById('message-persona')?.selectedOptions?.[0],defaultName=option?.dataset.speaker||profile.nome||currentUser||'Personagem';let saved={};try{saved=JSON.parse(localStorage.getItem(chaveIdentidadeMensagem())||'{}');}catch(_){}
    const name=document.getElementById('message-speaker-name'),portrait=document.getElementById('message-avatar-url');if(name)name.value=saved.name||defaultName;if(portrait)portrait.value=saved.avatar||'';
    atualizarRetratoPreview(obterCamadasRetratoAtivo(profile,option,portrait?.value?.trim()||''),name?.value||defaultName);atualizarPreviaMensagemSite();
}
function salvarIdentidadeMensagem(){const data={name:document.getElementById('message-speaker-name')?.value.trim()||'',avatar:document.getElementById('message-avatar-url')?.value.trim()||''};try{localStorage.setItem(chaveIdentidadeMensagem(),JSON.stringify(data));}catch(_){}const profile=obterPerfilVozAtiva(),option=document.getElementById('message-persona')?.selectedOptions?.[0];atualizarRetratoPreview(obterCamadasRetratoAtivo(profile,option,data.avatar),data.name||option?.dataset.speaker);atualizarPreviaMensagemSite();}
function obterDadosCompositorMensagem(){
    const voice=document.getElementById('message-persona'),opt=voice?.selectedOptions?.[0],profile=obterPerfilVozAtiva();
    const speaker=(document.getElementById('message-speaker-name')?.value||'').trim()||opt?.dataset.speaker||profile.nome||currentUser||'Personagem';
    const kind=document.getElementById('message-kind')?.value||'mista',tone=document.getElementById('message-tone')?.value||'neutro',theme=document.getElementById('message-theme')?.value||'violet';
    const raw=(document.getElementById('site-message-text')?.value||'').trim(),meaning=(document.getElementById('site-message-meaning')?.value||'').trim();
    const avatarLayers=obterCamadasRetratoAtivo(profile,opt,document.getElementById('message-avatar-url')?.value.trim()||''),avatar=avatarLayers[0]||'';
    return {speaker,kind,tone,theme,raw,meaning,avatar,avatarLayers,voice:voice?.value||'self',appearance:obterAparenciaBanner(theme)};
}
function limparMarcacaoWhatsApp(text){return String(text||'').replace(/```/g,'').replace(/[*_~`]/g,'').replace(/^\s*>\s?/gm,'').replace(/^\s*[-•]\s/gm,'• ').trim();}
function quebrarTextoCanvas(ctx,text,maxWidth){const lines=[];String(text||'').split('\n').forEach(paragraph=>{if(!paragraph){lines.push('');return;}let line='';for(const word of paragraph.split(/\s+/)){const candidate=line?`${line} ${word}`:word;if(ctx.measureText(candidate).width<=maxWidth||!line)line=candidate;else{lines.push(line);line=word;}}if(line)lines.push(line);});return lines;}
const bannerImageCache=new Map();
function carregarImagemBanner(url){if(!url||!(/^(https?:\/\/|data:image\/)/i.test(url)))return Promise.resolve(null);if(bannerImageCache.has(url))return bannerImageCache.get(url);const pending=new Promise(resolve=>{const image=new Image();if(!url.startsWith('data:'))image.crossOrigin='anonymous';image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=url;});bannerImageCache.set(url,pending);return pending;}
function arredondar(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):(ctx.rect(x,y,w,h));ctx.fill();}
function escurecerHex(hex,amount=-25){const raw=String(hex||'#14201d').replace('#','');if(raw.length!==6)return '#101513';const values=[0,2,4].map(i=>parseInt(raw.slice(i,i+2),16));return '#'+values.map(v=>Math.max(0,Math.min(255,v+amount)).toString(16).padStart(2,'0')).join('');}
function desenharPadraoBanner(ctx,style,width,height,accent){
    ctx.save();if(style==='noite'){
        for(let i=0;i<58;i++){const x=(i*167+39)%width,y=(i*89+31)%height;ctx.fillStyle=i%5===0?accent+'bb':'#ffffff55';ctx.beginPath();ctx.arc(x,y,i%6===0?2:1,0,Math.PI*2);ctx.fill();}
    }else if(style==='floresta'){
        ctx.strokeStyle=accent+'20';ctx.lineWidth=2;for(let x=-50;x<width+100;x+=90){ctx.beginPath();ctx.moveTo(x,height);ctx.quadraticCurveTo(x+70,height*.52,x+18,0);ctx.stroke();}
        ctx.fillStyle=accent+'14';for(let i=0;i<34;i++){const x=(i*193+21)%width,y=(i*113+47)%height;ctx.beginPath();ctx.ellipse(x,y,18,6,(i%7)/4,0,Math.PI*2);ctx.fill();}
    }else if(style==='pergaminho'){
        ctx.strokeStyle='#f3deb019';ctx.lineWidth=1;for(let y=72;y<height;y+=31){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y+((y%3)-1)*5);ctx.stroke();}
        for(let i=0;i<48;i++){ctx.fillStyle='#e5c99122';ctx.beginPath();ctx.arc((i*131+16)%width,(i*79+18)%height,1+(i%3),0,Math.PI*2);ctx.fill();}
    }else if(style==='brasa'){
        for(let i=0;i<38;i++){const x=(i*109+57)%width,y=(i*163+height*.45)%height;ctx.fillStyle=i%3===0?accent+'55':'#e7965730';ctx.beginPath();ctx.arc(x,y,2+(i%5),0,Math.PI*2);ctx.fill();}
    }
    ctx.restore();
}
function desenharMolduraBanner(ctx,style,accent,width,height){
    ctx.save();if(style==='minimal'){ctx.strokeStyle=accent+'aa';ctx.lineWidth=2;ctx.strokeRect(22,22,width-44,height-44);}else{
        ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.strokeRect(22,22,width-44,height-44);ctx.strokeStyle=accent+'66';ctx.lineWidth=1;ctx.strokeRect(32,32,width-64,height-64);
        const corners=[[48,48],[width-48,48],[48,height-48],[width-48,height-48]];ctx.fillStyle=accent;corners.forEach(([x,y])=>{ctx.beginPath();ctx.moveTo(x,y-8);ctx.lineTo(x+3,y-3);ctx.lineTo(x+8,y);ctx.lineTo(x+3,y+3);ctx.lineTo(x,y+8);ctx.lineTo(x-3,y+3);ctx.lineTo(x-8,y);ctx.lineTo(x-3,y-3);ctx.closePath();ctx.fill();});
        if(style==='runes'){ctx.font='18px Georgia,serif';ctx.fillStyle=accent+'bb';ctx.fillText('ᚱ ᚨ ᚲ',54,90);ctx.textAlign='right';ctx.fillText('ᛉ ᚷ ᛟ',width-54,height-55);ctx.textAlign='start';}
    }ctx.restore();
}
async function desenharBannerMensagem(data,token){
    const canvas=document.getElementById('message-banner-canvas'),ctx=canvas?.getContext('2d');if(!canvas||!ctx)return null;
    const avatarLayers=await Promise.all((data.avatarLayers?.length?data.avatarLayers:[data.avatar]).filter(Boolean).map(carregarImagemBanner));if(token!==messageBannerRenderToken)return null;messageBannerHasPhoto=avatarLayers.some(Boolean);
    const a=data.appearance||obterAparenciaBanner(data.theme),accent=a.accent||siteMessageThemes[data.theme]||siteMessageThemes.violet;
    const body=limparMarcacaoWhatsApp(data.raw),meaning=limparMarcacaoWhatsApp(data.meaning),isCentered=a.layout==='central';
    ctx.font=`500 27px ${a.fontFamily}`;const bodyWidth=isCentered?980:735,bodyLines=quebrarTextoCanvas(ctx,body,bodyWidth);
    ctx.font=`400 21px ${a.fontFamily}`;const meaningLines=meaning?quebrarTextoCanvas(ctx,meaning,bodyWidth):[];
    const height=Math.min(2000,Math.max(isCentered?760:675,(isCentered?540:410)+bodyLines.length*38+(meaningLines.length?105+meaningLines.length*30:0)));
    canvas.width=1200;canvas.height=height;
    const bg=ctx.createLinearGradient(0,0,1200,height);bg.addColorStop(0,a.bgColor);bg.addColorStop(.55,escurecerHex(a.bgColor,-16));bg.addColorStop(1,escurecerHex(a.bgColor,-34));ctx.fillStyle=bg;ctx.fillRect(0,0,1200,height);
    const glow=ctx.createRadialGradient(80,80,5,80,80,580);glow.addColorStop(0,accent+'45');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(0,0,1200,height);
    desenharPadraoBanner(ctx,a.background,1200,height,accent);desenharMolduraBanner(ctx,a.ornament,accent,1200,height);
    ctx.fillStyle=accent;ctx.font=`700 15px ${a.fontFamily}`;ctx.letterSpacing='3px';ctx.fillText('✦  ESTÚDIO DE PERSONAGEM   ·   BANNER',58,77);ctx.letterSpacing='0px';
    const textColor=a.textColor||'#f4efe4';
    const drawPortrait=(cx,cy,r)=>{ctx.beginPath();ctx.arc(cx,cy,r+12,0,Math.PI*2);ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=accent+'22';ctx.fill();ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();if(avatarLayers.some(Boolean)){const base=avatarLayers.find(Boolean),scale=Math.min((r*2)/base.width,(r*2)/base.height),w=base.width*scale,h=base.height*scale;avatarLayers.filter(Boolean).forEach(layer=>ctx.drawImage(layer,cx-w/2,cy-h/2,w,h));}else{ctx.fillStyle=accent+'30';ctx.fillRect(cx-r,cy-r,r*2,r*2);ctx.fillStyle=accent;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`700 ${Math.floor(r*.8)}px ${a.fontFamily}`;ctx.fillText((data.speaker||'✦').trim().slice(0,1).toUpperCase(),cx,cy);}ctx.restore();ctx.textAlign='start';ctx.textBaseline='alphabetic';};
    let panelX,panelY,panelW,panelH,bodyX,bodyY;
    if(isCentered){drawPortrait(600,162,76);ctx.fillStyle=textColor;ctx.textAlign='center';ctx.font=`700 24px ${a.fontFamily}`;ctx.fillText(data.speaker||'Personagem',600,274,700);ctx.fillStyle=accent;ctx.font=`700 12px system-ui,sans-serif`;ctx.fillText(siteMessageKinds[data.kind]||'FALA',600,300,700);ctx.textAlign='start';panelX=70;panelY=330;panelW=1060;panelH=height-414;bodyX=panelX+38;bodyY=panelY+69;}
    else{drawPortrait(160,238,94);ctx.fillStyle=textColor;ctx.textAlign='center';ctx.font=`700 24px ${a.fontFamily}`;ctx.fillText(data.speaker||'Personagem',160,388,255);ctx.fillStyle=accent;ctx.font='700 12px system-ui,sans-serif';ctx.letterSpacing='1px';ctx.fillText(siteMessageKinds[data.kind]||'FALA',160,415,255);ctx.letterSpacing='0px';ctx.textAlign='start';ctx.fillStyle='#ffffff22';ctx.fillRect(300,118,1,height-236);panelX=355;panelY=126;panelW=780;panelH=height-252;bodyX=panelX+34;bodyY=222;}
    ctx.fillStyle='#ffffff12';arredondar(ctx,panelX,panelY,panelW,panelH,20);
    ctx.fillStyle=accent;ctx.font=`700 14px ${a.fontFamily}`;ctx.letterSpacing='2px';ctx.fillText(`A VOZ DE ${String(data.speaker||'PERSONAGEM').toLocaleUpperCase('pt-BR')}`,panelX+34,panelY+42);ctx.letterSpacing='0px';
    const toneIcon=siteMessageToneIcons[data.tone]||'';if(toneIcon&&data.tone!=='neutro'){ctx.fillStyle=textColor;ctx.font=`16px ${a.fontFamily}`;ctx.fillText(`${toneIcon} ${data.tone}`,panelX+34,panelY+70);bodyY+=30;}
    ctx.fillStyle=textColor;ctx.font=`500 27px ${a.fontFamily}`;let y=bodyY;
    bodyLines.forEach(line=>{ctx.fillText(line,bodyX,y,panelW-76);y+=38;});
    if(meaningLines.length){y+=22;ctx.strokeStyle=accent+'88';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(bodyX,y-12);ctx.lineTo(panelX+panelW-38,y-12);ctx.stroke();ctx.fillStyle=accent;ctx.font=`700 13px ${a.fontFamily}`;ctx.letterSpacing='1.4px';ctx.fillText('SIGNIFICADO',bodyX,y+14);ctx.letterSpacing='0px';y+=49;ctx.fillStyle=textColor;ctx.font=`400 21px ${a.fontFamily}`;meaningLines.forEach(line=>{ctx.fillText(line,bodyX,y,panelW-76);y+=30;});}
    ctx.fillStyle=accent+'bb';ctx.font=`12px ${a.fontFamily}`;ctx.fillText('CRIADO NO ESTÚDIO DE PERSONAGEM',58,height-57);ctx.textAlign='right';ctx.fillText('✦',1142,height-57);ctx.textAlign='start';
    try{return await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));}catch(_){return null;}
}
function assinaturaBanner(data){return JSON.stringify([data.speaker,data.kind,data.tone,data.theme,data.raw,data.meaning,data.avatarLayers||data.avatar,data.appearance]);}
function agendarBannerMensagem(){clearTimeout(messageBannerTimer);const button=document.getElementById('btn-share-message-wa'),status=document.getElementById('message-share-status');messageBannerFile=null;messageBannerSignature='';if(button)button.disabled=true;if(status)status.textContent='Preparando o banner…';messageBannerTimer=setTimeout(async()=>{
    const token=++messageBannerRenderToken,data=obterDadosCompositorMensagem();if(!data.raw){if(button)button.disabled=false;if(status)status.textContent='Escreva a fala para montar o banner.';return;}
    try{const blob=await desenharBannerMensagem(data,token);if(token!==messageBannerRenderToken)return;if(blob){const fileName=`mensagem-${safeMessageKey(data.speaker)||'personagem'}.png`;messageBannerFile=new File([blob],fileName,{type:'image/png'});messageBannerSignature=assinaturaBanner(data);if(status)status.textContent=messageBannerHasPhoto?'Banner com retrato pronto para compartilhar.':'Banner pronto com inicial; a foto não pôde ser carregada neste formato.';}else if(status)status.textContent='Não foi possível preparar o banner. Tente novamente.';}
    catch(error){console.warn('Falha ao montar banner:',error);if(status)status.textContent='Falha ao montar o banner.';}
    if(token===messageBannerRenderToken&&button)button.disabled=false;
},220);}
function atualizarPreviaMensagemSite(){
    const data=obterDadosCompositorMensagem();try{localStorage.setItem('message-studio-preferences',JSON.stringify({kind:data.kind,tone:data.tone,theme:data.theme,voice:data.voice}));}catch(_){}
    const label=document.getElementById('message-preview-label');if(label)label.textContent=`${data.speaker} · ${siteMessageKinds[data.kind]||'FALA'}`;
    const count=document.getElementById('message-char-count');if(count)count.textContent=`${(document.getElementById('site-message-text')?.value||'').length}/1200`;
    const meaningCount=document.getElementById('message-meaning-count');if(meaningCount)meaningCount.textContent=`${(document.getElementById('site-message-meaning')?.value||'').length}/600`;
    atualizarRetratoPreview(data.avatarLayers,data.speaker);agendarBannerMensagem();
}
let characterProfileBannerBlob=null,characterProfileBannerToken=0,characterProfileBannerTimer=null;
function chavePreferenciaBannerPersonagem(){return `character-profile-banner:${currentUser||'guest'}`;}
function chaveAparenciaBannerPersonagem(){return `character-profile-banner-style:${currentUser||'guest'}`;}
function obterAparenciaBannerPersonagem(){const get=id=>document.getElementById(id);return {background:get('character-banner-background')?.value||'floresta',layout:get('character-banner-layout')?.value||'lateral',font:get('character-banner-font')?.value||'cinzel',ornament:get('character-banner-ornament')?.value||'ornate',accent:get('character-banner-accent')?.value||'#d1b36c',bgColor:get('character-banner-bg-color')?.value||'#19211d',textColor:get('character-banner-text-color')?.value||'#f0eadc',fontFamily:bannerFontFamilies[get('character-banner-font')?.value||'cinzel']||bannerFontFamilies.cinzel};}
function carregarAparenciaBannerPersonagem(){let saved={};try{saved=JSON.parse(localStorage.getItem(chaveAparenciaBannerPersonagem())||'{}');}catch(_){}const defaults={background:'floresta',layout:'lateral',font:'cinzel',ornament:'ornate',accent:'#d1b36c',bgColor:'#19211d',textColor:'#f0eadc'};Object.entries({...defaults,...saved}).forEach(([key,value])=>{const el=document.getElementById(`character-banner-${key==='accent'?'accent':key==='bgColor'?'bg-color':key==='textColor'?'text-color':key}`);if(el&&value)el.value=value;});}
function salvarAparenciaBannerPersonagem(){const style=obterAparenciaBannerPersonagem();try{localStorage.setItem(chaveAparenciaBannerPersonagem(),JSON.stringify({background:style.background,layout:style.layout,font:style.font,ornament:style.ornament,accent:style.accent,bgColor:style.bgColor,textColor:style.textColor}));}catch(_){}characterProfileBannerBlob=null;const button=document.getElementById('btn-download-character-banner');if(button)button.disabled=true;desenharBannerApresentacao();}
function preferenciaBannerPersonagem(){try{return JSON.parse(localStorage.getItem(chavePreferenciaBannerPersonagem())||'{}');}catch(_){return {};}}
function salvarPreferenciaBannerPersonagem(){
    const chosen=[...document.querySelectorAll('#character-banner-attribute-list input:checked')].map(el=>el.value);
    const prefs={bio:document.getElementById('character-banner-bio')?.value||'',role:document.getElementById('character-banner-role')?.value||'',attributes:chosen};
    try{localStorage.setItem(chavePreferenciaBannerPersonagem(),JSON.stringify(prefs));}catch(_){}
    const count=document.getElementById('character-banner-bio-count');if(count)count.textContent=String(prefs.bio.length);
    clearTimeout(characterProfileBannerTimer);characterProfileBannerBlob=null;const btn=document.getElementById('btn-download-character-banner');if(btn)btn.disabled=true;
    characterProfileBannerTimer=setTimeout(()=>desenharBannerApresentacao(),100);
}
function carregarEditorBannerPersonagem(profile={}){
    const bio=document.getElementById('character-banner-bio'),role=document.getElementById('character-banner-role'),list=document.getElementById('character-banner-attribute-list');if(!bio||!role||!list)return;
    const prefs=preferenciaBannerPersonagem();carregarAparenciaBannerPersonagem();bio.value=prefs.bio||'';role.value=prefs.role||'';
    const attrs=profile.atributos&&typeof profile.atributos==='object'?Object.entries(profile.atributos):[];list.replaceChildren();
    if(!attrs.length){const empty=document.createElement('p');empty.className='character-banner-empty';empty.textContent='Nenhum atributo encontrado na ficha ativa.';list.appendChild(empty);}
    else{
        const previous=(Array.isArray(prefs.attributes)?prefs.attributes:attrs.slice(0,Math.min(4,attrs.length)).map(([name])=>name)).slice(0,4);
        attrs.forEach(([name,value])=>{const label=document.createElement('label');label.className='character-banner-attr-choice';const check=document.createElement('input');check.type='checkbox';check.value=name;check.checked=previous.includes(name);check.addEventListener('change',()=>{const selected=[...list.querySelectorAll('input:checked')];if(selected.length>4){check.checked=false;const status=document.getElementById('character-banner-status');if(status)status.textContent='Você pode exibir até quatro atributos.';}salvarPreferenciaBannerPersonagem();});const text=document.createElement('span');text.textContent=`${name}: ${value==null?'—':typeof value==='object'?JSON.stringify(value):value}`;label.append(check,text);list.appendChild(label);});
    }
    bio.oninput=salvarPreferenciaBannerPersonagem;role.oninput=salvarPreferenciaBannerPersonagem;
    const count=document.getElementById('character-banner-bio-count');if(count)count.textContent=String(bio.value.length);
    desenharBannerApresentacao();
}
async function desenharBannerApresentacao(){
    const canvas=document.getElementById('character-profile-banner-canvas'),ctx=canvas?.getContext('2d');if(!canvas||!ctx)return;
    const token=++characterProfileBannerToken,profile=siteMessageProfile||(typeof fichaAtual!=='undefined'&&fichaAtual)||{},appearance=obterAparenciaBannerPersonagem(),centered=appearance.layout==='central',name=String(profile.nome||currentUser||'Personagem'),role=String(document.getElementById('character-banner-role')?.value||'').trim(),bio=String(document.getElementById('character-banner-bio')?.value||'').trim(),selected=[...document.querySelectorAll('#character-banner-attribute-list input:checked')].slice(0,4),attrs=selected.map(el=>{const value=profile.atributos?.[el.value];return {name:el.value,value:value==null?'—':typeof value==='object'?JSON.stringify(value):String(value)}});
    const avatarLayers=await Promise.all(obterCamadasRetratoPerfil(profile).map(carregarImagemBanner));if(token!==characterProfileBannerToken)return;
    const w=1200,h=centered?900:675,a=appearance,accent=a.accent,family=a.fontFamily;canvas.width=w;canvas.height=h;
    const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,a.bgColor);bg.addColorStop(.55,escurecerHex(a.bgColor,-15));bg.addColorStop(1,escurecerHex(a.bgColor,-30));ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    const glow=ctx.createRadialGradient(centered?600:180,140,4,centered?600:180,140,560);glow.addColorStop(0,accent+'48');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    desenharPadraoBanner(ctx,a.background,w,h,accent);desenharMolduraBanner(ctx,a.ornament,accent,w,h);
    ctx.fillStyle=accent;ctx.font=`700 15px ${family}`;ctx.letterSpacing='3px';ctx.fillText('✦  DOSSIÊ DE PERSONAGEM',60,76);ctx.letterSpacing='0px';
    const drawPortrait=(cx,cy,r)=>{ctx.beginPath();ctx.arc(cx,cy,r+14,0,Math.PI*2);ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=accent+'22';ctx.fill();ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();const base=avatarLayers.find(Boolean);if(base){const scale=Math.min((r*2)/base.width,(r*2)/base.height),dw=base.width*scale,dh=base.height*scale;avatarLayers.filter(Boolean).forEach(layer=>ctx.drawImage(layer,cx-dw/2,cy-dh/2,dw,dh));}else{ctx.fillStyle=accent+'28';ctx.fillRect(cx-r,cy-r,r*2,r*2);ctx.fillStyle=accent;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`700 ${Math.floor(r*.8)}px ${family}`;ctx.fillText(name.trim().slice(0,1).toUpperCase()||'✦',cx,cy);}ctx.restore();ctx.textAlign='start';ctx.textBaseline='alphabetic';};
    let panelX,panelY,panelW,panelH,contentX,contentW,bioY;
    if(centered){drawPortrait(600,147,88);ctx.textAlign='center';ctx.fillStyle='#f0eadc';ctx.font=`700 34px ${family}`;ctx.fillText(name,600,278,850);ctx.fillStyle=accent;ctx.font=`700 14px ${family}`;ctx.fillText((role||'FUNÇÃO NÃO DEFINIDA').toLocaleUpperCase('pt-BR'),600,306,850);ctx.textAlign='start';panelX=70;panelY=330;panelW=1060;panelH=505;contentX=112;contentW=976;bioY=398;}
    else{drawPortrait(190,315,116);ctx.fillStyle='#eee7d7';ctx.textAlign='center';ctx.font=`700 21px ${family}`;ctx.fillText(name,190,315+116+48,275);ctx.textAlign='start';panelX=355;panelY=118;panelW=780;panelH=500;contentX=390;contentW=710;ctx.fillStyle=accent;ctx.font=`700 13px ${family}`;ctx.letterSpacing='2px';ctx.fillText((role||'FUNÇÃO NÃO DEFINIDA').toLocaleUpperCase('pt-BR'),contentX,161,contentW);ctx.letterSpacing='0px';ctx.fillStyle=a.textColor;ctx.font=`700 38px ${family}`;ctx.fillText(name,contentX,218,contentW);bioY=270;}
    ctx.fillStyle='#ffffff12';arredondar(ctx,panelX,panelY,panelW,panelH,18);
    if(centered){ctx.fillStyle=accent;ctx.font=`700 12px ${family}`;ctx.letterSpacing='2px';ctx.fillText('BIOGRAFIA',contentX,panelY+38);ctx.letterSpacing='0px';bioY=panelY+70;}
    ctx.fillStyle=a.textColor;ctx.font=`400 21px ${family}`;const bioLines=quebrarTextoCanvas(ctx,bio||'Biografia ainda não definida.',contentW);let y=bioY;bioLines.slice(0,5).forEach(line=>{ctx.fillText(line,contentX,y,contentW);y+=31;});
    const dividerY=Math.max(centered?panelY+190:425,y+12);ctx.strokeStyle=accent+'77';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(contentX,dividerY);ctx.lineTo(contentX+contentW,dividerY);ctx.stroke();ctx.fillStyle=accent;ctx.font=`700 12px ${family}`;ctx.letterSpacing='2px';ctx.fillText('ATRIBUTOS DA FICHA',contentX,dividerY+30);ctx.letterSpacing='0px';
    if(!attrs.length){ctx.fillStyle=a.textColor;ctx.globalAlpha=.68;ctx.font=`16px ${family}`;ctx.fillText('Escolha até quatro atributos da ficha.',contentX,dividerY+67);ctx.globalAlpha=1;}
    else attrs.forEach((attr,index)=>{const gap=centered?24:28,colW=(contentW-gap)/2,x=contentX+(index%2)*(colW+gap),yy=dividerY+70+Math.floor(index/2)*58;ctx.fillStyle='#ffffff10';arredondar(ctx,x,yy-22,colW,43,8);ctx.fillStyle=accent;ctx.font=`700 13px ${family}`;ctx.fillText(attr.name.toLocaleUpperCase('pt-BR'),x+14,yy+3,colW-102);ctx.textAlign='right';ctx.fillStyle=a.textColor;ctx.font=`700 17px ${family}`;ctx.fillText(attr.value,x+colW-14,yy+4,88);ctx.textAlign='start';});
    ctx.fillStyle=accent+'bb';ctx.font=`12px ${family}`;ctx.fillText('✦  FICHA DE PERSONAGEM',60,h-42);ctx.textAlign='right';ctx.fillText('✦',1140,h-42);ctx.textAlign='start';
    try{characterProfileBannerBlob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));}catch(_){characterProfileBannerBlob=null;}
    if(token!==characterProfileBannerToken)return;const btn=document.getElementById('btn-download-character-banner');if(btn)btn.disabled=!characterProfileBannerBlob;
    const status=document.getElementById('character-banner-status');if(status)status.textContent=avatarLayers.some(Boolean)?`Prévia pronta com ${avatarLayers.filter(Boolean).length} camada(s) do retrato.`:'Prévia pronta; a ficha não tem retrato acessível, então usamos a inicial.';
}
document.getElementById('btn-download-character-banner')?.addEventListener('click',()=>{if(!characterProfileBannerBlob)return;const link=document.createElement('a');link.href=URL.createObjectURL(characterProfileBannerBlob);link.download=`banner-${safeMessageKey(siteMessageProfile?.nome||fichaAtual?.nome||currentUser)||'personagem'}.png`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),30000);});

window.abrirMensagensSite=async function(){
    try{const saved=JSON.parse(localStorage.getItem('message-studio-preferences')||'{}');if(saved.kind&&document.getElementById('message-kind'))document.getElementById('message-kind').value=saved.kind;if(saved.tone&&document.getElementById('message-tone'))document.getElementById('message-tone').value=saved.tone;if(saved.theme&&document.getElementById('message-theme'))document.getElementById('message-theme').value=saved.theme;}catch(_){}
    carregarAparenciaBanner(document.getElementById('message-theme')?.value||'violet');
    const [profileResult,npcsResult]=await Promise.allSettled([get(ref(db,`characters/${currentUser}`)),get(ref(db,'npcs'))]);
    siteMessageProfile=profileResult.status==='fulfilled'?(profileResult.value.val()||{}):(typeof fichaAtual!=='undefined'?fichaAtual||{}:{});siteMessageNpcs=npcsResult.status==='fulfilled'?(npcsResult.value.val()||{}):{};
    carregarEditorBannerPersonagem(siteMessageProfile);
    atualizarVozesMensagens(siteMessageProfile.nome||currentUser);try{const prefs=JSON.parse(localStorage.getItem('message-studio-preferences')||'{}');if(prefs.voice&&[...document.getElementById('message-persona').options].some(option=>option.value===prefs.voice))document.getElementById('message-persona').value=prefs.voice;}catch(_){}
    carregarIdentidadeMensagem();
};
function compartilharMensagemWhatsApp(){
    const data=obterDadosCompositorMensagem();if(!data.raw){document.getElementById('site-message-text')?.focus();return alert('Escreva a fala antes de compartilhar.');}
    const currentSignature=assinaturaBanner(data),file=messageBannerSignature===currentSignature?messageBannerFile:null,status=document.getElementById('message-share-status');
    if(file&&navigator.share&&navigator.canShare){try{if(navigator.canShare({files:[file]})){navigator.share({files:[file],title:`Banner de ${data.speaker}`}).then(()=>{if(status)status.textContent='Compartilhamento aberto. Escolha WhatsApp e depois o grupo da Comunidade.';}).catch(error=>{if(status)status.textContent=error?.name==='AbortError'?'Compartilhamento cancelado. Nada foi enviado.':'Não foi possível abrir o compartilhamento.';});return;}}catch(error){console.warn('Web Share indisponível:',error);}}
    const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);window.open(mobile?'https://wa.me/':'https://web.whatsapp.com/','_blank','noopener,noreferrer');
    if(file){const url=URL.createObjectURL(file),anchor=document.createElement('a');anchor.href=url;anchor.download=file.name;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
    if(status)status.textContent=file?'Banner baixado; no WhatsApp, escolha o grupo e anexe somente o PNG.':'Aguarde o banner terminar de preparar e tente compartilhar novamente.';
}
document.getElementById('message-persona')?.addEventListener('change',carregarIdentidadeMensagem);
document.getElementById('message-speaker-name')?.addEventListener('input',salvarIdentidadeMensagem);
document.getElementById('message-avatar-url')?.addEventListener('input',salvarIdentidadeMensagem);
document.getElementById('message-reset-portrait')?.addEventListener('click',()=>{const field=document.getElementById('message-avatar-url');if(field)field.value='';salvarIdentidadeMensagem();});
['message-kind','message-tone'].forEach(id=>document.getElementById(id)?.addEventListener('change',atualizarPreviaMensagemSite));
document.getElementById('message-theme')?.addEventListener('change',()=>{const accent=document.getElementById('banner-accent-color');if(accent)accent.value=siteMessageThemes[document.getElementById('message-theme').value]||siteMessageThemes.violet;salvarAparenciaBanner();});
['banner-accent-color','banner-bg-color','banner-text-color'].forEach(id=>document.getElementById(id)?.addEventListener('input',salvarAparenciaBanner));
['banner-background','banner-layout','banner-font','banner-ornament'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>{if(id==='banner-background'){const bg=document.getElementById('banner-bg-color');if(bg)bg.value=bannerBackgroundColors[document.getElementById(id).value]||bannerBackgroundColors.noite;}salvarAparenciaBanner();}));
document.getElementById('site-message-text')?.addEventListener('input',atualizarPreviaMensagemSite);
document.getElementById('site-message-meaning')?.addEventListener('input',atualizarPreviaMensagemSite);
document.getElementById('btn-share-message-wa')?.addEventListener('click',compartilharMensagemWhatsApp);
function inserirFormatacaoMensagem(kind){
    const input=document.getElementById('site-message-text');if(!input)return;const start=input.selectionStart,end=input.selectionEnd,value=input.value,selected=value.slice(start,end);
    const wraps={bold:['*','*'],italic:['_','_'],strike:['~','~'],mono:['`','`'],action:['_','_']};
    if(kind==='quote'||kind==='bullet'||kind==='numbered'){
        const from=selected?start:value.lastIndexOf('\n',start-1)+1;const to=selected?end:(value.indexOf('\n',start)>=0?value.indexOf('\n',start):value.length);const segment=value.slice(from,to);
        const updated=segment.split('\n').map((line,index)=>kind==='quote'?'> '+line:kind==='bullet'?'- '+line:`${index+1}. ${line}`).join('\n');input.value=value.slice(0,from)+updated+value.slice(to);input.setSelectionRange(from,from+updated.length);
    }else{
        const [left,right]=wraps[kind]||['',''];const formatted=kind==='action'&&selected.includes('\n')?selected.split('\n').map(line=>`_${line}_`).join('\n'):left+selected+right;input.value=value.slice(0,start)+formatted+value.slice(end);
        const cursorStart=start+left.length,cursorEnd=selected?(kind==='action'&&selected.includes('\n')?start+formatted.length:cursorStart+selected.length):cursorStart;input.setSelectionRange(cursorStart,cursorEnd);
    }
    input.focus();atualizarPreviaMensagemSite();
}
document.querySelectorAll('[data-format]').forEach(button=>button.addEventListener('click',()=>inserirFormatacaoMensagem(button.dataset.format)));
document.getElementById('message-emoji-toggle')?.addEventListener('click',()=>document.getElementById('message-emoji-tray')?.classList.toggle('hidden'));
document.querySelectorAll('#message-emoji-tray button').forEach(button=>button.addEventListener('click',()=>{
    const input=document.getElementById('site-message-text');if(!input)return;const start=input.selectionStart,end=input.selectionEnd;input.value=input.value.slice(0,start)+button.textContent+input.value.slice(end);input.setSelectionRange(start+button.textContent.length,start+button.textContent.length);input.focus();atualizarPreviaMensagemSite();
}));
let ultimoEnterMensagens=0;
document.getElementById('site-message-text')?.addEventListener('keydown',event=>{
    if(event.key!=='Enter'||event.shiftKey||event.isComposing)return;
    const now=Date.now();if(now-ultimoEnterMensagens<=650&&event.currentTarget.value.trim()){
        event.preventDefault();event.currentTarget.value=event.currentTarget.value.replace(/\n+$/,'');ultimoEnterMensagens=0;const count=document.getElementById('message-char-count');if(count)count.textContent=`${event.currentTarget.value.length}/1200`;const shareButton=document.getElementById('btn-share-message-wa');if(shareButton?.disabled){const status=document.getElementById('message-share-status');if(status)status.textContent='O banner está sendo atualizado. Aguarde e toque em Compartilhar no WhatsApp.';return;}compartilharMensagemWhatsApp();
    }else ultimoEnterMensagens=now;
});

// Arraste por toque no leque: rastreia o dedo e reconhece a zona de mesa ao soltar.
function configurarArrasteToqueDaMao(button,card){
    let state=null, ghost=null;
    button.addEventListener('pointerdown',e=>{
        if(e.pointerType==='mouse')return;
        e.preventDefault(); state={x:e.clientX,y:e.clientY,moved:false};
        try{button.setPointerCapture(e.pointerId);}catch(_){}
    });
    button.addEventListener('pointermove',e=>{
        if(!state)return;
        if(!state.moved && Math.hypot(e.clientX-state.x,e.clientY-state.y)>9){state.moved=true;ghost=document.createElement('div');ghost.className=`hand-drag-ghost ${String(card.cor||'mescla').toLowerCase()}`;ghost.textContent=card.nome||'Carta';document.body.appendChild(ghost);button._suppressClickUntil=Date.now()+700;}
        if(state.moved&&ghost){ghost.style.left=`${e.clientX}px`;ghost.style.top=`${e.clientY}px`;}
    });
    const finish=e=>{
        if(!state)return; const moved=state.moved;
        if(ghost){ghost.remove();ghost=null;}
        if(!moved){button._suppressClickUntil=Date.now()+700;abrirModalView(card);}
        if(moved){const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-table-side]');
            if(target?.dataset.tableSide==='mestre'){if(usuarioEhMestreDaMesa())colocarCartaNaMesaCompartilhada(card,'mestre');else alert('Essa área é reservada ao Mestre.');}
            else if(target?.dataset.tableSide==='jogadores'){if(usuarioEhMestreDaMesa())colocarCartaNaMesaCompartilhada(card,'jogadores');else jogarCartaDaMao(card);}
        }
        state=null;
    };
    button.addEventListener('pointerup',finish); button.addEventListener('pointercancel',()=>{state=null;if(ghost){ghost.remove();ghost=null;}});
}

// PWA instalável: o visual de smartphone/PC continua sendo apenas a moldura responsiva do site.
let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;document.getElementById('btn-install-app')?.classList.remove('hidden');});
document.getElementById('btn-install-app')?.addEventListener('click',async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;document.getElementById('btn-install-app')?.classList.add('hidden');});
window.addEventListener('appinstalled',()=>document.getElementById('btn-install-app')?.classList.add('hidden'));
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))window.addEventListener('load',()=>navigator.serviceWorker.register(new URL('./sw.js',import.meta.url)).catch(error=>console.warn('PWA: não foi possível registrar o service worker:',error)));
