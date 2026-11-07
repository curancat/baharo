/* ============ TYLER'S MEMORIES — orquestração ============ */
'use strict';

const $ = id => document.getElementById(id);
const SAVE_KEY = 'tm_save', SET_KEY = 'tm_settings';

let state = 'loader';           // loader | menu | intro | game | ending | exit
let game = null;
let ui = { dialogue: false, memory: false, pause: false, options: false, over: false, puzzle: false };
let keys = { left: false, right: false, up: false, down: false };
let settings = { music: 70, sfx: 80, gentle: false, crt: true };
let optionsFrom = 'menu';
let pendingAllDone = false;
let hintTimer = null;
let currentDialogue = null;     // {kind, lines, page, tw}
let currentMemoryTw = null;
let introTw = null, endingTw = null;
let endingStatsShown = false;

const INTRO_TEXT =
`Tyler não lembra de ter deitado na grama.

Mas o frio é real. A terra molhada nas mãos é real. A dor no peito é real.

Ele se lembra do hospital. Do leito 312. Do bip que ia ficando mais lento.

Depois, este campo.

Tudo o que ele trancou para não sentir está aqui, espalhado, pesando.

Seis memórias. Seis trancas. No fim do campo, uma porta.

Ela só abre para quem carrega o que viveu.`;

const ENDING_TEXT =
`A porta não rangeu. Estava esperando por ele.

Do outro lado não havia branco, nem túnel, nem vazio.

Havia um quintal. Terra molhada. Cheiro de café.

Um cachorro caramelo veio correndo — novo de novo.

E ela estava lá. De pé, sem dor, com a luz da cozinha acesa.

“Você demorou, meu filho.”
“Eu sei, mãe. Eu me perdi no caminho.”
“Não tem problema. Acendi a luz para você.”

No mundo que ficou para trás, no quarto 312, às 03h47, o monitor traçou uma linha reta.

A enfermeira anotou a hora com cuidado, como quem fecha um livro bom.

Na mesa de cabeceira, uma carta. E dentro dela, a foto de um quintal.

Enquanto alguém lembra, ninguém parte de verdade.

FIM`;

/* ---------- utilidades ---------- */
function anyUi() { return ui.dialogue || ui.memory || ui.pause || ui.options || ui.over || ui.puzzle; }
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }
function fade(on, white) {
  const f = $('fade');
  f.classList.toggle('white', !!white);
  f.classList.toggle('on', on);
}
function transition(fn, white) {
  fade(true, white);
  setTimeout(() => { fn(); setTimeout(() => fade(false, white), 80); }, 650);
}

function typewrite(el, text, speed, onDone) {
  let i = 0, done = false, timer = null;
  el.textContent = '';
  const tick = () => {
    if (i >= text.length) { done = true; if (onDone) onDone(); return; }
    const ch = text[i++];
    el.textContent += ch;
    if (ch !== ' ' && ch !== '\n' && i % 3 === 0) AudioMan.blip();
    timer = setTimeout(tick, ch === '\n' ? speed * 6 : speed);
  };
  tick();
  return {
    get done() { return done; },
    finish() { clearTimeout(timer); el.textContent = text; done = true; if (onDone) onDone(); },
    cancel() { clearTimeout(timer); },
  };
}

function showHint(text, dur = 4500) {
  const h = $('hint');
  h.textContent = text;
  h.classList.add('show');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => h.classList.remove('show'), dur);
}

/* ---------- save / settings ---------- */
function loadSettings() {
  try { Object.assign(settings, JSON.parse(localStorage.getItem(SET_KEY) || '{}')); } catch (e) {}
  $('opt-music').value = settings.music; $('opt-music-val').textContent = settings.music;
  $('opt-sfx').value = settings.sfx; $('opt-sfx-val').textContent = settings.sfx;
  $('opt-gentle').checked = settings.gentle;
  $('opt-crt').checked = settings.crt;
  document.body.classList.toggle('no-crt', !settings.crt);
  AudioMan.setMusic(settings.music / 100);
  AudioMan.setSfx(settings.sfx / 100);
  if (game) game.gentle = settings.gentle;
}
function saveSettings() { localStorage.setItem(SET_KEY, JSON.stringify(settings)); }
function getSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { return null; } }
function writeSave() { if (game && state === 'game') localStorage.setItem(SAVE_KEY, JSON.stringify(game.serialize())); }
function clearSave() { localStorage.removeItem(SAVE_KEY); updateSaveHint(); }
function updateSaveHint() { $('save-hint').classList.toggle('hidden', !getSave()); }

/* ---------- HUD ---------- */
function buildHud() {
  const box = $('hud-frags');
  box.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const s = document.createElement('div');
    s.className = 'frag-slot'; s.id = 'slot' + i;
    box.appendChild(s);
  }
  const c = document.createElement('span');
  c.className = 'frag-count'; c.id = 'frag-count';
  box.appendChild(c);
}
function updateHud() {
  if (!game) return;
  game.frags.forEach((f, i) => $('slot' + i).classList.toggle('got', f.taken));
  $('frag-count').textContent = game.fragsGot + '/6 memórias';
  const fill = $('luc-fill');
  fill.style.width = game.lucidity + '%';
  fill.classList.toggle('low', game.lucidity < 30);
}

/* ---------- estados ---------- */
function goMenu() {
  writeSave();
  state = 'menu';
  if (ui.puzzle) Puzzles.close();
  ui = { dialogue: false, memory: false, pause: false, options: false, over: false, puzzle: false };
  ['game-screen', 'intro', 'ending', 'exit', 'dialogue', 'memory', 'pause', 'gameover', 'options', 'puzzle', 'stare-warning', 'touch'].forEach(id => hide($(id)));
  show($('menu'));
  updateSaveHint();
  AudioMan.stareOff();
  AudioMan.musicLevel(1, 0);
}

function startIntro() {
  transition(() => {
    hide($('menu')); show($('intro'));
    state = 'intro';
    $('intro-hint').style.visibility = 'hidden';
    introTw = typewrite($('intro-text'), INTRO_TEXT, 26, () => { $('intro-hint').style.visibility = 'visible'; });
  });
}

function startGame(resume) {
  transition(() => {
    if (ui.puzzle) Puzzles.close();
    ['menu', 'intro', 'ending', 'exit'].forEach(id => hide($(id)));
    show($('game-screen'));
    state = 'game';
    if (resume) {
      game.restore(getSave());
      showHint('você continua de onde parou. o campo não esqueceu.');
    } else {
      game.reset(true);
      showHint('WASD / setas para andar · E interage com as trancas', 6000);
    }
    game.gentle = settings.gentle;
    buildHud(); updateHud();
    AudioMan.musicLevel(1, 0);
    if (isTouch()) show($('touch'));
    writeSave();
  });
}

function startEnding() {
  writeSave();
  AudioMan.doorOpen();
  AudioMan.musicLevel(0.25, 0);
  transition(() => {
    hide($('game-screen')); hide($('touch'));
    show($('ending'));
    state = 'ending';
    endingStatsShown = false;
    hide($('ending-stats'));
    $('ending-text').style.display = '';
    clearSave();
    endingTw = typewrite($('ending-text'), ENDING_TEXT, 34, showEndingStats);
  }, true);
}

function showEndingStats() {
  if (endingStatsShown) return;
  endingStatsShown = true;
  const m = Math.floor(game.playTime / 60), s = Math.floor(game.playTime % 60);
  $('stats-line').textContent = `6/6 memórias carregadas · ${m}min ${String(s).padStart(2, '0')}s · ${game.deaths} queda${game.deaths === 1 ? '' : 's'}`;
  $('ending-text').style.display = 'none';
  show($('ending-stats'));
}

/* ---------- diálogo ---------- */
function openDialogue(kind, lines) {
  ui.dialogue = true;
  currentDialogue = { kind, lines, page: 0, tw: null };
  const img = kind === 'sol' ? ASSETS.sol[0] : ASSETS.lua[0];
  $('dlg-img').src = img.src;
  const name = $('dlg-name');
  name.textContent = kind === 'sol' ? '☀ SOL' : '☾ LUA';
  name.className = kind;
  show($('dialogue'));
  dialoguePage();
}
function dialoguePage() {
  const d = currentDialogue;
  $('dlg-next').style.visibility = 'hidden';
  d.tw = typewrite($('dlg-text'), d.lines[d.page], 24, () => { $('dlg-next').style.visibility = 'visible'; });
}
function advanceDialogue() {
  const d = currentDialogue;
  if (!d) return;
  if (!d.tw.done) { d.tw.finish(); return; }
  d.page++;
  if (d.page < d.lines.length) dialoguePage();
  else {
    game.markMet(d.kind);
    ui.dialogue = false;
    currentDialogue = null;
    hide($('dialogue'));
    writeSave();
  }
}

/* ---------- memória ---------- */
function openMemory(frag) {
  ui.memory = true;
  $('mem-num').textContent = frag.id + 1;
  $('mem-title').textContent = frag.title;
  show($('memory'));
  currentMemoryTw = typewrite($('mem-text'), frag.text, 22);
  updateHud();
  writeSave();
}
function closeMemory() {
  if (currentMemoryTw && !currentMemoryTw.done) { currentMemoryTw.finish(); return; }
  ui.memory = false;
  hide($('memory'));
  if (pendingAllDone) {
    pendingAllDone = false;
    showHint('Você carregou tudo. A porta no fim do campo está aberta. Vá até ela.', 7000);
  }
}

/* ---------- ação (E) roteada ---------- */
function action() {
  AudioMan.resume();
  if (state === 'intro') {
    if (introTw && !introTw.done) introTw.finish();
    else startGame(false);
    return;
  }
  if (state === 'ending') {
    if (endingTw && !endingTw.done) { endingTw.finish(); }
    else showEndingStats();
    return;
  }
  if (state !== 'game') return;
  if (ui.puzzle) { Puzzles.key('e'); return; }
  if (ui.dialogue) { advanceDialogue(); return; }
  if (ui.memory) { closeMemory(); return; }
  if (anyUi()) return;
  game.interact();
}

/* ---------- hooks do jogo ---------- */
const hooks = {
  onFragment: f => openMemory(f),
  onPuzzle: f => Puzzles.open(f),
  onDialogue: (kind, lines) => openDialogue(kind, lines),
  onHint: txt => showHint(txt),
  onAllDone: () => { pendingAllDone = true; },
  onStare: on => { $('stare-warning').classList.toggle('hidden', !on); },
  onGameOver: () => {
    if (ui.puzzle) Puzzles.close();
    ui.over = true;
    hide($('stare-warning'));
    show($('gameover'));
    writeSave();
  },
  onExit: () => startEnding(),
};

/* ---------- input ---------- */
const KEYMAP = {
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
};
document.addEventListener('keydown', e => {
  firstGesture();
  /* dentro de um puzzle, as teclas vão para a tranca, não para o player */
  if (state === 'game' && ui.puzzle) {
    if (e.key === 'Escape') { e.preventDefault(); Puzzles.abort(); return; }
    if (e.key === 'm' || e.key === 'M') { AudioMan.toggleMute(); return; }
    e.preventDefault();
    if (!e.repeat || ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','a','s','d'].includes(e.key)) Puzzles.key(e.key);
    return;
  }
  const k = KEYMAP[e.key];
  if (k) { keys[k] = true; e.preventDefault(); return; }
  if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (!e.repeat) action();
    return;
  }
  if (e.key === 'Escape') {
    if (ui.options) { closeOptions(); return; }
    if (state === 'game' && !ui.dialogue && !ui.memory && !ui.over) {
      ui.pause = !ui.pause;
      $('pause').classList.toggle('hidden', !ui.pause);
      if (ui.pause) writeSave();
    }
    return;
  }
  if (e.key === 'm' || e.key === 'M') {
    const m = AudioMan.toggleMute();
    if (state === 'game') showHint(m ? 'som desligado' : 'som ligado', 1800);
  }
});
document.addEventListener('keyup', e => { const k = KEYMAP[e.key]; if (k) keys[k] = false; });

function isTouch() { return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window; }
document.querySelectorAll('.t-btn').forEach(btn => {
  const k = btn.dataset.key;
  const down = e => {
    e.preventDefault(); firstGesture();
    if (k === 'action') action();
    else if (state === 'game' && ui.puzzle) Puzzles.key(k);
    else keys[k] = true;
  };
  const up = e => { e.preventDefault(); if (k !== 'action') keys[k] = false; };
  btn.addEventListener('pointerdown', down);
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointercancel', up);
  btn.addEventListener('pointerleave', up);
});

/* clique/tap avança intro/diálogo/memória/final */
['intro', 'dialogue', 'memory', 'ending'].forEach(id => {
  $(id).addEventListener('click', () => { if (state !== 'menu') action(); });
});

let gestured = false;
function firstGesture() {
  if (gestured) return;
  gestured = true;
  AudioMan.init();
  AudioMan.setMusic(settings.music / 100);
  AudioMan.setSfx(settings.sfx / 100);
}
document.addEventListener('pointerdown', firstGesture);

/* ---------- opções ---------- */
function openOptions(from) {
  optionsFrom = from;
  ui.options = true;
  if (from === 'pause') hide($('pause'));
  show($('options'));
}
function closeOptions() {
  ui.options = false;
  hide($('options'));
  saveSettings();
  if (optionsFrom === 'pause') show($('pause'));
}
$('opt-music').addEventListener('input', e => {
  settings.music = +e.target.value; $('opt-music-val').textContent = settings.music;
  AudioMan.setMusic(settings.music / 100);
});
$('opt-sfx').addEventListener('input', e => {
  settings.sfx = +e.target.value; $('opt-sfx-val').textContent = settings.sfx;
  AudioMan.setSfx(settings.sfx / 100); AudioMan.click();
});
$('opt-gentle').addEventListener('change', e => { settings.gentle = e.target.checked; if (game) game.gentle = settings.gentle; });
$('opt-crt').addEventListener('change', e => { settings.crt = e.target.checked; document.body.classList.toggle('no-crt', !settings.crt); });
$('btn-wipe').addEventListener('click', () => {
  clearSave();
  const b = $('btn-wipe'); const old = b.textContent;
  b.textContent = 'progresso apagado ✓';
  setTimeout(() => { b.textContent = old; }, 1600);
});
$('btn-opt-back').addEventListener('click', () => { AudioMan.click(); closeOptions(); });

/* ---------- botões ---------- */
function wire(id, fn) { $(id).addEventListener('click', e => { e.stopPropagation(); firstGesture(); AudioMan.click(); fn(); }); }
wire('btn-jogar', () => { getSave() ? startGame(true) : startIntro(); });
wire('btn-opcoes', () => openOptions('menu'));
wire('btn-sair', () => { transition(() => { hide($('menu')); show($('exit')); state = 'exit'; }); });
wire('btn-back-menu', () => { transition(() => { hide($('exit')); show($('menu')); state = 'menu'; }); });
wire('btn-continue', () => { ui.pause = false; hide($('pause')); });
wire('btn-pause-options', () => openOptions('pause'));
wire('btn-newgame', () => { ui.pause = false; hide($('pause')); clearSave(); startGame(false); });
wire('btn-tomenu', () => { ui.pause = false; hide($('pause')); transition(goMenu); });
wire('btn-retry', () => { ui.over = false; hide($('gameover')); game.respawn(); updateHud(); writeSave(); showHint('o que você já carregou continua com você. levante.', 4000); });
wire('btn-over-menu', () => { ui.over = false; hide($('gameover')); game.respawn(); transition(goMenu); });
wire('btn-again', () => { clearSave(); startGame(false); });
wire('btn-end-menu', () => transition(goMenu));
document.querySelectorAll('.menu-btn').forEach(b => b.addEventListener('mouseenter', () => AudioMan.hover()));

window.addEventListener('beforeunload', writeSave);
document.addEventListener('visibilitychange', () => { if (document.hidden) writeSave(); });

/* ---------- loop ---------- */
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state === 'game' && game) {
    if (!anyUi()) game.update(dt, keys);
    else if (ui.puzzle && !ui.over) {
      /* o frio não espera: a lucidez drena enquanto você enfrenta a tranca */
      game.lucidity -= (game.gentle ? 0.5 : 1.1) * dt;
      if (game.lucidity <= 0) {
        game.lucidity = 0;
        AudioMan.gameOver();
        AudioMan.stareOff();
        hooks.onGameOver();
      }
    }
    game.render();
    updateHud();
  }
  requestAnimationFrame(loop);
}

/* ---------- boot ---------- */
loadSettings();
loadAssets(p => {
  $('loader-fill').style.width = Math.round(p * 100) + '%';
  $('loader-pct').textContent = Math.round(p * 100) + '%';
}).then(() => {
  game = new Game($('game'), hooks);
  game.gentle = settings.gentle;
  buildHud();
  setTimeout(() => {
    transition(() => {
      hide($('loader'));
      show($('menu'));
      state = 'menu';
      updateSaveHint();
    });
  }, 400);
  requestAnimationFrame(loop);
}).catch(err => {
  $('loader-pct').textContent = 'erro ao carregar o campo 😢';
  document.querySelector('.loader-text').textContent = 'erro: ' + err.message;
});
