# 🌙 Tyler's Memories

> *Enquanto alguém lembra, ninguém parte de verdade.*

Um jogo de exploração **dreamcore/horror psicológico** em HTML5 + CSS + JavaScript puro
(sem dependências), construído com a arte e as trilhas sonoras originais do projeto.

**v2.0 — "As Trancas":** cada memória agora está **trancada por um puzzle**, e a história
ficou mais crua e real: depressão, luto, leito de morte. Tyler não está sonhando —
o campo é real, é o fim de tudo, e a porta é uma chegada, não uma saída.

> ⚠️ **Aviso de conteúdo:** depressão, luto, morte e hospital. Se isso ecoar em você,
> fale com alguém. **CVV — ligue 188** (Brasil, 24h, gratuito).

## 🎮 Como jogar

| Tecla | Ação |
|---|---|
| `WASD` ou setas | Andar (4 direções) |
| `E` / `Espaço` / `Enter` | Interagir com trancas, NPCs e porta · avançar diálogos |
| `Esc` | Pausar · desistir de uma tranca (pode voltar depois) |
| `M` | Mutar o som |

### As 6 trancas (puzzles)
1. **A caixa de remédios** — repita a sequência de cápsulas (4 rodadas, cresce a cada uma).
2. **O celular dela** — decifre a senha de 4 dígitos pelas pistas no verso da foto.
3. **O caminho de Bidu** — guie o cachorro pelo labirinto até casa, com passos contados.
4. **As cortinas** — acenda as 9 luzes (tocar numa vira as vizinhas), com toques limitados.
5. **Leito 312** — acompanhe o ritmo do monitor: 5 batimentos na zona verde, cada vez mais rápido.
6. **A carta** — remonte as frases da carta na ordem certa; errar devolve tudo ao início.

- ❌ **Errar custa lucidez.** E o frio **drena sua lucidez enquanto você tenta** — resolva rápido.
- 👁 **O Olhar**: quando o céu acordar, **continue andando**. Parado, a lucidez despenca.
- 💾 Progresso salvo automaticamente no navegador (`localStorage`).
- 📱 Controles touch automáticos no celular · 🎧 fones recomendados.

## 🚀 Publicar no GitHub Pages

1. Crie um repositório (ex.: `tylers-memories`) e envie **todo o conteúdo desta pasta** para a raiz
   (pelo site: *Add file → Upload files*; ou `git init && git add . && git commit -m "v2" && git push`).
2. **Settings → Pages** → Source: **Deploy from a branch** → Branch **main** / **/ (root)** → Save.
3. Em ~1 minuto: `https://SEU-USUARIO.github.io/tylers-memories/`.

> 💡 Local: abra o `index.html` ou rode `python3 -m http.server 8000` na pasta.

## 🗂 Estrutura

```
tylers-memories/
├── index.html          # telas: menu, intro, jogo, trancas, final…
├── css/style.css       # estética dreamcore + CRT + puzzles
├── js/
│   ├── assets.js       # carregador de imagens
│   ├── audio.js        # trilhas + efeitos (WebAudio)
│   ├── game.js         # mundo, player, NPCs, memórias, O Olhar
│   ├── puzzles.js      # as 6 trancas
│   └── main.js         # estados, diálogos, save, controles
└── assets/             # arte original processada + terror.mp3 / horror.mp3
```

## 🎨 Créditos

- **Arte, sprites, cenários e trilhas:** acervo original do projeto (pasta `dream`).
- **Game design, código e montagem:** feito com ajuda de IA (Arena.ai Agent Mode).

A arte e as trilhas pertencem aos seus autores originais — verifique os direitos antes
de redistribuir comercialmente.
