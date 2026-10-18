// Kit de Diógenes para a arena KULT. Toda a definição de poderes e modos fica centralizada aqui.
export const DIOGENES_KIT = {
  character: 'Diógenes',
  inks: {
    vermelha: {
      label: 'Cinza rubra', color: '#f05b43', fantasy: 'Fogo / agressão',
      skills: {
        q: { name: 'Incêndio — Q', mode: 'damage', cost: 20, cooldown: 2.3, damage: 38, behavior: 'fire', effect: 'projétil flamejante e queimadura por 3s', marker: 'linha de fogo' },
        w: { name: 'Manto de Brasa — W', mode: 'damage', cost: 25, cooldown: 8, damage: 0, behavior: 'ember-shield', effect: 'escudo de brasa e recuperação', marker: 'círculo protetor' },
        e: { name: 'Minas de Cinza — E', mode: 'damage', cost: 28, cooldown: 7, damage: 46, behavior: 'ash-mine', effect: 'mina explosiva em área', marker: 'área circular' }
      }
    },
    azul: {
      label: 'Tinta azul', color: '#58b5f0', fantasy: 'Maré / cura',
      skills: {
        q: { name: 'Lança de Maré — Q', mode: 'damage', cost: 19, cooldown: 2.5, damage: 34, behavior: 'water-lance', effect: 'projétil perfurante', marker: 'linha perfurante' },
        w: { name: 'Véu de Tinta — W', mode: 'damage', cost: 27, cooldown: 8, damage: 0, behavior: 'water-heal', effect: 'cura e escudo azul', marker: 'círculo de proteção' },
        e: { name: 'Redemoinho — E', mode: 'damage', cost: 29, cooldown: 7, damage: 24, behavior: 'water-vortex', effect: 'prende e desacelera inimigos próximos', marker: 'zona de controle' }
      }
    },
    amarela: {
      label: 'Ocre vivo', color: '#f2d057', fantasy: 'Luz / mobilidade',
      skills: {
        q: { name: 'Raio Prismático — Q', mode: 'damage', cost: 20, cooldown: 2.2, damage: 36, behavior: 'light-beam', effect: 'feixe de luz rápido', marker: 'feixe estreito' },
        w: { name: 'Passo de Luz — W', mode: 'damage', cost: 24, cooldown: 7, damage: 0, behavior: 'light-step', effect: 'esquiva, aceleração e breve invulnerabilidade', marker: 'rastro de luz' },
        e: { name: 'Clarão — E', mode: 'damage', cost: 30, cooldown: 7, damage: 20, behavior: 'light-flash', effect: 'cega e atordoa alvos na área', marker: 'área de clarão' }
      }
    }
  },
  modes: {
    damage: {
      label: 'DANO', description: 'Modo agressivo: maximize os projéteis e as explosões.',
      overrides: {}
    },
    support: {
      label: 'SUPORTE · VIDA BAIXA', description: 'Vida crítica: as tintas se reorganizam para proteger e recuperar Diógenes.',
      overrides: {
        q: { nameSuffix: ' · Cura', effect: 'pulso de suporte que recupera vida e remove queimadura', marker: 'círculo de cura', behavior: 'support-heal' },
        w: { nameSuffix: ' · Barreira', effect: 'barreira reforçada que bloqueia o próximo impacto', marker: 'escudo grande', behavior: 'support-shield' },
        e: { nameSuffix: ' · Zona segura', effect: 'zona de controle que afasta e atordoa inimigos próximos', marker: 'grande zona segura', behavior: 'support-control' }
      }
    },
    control: {
      label: 'CONTROLE DE GRUPO', description: 'Múltiplas ameaças: controle a arena e abra espaço para escapar.',
      overrides: {
        q: { nameSuffix: ' · Marca', effect: 'marca em área que interrompe inimigos próximos', marker: 'círculo de marcação', behavior: 'group-mark' },
        w: { nameSuffix: ' · Nuvem', effect: 'nuvem de tinta que desacelera o grupo', marker: 'nuvem ampla', behavior: 'group-slow' },
        e: { nameSuffix: ' · Prisão', effect: 'aprisiona e atordoa os inimigos na área', marker: 'zona de prisão', behavior: 'group-stun' }
      }
    }
  },
  ultimates: {
    vermelha: { name: 'Super-Nova Rubra', effect: 'grande explosão; dano massivo e queimadura em área', behavior: 'ultimate-fire', marker: 'círculo de explosão', damage: 125, cost: 52, cooldown: 22 },
    azul: { name: 'Dilúvio do Véu', effect: 'onda ampla; dano, cura e empurrão', behavior: 'ultimate-water', marker: 'onda ampla', damage: 88, cost: 52, cooldown: 22 },
    amarela: { name: 'Prisma do Apocalipse', effect: 'feixe em leque; dano, clarão e atordoamento', behavior: 'ultimate-light', marker: 'cone luminoso', damage: 98, cost: 52, cooldown: 22 }
  },
  utility: {
    branca: { name: 'Apagar', effect: 'remove projéteis e estados negativos próximos; abre uma janela de invulnerabilidade' },
    preta: { name: 'Absorver', targets: ['vida', 'mana', 'ouro', 'força'], effect: 'absorve do alvo o recurso escolhido' }
  }
};

export function determinarModoDio({ vida = 1, inimigos = 0, chefe = false, telegraph = false } = {}) {
  if (vida <= 0.38) return 'support';
  if (inimigos >= 2 || (chefe && telegraph) || (inimigos >= 1 && telegraph)) return 'control';
  return 'damage';
}

export function habilidadeDio(tinta, tecla, modo = 'damage') {
  const ink = DIOGENES_KIT.inks[tinta] || DIOGENES_KIT.inks.vermelha;
  if (tecla === 'r') return { ...DIOGENES_KIT.ultimates[tinta || 'vermelha'], key: 'r', color: ink.color };
  const base = ink.skills[tecla];
  if (!base) return null;
  const override = DIOGENES_KIT.modes[modo]?.overrides?.[tecla] || {};
  return { ...base, ...override, name: `${base.name}${override.nameSuffix || ''}`, key: tecla, color: ink.color, ink: tinta, mode: modo };
}
