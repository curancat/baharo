# 🌙 Tyler's Memories

> *Enquanto a gente lembra, ninguém parte de verdade.*

Um jogo de exploração **dreamcore/horror** feito em HTML5 + CSS + JavaScript puro (sem dependências),
construído inteiramente com a arte e as trilhas sonoras originais do projeto.

Tyler adormeceu com o coração pesado de saudade e acordou num sonho estranho: um campo noturno
vigiado por **olhos que não piscam**. Recolha as **6 memórias** espalhadas pelo campo, converse com
o **Sol** e a **Lua**, sobreviva ao **Olhar** e encontre a porta de **SAÍDA** para acordar.

## 🎮 Como jogar

| Tecla | Ação |
|---|---|
| `WASD` ou setas | Andar (4 direções) |
| `E` / `Espaço` / `Enter` | Interagir, avançar diálogos |
| `Esc` | Pausar |
| `M` | Mutar o som |

- 📱 Funciona também no celular (controles touch aparecem sozinhos).
- 👁 **O Olhar**: de tempos em tempos o céu acorda. **Continue andando!** Ficar parado drena sua
  *lucidez* muito mais rápido. Se ela zerar, o sonho te engole (mas suas memórias ficam salvas).
- 💾 O progresso é salvo automaticamente no navegador (`localStorage`).
- 🎧 Fones de ouvido recomendados.

## 🚀 Publicar no GitHub Pages (passo a passo)

1. Crie um repositório novo no GitHub (ex.: `tylers-memories`).
2. Envie **todo o conteúdo desta pasta** para a raiz do repositório:
   - pelo site: *Add file → Upload files* e arraste tudo (inclusive as pastas `assets/`, `css/`, `js/`);
   - ou via terminal:
     ```bash
     git init
     git add .
     git commit -m "Tyler's Memories v1.0"
     git branch -M main
     git remote add origin https://github.com/SEU-USUARIO/tylers-memories.git
     git push -u origin main
     ```
3. No repositório: **Settings → Pages**.
4. Em *Build and deployment*: Source = **Deploy from a branch**, Branch = **main**, pasta = **/ (root)** → **Save**.
5. Aguarde ~1 minuto e o jogo estará no ar em:
   `https://SEU-USUARIO.github.io/tylers-memories/`

> 💡 Também roda localmente: basta abrir o `index.html` no navegador, ou servir a pasta
> (`python3 -m http.server 8000` e acessar `http://localhost:8000`).

## 🗂 Estrutura

```
tylers-memories/
├── index.html          # telas: menu, intro, jogo, final, opções…
├── css/style.css       # estética dreamcore + efeito CRT
├── js/
│   ├── assets.js       # carregador de imagens
│   ├── audio.js        # trilhas + efeitos sonoros (WebAudio)
│   ├── game.js         # mundo, player, NPCs, memórias, O Olhar
│   └── main.js         # estados, diálogos, save, controles
└── assets/
    ├── img/            # arte original processada (sprites recortados,
    │                   # fundo preto → transparência, cenários, céu, menu)
    └── audio/          # terror.mp3 (menu/jogo) · horror.mp3 (evento O Olhar)
```

## 🎨 Créditos

- **Arte, sprites, cenários e trilhas sonoras:** acervo original do projeto (pasta `dream`).
- **Game design, código e montagem:** feito com ajuda de IA (Arena.ai Agent Mode).

Sinta-se livre para modificar o código. A arte e as trilhas pertencem aos seus autores originais —
verifique os direitos antes de redistribuir comercialmente.
