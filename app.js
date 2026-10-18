// Importações do Firebase v9 (SDK Modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue, set, push, remove, get, child, update } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
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
let limiteTintaDiogenes = 10;      // Limite padrão pela qualidade (Boa = 5)
let filtroCorDiogenes = 'todos';   // Filtro de cor ativo
let tintaEspecialLiberada = true; // Controla se preto/branco foram liberados por dados iguais
let estoqueTintasDiogenes = {
    vermelha: 3,
    azul: 3,
    amarela: 3,
    preta: 0,
    branca: 0,
    mescla: 0
};
// Quando carregar/atualizar os dados do personagem:
// ==========================================
// 3. O GRIMÓRIO ATUALIZADO DE DIÓGENES (100 EFEITOS)
// ==========================================
const magiasDiogenes = [
        // --- TINTA VERMELHA (FOGO) [1 a 10] ---
        { nome: "Bola de fogo", cor: "vermelha", receita: "Tinta Vermelha", efeito: "Cria um pequeno fogo autônomo que ilumina e causa 1 de dano de fogo." },
        { nome: "Manto de Calor", cor: "vermelha", receita: "Tinta Vermelha", efeito: "Concede resistência a dano de frio por uma cena." },
        { nome: "Projétil Incandescente", cor: "vermelha", receita: "Tinta Vermelha", efeito: "Dispara um dardo flamejante que causa 2 de dano de fogo." },
        { nome: "Explosão de Brasa", cor: "vermelha", receita: "Tinta Vermelha", efeito: "Cria uma explosão em área de 3 metros que empurra inimigos. causando 2 dano nos alvos" },
        { nome: "Arma Ardente", cor: "vermelha", receita: "Tinta Vermelha", efeito: "Adiciona +1 de dano de fogo a uma arma por uma cena" },
        { nome: "Sopro de Fênix", cor: "vermelha", receita: "Tinta Vermelha", efeito: "Libera um cone de fogo de 4 metros causando 3 de dano." },
        { nome: "Muro de labaredas", cor: "vermelha", receita: "Tinta Vermelha", efeito: "Ergue uma barreira de chamas bloqueando a passagem por 2 rodadas. causando 3 de dano a quem tenta ultrapassar" },
        { nome: "Marca das Brasas", cor: "vermelha", receita: "Tinta Vermelha", efeito: "ao desenhar uma marca no alvo, sobe o comando do conjurador, a marca explode, queimando o alvo e causando 5 de dano" },
        { nome: "Adrenalina", cor: "vermelha", receita: "Tinta Vermelha", efeito: "Aumenta temporariamente a velocidade de movimento em 3 metros.aumentando em +2 os testes fisicos, porem se a marca permanecer por tempo estendido, podera ganhar ferimentos graves, e se abusado morre" },
        { nome: "Estilhaço Magmático", cor: "vermelha", receita: "Tinta Vermelha", efeito: "Dispara estilhaços quentes que perfuram armaduras leves. destruindo o equipamento atingido, se for metal ficara incandecente" },

        // --- TINTA AZUL (ÁGUA E ESPIRITUALIDADE) [11 a 20] ---
        { nome: "Cura das Marés", cor: "azul", receita: "Tinta Azul", efeito: "faz 1 ferimento estabilizado sumir da ficha" },
        { nome: "Bolha de Oxigênio", cor: "azul", receita: "Tinta Azul", efeito: "cria bolhas, permitindo respiraçao em qualquer local, por tempo indeterminado" },
        { nome: "Passo Sobre Águas", cor: "azul", receita: "Tinta Azul", efeito: "Permite caminhar sobre superfícies líquidas como se fossem solidas por uma cena" },
        { nome: "Sussurro Espiritual", cor: "azul", receita: "Tinta Azul", efeito: "Permite enxergar e conversar com espíritos recem mortos, por uma cena" },
        { nome: "Nevoeiro Purificador", cor: "azul", receita: "Tinta Azul", efeito: "Remove condições de veneno ou doença leve de um aliado." },
        { nome: "Escudo de Gelo", cor: "azul", receita: "Tinta Azul", efeito: "Bloqueia completamente o próximo ataque corpo a corpo recebido." },
        { nome: "Lágrima dos Mares", cor: "azul", receita: "Tinta Azul", efeito: "restaura  estabilidade mental." },
        { nome: "Voz do Oceano", cor: "azul", receita: "Tinta Azul", efeito: "Permite comunicação telepática de longo alcance com aliados." },
        { nome: "Bênção da Névoa", cor: "azul", receita: "Tinta Azul", efeito: "Cria uma névoa densa ao redor concedendo camuflagem arcana." },
        { nome: "Onda de Retorno", cor: "azul", receita: "Tinta Azul", efeito: "Empurra todos os inimigos ao redor para longe com força hidráulica., deixa o campo umido, lançado o alvo ate 5 metros" },

        // --- TINTA AMARELA (LUZ) [21 a 30] ---
        { nome: "Clarão Ofuscante", cor: "amarela", receita: "Tinta Amarela", efeito: "Cega temporariamente inimigos em um raio de 5 metros." },
        { nome: "Lâmina de Luz", cor: "amarela", receita: "Tinta Amarela", efeito: "Infunde uma arma com luz radiante, permite ferir criaturais e causa dano extra em criaturas sobrenaturais maliguinas" },
        { nome: "Faro da Verdade", cor: "amarela", receita: "Tinta Amarela", efeito: "Revela ilusões, metamorfos e invisibilidade em até 10 metros." },
        { nome: "Aura de Proteção", cor: "amarela", receita: "Tinta Amarela", efeito: "Concede +2 no suporta lesao do alvo por uma cena. " },
        { nome: "Feixe Solar", cor: "amarela", receita: "Tinta Amarela", efeito: "Dispara um raio de luz concentrada em linha reta ignorando armaduras leves." },
        { nome: "Luz Guia", cor: "amarela", receita: "Tinta Amarela", efeito: "Cria uma esfera de luz flutuante que ilumina locais escuros., inimigos que estao sobre a luz sao revelados,e aliados recebem um buf de +2 em acerto contra inimigos revelados" },
        { nome: "Claridade Mental", cor: "amarela", receita: "Tinta Amarela", efeito: "Remove efeitos de medo ou confusão mental de um aliado,permitindo tambem exorcirsar o alvo" },
        { nome: "Selo Solar", cor: "amarela", receita: "Tinta Amarela", efeito: "Cria uma runa no chão que prende criaturas ao pisarem.,machuca ao tentar ultrapassar , porem nao poderam ultrapassar por inteiro" },
        { nome: "Reflexo Espelhado", cor: "amarela", receita: "Tinta Amarela", efeito: "Cria cópias ilusórias de algo ou alguem." },
        { nome: "Toque do Amanhecer", cor: "amarela", receita: "Tinta Amarela", efeito: "estabiliza um ferimento temporariamente" },

        // --- TINTA PRETA (MATÉRIA - PASSIVA DE CRÍTICO) [31 a 40] ---
        { nome: "Parede de Ferro", cor: "preta", receita: "Tinta Preta", efeito: "Cria uma parede sólida de matéria de 2x2 metros para bloqueio físico." },
        { nome: "Criação de Ferramentas", cor: "preta", receita: "Tinta Preta", efeito: "Materializa instantaneamente uma ferramenta útil (chave, alavanca, corda)." },
        { nome: "Armadura Sólida", cor: "preta", receita: "Tinta Preta", efeito: "Concede +3 de bônus na armadura do conjurador por 1 rodada." },
        { nome: "Projétil Físico Denso", cor: "preta", receita: "Tinta Preta", efeito: "Cria e arremessa um pedregulho maciço com alto dano de impacto." },
        { nome: "Selo de Prisão Material", cor: "preta", receita: "Tinta Preta", efeito: "Invoca algemas materiais do chão que prendem os pés do alvo." },
        { nome: "Pilar de Sustentação", cor: "preta", receita: "Tinta Preta", efeito: "Cria uma coluna instantânea para sustentar tetos desabando." },
        { nome: "Bloco de Contenção", cor: "preta", receita: "Tinta Preta", efeito: "Cria um cubo de pedra ao redor de um item ou inimigo pequeno." },
        { nome: "Lâmina Materializada", cor: "preta", receita: "Tinta Preta", efeito: "Cria uma espada física improvisada de alta durabilidade." },
        { nome: "Escudo de Chumbo", cor: "preta", receita: "Tinta Preta", efeito: "Cria um escudo pesado bloqueando magias baseadas em radiação ou luz." },
        { nome: "Maciço Colossal", cor: "preta", receita: "Tinta Preta", efeito: "Cria uma estrutura grossa de metal para bloquear passagens inteiras." },

        // --- TINTA BRANCA (APAGAR - PASSIVA DE CRÍTICO) [41 a 50] ---
        { nome: "Desintegrar Objeto", cor: "branca", receita: "Tinta Branca", efeito: "Apaga e desintegra um objeto pequeno não mágico do cenário." },
        { nome: "Silêncio Absoluto", cor: "branca", receita: "Tinta Branca", efeito: "Cria uma zona esférica de silêncio mágico onde nenhum som escapa." },
        { nome: "Apagar Memória Recente", cor: "branca", receita: "Tinta Branca", efeito: "Apaga os últimos 10 segundos da mente de um alvo afetado." },
        { nome: "Cancelamento de Magia", cor: "branca", receita: "Tinta Branca", efeito: "Anula um efeito mágico ativo de nível baixo." },
        { nome: "Invisibilidade Óptica", cor: "branca", receita: "Tinta Branca", efeito: "Apaga a imagem visível do usuário do espectro óptico por 1 minuto." },
        { nome: "Buraco Vazio", cor: "branca", receita: "Tinta Branca", efeito: "Cria um pequeno vácuo que suga e aprisiona projéteis inimigos." },
        { nome: "Apagar Traços", cor: "branca", receita: "Tinta Branca", efeito: "Apaga pegadas, rastros e odores deixados pelo grupo." },
        { nome: "Nulificação de Efeito", cor: "branca", receita: "Tinta Branca", efeito: "Remove uma maldição menor ou efeito de veneno persistente." },
        { nome: "Apagão de Chamas", cor: "branca", receita: "Tinta Branca", efeito: "Extingue instantaneamente qualquer fogo natural ou mágico em área." },
        { nome: "Vazio de Cor", cor: "branca", receita: "Tinta Branca", efeito: "Cria uma área sem cor que desorienta a visão de criaturas comuns." },

        // --- MESCLAS DUPLAS: VERMELHA + AZUL [51 a 60] ---
        { nome: "Torrente de Vapor Quente", cor: "mescla", receita: "Tinta Vermelha + Tinta Azul", efeito: "Jato de vapor escaldante que causa 2 dano de fogo e cega o alvo." },
        { nome: "Gêiser Eruptivo", cor: "mescla", receita: "Tinta Vermelha + Tinta Azul", efeito: "Faz brotar água fervente do chão em área de 3 metros causando 3 (dano misto)." },
        { nome: "Cura Calcinante", cor: "mescla", receita: "Tinta Vermelha + Tinta Azul", efeito: "Cura um aliado, mas cauteriza feridas com calor mágico instantâneo." },
        { nome: "Nevoeiro Termal", cor: "mescla", receita: "Tinta Vermelha + Tinta Azul", efeito: "Cria uma névoa espessa e quente que confunde sensores térmicos." },
        { nome: "Escudo de Vapor", cor: "mescla", receita: "Tinta Vermelha + Tinta Azul", efeito: "Cria uma barreira defensiva que repele projeteis e queima quem se aproxima." },
        { nome: "Lâmina de Água Fervente", cor: "mescla", receita: "Tinta Vermelha + Tinta Azul", efeito: "remove efeitos de arma ou armadura" },
        { nome: "Chama Líquida", cor: "mescla", receita: "Tinta Vermelha + Tinta Azul", efeito: "Dispara um fluido pegajoso que queima mesmo sob a água, 1 de dano constante" },
        { nome: "Purificação Ígnea", cor: "mescla", receita: "Tinta Vermelha + Tinta Azul", efeito: "Purifica o corpo de doenças queimando impurezas espirituais." },
        { nome: "Pulso de Vapor", cor: "mescla", receita: "Tinta Vermelha + Tinta Azul", efeito: "cria uma curtina de gas,enquanto nimguem tapar a fenda continuara enchendo o local com o gas, sufucando quem a respira, tempo de duraçao 1 cena " },
        { nome: "Termoterapia Mágica", cor: "mescla", receita: "Tinta Vermelha + Tinta Azul", efeito: "Recupera fadiga extrema, podendo acordar pessoas desmaiadas" },

        // --- MESCLAS DUPLAS: VERMELHA + AMARELA [61 a 70] ---
        { nome: "Plasma Solar", cor: "mescla", receita: "Tinta Vermelha + Tinta Amarela", efeito: "Cria uma esfera de plasma superaquecido que causa 4 dano massivo." },
        { nome: "Aura de Fogo Sagrado", cor: "mescla", receita: "Tinta Vermelha + Tinta Amarela", efeito: "Envolve o usuário em chamas douradas que blindam contra criaturas sobrenaturais." },
        { nome: "Lança de Radiância Ardente", cor: "mescla", receita: "Tinta Vermelha + Tinta Amarela", efeito: "cria uma laça luz que lhe permite trocar de lugar com ela" },
        { nome: "Explosão Prateada", cor: "mescla", receita: "Tinta Vermelha + Tinta Amarela", efeito: "purifica todos os efeitos negativos" },
        { nome: "Manto de Ouro Vivo", cor: "mescla", receita: "Tinta Vermelha + Tinta Amarela", efeito: "Aumenta em +2 o suporta lesao e concede aura de calor blindada por 1 cena., inimigos proximos sao queimados levando 1 de dano" },
        { nome: "Brilho Magmático", cor: "mescla", receita: "Tinta Vermelha + Tinta Amarela", efeito: "permite colocar um ponto brilhante em um local atraindo qualquer coisa feita de metal" },
        { nome: "Chama Solar Refletida", cor: "mescla", receita: "Tinta Vermelha + Tinta Amarela", efeito: "Reflete feixes de luz concentrada em alvos específicos." },
        { nome: "Fúria Radiante", cor: "mescla", receita: "Tinta Vermelha + Tinta Amarela", efeito: "faz o inimigo atacar qualquer um proximo a ele." },
        { nome: "Farol de Combate", cor: "mescla", receita: "Tinta Vermelha + Tinta Amarela", efeito: "Marca um inimigo com luz incandescente visível a longa distância." },
        { nome: "Supernova Menor", cor: "mescla", receita: "Tinta Vermelha + Tinta Amarela", efeito: "Pequena explosão luz-fogo em grande área 10 de dano, so explodindo depois de uma cena" },

        // --- MESCLAS DUPLAS: AZUL + AMARELA [71 a 80] ---
        { nome: "Luz das Marés", cor: "mescla", receita: "Tinta Azul + Tinta Amarela", efeito: "ao desenhar sobre o aliado, cura todos seus ferimentos" },
        { nome: "Prisma Espiritual", cor: "mescla", receita: "Tinta Azul + Tinta Amarela", efeito: "permite conversa com alguem idependente da distancia viva ou morta" },
        { nome: "Escudo de Aurora", cor: "mescla", receita: "Tinta Azul + Tinta Amarela", efeito: "protege alguem contra posseçao e efeitos sobrenaturais" },
        { nome: "Água Cristalina", cor: "mescla", receita: "Tinta Azul + Tinta Amarela", efeito: "Cria água benta com propriedades de cura aprimoradas." },
        { nome: "Bênção dos Mares", cor: "mescla", receita: "Tinta Azul + Tinta Amarela", efeito: "cria uma poça no chao que concede 1 de dano constante a quem pisa sobre ela" },
        { nome: "Nevoeiro Arco-Íris", cor: "mescla", receita: "Tinta Azul + Tinta Amarela", efeito: "Cria ilusões óticas fantásticas na névoa d'água." },
        { nome: "Pulso de Cura Astral", cor: "mescla", receita: "Tinta Azul + Tinta Amarela", efeito: "Cura em área moderada e afasta presenças espirituais malignas." },
        { nome: "Olhar da Verdade Oceânica", cor: "mescla", receita: "Tinta Azul + Tinta Amarela", efeito: "Permite encherga atravez de materia" },
        { nome: "Cristalização de Luz", cor: "mescla", receita: "Tinta Azul + Tinta Amarela", efeito: "o diogenes cria um feiche de luz que congela o alvo, apenas podendo um alvo por vez" },
        { nome: "Onda Radiante", cor: "mescla", receita: "Tinta Azul + Tinta Amarela", efeito: "lança uma onda de energia que deliga aoarelhos por um determinado tempo" },

        // --- MESCLAS COM PRETA E BRANCA (MATÉRIA E NADA) [81 a 90] ---
        { nome: "Matéria Vazia", cor: "mescla", receita: "Tinta Preta + Tinta Branca", efeito: "Cria e desfaz simultaneamente um objeto para abrir fechaduras." },
        { nome: "Escudo de Antimatéria", cor: "mescla", receita: "Tinta Preta + Tinta Branca", efeito: "Anula o impacto de qualquer projétil físico ou mágico recebido." },
        { nome: "Criação Silenciosa", cor: "mescla", receita: "Tinta Preta + Tinta Branca", efeito: "Materializa uma estrutura física sem emitir absolutamente nenhum som." },
        { nome: "Apagar e Substituir", cor: "mescla", receita: "Tinta Preta + Tinta Branca", efeito: "Apaga um obstáculo pequeno e cria uma passagem no lugar." },
        { nome: "Anulação Térmica", cor: "mescla", receita: "Tinta Vermelha + Tinta Branca + Tinta Preta", efeito: "Cria um campo onde o fogo é instantaneamente anulado pelo vazio." },
        { nome: "Forja Fantasma", cor: "mescla", receita: "Tinta Vermelha + Tinta Preta + Tinta Amarela", efeito: "Cria armas metálicas incandescentes prontas para uso imediato." },
        { nome: "Cristalização do Vazio", cor: "mescla", receita: "Tinta Azul + Tinta Branca + Tinta Preta", efeito: "Cria um bloco de gelo indestrutível que absorve feitiços." },
        { nome: "Prisão Absoluta", cor: "mescla", receita: "Tinta Preta + Tinta Branca", efeito: "Prende o alvo em uma caixa dimensional de matéria apagada." },
        { nome: "Silêncio de Ferro", cor: "mescla", receita: "Tinta Preta + Tinta Branca", efeito: "Cria uma barreira física e sonora intransponível." },
        { nome: "Correção da Realidade", cor: "mescla", receita: "Todas as Tintas (Vermelha, Azul, Amarela, Preta, Branca)", efeito: "Habilidade suprema: Altera um pequeno aspecto físico ou mágico do ambiente." },

        // --- MESCLAS COMPLEXAS E MULTITINTAS SUPREMAS [91 a 100] ---
        { nome: "Fúria dos Quatro Elementos", cor: "mescla", receita: "Tinta Vermelha + Tinta Azul + Tinta Amarela + Tinta Preta", efeito: "Libera uma tempestade elementar massiva ao redor do conjurador." },
        { nome: "Cura Total do Pelo Mágico", cor: "mescla", receita: "Tinta Azul + Tinta Amarela + Tinta Branca", efeito: "Restaura 100% da vida usando os estoques guardados no pelo." },
        { nome: "Barreira do Armazém Ambulante", cor: "mescla", receita: "Tinta Preta + Tinta Branca + Tinta Vermelha", efeito: "Protege o inventário guardado no pelo místico contra roubos e danos." },
        { nome: "Super-Nova Arcana", cor: "mescla", receita: "Tinta Vermelha + Tinta Amarela + Tinta Branca", efeito: "Explosão gigantesca de luz e calor sob supervisão mística." },
        { nome: "Véu Etéreo Absoluto", cor: "mescla", receita: "Tinta Azul + Tinta Branca + Tinta Preta", efeito: "Dá invisibilidade completa e intangibilidade física por 30 segundos." },
        { nome: "Lança Mestra", cor: "mescla", receita: "Tinta Vermelha + Tinta Azul + Tinta Amarela", efeito: "Cria uma arma lendária temporária com efeitos elementais combinados." },
        { nome: "Ressurreição de Tinta", cor: "mescla", receita: "Todas as Tintas (Vermelha, Azul, Amarela, Preta, Branca)", efeito: "Milagre supremo do grimório: Estabiliza um aliado à beira da morte." },
        { nome: "Campo Anti-Magia", cor: "mescla", receita: "Tinta Branca + Tinta Preta", efeito: "Anula todas as magias ativas em um raio de 6 metros." },
        { nome: "Labaredas Espirituais", cor: "mescla", receita: "Tinta Vermelha + Tinta Azul", efeito: "Causa dano de fogo espiritual que ignora defesas físicas comuns." },
        { nome: "Apotéose Mágica", cor: "mescla", receita: "Todas as Tintas (Vermelha, Azul, Amarela, Preta, Branca)", efeito: "Canaliza essência pura, dobrando o poder de todas as tintas por 3 rodadas." }
];
// ==========================================
// 4. CONTROLE DE LOGIN / INTERFACE
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
window.sincronizarAudio = function() {
    const url = document.getElementById('youtube-url').value;
    if(!url) return;
    
    // Extrai o ID do vídeo do youtube (ex: v=123456)
    const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (videoId) {
        set(ref(db, 'audio_global'), { videoId: videoId, timestamp: Date.now() }).then(() => {
            alert("Música enviada para todos!");
            fecharModalAudio();
        });
    } else {
        alert("Link do YouTube inválido.");
    }
}

window.pararAudio = function() {
    remove(ref(db, 'audio_global')).then(() => alert("Música parada para todos."));
}

// Cliente Escuta a Música Global
onValue(ref(db, 'audio_global'), (snapshot) => {
    const container = document.getElementById('global-audio-container');
    const iframe = document.getElementById('youtube-player');
    if (snapshot.exists()) {
        const data = snapshot.val();
        container.style.display = 'block';
        // Autoplay ativado via query param (nota: browsers modernos exigem interação prévia do usuário)
        iframe.src = `https://www.youtube.com/embed/${data.videoId}?autoplay=1&loop=1&playlist=${data.videoId}`;
    } else {
        container.style.display = 'none';
        iframe.src = "";
    }
});

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
    
    DOM.userTitle.innerText = `Grimório de ${currentUser.charAt(0).toUpperCase() + currentUser.slice(1)}`;
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
    
    if (currentUser && currentUser.toLowerCase() === 'diogenes') {
        gerenciarMarcadorTintaDiogenes();
    }
    
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
            if (currentUser === 'diogenes') {
                magiasDiogenes.forEach(magia => {
                    const novaMagiaRef = push(ref(db, 'grimoires/' + currentUser));
                    set(novaMagiaRef, magia);
                });
            } else {
                userGrimoire = [];
                renderizarCards(userGrimoire);
            }
        }
    });
}

function renderizarCards(lista) {
    DOM.grid.innerHTML = "";
    let listaFinal = lista;
    
    if (currentUser && currentUser.toLowerCase() === 'diogenes') {
        if (filtroCorDiogenes !== 'todos') {
            listaFinal = listaFinal.filter(ef => ef.cor === filtroCorDiogenes);
        }
        if (!tintaEspecialLiberada) {
            listaFinal = listaFinal.filter(ef => ef.cor !== 'preta' && ef.cor !== 'branca');
        }
        listaFinal = listaFinal.slice(0, limiteTintaDiogenes);
    }

    const deckCounter = document.getElementById('deck-card-count');
    if (deckCounter) deckCounter.textContent = String(listaFinal.length);
    if(listaFinal.length === 0) {
        DOM.grid.innerHTML = "<p class='text-muted' style='grid-column: 1/-1;'>Nenhum efeito encontrado com esta cor ou o limite de tinta esgotou as páginas visíveis!</p>";
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
document.getElementById('close-view-modal').onclick = () => DOM.modalView.style.display = 'none';

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
    btnConjurar.innerText = currentUser.toLowerCase() === 'diogenes' ? `🖋️ Usar tinta ${String(ef.cor || 'mescla').toUpperCase()}` : '✨ Usar habilidade';
    
    btnConjurar.onclick = () => {
        const podeConjurar = usarEfeitoDiogenes(ef);
        if (!podeConjurar) return;
        const dadoA = Math.floor(Math.random() * 10) + 1;
        const dadoB = Math.floor(Math.random() * 10) + 1;
        const operador = document.getElementById('ability-operator')?.value || '+';
        const atributoSelect = document.getElementById('ability-attribute');
        const valorAtributo = Number(atributoSelect?.value || 0);
        const atributoNome = atributoSelect?.selectedOptions?.[0]?.dataset?.name || 'Sem atributo';
        const resultado = dadoA + dadoB + (operador === '-' ? -valorAtributo : valorAtributo);
        const sucesso = resultado >= 15 ? 'Sucesso completo' : resultado >= 10 ? 'Sucesso com complicação' : 'Falha';
        const usada = { nome: ef.nome || 'Habilidade', cor: ef.cor || 'arcana', efeito: ef.efeito || '', receita: ef.receita || '', dado: '2D10', dados: [dadoA, dadoB], operador, atributoNome, valorAtributo, resultado, sucesso, data: Date.now() };
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
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        
        btn.classList.add('active');
        document.getElementById(btn.getAttribute('data-target')).classList.remove('hidden');
    });
});

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
        
        if (currentUser && currentUser.toLowerCase() === 'diogenes' && resultadosIndividuais.length >= 2) {
            const temDuplo = resultadosIndividuais.some((val, i, arr) => arr.indexOf(val) !== i);
            if (temDuplo) {
                tintaEspecialLiberada = true;
                estoqueTintasDiogenes['preta'] = Math.floor(limiteTintaDiogenes / 2);
                estoqueTintasDiogenes['branca'] = Math.floor(limiteTintaDiogenes / 2);
                
                alert("✨ DUPLO MÍSTICO! As tintas especiais (Preta e Branca) foram desbloqueadas e abastecidas!");
                
                atualizarPainelTintasVisual();
                salvarEstoqueNoFirebase();
                renderizarCards(userGrimoire);
            }
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

function concluirCrafting(nomeItemCriado) {
    const nomeLower = nomeItemCriado.toLowerCase().trim();
    let corEncontrada = null;

    if (nomeLower.includes('vermelha')) corEncontrada = 'vermelha';
    else if (nomeLower.includes('azul')) corEncontrada = 'azul';
    else if (nomeLower.includes('amarela')) corEncontrada = 'amarela';

    if (corEncontrada) {
        estoqueTintasDiogenes[corEncontrada] = limiteTintaDiogenes;
        alert(`🧪 Pote Recarregado! A Tinta ${corEncontrada.toUpperCase()} agora tem ${limiteTintaDiogenes} cargas.`);
        atualizarPainelTintasVisual();
        salvarEstoqueNoFirebase();
    }
}

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

            concluirCrafting(nomeItem);

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
        // Prepara o container para sobreposição de camadas
        containerFichaImg.style.position = "relative";
        containerFichaImg.style.display = "inline-block";
        containerFichaImg.innerHTML = ""; 

        if (avatarLayers.length > 0) {
            avatarLayers.forEach((camada, idx) => {
                const img = document.createElement('img');
                img.src = camada;
                img.className = "avatar-destaque";
                
                // Se for a camada base (saudável), ela dita o tamanho.
                // Camadas de ferimento/insanidade ficam sobrepostas.
                if (idx > 0) {
                    img.style.position = "absolute";
                    img.style.top = "0";
                    img.style.left = "0";
                    img.style.width = "100%";
                    img.style.height = "100%";
                    img.style.background = "transparent"; 
                    img.style.pointerEvents = "none"; // Evita conflito de cliques
                } else {
                    img.onclick = () => window.open(camada, '_blank');
                    img.title = "Clique para ampliar";
                }
                
                containerFichaImg.appendChild(img);
            });
        } else {
            containerFichaImg.innerHTML = `<img src="https://via.placeholder.com/150" class="avatar-destaque">`;
        }
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
function gerenciarMarcadorTintaDiogenes() {
    let painelTinta = document.getElementById('painel-tinta-diogenes');
    
    if (currentUser && currentUser.toLowerCase() === 'diogenes') {
        if (!painelTinta) {
            const gridMagias = document.getElementById('lista-efeitos');
            if (gridMagias && gridMagias.parentNode) {
                painelTinta = document.createElement('div');
                painelTinta.id = 'painel-tinta-diogenes';
                painelTinta.style.cssText = "background: rgba(20, 20, 20, 0.95); border: 1px solid #c9b037; padding: 10px; border-radius: 6px; margin-bottom: 15px; display: flex; flex-direction: column; gap: 8px; color: #fff; font-size: 0.85rem; width: 100%; box-sizing: border-box;";
                
                painelTinta.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 5px;">
                        <div>
                            🖋️ <strong>Qualidade:</strong> 
                            <select id="select-qualidade-tinta" style="background: #111; color: #fff; border: 1px solid #555; padding: 3px; border-radius: 4px; font-size: 0.8rem;">
                                <option value="ruim">Ruim (2)</option>
                                <option value="boa" selected>Boa (5)</option>
                                <option value="perfeita">Perfeita (10)</option>
                            </select>
                        </div>
                        <div id="status-tinta-especial" style="color: ${tintaEspecialLiberada ? '#0f0' : '#888'}; font-size: 0.75rem;">
                            ${tintaEspecialLiberada ? '🔓 P/B Liberadas' : '🔒 P/B Bloqueadas (Role Duplo)'}
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 8px; justify-content: space-around; background: #111; padding: 6px; border-radius: 4px; border: 1px solid #333; font-size: 0.75rem;">
                        <span>🔴 V: <strong id='estoque-vermelha'>${estoqueTintasDiogenes.vermelha}</strong></span>
                        <span>🔵 A: <strong id='estoque-azul'>${estoqueTintasDiogenes.azul}</strong></span>
                        <span>🟡 Am: <strong id='estoque-amarela'>${estoqueTintasDiogenes.amarela}</strong></span>
                        <span>⚫ P: <strong id='estoque-preta'>${estoqueTintasDiogenes.preta}</strong></span>
                        <span>⚪ B: <strong id='estoque-branca'>${estoqueTintasDiogenes.branca}</strong></span>
                        <span>🟣 M: <strong id='estoque-mescla'>${estoqueTintasDiogenes.mescla}</strong></span>
                    </div>
                    
                    <div style="display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; border-top: 1px solid #333; padding-top: 6px;">
                        <button class="btn-filtro-cor" data-cor="todos" style="background: #333; color: #fff; border: 1px solid #555; padding: 3px 8px; border-radius: 3px; font-size: 0.75rem; cursor: pointer; font-weight: bold;">Todas</button>
                        <button class="btn-filtro-cor" data-cor="vermelha" style="background: #8b0000; color: #fff; border: none; padding: 3px 8px; border-radius: 3px; font-size: 0.75rem; cursor: pointer;">Vermelha</button>
                        <button class="btn-filtro-cor" data-cor="azul" style="background: #00008b; color: #fff; border: none; padding: 3px 8px; border-radius: 3px; font-size: 0.75rem; cursor: pointer;">Azul</button>
                        <button class="btn-filtro-cor" data-cor="amarela" style="background: #b8860b; color: #fff; border: none; padding: 3px 8px; border-radius: 3px; font-size: 0.75rem; cursor: pointer;">Amarela</button>
                        <button class="btn-filtro-cor" data-cor="preta" style="background: #222; color: #fff; border: 1px solid #555; padding: 3px 8px; border-radius: 3px; font-size: 0.75rem; cursor: pointer;">Preta</button>
                        <button class="btn-filtro-cor" data-cor="branca" style="background: #ddd; color: #000; border: none; padding: 3px 8px; border-radius: 3px; font-size: 0.75rem; cursor: pointer;">Branca</button>
                        <button class="btn-filtro-cor" data-cor="mescla" style="background: #551a8b; color: #fff; border: none; padding: 3px 8px; border-radius: 3px; font-size: 0.75rem; cursor: pointer;">Mescla</button>
                    </div>
                `;
                
                gridMagias.parentNode.insertBefore(painelTinta, gridMagias);
                
                document.getElementById('select-qualidade-tinta').onchange = (e) => {
                    salvarEAtualizarTinta(e.target.value);
                };
                
                painelTinta.querySelectorAll('.btn-filtro-cor').forEach(btn => {
                    btn.onclick = (e) => {
                        filtroCorDiogenes = e.target.getAttribute('data-cor');
                        painelTinta.querySelectorAll('.btn-filtro-cor').forEach(b => b.style.outline = 'none');
                        e.target.style.outline = '2px solid #fff';
                        renderizarCards(userGrimoire);
                    };
                });
            }
        } else {
            painelTinta.style.display = 'flex';
        }
        
        carregarTintaDoFirebase();
    } else {
        if (painelTinta) painelTinta.style.display = 'none';
    }
}

function salvarEAtualizarTinta(qualidade) {
    const limites = { ruim: 2, boa: 5, perfeita: 10 };
    limiteTintaDiogenes = limites[qualidade] || 5;
    
    const statusEl = document.getElementById('status-limite-tinta');
    if (statusEl) {
        statusEl.innerText = `Capacidade: ${limiteTintaDiogenes}`;
    }
    
    if (typeof userGrimoire !== 'undefined') {
        renderizarCards(userGrimoire);
    }
    
    set(ref(db, `characters/diogenes/qualidadeTinta`), {
        qualidade: qualidade,
        limite: limiteTintaDiogenes
    }).then(() => {
        if (typeof registrarLog === "function") {
            registrarLog(`Diógenes ajustou a qualidade da tinta para: ${qualidade.toUpperCase()} (${limiteTintaDiogenes} efeitos).`);
        }
    });
}

function carregarTintaDoFirebase() {
    const tintaRef = ref(db, `characters/diogenes/qualidadeTinta`);
    onValue(tintaRef, (snapshot) => {
        const dados = snapshot.val();
        if (dados && dados.qualidade) {
            const select = document.getElementById('select-qualidade-tinta');
            if (select) select.value = dados.qualidade;
            
            limiteTintaDiogenes = dados.limite || 5;
            const statusEl = document.getElementById('status-limite-tinta');
            if (statusEl) statusEl.innerText = `Capacidade: ${limiteTintaDiogenes}`;
            
            if (typeof userGrimoire !== 'undefined') {
                renderizarCards(userGrimoire);
            }
        }
    }, { onlyOnce: true });
}

// ==========================================
// 19. CONSUMO DE TINTA (DIÓGENES)
// ==========================================
function usarEfeitoDiogenes(efeito) {
    if (!currentUser || currentUser.toLowerCase() !== 'diogenes') return true;

    const coresNecessarias = [];

    if (efeito.cor !== 'mescla') {
        coresNecessarias.push(efeito.cor);
    } else {
        const receitaLower = efeito.receita.toLowerCase();
        
        if (receitaLower.includes('todas')) {
            coresNecessarias.push('vermelha', 'azul', 'amarela', 'preta', 'branca');
        } else {
            if (receitaLower.includes('vermelh')) coresNecessarias.push('vermelha');
            if (receitaLower.includes('azul')) coresNecessarias.push('azul');
            if (receitaLower.includes('amarel')) coresNecessarias.push('amarela');
            if (receitaLower.includes('pret')) coresNecessarias.push('preta');
            if (receitaLower.includes('branc')) coresNecessarias.push('branca');
        }
    }

    const tintasFaltando = [];
    coresNecessarias.forEach(cor => {
        if (!estoqueTintasDiogenes[cor] || estoqueTintasDiogenes[cor] <= 0) {
            tintasFaltando.push(cor.toUpperCase());
        }
    });

    if (tintasFaltando.length > 0) {
        alert(`❌ Tinta insuficiente para a mescla! Faltam cargas de: ${tintasFaltando.join(', ')}.`);
        return false; 
    }

    coresNecessarias.forEach(cor => {
        estoqueTintasDiogenes[cor]--;
    });

    atualizarPainelTintasVisual();
    salvarEstoqueNoFirebase();

    const detalheConsumo = coresNecessarias.map(c => c.toUpperCase()).join(' + ');
    registrarLog(`Diógenes conjurou "${efeito.nome}" gastando [${detalheConsumo}].`);

    return true;
}
function atualizarPainelTintasVisual() {
    ['vermelha', 'azul', 'amarela', 'preta', 'branca', 'mescla'].forEach(cor => {
        const el = document.getElementById(`estoque-${cor}`);
        if (el) el.innerText = estoqueTintasDiogenes[cor];
    });
}

function salvarEstoqueNoFirebase() {
    set(ref(db, `characters/diogenes/estoqueTintas`), estoqueTintasDiogenes);
}

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
        const img = document.createElement('img'); img.src = url.href; img.alt = titulo; img.loading = 'lazy'; img.className = 'media-preview'; return img;
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
        const frame = document.createElement('iframe'); frame.src = embedUrl; frame.title = titulo; frame.allow = 'fullscreen; picture-in-picture'; frame.allowFullscreen = true; frame.loading = 'lazy'; frame.referrerPolicy = 'strict-origin-when-cross-origin'; frame.className = 'media-preview video-frame';
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
const CACHE_MESA_GRUPO = 'grimorio-mesa-compartilhada-v1';
let cartasMesaCompartilhada = [];
let pararEscutaMesaCompartilhada = null;
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
function renderizarMaoCartas() { const hand=document.getElementById('hand-cards'),preview=document.getElementById('hand-preview');const cards=maoCartaIds.map(id=>userGrimoire.find(card=>String(card.id)===id)).filter(Boolean);const count=`${maoCartaIds.length}/${LIMITE_MAO_CARTAS}`;['hand-summary-count','hand-count-large'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=count;});const tabCount=document.getElementById('hand-tab-count');if(tabCount)tabCount.textContent=String(maoCartaIds.length);if(preview){preview.replaceChildren();if(!cards.length){const p=document.createElement('p');p.textContent='Abra o grimório e escolha até cinco cartas para sua mão.';preview.appendChild(p);}cards.slice(0,4).forEach(card=>{const chip=document.createElement('span');chip.className=`hand-preview-chip ${card.cor||'mescla'}`;chip.textContent=card.nome;preview.appendChild(chip);});if(cards.length>4){const extra=document.createElement('small');extra.textContent=`+${cards.length-4}`;preview.appendChild(extra);}}if(!hand)return;hand.replaceChildren();if(!cards.length){const empty=document.createElement('p');empty.className='hand-empty';empty.textContent='Sua mão está vazia. Abra “Coleção” e adicione cartas; você pode trocar a seleção quando quiser.';hand.appendChild(empty);return;}cards.forEach(card=>{const article=document.createElement('article');article.className=`hand-card ${card.cor||'mescla'}`;const badge=document.createElement('span');badge.className='hand-card-color';badge.textContent=(card.cor||'arcana').toUpperCase();const title=document.createElement('h4');title.textContent=card.nome||'Carta';const effect=document.createElement('p');effect.textContent=card.efeito||'';const actions=document.createElement('div');actions.className='hand-card-actions';const view=document.createElement('button');view.type='button';view.textContent='Ver / usar';view.onclick=()=>abrirModalView(card);const place=document.createElement('button');place.type='button';place.textContent='Pôr na mesa';place.onclick=()=>colocarCartaNaMesaCompartilhada(card);const swap=document.createElement('button');swap.type='button';swap.className='hand-remove';swap.textContent='Trocar';swap.title='Retirar esta carta da mão';swap.onclick=()=>removerCartaDaMao(card.id);actions.append(view,place,swap);article.append(badge,title,effect,actions);hand.appendChild(article);}); }
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
            const title=document.createElement('h3');title.textContent=card.nome||'Carta';const effect=document.createElement('p');effect.textContent=card.efeito||'Sem descrição.';article.append(top,title,effect);
            if(card.receita){const recipe=document.createElement('small');recipe.className='table-card-recipe';recipe.textContent=`Receita · ${card.receita}`;article.appendChild(recipe);}
            if(card.jogador===currentUser||usuarioEhMestreDaMesa()){const removeButton=document.createElement('button');removeButton.type='button';removeButton.className='table-card-remove';removeButton.textContent='Recolher';removeButton.onclick=()=>retirarCartaDaMesa(card.id);article.appendChild(removeButton);}
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
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.getElementById('popup-grimoire')?.classList.contains('hidden'))fecharPopupGrimorio();});

// Arraste desktop: soltar uma carta sobre a mesa abre sua ficha de uso; no celular, toque na carta.
(() => {
    const mesa=document.getElementById('campo-batalha'); if(!mesa)return;
    mesa.addEventListener('dragover',e=>{e.preventDefault();mesa.classList.add('drop-ready');});
    mesa.addEventListener('dragleave',e=>{if(!mesa.contains(e.relatedTarget))mesa.classList.remove('drop-ready');});
    mesa.addEventListener('drop',e=>{e.preventDefault();mesa.classList.remove('drop-ready');const id=e.dataTransfer?.getData('text/plain');const ability=userGrimoire.find(x=>String(x.id||x.nome)===id);if(ability)colocarCartaNaMesaCompartilhada(ability);});
    document.querySelectorAll('[data-table-side]').forEach(lane=>{lane.addEventListener('dragover',e=>{e.preventDefault();lane.classList.add('drop-ready');});lane.addEventListener('dragleave',e=>{if(!lane.contains(e.relatedTarget))lane.classList.remove('drop-ready');});lane.addEventListener('drop',e=>{e.preventDefault();lane.classList.remove('drop-ready');const id=e.dataTransfer?.getData('text/plain');const ability=userGrimoire.find(x=>String(x.id||x.nome)===id);if(ability)colocarCartaNaMesaCompartilhada(ability,lane.dataset.tableSide);});});
})();
