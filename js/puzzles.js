/* ============ TYLER'S MEMORIES — as trancas (puzzles) ============ */
'use strict';

const Puzzles = {
  frag: null,
  type: null,
  st: null,          // estado do puzzle atual
  timers: [],
  cursor: 0,

  META: {
    simon: { title: 'A CAIXA DE REMÉDIOS',
      desc: 'Ela tomava os remédios sempre na mesma ordem. Observe as cápsulas acenderem e repita a sequência. Quatro rodadas — a cada uma, uma cápsula a mais.' },
    code: { title: 'O CELULAR DELA',
      desc: 'Você nunca desbloqueou o celular dela. No verso da foto do quintal, a letra trêmula deixou as pistas da senha de 4 dígitos.' },
    maze: { title: 'O CAMINHO DE BIDU',
      desc: 'O último passeio. Guie Bidu até a porta de casa antes que os passos acabem. Ele conhecia o caminho de cor — você não.' },
    lights: { title: 'AS CORTINAS',
      desc: 'Onze meses no escuro. Acenda todas as luzes do quarto. Mas tocar numa luz vira também as vizinhas de cima, baixo, esquerda e direita.' },
    pulse: { title: 'LEITO 312',
      desc: 'O monitor marca o ritmo. Aperte E quando o traço cruzar a zona verde. Fique com ela até o fim. Cinco batimentos.' },
    letter: { title: 'A CARTA',
      desc: 'As frases se embaralharam na gaveta. Toque nelas na ordem em que foram escritas. Errar devolve tudo para o começo.' },
  },

  open(frag) {
    this.frag = frag;
    this.type = frag.puzzle;
    this.st = {};
    this.cursor = 0;
    ui.puzzle = true;
    keys.left = keys.right = keys.up = keys.down = false;
    const m = this.META[this.type];
    $('pz-title').textContent = m.title;
    $('pz-desc').textContent = m.desc;
    $('pz-status').textContent = '';
    $('pz-status').className = '';
    $('pz-stage').innerHTML = '';
    show($('puzzle'));
    AudioMan.click();
    this['build_' + this.type]();
  },

  close() {
    this.timers.forEach(t => { clearTimeout(t); clearInterval(t); });
    this.timers = [];
    ui.puzzle = false;
    hide($('puzzle'));
    this.frag = null; this.st = null; this.type = null;
  },

  abort() {
    if (!this.frag) return;
    this.close();
    showHint('A tranca continua lá. Ela não vai embora — e nem a memória.');
  },

  win() {
    const id = this.frag.id;
    AudioMan.unlock();
    this.close();
    game.collect(id);
  },

  fail(cost, msg) {
    AudioMan.doorLocked();
    this.status(msg, 'bad');
    return game.penalty(cost); // true = morreu (main abre o game over)
  },

  status(msg, cls) {
    const el = $('pz-status');
    el.textContent = msg;
    el.className = cls || '';
  },

  later(fn, ms) { const t = setTimeout(fn, ms); this.timers.push(t); return t; },
  every(fn, ms) { const t = setInterval(fn, ms); this.timers.push(t); return t; },

  key(k) {
    if (!this.type) return;
    const map = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
      ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down',
      left: 'left', right: 'right', up: 'up', down: 'down',
      e: 'e', E: 'e', Enter: 'e', ' ': 'e', Backspace: 'back' };
    const kk = map[k] || (/^[0-9]$/.test(k) ? k : null);
    if (!kk) return;
    const h = this['key_' + this.type];
    if (h) h.call(this, kk);
  },

  /* ============ 1) SIMON — a ordem dos remédios ============ */
  build_simon() {
    this.st = { round: 0, seq: [], pos: 0, phase: 'wait' };
    const colors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71'];
    const wrap = document.createElement('div');
    wrap.className = 'simon-wrap';
    colors.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'simon-btn'; b.id = 'simon' + i;
      b.style.setProperty('--c', c);
      b.innerHTML = `<span class="pill"></span>${i + 1}`;
      b.addEventListener('click', () => this.simonPress(i));
      wrap.appendChild(b);
    });
    $('pz-stage').appendChild(wrap);
    for (let i = 0; i < 3; i++) this.st.seq.push(Math.floor(Math.random() * 4));
    this.later(() => this.simonShow(), 600);
  },
  simonShow() {
    const st = this.st; if (!st) return;
    st.phase = 'show'; st.pos = 0;
    this.status(`Rodada ${st.round + 1}/4 — observe…`);
    st.seq.forEach((c, i) => {
      this.later(() => { const b = $('simon' + c); if (b) b.classList.add('lit'); }, 500 + i * 620);
      this.later(() => { const b = $('simon' + c); if (b) b.classList.remove('lit'); }, 500 + i * 620 + 400);
    });
    this.later(() => { if (!this.st) return; st.phase = 'input'; this.status(`Sua vez — 0/${st.seq.length}`); }, 500 + st.seq.length * 620);
  },
  simonPress(i) {
    const st = this.st;
    if (!st || st.phase !== 'input') return;
    const b = $('simon' + i);
    b.classList.add('lit'); this.later(() => b.classList.remove('lit'), 220);
    AudioMan.blip();
    if (i !== st.seq[st.pos]) {
      st.phase = 'wait';
      if (this.fail(6, 'A ordem se perdeu. As cápsulas rolam de volta. Observe de novo.')) return;
      this.later(() => this.simonShow(), 1100);
      return;
    }
    st.pos++;
    this.status(`Sua vez — ${st.pos}/${st.seq.length}`);
    if (st.pos === st.seq.length) {
      st.round++;
      if (st.round >= 4) { this.win(); return; }
      st.phase = 'wait';
      st.seq.push(Math.floor(Math.random() * 4));
      this.status('Certo. Mais uma cápsula na ordem…', 'good');
      this.later(() => this.simonShow(), 1000);
    }
  },
  key_simon(k) { if (['1', '2', '3', '4'].includes(k)) this.simonPress(+k - 1); },

  /* ============ 2) SENHA — o celular dela ============ */
  build_code() {
    this.st = { entered: '' };
    const clues = document.createElement('div');
    clues.className = 'code-clues';
    clues.innerHTML =
      '<p>“A soma dos quatro dígitos é oito.</p>' +
      '<p>O primeiro é o dobro do segundo.</p>' +
      '<p>O terceiro é igual ao segundo.</p>' +
      '<p>O último é zero. Você sabe qual.”</p>';
    $('pz-stage').appendChild(clues);
    const disp = document.createElement('div');
    disp.className = 'code-display'; disp.id = 'code-display';
    $('pz-stage').appendChild(disp);
    const pad = document.createElement('div');
    pad.className = 'code-pad';
    ['1','2','3','4','5','6','7','8','9','⌫','0','✔'].forEach(n => {
      const b = document.createElement('button');
      b.className = 'code-key'; b.textContent = n;
      b.addEventListener('click', () => this.codePress(n));
      pad.appendChild(b);
    });
    $('pz-stage').appendChild(pad);
    this.codeRender();
    this.status('Digite os 4 dígitos e confirme em ✔');
  },
  codeRender() {
    const e = this.st.entered;
    $('code-display').textContent = (e + '____'.slice(e.length)).split('').join(' ');
  },
  codePress(n) {
    const st = this.st; if (!st) return;
    AudioMan.blip();
    if (n === '⌫') { st.entered = st.entered.slice(0, -1); this.codeRender(); return; }
    if (n === '✔') {
      if (st.entered.length < 4) { this.status('Quatro dígitos. Ela sempre disse: quatro.'); return; }
      if (st.entered === '4220') { this.win(); return; }
      st.entered = '';
      this.codeRender();
      this.fail(6, 'Senha incorreta. A tela continua escura, como o quarto dela.');
      return;
    }
    if (st.entered.length < 4) { st.entered += n; this.codeRender(); }
  },
  key_code(k) {
    if (/^[0-9]$/.test(k)) this.codePress(k);
    else if (k === 'back') this.codePress('⌫');
    else if (k === 'e') this.codePress('✔');
  },

  /* ============ 3) LABIRINTO — o caminho de Bidu ============ */
  build_maze() {
    // labirinto gerado por backtracker (ímpar 13x9), sempre solúvel
    const W = 13, H = 9;
    const g = Array.from({ length: H }, () => Array(W).fill(1));
    const stack = [[1, 1]]; g[1][1] = 0;
    const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]];
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const opts = dirs.map(([dx, dy]) => [x + dx, y + dy, dx, dy])
        .filter(([nx, ny]) => nx > 0 && nx < W - 1 && ny > 0 && ny < H - 1 && g[ny][nx] === 1);
      if (!opts.length) { stack.pop(); continue; }
      const [nx, ny, dx, dy] = opts[Math.floor(Math.random() * opts.length)];
      g[y + dy / 2][x + dx / 2] = 0; g[ny][nx] = 0;
      stack.push([nx, ny]);
    }
    // BFS p/ caminho mínimo e limite justo
    const dist = Array.from({ length: H }, () => Array(W).fill(-1));
    const q = [[1, 1]]; dist[1][1] = 0;
    while (q.length) {
      const [x, y] = q.shift();
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (g[ny] && g[ny][nx] === 0 && dist[ny][nx] < 0) { dist[ny][nx] = dist[y][x] + 1; q.push([nx, ny]); }
      });
    }
    this.st = { g, W, H, x: 1, y: 1, gx: W - 2, gy: H - 2, steps: 0, limit: dist[H - 2][W - 2] + 14 };
    const grid = document.createElement('div');
    grid.className = 'maze-grid'; grid.id = 'maze-grid';
    grid.style.gridTemplateColumns = `repeat(${W}, 22px)`;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = document.createElement('div');
      c.className = 'maze-cell' + (g[y][x] ? ' wall' : '');
      c.id = `mz${x}_${y}`;
      grid.appendChild(c);
    }
    $('pz-stage').appendChild(grid);
    this.mazeRender();
  },
  mazeRender() {
    const st = this.st;
    for (let y = 0; y < st.H; y++) for (let x = 0; x < st.W; x++) {
      const c = $(`mz${x}_${y}`);
      c.textContent = (x === st.x && y === st.y) ? '🐕' : (x === st.gx && y === st.gy ? '🏠' : '');
    }
    this.status(`Passos: ${st.steps}/${st.limit} — leve Bidu para casa.`);
  },
  key_maze(k) {
    const st = this.st; if (!st) return;
    const d = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[k];
    if (!d) return;
    const nx = st.x + d[0], ny = st.y + d[1];
    if (!st.g[ny] || st.g[ny][nx] !== 0) return;
    st.x = nx; st.y = ny; st.steps++;
    AudioMan.step();
    if (nx === st.gx && ny === st.gy) { this.win(); return; }
    if (st.steps >= st.limit) {
      st.x = 1; st.y = 1; st.steps = 0;
      if (this.fail(6, 'Bidu se perdeu no escuro. Ele volta para o começo, esperando por você.')) return;
    }
    this.mazeRender();
  },

  /* ============ 4) LUZES — as cortinas ============ */
  build_lights() {
    const g = Array(9).fill(true);
    const press = i => {
      const x = i % 3, y = (i / 3) | 0;
      [[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < 3 && ny >= 0 && ny < 3) g[ny * 3 + nx] = !g[ny * 3 + nx];
      });
    };
    const used = new Set();
    while (used.size < 5) { const i = Math.floor(Math.random() * 9); if (!used.has(i)) { used.add(i); press(i); } }
    if (g.every(v => v)) press(4);
    this.st = { g, moves: 0, limit: 30 };
    const grid = document.createElement('div');
    grid.className = 'lights-grid'; grid.id = 'lights-grid';
    for (let i = 0; i < 9; i++) {
      const b = document.createElement('button');
      b.className = 'light-cell'; b.id = 'lt' + i;
      b.addEventListener('click', () => this.lightsPress(i));
      grid.appendChild(b);
    }
    $('pz-stage').appendChild(grid);
    this.lightsRender();
  },
  lightsRender() {
    const st = this.st;
    st.g.forEach((on, i) => {
      const b = $('lt' + i);
      b.classList.toggle('on', on);
      b.classList.toggle('cursor', i === this.cursor);
      b.textContent = on ? '💡' : '';
    });
    this.status(`Toques: ${st.moves}/${st.limit} — acenda as nove luzes.`);
  },
  lightsPress(i) {
    const st = this.st; if (!st) return;
    this.cursor = i;
    const x = i % 3, y = (i / 3) | 0;
    [[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < 3 && ny >= 0 && ny < 3) st.g[ny * 3 + nx] = !st.g[ny * 3 + nx];
    });
    st.moves++;
    AudioMan.blip();
    if (st.g.every(v => v)) { this.win(); return; }
    if (st.moves >= st.limit) {
      if (this.fail(6, 'As luzes se apagaram de novo. O escuro é paciente. Tente outra vez.')) return;
      $('pz-stage').innerHTML = '';
      this.build_lights();
      return;
    }
    this.lightsRender();
  },
  key_lights(k) {
    const d = { left: -1, right: 1, up: -3, down: 3 }[k];
    if (d != null) {
      const n = this.cursor + d;
      if (n >= 0 && n < 9 && !(d === -1 && this.cursor % 3 === 0) && !(d === 1 && this.cursor % 3 === 2)) this.cursor = n;
      this.lightsRender();
    } else if (k === 'e') this.lightsPress(this.cursor);
  },

  /* ============ 5) PULSO — leito 312 ============ */
  build_pulse() {
    this.st = { p: 0, dir: 1, speed: 2.0, z0: 40, w: 22, hits: 0, need: 5 };
    const wrap = document.createElement('div');
    wrap.className = 'pulse-wrap';
    wrap.innerHTML = '<div class="pulse-heart" id="pulse-heart">❤</div>' +
      '<div class="pulse-track" id="pulse-track"><div class="pulse-zone" id="pulse-zone"></div>' +
      '<div class="pulse-marker" id="pulse-marker"></div></div>' +
      '<button class="ui-btn pulse-btn" id="pulse-btn">E — fique com ela</button>';
    $('pz-stage').appendChild(wrap);
    $('pulse-track').addEventListener('click', () => this.pulseHit());
    $('pulse-btn').addEventListener('click', () => this.pulseHit());
    this.pulseZone();
    this.every(() => {
      const st = this.st; if (!st) return;
      st.p += st.dir * st.speed;
      if (st.p >= 100) { st.p = 100; st.dir = -1; }
      if (st.p <= 0) { st.p = 0; st.dir = 1; }
      const mk = $('pulse-marker'); if (mk) mk.style.left = st.p + '%';
      const h = $('pulse-heart'); if (h) h.style.transform = `scale(${1 + 0.12 * Math.sin(Date.now() / 180)})`;
    }, 28);
    this.status(`Batimentos: 0/${this.st.need}`);
  },
  pulseZone() {
    const st = this.st;
    st.z0 = 8 + Math.random() * (84 - st.w);
    const z = $('pulse-zone');
    z.style.left = st.z0 + '%'; z.style.width = st.w + '%';
  },
  pulseHit() {
    const st = this.st; if (!st) return;
    if (st.p >= st.z0 && st.p <= st.z0 + st.w) {
      st.hits++;
      AudioMan.blip();
      if (st.hits >= st.need) { this.win(); return; }
      st.speed += 0.55;
      st.w = Math.max(10, st.w - 3);
      this.pulseZone();
      this.status(`Batimentos: ${st.hits}/${st.need} — continue. Não solte a mão dela.`, 'good');
    } else {
      st.hits = Math.max(0, st.hits - 1);
      if (this.fail(5, 'O traço escapou. Respire. Ela ainda está aqui.')) return;
      this.status(`Batimentos: ${st.hits}/${st.need}`);
    }
  },
  key_pulse(k) { if (k === 'e') this.pulseHit(); },

  /* ============ 6) CARTA — a ordem das frases ============ */
  build_letter() {
    const lines = [
      'Para quem encontrar esta carta:',
      'não me procurem no cemitério. Eu não estou lá.',
      'Estou no quintal, na bicicleta, no pelo do Bidu,',
      'na luz que ela acendia todas as manhãs.',
      'Se a porta aparecer, não tenha medo. É só do outro lado que a gente para de doer.',
    ];
    const order = [2, 4, 0, 3, 1]; // embaralhamento fixo
    this.st = { lines, order, picked: [] };
    const wrap = document.createElement('div');
    wrap.className = 'letter-wrap';
    order.forEach((li, pos) => {
      const b = document.createElement('button');
      b.className = 'letter-line'; b.id = 'll' + pos;
      b.innerHTML = `<span class="ll-num">${pos + 1}</span> ${lines[li]}`;
      b.addEventListener('click', () => this.letterPress(pos));
      wrap.appendChild(b);
    });
    $('pz-stage').appendChild(wrap);
    this.status('Toque na primeira frase da carta.');
  },
  letterPress(pos) {
    const st = this.st; if (!st) return;
    if (st.picked.includes(pos)) return;
    const expected = st.picked.length; // índice correto na ordem original
    if (st.order[pos] === expected) {
      st.picked.push(pos);
      const b = $('ll' + pos);
      b.classList.add('picked');
      b.querySelector('.ll-num').textContent = st.picked.length;
      AudioMan.blip();
      if (st.picked.length === 5) { this.win(); return; }
      this.status(`Frase ${st.picked.length}/5. Continue.`, 'good');
    } else {
      st.picked = [];
      document.querySelectorAll('.letter-line').forEach(b => {
        b.classList.remove('picked');
      });
      st.order.forEach((li, p) => { $('ll' + p).querySelector('.ll-num').textContent = p + 1; });
      this.fail(4, 'Não era essa a ordem. As frases voltam para a gaveta.');
    }
  },
  key_letter(k) { if (['1', '2', '3', '4', '5'].includes(k)) this.letterPress(+k - 1); },
};
