/* ============ TYLER'S MEMORIES — mundo do sonho ============ */
'use strict';

const WORLD_W = 3200, WORLD_H = 600;
const VIEW_W = 960, VIEW_H = 540;
const S = VIEW_H / WORLD_H;                 // 0.9
const VIS_W = VIEW_W / S;                   // largura visível do mundo
const GROUND_TOP = 372, GROUND_BOT = 414;   // faixa caminhável (pés)
const SKY_H = 316;                          // olhos do céu até aqui
const PLAYER_SCALE = 118 / 805;             // altura do lado = 118 unidades
const NPC_SCALE = 0.213;
const DOOR_X = 3094, DOOR_HALF = 62;        // porta no cenario 4
const EYE_SEQ = [0, 1, 2, 3, 2, 1, 0, 4, 5, 6, 5, 4];

const FRAGMENTS = [
  { id: 0, x: 350,  y: 340, title: 'O quintal da vó',
    text: 'Terra molhada, pé descalço e o cheiro de chuva. Eu era pequeno, e o mundo cabia inteiro naquele quintal.' },
  { id: 1, x: 720,  y: 352, title: 'A bicicleta vermelha',
    text: 'Papai correndo atrás de mim, a mão no banco… até que um dia ele soltou. Eu voei sozinho pela primeira vez.' },
  { id: 2, x: 1290, y: 336, title: 'Bidu',
    text: 'Um cachorro caramelo me esperava no portão todos os dias. Ele nunca perguntou onde eu estive. Só abanava o rabo.' },
  { id: 3, x: 1850, y: 350, title: 'Canção de ninar',
    text: 'O quarto escuro não dava medo quando mamãe cantava baixinho. A voz dela acendia uma luz que ninguém via.' },
  { id: 4, x: 2460, y: 338, title: 'O corredor frio',
    text: 'O hospital cheirava a silêncio. Foi o dia em que eu aprendi que algumas despedidas não têm ensaio.' },
  { id: 5, x: 2920, y: 352, title: 'O último abraço',
    text: '“Enquanto você lembrar, a gente nunca vai embora.” Eu guardei esse abraço. E ele me guardou de volta.' },
];

class Game {
  constructor(canvas, hooks) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.hooks = hooks;
    this.gentle = false;
    this.reset(true);
  }

  reset(full) {
    this.player = { x: 140, y: 396, dir: 'frente', face: 1, frame: 0, animT: 0, stepT: 0, moving: false };
    this.camX = 0;
    this.t = 0;
    this.lucidity = 100;
    this.stare = { active: false, t: 0, next: 18 + Math.random() * 10 };
    this.eyeIdx = 0; this.eyeT = 0;
    this.doorOpen = false;
    this.doorHintShown = false;
    this.npcs = [
      { kind: 'sol', x: 980,  y: 392, animT: 0, frame: 0 },
      { kind: 'lua', x: 2150, y: 392, animT: 0, frame: 0 },
    ];
    if (full) {
      this.frags = FRAGMENTS.map(f => ({ ...f, taken: false }));
      this.playTime = 0;
      this.deaths = 0;
      this.met = { sol: false, lua: false };
      this.allDoneShown = false;
    }
  }

  serialize() {
    return {
      frags: this.frags.filter(f => f.taken).map(f => f.id),
      x: this.player.x, y: this.player.y,
      lucidity: this.lucidity, playTime: this.playTime,
      deaths: this.deaths, met: this.met,
    };
  }

  restore(d) {
    this.reset(true);
    if (!d) return;
    (d.frags || []).forEach(id => { const f = this.frags.find(f => f.id === id); if (f) f.taken = true; });
    this.player.x = d.x || 140; this.player.y = d.y || 396;
    this.lucidity = d.lucidity != null ? Math.max(35, d.lucidity) : 100;
    this.playTime = d.playTime || 0;
    this.deaths = d.deaths || 0;
    this.met = d.met || { sol: false, lua: false };
    this.doorOpen = this.frags.every(f => f.taken);
    this.camX = Math.max(0, Math.min(WORLD_W - VIS_W, this.player.x - VIS_W / 2));
  }

  get fragsGot() { return this.frags.filter(f => f.taken).length; }
  get nearNpc() {
    return this.npcs.find(n => Math.abs(n.x - this.player.x) < 85 && Math.abs(n.y - this.player.y) < 42) || null;
  }
  get nearDoor() { return Math.abs(this.player.x - DOOR_X) < DOOR_HALF + 14; }

  markMet(kind) { this.met[kind] = true; }

  npcLines(kind) {
    const left = 6 - this.fragsGot;
    if (this.fragsGot === 6) {
      return kind === 'sol'
        ? ['Você lembrou de tudo! A porta acordou, Tyler. Vá acordar.',
           'E… obrigado por não esquecer da gente.']
        : ['A porta está cantando, Tyler. É a sua deixa.',
           'Acorda. E quando sentir saudade… sonha com a gente de novo.'];
    }
    if (!this.met[kind]) {
      return kind === 'sol'
        ? ['Oi, Tyler. Você está sonhando de novo.',
           'O céu deixou os olhos abertos hoje… eles têm fome de quem esquece.',
           'Suas memórias caíram pelo campo. São seis. Recolha todas.',
           'Quando lembrar de tudo, a porta da SAÍDA vai abrir. Eu prometo.']
        : ['Shhh… eu sou a Lua. Eu cuido do que você esqueceu.',
           'A árvore ali atrás também já foi gente. Ela parou de lembrar.',
           'Cuidado com o Olhar: quando o céu brilhar, ANDAR é sobreviver.',
           'A saída fica lá na frente, depois de mim. Mas ela só abre para quem lembra.'];
    }
    return kind === 'sol'
      ? [`Faltam ${left} memória${left > 1 ? 's' : ''}, Tyler. Continue andando.`,
         'Não fique parado quando os olhos olharem. Eles comem a coragem de quem para.']
      : [`${left} memória${left > 1 ? 's' : ''} ainda dorm${left > 1 ? 'em' : 'e'} por aí. Eu sinto o cheiro dela${left > 1 ? 's' : ''}.`,
         'Se a sua luzinha apagar, o sonho te engole. Mexa-se, querido.'];
  }

  interact() {
    const npc = this.nearNpc;
    if (npc) { this.hooks.onDialogue(npc.kind, this.npcLines(npc.kind)); return; }
    if (this.nearDoor) {
      if (this.doorOpen) this.hooks.onExit();
      else {
        AudioMan.doorLocked();
        const left = 6 - this.fragsGot;
        this.hooks.onHint(`A porta não abre… ainda faltam ${left} memória${left > 1 ? 's' : ''}.`);
      }
    }
  }

  respawn() {
    this.deaths++;
    this.player.x = 140; this.player.y = 396;
    this.lucidity = 100;
    this.stare.active = false; this.stare.next = 20 + Math.random() * 10;
    this.camX = 0;
    this.hooks.onStare(false);
  }

  update(dt, keys) {
    this.t += dt;
    this.playTime += dt;
    const p = this.player;

    /* ---- movimento ---- */
    let vx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    let vy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    p.moving = !!(vx || vy);
    if (p.moving) {
      p.x += vx * 175 * dt;
      p.y += vy * 95 * dt;
      p.x = Math.max(40, Math.min(WORLD_W - 40, p.x));
      p.y = Math.max(GROUND_TOP, Math.min(GROUND_BOT, p.y));
      if (vx) { p.dir = 'lado'; p.face = vx; }
      else p.dir = vy < 0 ? 'costas' : 'frente';
      p.animT += dt;
      const spd = p.dir === 'lado' ? 0.1 : 0.14;
      if (p.animT >= spd) { p.animT = 0; p.frame++; }
      p.stepT += dt;
      if (p.stepT >= 0.27) { p.stepT = 0; AudioMan.step(); }
    } else { p.frame = 0; p.animT = 0; p.stepT = 0.2; }

    /* ---- câmera ---- */
    const target = Math.max(0, Math.min(WORLD_W - VIS_W, p.x - VIS_W / 2));
    this.camX += (target - this.camX) * Math.min(1, dt * 5);

    /* ---- olhos do céu (animação) ---- */
    this.eyeT += dt;
    if (this.eyeT >= 0.8) { this.eyeT = 0; this.eyeIdx = (this.eyeIdx + 1) % EYE_SEQ.length; }

    /* ---- NPCs ---- */
    for (const n of this.npcs) {
      n.animT += dt;
      if (n.animT >= 0.18) { n.animT = 0; n.frame++; }
    }

    /* ---- fragmentos ---- */
    for (const f of this.frags) {
      if (!f.taken && Math.abs(f.x - p.x) < 40 && Math.abs((f.y + 26) - p.y) < 46) {
        f.taken = true;
        this.lucidity = Math.min(100, this.lucidity + 20);
        AudioMan.pickup();
        this.hooks.onFragment(f);
        if (this.fragsGot === 6) {
          this.doorOpen = true;
          if (!this.allDoneShown) {
            this.allDoneShown = true;
            AudioMan.unlock();
            this.hooks.onAllDone();
          }
        }
        break;
      }
    }

    /* ---- O OLHAR ---- */
    const st = this.stare;
    if (!st.active) {
      st.next -= dt;
      if (st.next <= 0) {
        st.active = true;
        st.t = this.gentle ? 5 : 7;
        this.hooks.onStare(true);
        AudioMan.stareOn();
        if (!this.gentle) AudioMan.stareHit();
      }
      this.lucidity = Math.min(100, this.lucidity + 3 * dt);
    } else {
      st.t -= dt;
      const drain = this.gentle ? (p.moving ? 1.2 : 3) : (p.moving ? 2.5 : 6);
      this.lucidity -= drain * dt;
      if (st.t <= 0) {
        st.active = false;
        st.next = 22 + Math.random() * 16;
        this.hooks.onStare(false);
        AudioMan.stareOff();
      }
    }
    if (this.lucidity <= 0) {
      this.lucidity = 0;
      AudioMan.gameOver();
      AudioMan.stareOff();
      this.hooks.onGameOver();
    }

    /* ---- dica da porta ---- */
    if (this.nearDoor && !this.doorHintShown) {
      this.doorHintShown = true;
      this.hooks.onHint(this.doorOpen ? 'A porta está aberta. Pressione E para acordar.' : 'Uma porta com placa de SAÍDA… trancada por enquanto.');
    }
  }

  /* ================= RENDER ================= */
  render() {
    const ctx = this.ctx, t = this.t;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.setTransform(S, 0, 0, S, -this.camX * S, 0);

    /* cenários */
    for (let i = 0; i < 4; i++) {
      const x = i * 800;
      if (x + 800 > this.camX - 10 && x < this.camX + VIS_W + 10)
        ctx.drawImage(ASSETS.cenarios[i], x, 0);
    }

    /* olhos do céu — blend screen, parallax */
    const stareOn = this.stare.active;
    const eyeFrame = stareOn ? ASSETS.ceu[3] : ASSETS.ceu[EYE_SEQ[this.eyeIdx]];
    const baseA = this.gentle ? 0.4 : 0.55;
    const eyeA = stareOn ? (this.gentle ? 0.7 : 0.95) : baseA;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = eyeA;
    const off = this.camX * 0.55;
    const start = Math.floor(off / 800) - 1;
    for (let k = start; k <= start + 3; k++) {
      const x = k * 800 - off + this.camX;
      ctx.drawImage(eyeFrame, 0, 0, 800, SKY_H, x, 0, 800, SKY_H);
      if (stareOn) { ctx.globalAlpha = eyeA * (0.5 + 0.5 * Math.sin(t * 6)); ctx.drawImage(eyeFrame, 0, 0, 800, SKY_H, x, 0, 800, SKY_H); ctx.globalAlpha = eyeA; }
    }
    ctx.restore();

    /* porta — brilho quando aberta */
    if (this.doorOpen) {
      const g = ctx.createRadialGradient(DOOR_X, 268, 8, DOOR_X, 268, 150);
      const pulse = 0.75 + 0.25 * Math.sin(t * 2.4);
      g.addColorStop(0, `rgba(255,240,190,${0.85 * pulse})`);
      g.addColorStop(0.45, `rgba(255,210,120,${0.3 * pulse})`);
      g.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = g;
      ctx.fillRect(DOOR_X - 150, 118, 300, 300);
      ctx.fillStyle = `rgba(255,244,210,${0.8 * pulse})`;
      ctx.fillRect(3040, 200, 108, 130);
    }

    /* fragmentos de memória */
    for (const f of this.frags) {
      if (f.taken) continue;
      const fy = f.y + Math.sin(t * 2.2 + f.id * 1.7) * 5;
      const pulse = 0.7 + 0.3 * Math.sin(t * 3 + f.id);
      const g = ctx.createRadialGradient(f.x, fy, 2, f.x, fy, 26 + pulse * 6);
      g.addColorStop(0, 'rgba(255,250,225,.95)');
      g.addColorStop(0.35, `rgba(255,217,122,${0.55 * pulse})`);
      g.addColorStop(1, 'rgba(255,217,122,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(f.x, fy, 34, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff8e0';
      ctx.beginPath(); ctx.arc(f.x, fy, 6, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${0.7 * pulse})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(f.x - 12, fy); ctx.lineTo(f.x + 12, fy);
      ctx.moveTo(f.x, fy - 12); ctx.lineTo(f.x, fy + 12);
      ctx.stroke();
    }

    /* NPCs */
    for (const n of this.npcs) {
      const frames = n.kind === 'sol' ? ASSETS.sol : ASSETS.lua;
      const seq = n.kind === 'sol' ? [0, 1, 2, 3, 4, 3, 2, 1] : [0, 1, 2, 3, 4, 5, 4, 3, 2, 1];
      const im = frames[seq[n.frame % seq.length]];
      const w = im.width * NPC_SCALE, h = im.height * NPC_SCALE;
      const sway = Math.sin(t * 0.9 + (n.kind === 'sol' ? 0 : 2)) * 0.022;
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate(sway);
      ctx.drawImage(im, -w / 2, -h, w, h);
      ctx.restore();
    }

    /* player */
    const p = this.player;
    const frames = ASSETS.player[p.dir];
    const im = frames[p.frame % frames.length];
    const w = im.width * PLAYER_SCALE, h = im.height * PLAYER_SCALE;
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 24, 6, 0, 0, 7); ctx.fill();
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.dir === 'lado' && p.face < 0) ctx.scale(-1, 1);
    ctx.drawImage(im, -w / 2, -h, w, h);
    ctx.restore();

    /* prompt de interação */
    const near = this.nearNpc;
    let px = null, py = null;
    if (near) { px = near.x; py = near.y - (near.kind === 'sol' ? 175 : 160); }
    else if (this.nearDoor) { px = DOOR_X; py = 175; }
    if (px != null) {
      const bob = Math.sin(t * 4) * 3;
      ctx.fillStyle = 'rgba(10,10,20,.85)';
      ctx.strokeStyle = '#ffd97a'; ctx.lineWidth = 2;
      const bw = 34, bh = 30, bx = px - bw / 2, by = py + bob;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 7); else ctx.rect(bx, by, bw, bh);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd97a';
      ctx.font = 'bold 17px "Courier New", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('E', px, by + bh / 2 + 1);
    }

    /* ---- pós: vinheta + olhar (espaço da tela) ---- */
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const v = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.36, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.85);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, `rgba(0,0,10,${stareOn ? 0.78 : 0.5})`);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (stareOn && !this.gentle) {
      ctx.fillStyle = `rgba(120,0,0,${0.08 + 0.06 * Math.sin(t * 7)})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    if (this.lucidity < 30) {
      const a = (30 - this.lucidity) / 30 * (0.35 + 0.15 * Math.sin(t * 5));
      const v2 = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.2, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.8);
      v2.addColorStop(0, 'rgba(0,0,0,0)');
      v2.addColorStop(1, `rgba(0,0,0,${a})`);
      ctx.fillStyle = v2;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }
}
