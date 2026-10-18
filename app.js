import { DIOGENES_KIT, determinarModoDio, habilidadeDio } from './diogenes.js';
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
    carregarMesaHabilidades();
    carregarPassatempo();
    
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

    if(listaFinal.length === 0) {
        DOM.grid.innerHTML = "<p class='text-muted' style='grid-column: 1/-1;'>Nenhum efeito encontrado com esta cor ou o limite de tinta esgotou as páginas visíveis!</p>";
        return;
    }

    listaFinal.forEach((ef) => {
        const div = document.createElement('div');
        div.className = `card skill-card ${ef.cor || 'mescla'}`;
        const tag = document.createElement('span'); tag.className = 'skill-card-type'; tag.textContent = String(ef.cor || 'arcana').toUpperCase();
        const title = document.createElement('h3'); title.textContent = ef.nome || 'Habilidade sem nome';
        const effect = document.createElement('p'); effect.textContent = ef.efeito || 'Toque para ver os detalhes da habilidade.';
        const footer = document.createElement('span'); footer.className = 'skill-card-cta'; footer.textContent = 'Desktop: arraste à mesa · Mobile: toque para usar ↗';
        div.append(tag, title, effect, footer);
        div.setAttribute('role', 'button'); div.setAttribute('tabindex', '0'); div.setAttribute('draggable', String(window.matchMedia('(pointer:fine)').matches)); div.dataset.skillId = ef.id || '';
        div.onclick = () => abrirModalView(ef);
        div.onkeydown = (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); abrirModalView(ef); } };
        div.ondragstart = (event) => { event.dataTransfer.setData('text/plain', String(ef.id || ef.nome)); event.dataTransfer.effectAllowed = 'copy'; div.classList.add('is-dragging'); };
        div.ondragend = () => div.classList.remove('is-dragging');
        div.onpointermove = (event) => { if (event.pointerType === 'mouse') { const r=div.getBoundingClientRect(); div.style.setProperty('--tilt-x', `${((event.clientY-r.top)/r.height-.5)*-5}deg`); div.style.setProperty('--tilt-y', `${((event.clientX-r.left)/r.width-.5)*6}deg`); } };
        div.onpointerleave = () => { div.style.removeProperty('--tilt-x'); div.style.removeProperty('--tilt-y'); };
        DOM.grid.appendChild(div);
    });
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
        DOM.modalAdd.style.display = 'none';
        document.getElementById('new-nome').value = "";
        document.getElementById('new-receita').value = "";
        document.getElementById('new-efeito').value = "";
    });
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
        if (btn.getAttribute('data-target') === 'tab-hobbies' && passatempoSomentePc()) { carregarPassatempo(); alert('Os passatempos de batalha estão disponíveis somente no PC.'); return; }
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
        medidorSanidade.value = fichaAtual.sanidade || 100;
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
// MESA DE HABILIDADES E PASSATEMPOS
// ==========================================
let cartasNaMesa = [];
let mesaOwnerConectado = '';
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

function passatempoSomentePc() { return window.matchMedia('(max-width: 820px), (pointer: coarse)').matches; }
function carregarPassatempo() {
    const host = document.getElementById('hobby-game'); if (!host) return;
    if (passatempoSomentePc()) { host.innerHTML = `<section class="hobby-card pc-only-lock"><div class="game-kicker">ARENA DE COMPUTADOR</div><h3>Este passatempo é apenas para PC</h3><p>O minijogo usa teclado, área ampla de combate e controles de precisão. Abra o Grimório em um computador para jogar.</p><span>⌨️ Q W E R · I · Espaço · setas</span></section>`; return; }
    if (host.dataset.initializedUser === currentUser && host.querySelector('#kult-arena')) return;
    host.dataset.initializedUser = currentUser || 'visitante';
    montarArenaKult(host);
}
function setScoreGame(key, score) { localStorage.setItem(`hobby-${key}-${currentUser}`, String(score)); }
function getScoreGame(key) { return Number(localStorage.getItem(`hobby-${key}-${currentUser}`) || 0); }

// Dominique: programação + gestão de uma central de operações contra bots.
function montarJogoDominique(host) {
    let state = { energia: 70, seguranca: 55, caixa: 60, pontuacao: getScoreGame('ops'), rodada: 1, ameaca: 1 };
    host.innerHTML = `<section class="hobby-card ops-game"><div class="game-kicker">DOMINIQUE · CODE & COMMAND · CAMPANHA DE INCIDENTES</div><h3>Protocolo: Última Vigília</h3><p>Um ataque de IA se espalha pela cidade. Administre energia e créditos, escreva correções seguras e vença as fases do bot antes que a infraestrutura colapse. Segure a rede, então faça o deploy.</p><div class="ops-stats"><div><span>Uptime / energia</span><strong id="ops-energy">70%</strong><i><b id="ops-energy-bar"></b></i></div><div><span>Segurança</span><strong id="ops-security">55%</strong><i><b id="ops-security-bar"></b></i></div><div><span>Caixa</span><strong id="ops-cash">60 créditos</strong><i><b id="ops-cash-bar"></b></i></div></div><div class="boss-alert"><span>AMEAÇA ATIVA</span><strong id="ops-threat">Bot invasor · Fase 1</strong><span id="ops-objective">Objetivo: manter segurança e energia, depois executar deploy</span></div><div class="code-console" id="ops-console">$ conexão suspeita detectada\n$ a cidade está no modo de contingência…\n$ aguardando comando da administradora</div><div class="ops-actions"><button data-op="patch" class="btn-mystic"><code>patch_security()</code><small>Corrige vulnerabilidade · +segurança, custa energia</small></button><button data-op="optimize" class="btn-mystic"><code>optimize_server()</code><small>Otimiza recursos · +energia, custa créditos</small></button><button data-op="deploy" class="btn-mystic"><code>deploy()</code><small>Executa a estratégia e enfrenta o bot</small></button></div><div class="game-footer"><span>Rodada <b id="ops-round">1</b> · Vitórias <b id="ops-score">${state.pontuacao}</b></span><button id="ops-reset" class="btn-mystic small">Reiniciar operação</button></div></section>`;
    const update = () => {
        ['energy','security','cash'].forEach(key => { const val = key==='energy'?state.energia:key==='security'?state.seguranca:state.caixa; document.getElementById(`ops-${key}`).textContent = key==='cash'?`${val} créditos`:`${val}%`; document.getElementById(`ops-${key}-bar`).style.width = `${val}%`; });
        document.getElementById('ops-round').textContent = state.rodada; document.getElementById('ops-score').textContent = state.pontuacao;
        const threats = ['Bot invasor','Enxame de ransomware','IA de contenção','Núcleo Ômega'];
        document.getElementById('ops-threat').textContent = `${threats[Math.min(threats.length-1, Math.floor(state.pontuacao/2))]} · Fase ${Math.floor((state.pontuacao % 2)+1)}`;
    };
    host.querySelectorAll('[data-op]').forEach(btn => btn.onclick = () => {
        const log = document.getElementById('ops-console'); let bot = '';
        if (btn.dataset.op === 'patch') { if (state.energia < 15) return log.textContent = '$ energia insuficiente. Otimize o servidor primeiro.'; state.energia -= 15; state.seguranca = Math.min(100,state.seguranca+27); bot = '$ patch aplicado: firewall atualizado.'; }
        if (btn.dataset.op === 'optimize') { if (state.caixa < 12) return log.textContent = '$ caixa insuficiente para otimizar.'; state.caixa -= 12; state.energia = Math.min(100,state.energia+22); bot = '$ cache otimizado: uptime recuperado.'; }
        if (btn.dataset.op === 'deploy') {
            const alvoSeguranca = Math.min(90, 70 + Math.floor(state.pontuacao / 3) * 5);
            if (state.seguranca >= alvoSeguranca && state.energia >= 45) { state.pontuacao++; state.caixa = Math.min(100,state.caixa+15); state.energia=Math.max(0,state.energia-8); state.seguranca=Math.max(0,state.seguranca-10); bot = `$ deploy seguro! Ameaça neutralizada. +1 vitória e +15 créditos. Próxima fase exige segurança ${Math.min(90,70+Math.floor(state.pontuacao/3)*5)}+.`; }
            else { state.energia = Math.max(0,state.energia-18); state.seguranca = Math.max(0,state.seguranca-12); bot = `$ deploy recusado pelo bot. Reforce segurança (${alvoSeguranca}+) e energia (45+).`; }
            state.rodada++;
        }
        if (btn.dataset.op !== 'deploy') { state.seguranca = Math.max(0,state.seguranca-5); bot += '\n$ bot tentou invadir… -5 segurança.'; }
        state.energia = Math.max(0,state.energia); setScoreGame('ops',state.pontuacao); log.textContent=bot; update();
    });
    document.getElementById('ops-reset').onclick = () => { state.energia=70;state.seguranca=55;state.caixa=60;state.rodada=1;update();document.getElementById('ops-console').textContent='$ operação reiniciada. Escolha uma estratégia.'; };
}

// Diógenes: desenha uma arma mágica no canvas e usa a tinta para enfrentar bots.
function montarJogoDiogenes(host) {
    const best = getScoreGame('paint');
    host.innerHTML = `<section class="hobby-card paint-game"><div class="game-kicker">DIÓGENES · TINTA EM COMBATE</div><h3>Ateliê de Batalha</h3><p>Desenhe uma runa/arma na tela. Quanto mais criativa a pintura, mais dano causa no bot. No celular, desenhe com o dedo.</p><div class="paint-status"><span>Alvo: <b id="paint-bot-name">Sentinela de Sucata</b></span><span>Fraqueza: <b id="paint-weakness">Tinta vermelha</b></span><span>Vida do bot: <b id="paint-bot-hp">40</b></span><span>Sua integridade: <b id="paint-player-hp">100</b></span><span>Vitórias: <b id="paint-score">${best}</b></span></div><canvas id="paint-canvas" width="720" height="360" aria-label="Área de desenho para criar uma arma de tinta"></canvas><div class="paint-tools"><label for="paint-color">Tinta</label><select id="paint-color" class="input-mystic"><option value="#e34d4d" data-ink="vermelha">Vermelha · fogo</option><option value="#48a4e8" data-ink="azul">Azul · maré</option><option value="#f2c94c" data-ink="amarela">Amarela · luz</option><option value="#e9e9e9" data-ink="branca">Branca · vazio</option><option value="#222222" data-ink="preta">Preta · matéria</option></select><label>Traço <input id="paint-width" type="range" min="3" max="30" value="10"></label><button id="paint-clear" class="btn-mystic small">Limpar tela</button><button id="paint-attack" class="btn-mystic paint-attack">⚔️ Atacar com a pintura</button></div><p id="paint-message" class="text-muted">Desenhe algo e ataque quando estiver pronto. Recorde pessoal: ${best} vitórias.</p></section>`;
    const canvas = document.getElementById('paint-canvas'), ctx=canvas.getContext('2d'); let drawing=false, strokes=0, points=0, wins=best, hp=40, integridade=100;
    const inimigos=['Sentinela de Sucata','Drone de Patrulha','Golem de Código','Anjo de Ferro','Arconte do Abismo'];
    const fraquezas=['vermelha','azul','amarela','preta','branca'];
    function prepararInimigo(){ const boss=(wins+1)%3===0; const base=boss?90:40+Math.min(35,wins*4); hp=base; document.getElementById('paint-bot-name').textContent=boss?`👑 CHEFE: ${inimigos[wins%inimigos.length]}`:inimigos[wins%inimigos.length]; document.getElementById('paint-weakness').textContent=`Tinta ${fraquezas[wins%fraquezas.length]}`; document.getElementById('paint-bot-hp').textContent=hp; }
    const colorInput=document.getElementById('paint-color'); ctx.lineCap='round';ctx.lineJoin='round';
    function point(e){ const r=canvas.getBoundingClientRect(); return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}; }
    canvas.addEventListener('pointerdown',e=>{e.preventDefault();drawing=true;strokes++;canvas.setPointerCapture(e.pointerId);const p=point(e);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.strokeStyle=colorInput.value;ctx.lineWidth=Number(document.getElementById('paint-width').value)*canvas.width/rangeWidth();ctx.lineTo(p.x+0.1,p.y+0.1);ctx.stroke();});
    canvas.addEventListener('pointermove',e=>{if(!drawing)return;const p=point(e);ctx.lineTo(p.x,p.y);ctx.stroke();points++;});
    ['pointerup','pointercancel','pointerleave'].forEach(ev=>canvas.addEventListener(ev,()=>drawing=false));
    function rangeWidth(){return Math.max(1,canvas.getBoundingClientRect().width);}
    document.getElementById('paint-clear').onclick=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);strokes=0;points=0;document.getElementById('paint-message').textContent='Tela limpa. Desenhe sua arma.';};
    prepararInimigo();
    document.getElementById('paint-attack').onclick=()=>{
        const message=document.getElementById('paint-message');
        if(integridade<=0)return message.textContent='Você caiu no combate. Use Retomar combate para voltar à arena.';
        if(strokes===0)return message.textContent='Primeiro desenhe uma runa ou arma na tela.';
        const ink=colorInput.selectedOptions[0].dataset.ink;
        if(estoqueTintasDiogenes[ink]!==undefined && estoqueTintasDiogenes[ink] <= 0) return message.textContent=`Acabou a tinta ${ink}. Escolha outra cor ou recarregue seu estoque.`;
        if(estoqueTintasDiogenes[ink]!==undefined){estoqueTintasDiogenes[ink]--; atualizarPainelTintasVisual(); salvarEstoqueNoFirebase();}
        const comboBonus=ink===fraquezas[wins%fraquezas.length]?12:0;
        const boss=(wins+1)%3===0;
        const dano=Math.min(55,Math.max(5,Math.round(5+strokes*2+points/22+comboBonus)));
        hp=Math.max(0,hp-dano);
        document.getElementById('paint-bot-hp').textContent=hp;
        message.textContent=`Você invoca sua pintura: ${dano} de dano${comboBonus?' · FRAQUEZA EXPLORADA! +12':''}.`;
        if(hp<=0){wins++;setScoreGame('paint',wins);document.getElementById('paint-score').textContent=wins;message.textContent=`EXECUÇÃO ARCANA! O alvo foi derrotado pela sua obra. ${wins%3===0?'Um CHEFE atravessa o véu!':'Outro inimigo entrou na arena.'}`;prepararInimigo();}
        else {integridade=Math.max(0,integridade-(boss?22:12));document.getElementById('paint-player-hp').textContent=integridade;message.textContent+=` O bot contra-ataca: −${boss?22:12} integridade.`;}
        ctx.clearRect(0,0,canvas.width,canvas.height);strokes=0;points=0;
    };
    const restart=document.createElement('button');restart.className='btn-mystic small';restart.textContent='Retomar combate';restart.onclick=()=>{integridade=100;document.getElementById('paint-player-hp').textContent=integridade;message.textContent='A pintura desperta novamente. Desenhe sua próxima arma.';};document.querySelector('.paint-tools').appendChild(restart);
}

document.querySelectorAll('[data-target="tab-hobbies"]').forEach(button => button.addEventListener('click', carregarPassatempo));

// Arena de ação KULT: controles Q/W/E/R, mobilidade e loja, com interface para toque.
const KULT_ARENA_ENEMIES = [
 {name:'Drone Oco', title:'Sentinela', hp:85, speed:24, damage:8, cadence:1.7, pattern:'aim'},
 {name:'Parasita de Fio', title:'Caçador', hp:105, speed:52, damage:9, cadence:1.4, pattern:'triple'},
 {name:'Cão de Vidro', title:'Investida', hp:125, speed:68, damage:11, cadence:2.2, pattern:'charge'},
 {name:'Torre de Sal', title:'Artilharia', hp:150, speed:14, damage:12, cadence:2.0, pattern:'lanes'},
 {name:'Espiral do Véu', title:'Espiral', hp:165, speed:26, damage:12, cadence:1.8, pattern:'spiral'},
 {name:'Devorador de Ecos', title:'Anel de Ruína', hp:185, speed:32, damage:13, cadence:2.3, pattern:'ring'},
 {name:'Tecelão de Minas', title:'Campo Minado', hp:205, speed:18, damage:14, cadence:2.1, pattern:'mine'},
 {name:'Olho de Cobalto', title:'Raio', hp:230, speed:12, damage:15, cadence:2.4, pattern:'beam'},
 {name:'Ninhada Impossível', title:'Rajada', hp:255, speed:54, damage:15, cadence:1.6, pattern:'volley'},
 {name:'Abominação Rubra', title:'Onda Sísmica', hp:290, speed:36, damage:17, cadence:2.1, pattern:'pulse'},
 {name:'Mímico de Carne', title:'Duplo Reflexo', hp:330, speed:58, damage:18, cadence:1.5, pattern:'echo'},
 {name:'Arconte de Mercúrio', title:'Tempestade', hp:365, speed:30, damage:19, cadence:1.9, pattern:'storm'},
 {name:'Cavaleiro do Nada', title:'Lança Sombria', hp:410, speed:72, damage:21, cadence:1.8, pattern:'lance'},
 {name:'Mãe das Fendas', title:'Fendas', hp:455, speed:23, damage:22, cadence:1.7, pattern:'rift'},
 {name:'Anjo Desfigurado', title:'Chuva Celeste', hp:510, speed:48, damage:24, cadence:1.6, pattern:'rain'},
 {name:'Leviatã de Dados', title:'Maré de Dados', hp:575, speed:36, damage:26, cadence:1.45, pattern:'tide'},
 {name:'O Rei sem Rosto', title:'Caçada', hp:650, speed:82, damage:28, cadence:1.35, pattern:'hunt'},
 {name:'A Cidade que Sonha', title:'Labirinto', hp:740, speed:45, damage:31, cadence:1.2, pattern:'maze'},
 {name:'Deus-Máquina', title:'Colapso', hp:860, speed:35, damage:34, cadence:1.05, pattern:'collapse'},
 {name:'O Impossível', title:'Absurdo', hp:1100, speed:92, damage:40, cadence:.9, pattern:'absurd'}
];

const KULT_ARENA_ITEMS = [
 {id:'faca',name:'Faca de Caça',cat:'Físico',cost:70,desc:'+16 ataque físico e +3% roubo de vida',stats:{ad:16,lifeSteal:3}},
 {id:'machado',name:'Machado de Ferro',cat:'Físico',cost:110,desc:'+28 ataque físico; golpes básicos causam +5',stats:{ad:28,basic:5}},
 {id:'arco',name:'Arco de Osso',cat:'Físico',cost:125,desc:'+16 ataque e +12% chance crítica',stats:{ad:16,crit:12}},
 {id:'lanca',name:'Lança Perfurante',cat:'Físico',cost:145,desc:'+22 ataque e ignora 8 de armadura',stats:{ad:22,penetration:8}},
 {id:'luvas',name:'Luvas do Carrasco',cat:'Físico',cost:155,desc:'+14 ataque e +18% velocidade de ataque',stats:{ad:14,attackSpeed:18}},
 {id:'lamina',name:'Lâmina da Fenda',cat:'Físico',cost:190,desc:'+34 ataque e +8% crítico',stats:{ad:34,crit:8}},
 {id:'tomo',name:'Tomo de Sigilos',cat:'AP',cost:90,desc:'+24 poder arcano',stats:{ap:24}},
 {id:'varinha',name:'Varinha de Mercúrio',cat:'AP',cost:120,desc:'+20 poder arcano e +8 aceleração',stats:{ap:20,haste:8}},
 {id:'orbe',name:'Orbe do Vazio',cat:'AP',cost:155,desc:'+38 poder arcano e +10 penetração mágica',stats:{ap:38,magicPen:10}},
 {id:'cetro',name:'Cetro de Tempestade',cat:'AP',cost:175,desc:'+28 poder arcano e +20% velocidade de ataque',stats:{ap:28,attackSpeed:20}},
 {id:'prisma',name:'Prisma das Marés',cat:'AP',cost:180,desc:'+30 poder arcano, +18 resistência mágica',stats:{ap:30,mr:18}},
 {id:'grimorio',name:'Grimório Vivo',cat:'AP',cost:220,desc:'+50 poder arcano e +16 aceleração',stats:{ap:50,haste:16}},
 {id:'couro',name:'Casaco de Couro',cat:'Defesa',cost:75,desc:'+18 armadura e +12 vida máxima',stats:{armor:18,hp:12}},
 {id:'escudo',name:'Escudo de Sal',cat:'Defesa',cost:115,desc:'+32 armadura e +20 vida máxima',stats:{armor:32,hp:20}},
 {id:'manto',name:'Manto Prismático',cat:'Defesa',cost:125,desc:'+28 resistência mágica e reduz 5% do dano arcano',stats:{mr:28,magicReduce:5}},
 {id:'coracao',name:'Coração Vital',cat:'Defesa',cost:150,desc:'+55 vida máxima e regenera 1,5 vida/s',stats:{hp:55,hpRegen:1.5}},
 {id:'couraca',name:'Couraça dos Condenados',cat:'Defesa',cost:185,desc:'+48 armadura e +35 vida máxima',stats:{armor:48,hp:35}},
 {id:'aegis',name:'Égide do Fim',cat:'Defesa',cost:230,desc:'+35 armadura, +35 resistência mágica, +30 vida',stats:{armor:35,mr:35,hp:30}},
 {id:'botas',name:'Botas de Fuga',cat:'Utilidade',cost:80,desc:'+22% movimento e esquiva recarrega 15% mais rápido',stats:{move:22,dashHaste:15}},
 {id:'ampulheta',name:'Ampulheta Quebrada',cat:'Utilidade',cost:145,desc:'+18 aceleração; reduz recarga de habilidades',stats:{haste:18}},
 {id:'moeda',name:'Moeda do Trapaceiro',cat:'Utilidade',cost:115,desc:'+20% ouro ao derrotar um inimigo',stats:{goldBonus:20}},
 {id:'foco',name:'Foco de Caçador',cat:'Utilidade',cost:130,desc:'+28 alcance e mostra o próximo ataque inimigo mais cedo',stats:{reach:28,telegraph:0.35}},
 {id:'cinto',name:'Cinto de Guerra',cat:'Utilidade',cost:135,desc:'+12 vida, +12 mana e +8 velocidade',stats:{hp:12,mana:12,move:8}},
 {id:'bateria',name:'Bateria de Éter',cat:'Utilidade',cost:140,desc:'+30 mana máxima e +2,2 regeneração de mana/s',stats:{mana:30,manaRegen:2.2}},
 {id:'pocaoVida',name:'Poção Hemática',cat:'Consumível',cost:38,desc:'Ative com I: restaura 45 de vida',active:'heal'},
 {id:'pocaoMana',name:'Frasco de Éter',cat:'Consumível',cost:35,desc:'Ative com I: restaura 45 de mana',active:'mana'},
 {id:'elixir',name:'Elixir de Fúria',cat:'Consumível',cost:65,desc:'Ative com I: cura 25 e +25 dano por 12s',active:'fury'},
 {id:'bomba',name:'Bomba de Tinta',cat:'Consumível',cost:70,desc:'Ative com I: explode, causa 75 de dano e limpa projéteis próximos',active:'bomb'},
 {id:'selo',name:'Selo de Purificação',cat:'Consumível',cost:55,desc:'Ative com I: apaga projéteis e concede invulnerabilidade breve',active:'purge'},
 {id:'nucleo',name:'Núcleo de Reposição',cat:'Consumível',cost:60,desc:'Ative com I: restaura 25 vida, 35 mana e recarrega esquiva',active:'recharge'}
];

function montarArenaKult(host) {
    const player=(currentUser||'Viajante').toLowerCase();
    const hero=player.includes('diogenes')||player.includes('diógenes')?'diogenes':player.includes('dominique')?'dominique':'grimorio';
    const isDio=hero==='diogenes', isDom=hero==='dominique';
    const saveKey=`kult-arena-${currentUser}`;
    let saved={}; try { saved=JSON.parse(localStorage.getItem(saveKey)||'{}'); } catch {}
    const state={
        hp:100,maxHp:120,mana:100,maxMana:100,gold:80,wave:1,kills:0,inventory:Array.isArray(saved.inventory)?saved.inventory:[],
        activeId:saved.activeId||'',ink:saved.ink||'vermelha',utility:saved.utility||'branca',blackTarget:saved.blackTarget||'mana',
        x:190,y:300,vx:0,vy:0,keys:{},projectiles:[],enemyShots:[],particles:[],markers:[],adds:[],currentDioMode:'damage',lastInk:saved.lastInk||'vermelha',cd:{q:0,w:0,e:0,r:0,u:0},dashCd:0,dashUntil:0,invulnerable:0,shieldUntil:0,stunUntil:0,burnUntil:0,slowedUntil:0,lastHit:0,lastBasic:0,enemyTimer:1.1,warning:null,charge:null,alive:true,frame:0,lastSave:0,score:Number(saved.score)||0,
        stats:{ad:0,ap:0,armor:0,mr:0,hp:0,mana:0,hpRegen:0,manaRegen:0,haste:0,crit:0,lifeSteal:0,move:0,dashHaste:0,goldBonus:0,penetration:0,magicPen:0,magicReduce:0,basic:0,attackSpeed:0,reach:0,telegraph:0},
        enemy:null
    };
    state.wave=Math.max(1,Number(saved.wave)||1); state.kills=Math.max(0,Number(saved.kills)||0); state.gold=Math.max(0,Number(saved.gold??80)); if(!['vermelha','azul','amarela'].includes(state.ink))state.ink='vermelha';
    const colors=Object.fromEntries(Object.entries(DIOGENES_KIT.inks).map(([key,ink])=>[key,ink.color]));
    const inks=Object.keys(DIOGENES_KIT.inks);if(!DIOGENES_KIT.ultimates[state.lastInk])state.lastInk=state.ink;

    host.innerHTML=`<section id="kult-arena" class="hobby-card arena-shell ${isDio?'arena-diogenes':isDom?'arena-dominique':'arena-generic'}">
      <header class="arena-title"><div><p class="game-kicker">KULT · SOBREVIVÊNCIA EM TEMPO REAL</p><h3>${isDio?'Diógenes · A Tela Viva':isDom?'Dominique · Protocolo de Guerra':`${currentUser} · Arena do Véu`}</h3><p>${isDio?'Pinte, combine pigmentos e apague o impossível.':isDom?'Escreva a ofensiva, proteja o sistema e faça deploy sob pressão.':'Sobreviva, aprimore seus atributos e vença os horrores.'}</p></div><div class="wave-badge">ONDA <b id="arena-wave"></b><small id="arena-threat-level"></small></div></header>
      ${isDio?`<section class="ink-console"><div class="ink-select-row"><span class="game-kicker">PALETA DE COMBATE · Q / W / E</span><div class="ink-buttons">${inks.map(i=>`<button class="ink-choice" data-ink="${i}" style="--ink:${colors[i]}">${i==='vermelha'?'🔴 Cinza rubra':i==='azul'?'🔵 Tinta azul':'🟡 Ocre vivo'}</button>`).join('')}</div></div><div class="dio-mode-banner"><strong id="dio-mode-label">MODO DANO</strong><span id="dio-mode-desc">A tinta se adapta ao combate.</span></div><div class="utility-row"><label>U · Tinta utilitária <select id="arena-utility"><option value="branca">Branca · apagar o perigo</option><option value="preta">Preta · absorver / obter</option></select></label><label id="black-target-label">O que absorver <select id="arena-black-target"><option value="vida">Vida</option><option value="mana">Mana</option><option value="ouro">Ouro</option><option value="forca">Força temporária</option></select></label><p id="arena-ult-evolves">R · A Suprema muda conforme a última cor usada.</p></div></section>`:''}
      <div class="arena-hud"><div class="hero-hud"><div class="hud-label"><span>VIDA</span><b id="arena-hp-text"></b></div><div class="meter hp"><i id="arena-hp-bar"></i></div><div class="hud-label"><span>MANA</span><b id="arena-mana-text"></b></div><div class="meter mana"><i id="arena-mana-bar"></i></div></div><div class="arena-resources"><span>🪙 <b id="arena-gold"></b></span><span>☠️ <b id="arena-kills"></b></span><span>🎒 <b id="arena-slots"></b></span></div></div>
      <div class="arena-stage-wrap"><canvas id="arena-canvas" width="1200" height="560" aria-label="Arena de batalha KULT"></canvas><div class="stage-overlay" id="arena-message"></div></div>
      <div class="arena-controls"><div class="arena-dpad"><button class="arena-action move" data-move="up" aria-label="Mover para cima">▲</button><div><button class="arena-action move" data-move="left" aria-label="Mover para esquerda">◀</button><button class="arena-action move" data-move="down" aria-label="Mover para baixo">▼</button><button class="arena-action move" data-move="right" aria-label="Mover para direita">▶</button></div><button class="arena-action dodge" data-action="dash"><kbd>ESPAÇO</kbd><b>Esquiva</b><small id="arena-dash-cd">Pronta</small></button></div><div class="spell-controls" id="arena-spells"></div></div>
      <div class="touch-hint">PC: setas movem · Q/W/E/R habilidades · U tinta utilitária · I item ativo · Espaço esquiva · clique na arena ataca. Mobile: use o direcional e os botões.</div>
      <section class="arena-shop"><div class="shop-heading"><div><p class="game-kicker">ARSENAL · 30 RELÍQUIAS</p><h4>Loja de campo</h4></div><span>Ouro <b id="arena-shop-gold"></b> · inventário <b id="arena-inventory-count"></b>/6</span></div><div id="arena-categories" class="arena-categories"></div><div class="shop-items" id="arena-shop-items"></div><div class="active-item-row"><label for="arena-active-item">Item na tecla I</label><select id="arena-active-item" class="input-mystic"></select><button id="arena-use-item" class="btn-mystic small">Usar item (I)</button></div><div id="arena-inventory" class="arena-inventory"></div></section><p id="arena-combat-log" class="arena-log"></p></section>`;

    const canvas=host.querySelector('#arena-canvas'),ctx=canvas.getContext('2d');
    const spellHost=host.querySelector('#arena-spells');
    let lastHud=0;
    function getItem(id){return KULT_ARENA_ITEMS.find(x=>x.id===id);}
    function recalcStats(){state.stats={ad:0,ap:0,armor:0,mr:0,hp:0,mana:0,hpRegen:0,manaRegen:0,haste:0,crit:0,lifeSteal:0,move:0,dashHaste:0,goldBonus:0,penetration:0,magicPen:0,magicReduce:0,basic:0,attackSpeed:0,reach:0,telegraph:0};state.inventory.forEach(slot=>{const item=getItem(slot.id);if(item?.stats)Object.entries(item.stats).forEach(([k,v])=>state.stats[k]=(state.stats[k]||0)+v*(slot.count||1));});state.maxHp=120+state.stats.hp;state.maxMana=100+state.stats.mana;state.hp=Math.min(state.hp,state.maxHp);state.mana=Math.min(state.mana,state.maxMana);}
    function save(){try{localStorage.setItem(saveKey,JSON.stringify({hp:state.hp,maxHp:state.maxHp,mana:state.mana,maxMana:state.maxMana,gold:state.gold,wave:state.wave,kills:state.kills,inventory:state.inventory,activeId:state.activeId,ink:state.ink,utility:state.utility,blackTarget:state.blackTarget,lastInk:state.lastInk,score:state.score}));}catch{}}
    function enemyForWave(wave){const idx=(wave-1)%20,loop=Math.floor((wave-1)/20),base=KULT_ARENA_ENEMIES[idx],scale=1+loop*.85+Math.max(0,wave-1)*.085;return {...base,index:idx,level:loop+1,maxHp:Math.round(base.hp*scale),hp:Math.round(base.hp*scale),speed:base.speed*(1+loop*.18),damage:base.damage*(1+loop*.32),cadence:Math.max(.48,base.cadence/(1+loop*.08)),armor:Math.round(idx*1.25+loop*12),mr:Math.round(idx*.9+loop*10),damageType:idx%3===0?'physical':'magic',x:1080,y:300,radius:idx===19?48:27,attackCd:1.1,attackCount:0,phase:Math.random()*6,telegraph:0};}
    function minionsForWave(wave){const count=Math.min(5,Math.floor((wave-1)/2));return Array.from({length:count},(_,i)=>{const proto=KULT_ARENA_ENEMIES[(wave+i*3+6)%20],hp=Math.round((34+wave*8)*(1+Math.floor((wave-1)/20)*.65));return {...proto,name:`Eco ${i+1} · ${proto.name}`,index:(wave+i*3+6)%20,level:Math.ceil(wave/20),hp,maxHp:hp,damage:Math.max(5,proto.damage*.42+wave*.5),speed:Math.max(18,proto.speed*.7),x:820+i*62,y:100+(i%3)*140,radius:17,attackCd:.8+i*.25,cadence:Math.max(1.8,proto.cadence*1.8),attackCount:0,phase:Math.random()*6,telegraph:0,slowUntil:0,stunned:0,burn:0,damageType:'magic'};});}
    function say(text){host.querySelector('#arena-combat-log').textContent=text;}
    function showBanner(text){const el=host.querySelector('#arena-message');el.textContent=text;el.classList.add('show');clearTimeout(state.bannerTimer);state.bannerTimer=setTimeout(()=>el.classList.remove('show'),2100);}
    function getInkLabel(){return DIOGENES_KIT.inks[state.ink]?.label||'Tinta';}
    function getDioMode(){return determinarModoDio({vida:state.hp/Math.max(1,state.maxHp),inimigos:1+state.adds.length,chefe:state.enemy?.index===19,telegraph:!!state.warning||!!state.enemy?.telegraph});}
    function renderSpellButtons(){
      const mode=isDio?getDioMode():'damage';state.currentDioMode=mode;
      const labels=isDio?{
        q:habilidadeDio(state.ink,'q',mode),w:habilidadeDio(state.ink,'w',mode),e:habilidadeDio(state.ink,'e',mode),r:habilidadeDio(state.lastInk||state.ink,'r',mode)
      }:{q:{name:'Compile: Q',effect:'Ataque programado'},w:{name:'Firewall: W',effect:'Proteção / recuperação'},e:{name:'Debug: E',effect:'Interrupção'},r:{name:'Kernel Panic: R',effect:'Suprema'}};
      spellHost.innerHTML=['q','w','e','r'].map(k=>`<button class="arena-action spell ${k==='r'?'ultimate':''}" data-spell="${k}" title="${labels[k].effect||''} · ${labels[k].marker||''}"><kbd>${k.toUpperCase()}</kbd><b>${labels[k].name}</b><small id="cd-${k}">${labels[k].effect||''}</small></button>`).join('')+`<button class="arena-action utility" data-spell="u"><kbd>U</kbd><b>${isDio?(state.utility==='branca'?'Apagar':'Absorver'):'Utilitário'}</b><small id="cd-u">${isDio?DIOGENES_KIT.utility[state.utility]?.effect:'Limpar projéteis'}</small></button><button class="arena-action item-key" data-spell="i"><kbd>I</kbd><b>Item ativo</b><small id="arena-i-label">${getItem(state.activeId)?.name||'Escolha na loja'}</small></button><button class="arena-action auto" data-spell="basic"><kbd>CLIQUE</kbd><b>Ataque básico</b><small>Sem mana</small></button>`;
      spellHost.querySelectorAll('[data-spell]').forEach(btn=>btn.onclick=()=>cast(btn.dataset.spell));
      if(isDio){const modeData=DIOGENES_KIT.modes[mode];host.querySelector('#dio-mode-label').textContent=modeData.label;host.querySelector('#dio-mode-desc').textContent=modeData.description;host.querySelectorAll('.ink-choice').forEach(b=>b.classList.toggle('selected',b.dataset.ink===state.ink));}
    }
    recalcStats();state.hp=Math.min(state.maxHp,Number(saved.hp??state.maxHp));state.mana=Math.min(state.maxMana,Number(saved.mana??state.maxMana));
    if(!state.inventory.length&&Array.isArray(saved.items))state.inventory=saved.items;
    if(state.inventory.length)recalcStats();
    state.enemy=enemyForWave(state.wave);state.adds=minionsForWave(state.wave);

    function renderInventory(){const slots=host.querySelector('#arena-inventory');slots.replaceChildren();state.inventory.forEach((slot,index)=>{const item=getItem(slot.id);if(!item)return;const el=document.createElement('div');el.className='inventory-item-chip';const label=document.createElement('span');label.textContent=`${index+1}. ${item.name}${slot.count>1?` ×${slot.count}`:''}`;const sell=document.createElement('button');sell.type='button';sell.textContent='Vender';sell.title=`Vender por ${Math.floor(item.cost*.5)} ouro`;sell.onclick=()=>{state.gold+=Math.floor(item.cost*.5);if(slot.count>1)slot.count--;else state.inventory.splice(index,1);if(state.activeId===item.id&&!state.inventory.some(x=>x.id===item.id))state.activeId='';recalcStats();renderInventory();say(`${item.name} vendido por ${Math.floor(item.cost*.5)} ouro.`);save();updateHud(true);};el.append(label,sell);slots.append(el);});host.querySelector('#arena-inventory-count').textContent=state.inventory.length;const select=host.querySelector('#arena-active-item');const activeItems=state.inventory.filter(slot=>getItem(slot.id)?.active);select.replaceChildren();if(!activeItems.length){select.add(new Option('Nenhum item ativo comprado',''));state.activeId='';}else{activeItems.forEach(slot=>select.add(new Option(`${getItem(slot.id).name}${slot.count>1?` ×${slot.count}`:''}`,slot.id)));if(!activeItems.some(s=>s.id===state.activeId))state.activeId=activeItems[0].id;select.value=state.activeId;}host.querySelector('#arena-i-label').textContent=getItem(state.activeId)?.name||'Escolha na loja';}
    function updateHud(force=false){
      const now=performance.now();if(!force&&now-lastHud<120)return;lastHud=now;
      if(isDio){const mode=getDioMode();if(mode!==state.currentDioMode){renderSpellButtons();showBanner(`KIT ADAPTADO · ${DIOGENES_KIT.modes[mode].label}`);}}
      const enemy=state.enemy;host.querySelector('#arena-hp-bar').style.width=`${Math.max(0,state.hp/state.maxHp*100)}%`;host.querySelector('#arena-mana-bar').style.width=`${Math.max(0,state.mana/state.maxMana*100)}%`;host.querySelector('#arena-hp-text').textContent=`${Math.ceil(state.hp)} / ${state.maxHp}`;host.querySelector('#arena-mana-text').textContent=`${Math.floor(state.mana)} / ${state.maxMana}`;host.querySelector('#arena-gold').textContent=state.gold;host.querySelector('#arena-shop-gold').textContent=state.gold;host.querySelector('#arena-kills').textContent=state.kills;host.querySelector('#arena-slots').textContent=state.inventory.length;host.querySelector('#arena-wave').textContent=String((state.wave-1)%20+1).padStart(2,'0');host.querySelector('#arena-threat-level').textContent=`${enemy?.title||''} · ${state.adds.length?`${state.adds.length} ecos · `:''}NÍVEL ${enemy?.level||1}`;host.querySelector('#arena-inventory-count').textContent=state.inventory.length;
      for(const key of ['q','w','e','r','u']){const el=host.querySelector(`#cd-${key}`);if(!el)continue;const left=Math.max(0,state.cd[key]-performance.now()/1000);if(key==='u'){el.textContent=left?`${left.toFixed(1)}s`:isDio?DIOGENES_KIT.utility[state.utility]?.effect:'Limpar projéteis';}else if(isDio){const skill=habilidadeDio(key==='r'?(state.lastInk||state.ink):state.ink,key,getDioMode());el.textContent=left?`${left.toFixed(1)}s · ${getInkLabel()}`:(skill?.effect||'Pronta');}else el.textContent=left?`${left.toFixed(1)}s`:'Pronta';const btn=host.querySelector(`[data-spell="${key}"]`);if(btn)btn.classList.toggle('cooldown',left>0);}
      const dashLeft=Math.max(0,state.dashCd-performance.now()/1000);host.querySelector('#arena-dash-cd').textContent=dashLeft?`${dashLeft.toFixed(1)}s`:'Pronta';
    }

    function setCategory(category){host.querySelectorAll('[data-shop-cat]').forEach(b=>b.classList.toggle('active',b.dataset.shopCat===category));host.querySelectorAll('.shop-item').forEach(card=>card.hidden=category!=='Todos'&&card.dataset.category!==category);}
    function renderShop(){const cats=['Todos','Físico','AP','Defesa','Utilidade','Consumível'];host.querySelector('#arena-categories').innerHTML=cats.map(c=>`<button class="shop-filter ${c==='Todos'?'active':''}" data-shop-cat="${c}">${c}</button>`).join('');host.querySelectorAll('[data-shop-cat]').forEach(b=>b.onclick=()=>setCategory(b.dataset.shopCat));const list=host.querySelector('#arena-shop-items');list.innerHTML=KULT_ARENA_ITEMS.map(item=>`<button class="shop-item" data-item="${item.id}" data-category="${item.cat}"><span class="shop-icon">${item.cat==='Físico'?'⚔️':item.cat==='AP'?'🔮':item.cat==='Defesa'?'🛡️':item.cat==='Utilidade'?'🧭':'🧪'}</span><span><b>${item.name}</b><small>${item.desc}</small><em>${item.cat}</em></span><strong>${item.cost}🪙</strong></button>`).join('');list.querySelectorAll('[data-item]').forEach(btn=>btn.onclick=()=>buyItem(btn.dataset.item));}
    function buyItem(id){const item=getItem(id);if(!item)return;if(state.gold<item.cost)return say(`Faltam ${item.cost-state.gold} moedas para ${item.name}. Derrote inimigos e colete ouro.`);let slot=state.inventory.find(x=>x.id===id);if(slot&&(!item.active||slot.count>=3))return say('Esse item já está no inventário ou atingiu o limite de cargas.');if(!slot&&state.inventory.length>=6)return say('Inventário cheio (6 espaços). Cada item tem efeitos próprios; remova/consuma um item ativo antes de comprar.');state.gold-=item.cost;if(slot)slot.count++;else state.inventory.push({id,count:1});if(item.active&&!state.activeId)state.activeId=id;recalcStats();if(item.active){renderInventory();say(`${item.name} comprado. Selecione-o e use I para ativar.`);}else say(`${item.name} equipado: ${item.desc}`);renderInventory();save();updateHud(true);}
    function rollDmg(base,scale=1){const ad=(state.stats.ad+state.stats.basic)*.35,ap=state.stats.ap*.48;const crit=Math.random()*100<state.stats.crit;return Math.round((base+ad+ap)*scale*(crit?1.7:1));}
    function firePlayerProjectile(damage,color,options={}){const e=state.enemy;const dx=e.x-state.x,dy=e.y-state.y;const d=Math.max(1,Math.hypot(dx,dy));const speed=(options.speed||540)+state.stats.reach*1.4;state.projectiles.push({x:state.x+15,y:state.y,vx:dx/d*speed,vy:dy/d*speed,damage,color,r:options.radius||9,stun:options.stun||0,burn:options.burn||0,pierce:options.pierce||false,life:2.8+state.stats.reach/120,magic:options.magic!==false});}
    function damageEnemy(amount,options={}){if(!state.enemy)return;const target=state.enemy;const magic=options.magic!==false;const defense=magic?(target.mr||0):(target.armor||0);const pen=magic?state.stats.magicPen:state.stats.penetration;const effectiveDefense=Math.max(0,defense-pen);const dealt=Math.max(1,Math.round(amount*100/(100+effectiveDefense)));target.hp-=dealt;target.flash=.12;if(state.stats.lifeSteal)state.hp=Math.min(state.maxHp,state.hp+dealt*state.stats.lifeSteal/100);for(let i=0;i<6;i++)state.particles.push({x:target.x,y:target.y,color:options.magic===false?'#ffe68a':'#ba8cff',life:.42,maxLife:.42,vx:(Math.random()-.5)*150,vy:(Math.random()-.5)*150,size:2+Math.random()*3});if(target.hp<=0){killEnemy();return;}if(options.stun)target.stunned=performance.now()/1000+options.stun;if(options.burn)target.burn=performance.now()/1000+options.burn;}
    function addMarker(x,y,r,color,duration=1,shape='circle'){state.markers.push({x,y,r,color,time:duration,max:duration,shape,x2:state.enemy?.x,y2:state.enemy?.y});}
    function damageGroup(amount,options={}){const wave=state.wave,list=[...state.adds];damageEnemy(amount,options);if(state.wave!==wave)return;const now=performance.now()/1000;for(const e of list){if(!state.adds.includes(e))continue;const dealt=Math.max(1,Math.round(amount*100/(100+(e.mr||0))));e.hp-=dealt;e.flash=.14;if(options.stun)e.stunned=now+options.stun;if(options.burn)e.burn=now+options.burn;if(e.hp<=0){state.adds=state.adds.filter(x=>x!==e);state.kills++;state.gold+=Math.max(4,Math.round(7+state.wave*.8));for(let j=0;j<7;j++)state.particles.push({x:e.x,y:e.y,color:options.color||'#b987ff',life:.55,maxLife:.55,vx:(Math.random()-.5)*190,vy:(Math.random()-.5)*190,size:3+Math.random()*3});}}}
    function controlGroup({damage=0,stun=0,slow=0,color='#df76ff',radius=310}){const wave=state.wave,boss=state.enemy,targets=[...state.adds],now=performance.now()/1000;addMarker(state.x+radius*.72,state.y,radius,color,1.25,'ring');if(damage)damageGroup(damage,{stun,burn:0,magic:true,color});if(state.wave!==wave)return;for(const e of targets){if(!state.adds.includes(e))continue;if(Math.hypot(e.x-state.x,e.y-state.y)<radius+e.radius){if(stun)e.stunned=Math.max(e.stunned||0,now+stun);if(slow)e.slowUntil=now+slow;}}if(stun&&Math.hypot(state.enemy.x-state.x,state.enemy.y-state.y)<radius+state.enemy.radius)state.enemy.stunned=now+stun;if(slow)state.enemy.slowUntil=now+slow;}
    function killEnemy(){const old=state.enemy;state.kills++;state.score+=1;const reward=Math.round((22+state.wave*4)*(1+state.stats.goldBonus/100));state.gold+=reward;state.wave++;state.enemy=enemyForWave(state.wave);state.adds=minionsForWave(state.wave);state.enemyTimer=1.2;state.projectiles=[];state.enemyShots=state.enemyShots.filter(b=>b.x<state.x-60);showBanner(`${old.name} foi derrotado · +${reward} ouro · Onda ${(state.wave-1)%20+1}`);say(`Alvo abatido. ${state.enemy.name} se aproxima com ${Math.ceil(state.enemy.hp)} de vida.`);storeSafe();updateHud(true);}
    function storeSafe(){save();}
    function takeHit(amount,kind='magic'){const now=performance.now()/1000;if(now<state.invulnerable)return;if(now<state.shieldUntil){state.shieldUntil=0;say('Seu escudo absorveu o impacto!');return;}const resistance=kind==='physical'?state.stats.armor:state.stats.mr;const mitigation=Math.max(0,resistance)/(100+Math.max(0,resistance));const reduced=Math.max(1,amount*(1-mitigation-(kind==='magic'?state.stats.magicReduce/100:0)));state.hp-=reduced;state.lastHit=now;state.particles.push({x:state.x,y:state.y,color:'#ff4567',life:.45,maxLife:.45,vx:0,vy:0,size:14});host.querySelector('.arena-stage-wrap').classList.add('arena-hit-shake');setTimeout(()=>host.querySelector('.arena-stage-wrap')?.classList.remove('arena-hit-shake'),240);say(`Você sofreu ${Math.ceil(reduced)} de dano. Esquive-se!`);if(state.hp<=0)die();}
    function die(){state.hp=0;state.alive=false;showBanner('VOCÊ CAIU · clique em Retornar à arena');const b=document.createElement('button');b.className='arena-revive';b.textContent='Retornar · 50 ouro ou perder 1 onda';b.onclick=()=>{if(state.gold>=50)state.gold-=50;else{state.wave=Math.max(1,state.wave-1);state.gold=0;}state.hp=Math.ceil(state.maxHp*.55);state.mana=Math.ceil(state.maxMana*.5);state.alive=true;state.enemy=enemyForWave(state.wave);state.adds=minionsForWave(state.wave);state.enemyShots=[];b.remove();save();updateHud(true);};host.querySelector('.arena-stage-wrap').appendChild(b);save();}
    function dash(){const now=performance.now()/1000;if(!state.alive||now<state.dashCd)return;let dx=(state.keys.right?1:0)-(state.keys.left?1:0),dy=(state.keys.down?1:0)-(state.keys.up?1:0);if(!dx&&!dy){dx=state.lastDirX||1;dy=state.lastDirY||0;}const d=Math.hypot(dx,dy)||1;state.dashDx=dx/d;state.dashDy=dy/d;state.dashUntil=now+.22;state.invulnerable=now+.48;state.dashCd=now+Math.max(.85,2.3*(1-state.stats.dashHaste/100));state.particles.push({x:state.x,y:state.y,color:isDio?colors[state.ink]:'#6ccaff',life:.35});}
    function cast(key){if(!state.alive)return;const now=performance.now()/1000;if(key==='basic'){if(now-state.lastBasic<Math.max(.24,.62-state.stats.attackSpeed/200))return;state.lastBasic=now;firePlayerProjectile(rollDmg(13+state.stats.basic,.9),isDio?colors[state.ink]:'#82dcff',{speed:690,radius:5,magic:false});return;}
      if(key==='i'){const item=getItem(state.activeId);const slot=state.inventory.find(x=>x.id===state.activeId);if(!item?.active||!slot?.count)return say('Escolha um item ativo no inventário e compre-o na loja.');slot.count--;if(item.active==='heal')state.hp=Math.min(state.maxHp,state.hp+45);if(item.active==='mana')state.mana=Math.min(state.maxMana,state.mana+45);if(item.active==='fury'){state.hp=Math.min(state.maxHp,state.hp+25);state.damageBuff=now+12;}if(item.active==='bomb'){damageGroup(75+state.stats.ap*.3,{color:'#ff724e'});addMarker(state.enemy.x,state.enemy.y,210,'#ff724e',.8);state.enemyShots=state.enemyShots.filter(b=>Math.hypot(b.x-state.x,b.y-state.y)>160);}if(item.active==='purge'){state.enemyShots=state.enemyShots.filter(b=>Math.hypot(b.x-state.x,b.y-state.y)>220);state.invulnerable=now+1.4;}if(item.active==='recharge'){state.hp=Math.min(state.maxHp,state.hp+25);state.mana=Math.min(state.maxMana,state.mana+35);state.dashCd=now;}if(!slot.count)state.inventory=state.inventory.filter(x=>x.id!==item.id);if(!state.inventory.some(x=>getItem(x.id)?.active))state.activeId='';renderInventory();say(`${item.name} ativado.`);save();return;}
      if(key==='u'){if(now<state.cd.u)return say(`Utilitário recarregando: ${(state.cd.u-now).toFixed(1)}s`);state.cd.u=now+15;if(!isDio){state.enemyShots=state.enemyShots.filter(b=>Math.hypot(b.x-state.x,b.y-state.y)>180);state.invulnerable=now+.7;say('U · rotina de limpeza removeu os projéteis próximos.');}else if(state.utility==='branca'){const before=state.enemyShots.length;state.enemyShots=state.enemyShots.filter(b=>Math.hypot(b.x-state.x,b.y-state.y)>260);state.invulnerable=now+1.1;state.burnUntil=0;state.slowedUntil=0;say(`U · Tinta branca apagou ${before-state.enemyShots.length} ameaças do campo.`);}else{const target=state.blackTarget;if(target==='vida')state.hp=Math.min(state.maxHp,state.hp+32);if(target==='mana')state.mana=Math.min(state.maxMana,state.mana+42);if(target==='ouro')state.gold+=25+state.wave; if(target==='forca')state.damageBuff=now+10;damageGroup(22+state.stats.ap*.25,{magic:true,color:'#17151d'});say(`U · Tinta preta absorveu ${target==='vida'?'vitalidade':target==='mana'?'energia':target==='ouro'?'fragmentos de ouro':'força'} do inimigo.`);}updateHud(true);return;}
      if(!['q','w','e','r'].includes(key))return;if(now<state.cd[key])return say(`${key.toUpperCase()} ainda está em recarga.`);
      const ink=isDio?state.ink:'dominique',clr=colors[ink]||'#82dcff';
      if(isDio){
        const mode=getDioMode(),skill=habilidadeDio(key==='r'?(state.lastInk||ink):ink,key,mode);if(!skill)return;
        const cost=skill.cost||20;if(state.mana<cost)return say('Mana insuficiente. Esquive-se e aguarde regenerar ou compre um item de mana.');state.cd[key]=now+Math.max(.8,skill.cooldown*(1-state.stats.haste/100));state.mana-=cost;
        if(key!=='r')state.lastInk=ink;
        if(mode==='support'){
          if(key==='q'){state.hp=Math.min(state.maxHp,state.hp+30+state.stats.ap*.2);state.burnUntil=0;addMarker(state.x,state.y,72,'#70e4ce',.85);say(`${skill.name}: pulso de cura, queimadura removida.`);}
          if(key==='w'){state.shieldUntil=now+4.5;state.hp=Math.min(state.maxHp,state.hp+12);addMarker(state.x,state.y,52,'#79e7d0',1,'ring');say(`${skill.name}: barreira reforçada e recuperação.`);}
          if(key==='e'){controlGroup({damage:14+state.stats.ap*.15,stun:.9,slow:2.2,color:clr,radius:300});state.invulnerable=Math.max(state.invulnerable,now+.35);say(`${skill.name}: zona segura empurra e interrompe ameaças.`);}
        }else if(mode==='control'){
          if(key==='q'){controlGroup({damage:skill.damage+state.stats.ap*.25,stun:.45,color:clr,radius:330});say(`${skill.name}: marca em área interrompe o grupo.`);}
          if(key==='w'){controlGroup({slow:2.8,color:clr,radius:360});state.shieldUntil=now+2.3;addMarker(state.x+180,state.y,360,clr,1.2,'ring');say(`${skill.name}: nuvem ampla desacelera o grupo.`);}
          if(key==='e'){controlGroup({damage:skill.damage+state.stats.ap*.18,stun:1.45,slow:2,color:clr,radius:340});say(`${skill.name}: prisão de tinta atordoa inimigos na área.`);}
        }else{
          if(key==='q'){const behavior=skill.behavior;firePlayerProjectile(rollDmg(skill.damage+state.stats.ap*.25),clr,{burn:behavior==='fire'?3:0,pierce:behavior==='water-lance',speed:behavior==='light-beam'?850:600,radius:behavior==='water-lance'?7:10});addMarker(state.x+Math.max(100,(state.enemy.x-state.x)*.52),state.y,24,clr,.5,'line');say(`${skill.name}: ${skill.effect}.`);}
          if(key==='w'){if(ink==='vermelha'){state.shieldUntil=now+4;state.hp=Math.min(state.maxHp,state.hp+12);addMarker(state.x,state.y,42,clr,1,'ring');}if(ink==='azul'){state.hp=Math.min(state.maxHp,state.hp+34);state.mana=Math.min(state.maxMana,state.mana+6);state.shieldUntil=now+1.5;addMarker(state.x,state.y,60,clr,1,'ring');}if(ink==='amarela'){state.invulnerable=now+.72;state.moveBuff=now+4;state.dashCd=Math.min(state.dashCd,now);addMarker(state.x,state.y,70,clr,.8,'ring');}say(`${skill.name}: ${skill.effect}.`);}
          if(key==='e'){if(ink==='vermelha'){addMarker(state.enemy.x,state.enemy.y,120,clr,.9);damageGroup(rollDmg(skill.damage+state.stats.ap*.3),{magic:true,color:clr});}if(ink==='azul'){controlGroup({damage:skill.damage+state.stats.ap*.2,stun:1.1,slow:2.8,color:clr,radius:280});}if(ink==='amarela'){controlGroup({damage:skill.damage+state.stats.ap*.2,stun:1.5,color:clr,radius:290});}say(`${skill.name}: ${skill.effect}.`);}
        }
        if(key==='r'){const last=state.lastInk||ink,ult=habilidadeDio(last,'r',mode),targetWave=state.wave;addMarker(state.enemy.x,state.enemy.y,last==='azul'?420:290,colors[last],1.5,'ring');damageGroup(rollDmg(ult.damage+state.stats.ap*.6),{stun:last==='amarela'?1.3:0,burn:last==='vermelha'?4:0,magic:true,color:colors[last]});if(state.wave===targetWave&&last==='azul'){state.hp=Math.min(state.maxHp,state.hp+38);state.adds.forEach(e=>e.slowUntil=now+2.5);}if(state.wave===targetWave&&last==='amarela'){state.adds.forEach(e=>e.stunned=now+1.4);state.enemy.stunned=now+1.4;}if(state.wave===targetWave&&last==='vermelha')state.adds.forEach(e=>e.burn=now+4);if(state.wave===targetWave&&last==='azul')state.enemy.slowUntil=now+2.5;state.enemyShots=state.enemyShots.filter(b=>Math.hypot(b.x-state.x,b.y-state.y)>230);showBanner(`R · ${ult.name} · última tinta: ${DIOGENES_KIT.inks[last].label}`);say(`R · ${ult.name}: ${ult.effect}.`);}
        renderSpellButtons();
      }else{
        const costTable={q:20,w:25,e:23,r:55};if(state.mana<costTable[key])return say('Mana insuficiente. Esquive-se e aguarde regenerar ou compre um item de mana.');state.cd[key]=now+Math.max(.8,({q:2.4,w:8,e:6,r:22}[key])*(1-state.stats.haste/100));
        const power=state.stats.ad+state.stats.ap*.7;
        if(key==='q'){if(state.mana<20)return say('Mana insuficiente.');state.mana-=20;firePlayerProjectile(rollDmg(34+power*.45),isDom?'#69d9ff':'#c5a5ff',{speed:650});say(isDom?'Q · Exploit injetado no processo inimigo.':'Q · Pulso arcano disparado.');}
        if(key==='w'){if(state.mana<25)return say('Mana insuficiente.');state.mana-=25;state.shieldUntil=now+4;state.hp=Math.min(state.maxHp,state.hp+(isDom?14:20));say(isDom?'W · Firewall ativo: absorção e recuperação.':'W · Guarda arcana reforçada.');}
        if(key==='e'){if(state.mana<23)return say('Mana insuficiente.');state.mana-=23;state.enemy.stunned=now+1.6;state.enemy.armor=Math.max(0,(state.enemy.armor||0)-8);firePlayerProjectile(rollDmg(23+power*.35),'#cf71ff',{stun:.7});say(isDom?'E · Debug interrompeu a IA e expôs uma vulnerabilidade.':'E · Controle arcano interrompeu o ataque.');}
        if(key==='r'){if(state.mana<55)return say('Mana insuficiente para a Suprema.');state.mana-=55;const dmg=rollDmg(115+power*.8);damageEnemy(dmg,{stun:1});state.enemyShots=state.enemyShots.filter(b=>Math.hypot(b.x-state.x,b.y-state.y)>150);showBanner(isDom?'R · KERNEL PANIC':'R · RUPTURA DO VÉU');say(isDom?'R · Kernel Panic: limpeza de tela e dano massivo.':'R · Supremo arcano!');}
      }
      if(state.damageBuff>now&&key!=='w')state.enemy.hp-=10;
      updateHud(true);
    }
    function makeEnemyShot(angle,speed,damage,options={},source=state.enemy){state.enemyShots.push({x:source.x-15,y:source.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,damage,kind:options.kind||source.damageType,color:options.color||'#ff567a',r:options.r||8,type:options.type||'orb',life:options.life||4,blast:options.blast||0,phase:Math.random()*6});}
    function enemyAttack(e=state.enemy){const tx=state.x,ty=state.y,angle=Math.atan2(ty-e.y,tx-e.x),speed=195+e.index*5+e.level*15,dmg=e.damage,shot=(a,v,d,o={})=>makeEnemyShot(a,v,d,o,e);if(e===state.enemy)state.warning={x:tx,y:ty,time:.42+state.stats.telegraph,color:e.color||'#ff4d73'};e.attackCount++;switch(e.pattern){
      case'aim':shot(angle,speed,dmg);break;
      case'triple':for(let a=-.22;a<=.23;a+=.22)shot(angle+a,speed,dmg*.72);break;
      case'charge':e.charge={x:tx,y:ty,time:.7};break;
      case'lanes':[110,210,310].forEach(y=>shot(Math.atan2(y-e.y,tx-e.x),speed*.85,dmg*.65,{type:'lane',r:11}));break;
      case'spiral':for(let i=0;i<7;i++)shot(angle+i*.72,speed*.62,dmg*.48,{type:'spiral',color:'#bc73ff'});break;
      case'ring':for(let i=0;i<10;i++)shot(i*Math.PI/5,speed*.72,dmg*.55,{type:'ring',color:'#d871ff'});break;
      case'mine':shot(angle,speed*.38,dmg,{type:'mine',blast:1.25,r:12,color:'#f3bb53'});break;
      case'beam':shot(Math.atan2(ty-e.y,tx-e.x),speed*1.8,dmg*1.3,{type:'beam',r:13,color:'#8be9fa'});break;
      case'volley':for(let i=0;i<5;i++)setTimeout(()=>{if(state.enemy===e||state.adds.includes(e))shot(Math.atan2(state.y-e.y,state.x-e.x),speed,dmg*.57,{type:'volley'});},i*190);break;
      case'pulse':for(let i=0;i<5;i++)shot(angle+(i-2)*.34,speed*.78,dmg*.72,{type:'pulse',r:13,color:'#ff734e'});break;
      case'echo':for(let n=0;n<2;n++)shot(angle+(n?-.17:.17),speed*1.25,dmg*.85,{type:'echo',color:'#e5a0ff'});break;
      case'storm':for(let i=0;i<6;i++)shot(angle+(Math.random()-.5)*1.4,speed*.85,dmg*.72,{type:'storm',r:10,color:'#54d6ff'});break;
      case'lance':shot(angle,speed*2.2,dmg*1.5,{type:'lance',r:14,color:'#9224bd'});break;
      case'rift':for(let i=0;i<4;i++)shot(angle+i*.28,speed*.8,dmg,{type:'rift',blast:.65,color:'#f046aa'});break;
      case'rain':for(let i=0;i<8;i++)shot(Math.PI/2+(Math.random()-.5)*.7,speed*.82,dmg*.66,{type:'rain',color:'#fff28a'});break;
      case'tide':for(let i=0;i<7;i++)shot(angle+(i-3)*.18,speed*(.65+i*.08),dmg*.78,{type:'tide',r:12,color:'#49d9dc'});break;
      case'hunt':e.charge={x:tx,y:ty,time:.38};for(let i=0;i<3;i++)shot(angle+(i-1)*.34,speed,dmg*.75,{type:'hunt',color:'#fc4059'});break;
      case'maze':for(let i=0;i<6;i++)shot(angle+(i-2.5)*.3,speed*.9,dmg*.9,{type:'maze',blast:.5,color:'#be78ff'});break;
      case'collapse':for(let i=0;i<12;i++)shot(i*Math.PI/6+e.attackCount*.12,speed,dmg*.72,{type:'collapse',color:'#ff3971',r:10});break;
      case'absurd':for(let i=0;i<24;i++)shot(i*Math.PI/12+e.attackCount*.2,speed*1.35,dmg*.9,{type:'absurd',r:14,color:'#f630c4'});for(let j=0;j<5;j++)shot(Math.atan2(state.y-e.y,state.x-e.x)+(j-2)*.16,speed*1.6,dmg,{type:'lance',r:15,color:'#fff'});break;
      default:for(let i=0;i<16;i++)shot(i*Math.PI/8,speed*1.2,dmg,{type:'absurd',r:13,color:'#f630c4'});state.enemyTimer=Math.min(state.enemyTimer,.45);break;
    }}
    function stepEnemy(e,dt,now,isBoss=false){if(e.stunned>now){e.x=Math.max(state.x+e.radius+8,e.x);return;}e.phase+=dt;const advance=e.speed*(e.slowUntil>now?.42:1)*dt;const offset=isBoss?0:Math.max(70,(e.x-state.x)*.28);const targetX=state.x+e.radius+8+offset;if(e.x>targetX)e.x-=advance;else e.x=targetX+Math.sin(e.phase*2)*5;e.y+=(state.y+(isBoss?0:(e.y<state.y?-48:48))-e.y)*Math.min(1,dt*.55);if(e.charge){e.charge.time-=dt;if(e.charge.time<=0){const dx=state.x-e.x,dy=state.y-e.y,d=Math.max(1,Math.hypot(dx,dy));e.x+=dx/d*(330+e.speed)*dt;e.y+=dy/d*(330+e.speed)*dt;if(isBoss&&Math.hypot(state.x-e.x,state.y-e.y)<e.radius+18){takeHit(e.damage*1.3,e.damageType);e.charge=null;}}}if(e.burn>now){e.hp-=dt*(10+state.stats.ap*.08);if(e.hp<=0){if(isBoss)killEnemy();else state.adds=state.adds.filter(x=>x!==e);return;}}e.attackCd-=dt;if(isBoss&&e.attackCd<=.45&&!e.telegraph){e.telegraph=.45+state.stats.telegraph;state.warning={x:state.x,y:state.y,time:e.telegraph,color:'#ff556e'};}if(e.attackCd<=0){e.telegraph=0;enemyAttack(e);e.attackCd=e.cadence*(e.slowUntil>now?1.45:1);}if(isBoss&&e.x-state.x<e.radius+32&&Math.abs(e.y-state.y)<e.radius+24&&now-state.lastHit>1.2){takeHit(e.damage*.7,e.damageType);state.lastHit=now;}}
    function enemyStep(dt,now){stepEnemy(state.enemy,dt,now,true);for(const e of [...state.adds])stepEnemy(e,dt,now,false);}
    function update(dt,now){if(!state.alive)return;state.mana=Math.min(state.maxMana,state.mana+(4.2+state.stats.manaRegen)*dt);if(now-state.lastHit>5)state.hp=Math.min(state.maxHp,state.hp+(state.stats.hpRegen+.45)*dt);const speed=(215+state.stats.move*2)*(state.slowedUntil > now ? 0.55 : 1);if(now<state.dashUntil){state.x+=state.dashDx*680*dt;state.y+=state.dashDy*680*dt;}else{let dx=(state.keys.right?1:0)-(state.keys.left?1:0),dy=(state.keys.down?1:0)-(state.keys.up?1:0);const d=Math.hypot(dx,dy)||1;if(dx||dy){state.x+=dx/d*speed*dt;state.y+=dy/d*speed*dt;state.lastDirX=dx/d;state.lastDirY=dy/d;}}state.x=Math.max(48,Math.min(660,state.x));state.y=Math.max(70,Math.min(500,state.y));enemyStep(dt,now);
      state.projectiles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.area){p.life-=dt; if(!p.applied&&p.life<.3&&Math.hypot(state.enemy.x-p.x,state.enemy.y-p.y)<p.r+state.enemy.radius){damageEnemy(p.damage);p.applied=true;}}else if(Math.hypot(p.x-state.enemy.x,p.y-state.enemy.y)<p.r+state.enemy.radius){damageEnemy(p.damage,{stun:p.stun,burn:p.burn,magic:p.magic});p.hit=true;if(p.pierce)p.pierce=false;} });state.projectiles=state.projectiles.filter(p=>p.life>0&&!p.hit&&p.x<1250&&p.x>-30&&p.y>-30&&p.y<590);
      state.enemyShots.forEach(b=>{b.life-=dt;if(b.type==='mine'){b.blast-=dt;if(b.blast<=0){if(Math.hypot(b.x-state.x,b.y-state.y)<70+b.r)takeHit(b.damage*1.2,b.kind);b.hit=true;return;}}if(b.type==='rain')b.y+=180*dt;else{b.x+=b.vx*dt;b.y+=b.vy*dt;}if(Math.hypot(b.x-state.x,b.y-state.y)<b.r+15){if(now>state.invulnerable){takeHit(b.damage,b.kind);if(b.type==='rift'||b.type==='tide')state.slowedUntil=now+1.3;}b.hit=true;}});state.enemyShots=state.enemyShots.filter(b=>!b.hit&&b.life>0&&b.x>-60&&b.x<1260&&b.y>-80&&b.y<600);
      state.particles.forEach(p=>{p.life-=dt;p.x+=(p.vx||0)*dt;p.y+=(p.vy||0)*dt;p.vx=(p.vx||0)*.94;p.vy=(p.vy||0)*.94;});state.particles=state.particles.filter(p=>p.life>0);state.markers.forEach(m=>m.time-=dt);state.markers=state.markers.filter(m=>m.time>0);if(state.warning){state.warning.time-=dt;if(state.warning.time<=0)state.warning=null;}if(now-state.lastSave>4){save();state.lastSave=now;}}
    function draw(){const w=canvas.width,h=canvas.height;const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,isDio?'#291629':isDom?'#0c2030':'#141626');g.addColorStop(1,'#070a10');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);for(let i=0;i<30;i++){const x=(i*141+state.frame*.55)%w,y=(i*67)%h;ctx.fillStyle=`rgba(221,206,255,${.08+(i%4)*.04})`;ctx.fillRect(x,y,2,2);}ctx.fillStyle='#111b25';ctx.fillRect(0,495,w,65);ctx.strokeStyle='#716044';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,494);ctx.lineTo(w,494);ctx.stroke();for(let x=0;x<w;x+=54){ctx.fillStyle='#d8c99b12';ctx.fillRect(x,503,2,50);}if(state.warning){ctx.strokeStyle=state.warning.color;ctx.globalAlpha=.28+Math.sin(state.frame*.4)*.18;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(state.warning.x,state.warning.y,48,25,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}if(state.enemy?.charge){ctx.strokeStyle='#ff5d78';ctx.setLineDash([8,6]);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(state.enemy.x,state.enemy.y);ctx.lineTo(state.enemy.charge.x,state.enemy.charge.y);ctx.stroke();ctx.setLineDash([]);}
      state.markers.forEach(m=>{ctx.save();ctx.globalAlpha=Math.min(.75,m.time/Math.max(.01,m.max));ctx.strokeStyle=m.color;ctx.fillStyle=m.color+'20';ctx.lineWidth=3;ctx.setLineDash([10,7]);ctx.beginPath();if(m.shape==='line'){ctx.moveTo(state.x,state.y);ctx.lineTo(m.x2,m.y2);}else ctx.arc(m.x,m.y,m.r*(1+(1-m.time/m.max)*.12),0,Math.PI*2);if(m.shape!=='line')ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.restore();});
      // Enemy projectiles: each pattern has distinct shape and color.
      state.enemyShots.forEach(b=>{ctx.save();ctx.shadowBlur=b.type==='absurd'?24:14;ctx.shadowColor=b.color;ctx.fillStyle=b.color;if(b.type==='beam'){ctx.fillRect(b.x-13,b.y-3,26,14);}else if(b.type==='mine'){ctx.beginPath();ctx.rect(b.x-b.r,b.y-b.r,b.r*2,b.r*2);ctx.fill();ctx.strokeStyle='#fff8';ctx.beginPath();ctx.arc(b.x,b.y,b.r+7+Math.sin(state.frame*.3)*3,0,Math.PI*2);ctx.stroke();}else if(b.type==='lance'||b.type==='hunt'){ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx));ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-10,-8);ctx.lineTo(-6,0);ctx.lineTo(-10,8);ctx.closePath();ctx.fill();}else{ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();}ctx.restore();});
      state.projectiles.forEach(p=>{ctx.save();ctx.shadowBlur=20;ctx.shadowColor=p.color;ctx.fillStyle=p.color;if(p.area){ctx.globalAlpha=.45+Math.sin(state.frame*.45)*.15;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}else{ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}ctx.restore();});
      // Live player / enemy movement, shields, health bars and impact flashes.
      const now=performance.now()/1000;ctx.save();if(now<state.invulnerable)ctx.globalAlpha=.45+Math.sin(state.frame*.9)*.35;ctx.shadowBlur=now<state.dashUntil?35:20;ctx.shadowColor=isDio?(colors[state.ink]||'#d78fff'):isDom?'#56ddff':'#b98eff';ctx.fillStyle=isDio?(colors[state.ink]||'#d78fff'):isDom?'#4ba6d4':'#9b75cb';ctx.beginPath();ctx.arc(state.x,state.y,18,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#f7e8c9';ctx.beginPath();ctx.arc(state.x+6,state.y-3,3,0,Math.PI*2);ctx.fill();if(now<state.shieldUntil){ctx.strokeStyle='#6df4dc';ctx.lineWidth=4;ctx.beginPath();ctx.arc(state.x,state.y,27,0,Math.PI*2);ctx.stroke();}ctx.restore();
      const e=state.enemy;if(e){const r=e.radius;ctx.save();ctx.shadowBlur=28;ctx.shadowColor=e.index>14?'#fb326d':'#9b5be4';ctx.fillStyle=e.flash>0?'#fff':e.index>14?'#8a214d':'#593c7a';ctx.beginPath();ctx.moveTo(e.x,e.y-r);ctx.lineTo(e.x+r*.72,e.y-r*.22);ctx.lineTo(e.x+r*.82,e.y+r*.55);ctx.lineTo(e.x,e.y+r);ctx.lineTo(e.x-r*.82,e.y+r*.55);ctx.lineTo(e.x-r*.7,e.y-r*.2);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#ff4b72';ctx.fillRect(e.x-r,e.y-r-15,r*2,6);ctx.fillStyle='#70e389';ctx.fillRect(e.x-r,e.y-r-15,r*2*Math.max(0,e.hp/e.maxHp),6);ctx.fillStyle='#fff';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText(e.name,e.x,e.y-r-22);ctx.restore();}
      state.adds.forEach(e=>{const r=e.radius||17;ctx.save();ctx.globalAlpha=e.stunned>now?.48:1;ctx.shadowBlur=19;ctx.shadowColor='#d36cff';ctx.fillStyle=e.flash>0?'#fff':'#6d426e';ctx.beginPath();ctx.arc(e.x,e.y,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#ff7b91';ctx.fillRect(e.x-r,e.y-r-10,r*2,4);ctx.fillStyle='#80edb0';ctx.fillRect(e.x-r,e.y-r-10,r*2*Math.max(0,e.hp/e.maxHp),4);ctx.restore();});
      state.particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/(p.maxLife||.45));ctx.fillStyle=p.color;ctx.shadowBlur=12;ctx.shadowColor=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size||3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.globalAlpha=1;});state.frame++;}
    function loop(t){if(!host.isConnected)return;const dt=Math.min(.04,(t-(state.lastFrame||t-16))/1000);state.lastFrame=t;update(dt,t/1000);draw();updateHud();state.raf=requestAnimationFrame(loop);}
    function changeInk(ink){if(!inks.includes(ink))return;state.ink=ink;renderSpellButtons();host.querySelectorAll('.ink-choice').forEach(b=>b.classList.toggle('selected',b.dataset.ink===ink));save();updateHud(true);}
    function castBasic(){cast('basic');}
    function toggleUtility(){state.utility=host.querySelector('#arena-utility')?.value||state.utility;state.blackTarget=host.querySelector('#arena-black-target')?.value||state.blackTarget;}
    host.querySelectorAll('.ink-choice').forEach(btn=>btn.onclick=()=>changeInk(btn.dataset.ink));
    host.querySelector('#arena-utility')?.addEventListener('change',e=>{state.utility=e.target.value;renderSpellButtons();save();});
    host.querySelector('#arena-black-target')?.addEventListener('change',e=>{state.blackTarget=e.target.value;save();});
    host.querySelector('#arena-active-item').onchange=e=>{state.activeId=e.target.value;const label=host.querySelector('#arena-i-label');if(label)label.textContent=getItem(state.activeId)?.name||'Escolha na loja';save();};
    host.querySelector('#arena-use-item').onclick=()=>cast('i');
    host.querySelector('#arena-canvas').addEventListener('pointerdown',e=>{if(e.button===0)castBasic();});
    host.querySelectorAll('[data-move]').forEach(btn=>{const direction=btn.dataset.move;btn.onpointerdown=e=>{e.preventDefault();state.keys[direction]=true;btn.setPointerCapture?.(e.pointerId);};['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,()=>state.keys[direction]=false));});
    host.querySelector('[data-action="dash"]').onclick=dash;
    host.querySelector('#arena-categories').addEventListener('click',e=>{const b=e.target.closest('[data-shop-cat]');if(b)setCategory(b.dataset.shopCat);});
    renderSpellButtons();renderShop();renderInventory();if(isDio){host.querySelector('#arena-utility').value=state.utility;host.querySelector('#arena-black-target').value=state.blackTarget;changeInk(state.ink);}
    updateHud(true);showBanner(`Onda ${state.wave}: ${state.enemy.name} · ${state.enemy.title}`);state.raf=requestAnimationFrame(loop);
    const keydown=e=>{if(!host.isConnected||host.querySelector('input:focus,select:focus'))return;const tab=document.getElementById('tab-hobbies');if(tab?.classList.contains('hidden'))return;const k=e.key.toLowerCase();const moveMap={arrowleft:'left',a:'left',arrowright:'right',d:'right',arrowup:'up',arrowdown:'down'};if(moveMap[k]){e.preventDefault();state.keys[moveMap[k]]=true;}else if(['q','w','e','r','u','i'].includes(k)){e.preventDefault();if(k==='u')toggleUtility();cast(k);}else if(k===' '){e.preventDefault();dash();}};
    const keyup=e=>{const k=e.key.toLowerCase();const map={arrowleft:'left',a:'left',arrowright:'right',d:'right',arrowup:'up',arrowdown:'down'};if(map[k])state.keys[map[k]]=false;};
    window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);
}


// Arraste desktop: soltar uma carta sobre a mesa abre sua ficha de uso; no celular, toque na carta.
(() => {
    const mesa=document.getElementById('campo-batalha'); if(!mesa)return;
    mesa.addEventListener('dragover',e=>{e.preventDefault();mesa.classList.add('drop-ready');});
    mesa.addEventListener('dragleave',e=>{if(!mesa.contains(e.relatedTarget))mesa.classList.remove('drop-ready');});
    mesa.addEventListener('drop',e=>{e.preventDefault();mesa.classList.remove('drop-ready');const id=e.dataTransfer?.getData('text/plain');const ability=userGrimoire.find(x=>String(x.id||x.nome)===id);if(ability)abrirModalView(ability);});
})();
