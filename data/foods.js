// ═══════════════════════════════════════════════════════════
//  EINGEBAUTE LEBENSMITTEL-DATENBANK
//  KH = Kohlenhydrate pro 100g
//  defaultAmounts = empfohlene Portionsgrößen in Gramm
// ═══════════════════════════════════════════════════════════

export const BUILTIN_FOODS = [
  // ── Brot & Getreide ─────────────────────────────────────
  { id: 'b01', emoji: '🍞', name: 'Weißbrot',              khPer100g: 49, defaultAmounts: [30, 60, 90]      },
  { id: 'b02', emoji: '🍞', name: 'Vollkornbrot',           khPer100g: 41, defaultAmounts: [30, 60, 90]      },
  { id: 'b03', emoji: '🥖', name: 'Brötchen (Weiß)',        khPer100g: 54, defaultAmounts: [40, 60, 80]      },
  { id: 'b04', emoji: '🥖', name: 'Vollkornbrötchen',       khPer100g: 44, defaultAmounts: [40, 60, 80]      },
  { id: 'b05', emoji: '🥐', name: 'Croissant',              khPer100g: 45, defaultAmounts: [50, 80]          },
  { id: 'b06', emoji: '🥞', name: 'Pfannkuchen',            khPer100g: 40, defaultAmounts: [60, 120]         },
  { id: 'b07', emoji: '🧇', name: 'Waffeln',                khPer100g: 41, defaultAmounts: [60, 120]         },
  { id: 'b08', emoji: '🥣', name: 'Cornflakes',             khPer100g: 84, defaultAmounts: [30, 50]          },
  { id: 'b09', emoji: '🥣', name: 'Müsli',                  khPer100g: 60, defaultAmounts: [40, 60, 80]      },
  { id: 'b10', emoji: '🍪', name: 'Butterkeks',             khPer100g: 70, defaultAmounts: [10, 20, 30]      },
  { id: 'b11', emoji: '🥣', name: 'Haferflocken',           khPer100g: 60, defaultAmounts: [40, 60, 80]      },
  { id: 'b12', emoji: '🍞', name: 'Toastbrot',              khPer100g: 50, defaultAmounts: [25, 50, 75]      },
  { id: 'b13', emoji: '🥖', name: 'Baguette',               khPer100g: 54, defaultAmounts: [40, 80, 120]     },
  { id: 'b14', emoji: '🥣', name: 'Granola',                khPer100g: 65, defaultAmounts: [40, 60]          },

  // ── Nudeln & Reis ───────────────────────────────────────
  { id: 'p01', emoji: '🍝', name: 'Nudeln (roh)',           khPer100g: 71, defaultAmounts: [60, 80, 100]     },
  { id: 'p02', emoji: '🍝', name: 'Nudeln (gekocht)',       khPer100g: 25, defaultAmounts: [150, 200, 250]   },
  { id: 'p03', emoji: '🍚', name: 'Reis (roh)',             khPer100g: 78, defaultAmounts: [50, 75, 100]     },
  { id: 'p04', emoji: '🍚', name: 'Reis (gekocht)',         khPer100g: 28, defaultAmounts: [150, 200, 250]   },
  { id: 'p05', emoji: '🍝', name: 'Spaghetti (gekocht)',    khPer100g: 25, defaultAmounts: [150, 200, 250]   },
  { id: 'p06', emoji: '🍜', name: 'Mie-Nudeln (gekocht)',   khPer100g: 26, defaultAmounts: [150, 200]        },

  // ── Kartoffeln ───────────────────────────────────────────
  { id: 'k01', emoji: '🥔', name: 'Kartoffeln (gekocht)',   khPer100g: 17, defaultAmounts: [100, 150, 200]   },
  { id: 'k02', emoji: '🍟', name: 'Pommes frites',          khPer100g: 35, defaultAmounts: [100, 150, 200]   },
  { id: 'k03', emoji: '🥔', name: 'Bratkartoffeln',         khPer100g: 20, defaultAmounts: [100, 150, 200]   },
  { id: 'k04', emoji: '🥔', name: 'Kartoffelpüree',         khPer100g: 14, defaultAmounts: [100, 150, 200]   },

  // ── Aufstriche ───────────────────────────────────────────
  { id: 'a01', emoji: '🍫', name: 'Nutella',                khPer100g: 57, defaultAmounts: [15, 20, 30]      },
  { id: 'a02', emoji: '🍯', name: 'Honig',                  khPer100g: 81, defaultAmounts: [10, 15, 20]      },
  { id: 'a03', emoji: '🍓', name: 'Marmelade',              khPer100g: 60, defaultAmounts: [15, 20, 30]      },
  { id: 'a04', emoji: '🧈', name: 'Butter',                 khPer100g: 1,  defaultAmounts: [10, 20]          },
  { id: 'a05', emoji: '🥜', name: 'Erdnussbutter',          khPer100g: 14, defaultAmounts: [15, 20, 30]      },

  // ── Milchprodukte ────────────────────────────────────────
  { id: 'm01', emoji: '🥛', name: 'Vollmilch',              khPer100g: 5,  defaultAmounts: [100, 150, 200]   },
  { id: 'm02', emoji: '🥛', name: 'Fruchtjoghurt',          khPer100g: 15, defaultAmounts: [100, 150, 200]   },
  { id: 'm03', emoji: '🥛', name: 'Naturjoghurt',           khPer100g: 4,  defaultAmounts: [100, 150, 200]   },
  { id: 'm04', emoji: '🍦', name: 'Eis (Vanille)',          khPer100g: 23, defaultAmounts: [60, 100, 150]    },
  { id: 'm05', emoji: '🧀', name: 'Käse (Scheibe)',         khPer100g: 1,  defaultAmounts: [20, 30, 40]      },
  { id: 'm06', emoji: '🥛', name: 'Kakao (mit Milch)',      khPer100g: 10, defaultAmounts: [150, 200, 250]   },
  { id: 'm07', emoji: '🍦', name: 'Frozen Joghurt',         khPer100g: 20, defaultAmounts: [60, 100, 150]    },
  { id: 'm08', emoji: '🧀', name: 'Quark (20% F.i.Tr.)',   khPer100g: 4,  defaultAmounts: [100, 150, 200]   },

  // ── Obst ─────────────────────────────────────────────────
  { id: 'o01', emoji: '🍎', name: 'Apfel',                  khPer100g: 12, defaultAmounts: [100, 150, 180]   },
  { id: 'o02', emoji: '🍌', name: 'Banane',                 khPer100g: 23, defaultAmounts: [80, 120, 150]    },
  { id: 'o03', emoji: '🍊', name: 'Orange',                 khPer100g: 9,  defaultAmounts: [100, 150, 200]   },
  { id: 'o04', emoji: '🍇', name: 'Weintrauben',            khPer100g: 18, defaultAmounts: [50, 100, 150]    },
  { id: 'o05', emoji: '🍓', name: 'Erdbeeren',              khPer100g: 6,  defaultAmounts: [100, 150, 200]   },
  { id: 'o06', emoji: '🍑', name: 'Pfirsich',               khPer100g: 9,  defaultAmounts: [100, 150]        },
  { id: 'o07', emoji: '🍒', name: 'Kirschen',               khPer100g: 14, defaultAmounts: [50, 100, 150]    },
  { id: 'o08', emoji: '🥭', name: 'Mango',                  khPer100g: 14, defaultAmounts: [80, 120, 150]    },
  { id: 'o09', emoji: '🫐', name: 'Blaubeeren',             khPer100g: 14, defaultAmounts: [80, 100, 150]    },
  { id: 'o10', emoji: '🍉', name: 'Wassermelone',           khPer100g: 8,  defaultAmounts: [100, 150, 200]   },
  { id: 'o11', emoji: '🍐', name: 'Birne',                  khPer100g: 15, defaultAmounts: [100, 150, 180]   },
  { id: 'o12', emoji: '🥝', name: 'Kiwi',                   khPer100g: 10, defaultAmounts: [70, 100, 150]    },

  // ── Süßes & Snacks ───────────────────────────────────────
  { id: 's01', emoji: '🍫', name: 'Schokolade (Vollmilch)', khPer100g: 57, defaultAmounts: [20, 30, 50]      },
  { id: 's02', emoji: '🍬', name: 'Gummibärchen',           khPer100g: 77, defaultAmounts: [10, 20, 30]      },
  { id: 's03', emoji: '🍬', name: 'Traubenzucker',          khPer100g: 100,defaultAmounts: [4, 8, 12]        },
  { id: 's04', emoji: '🍰', name: 'Obstkuchen',             khPer100g: 45, defaultAmounts: [60, 100, 150]    },
  { id: 's05', emoji: '🎂', name: 'Schokoladenkuchen',      khPer100g: 55, defaultAmounts: [60, 100, 150]    },
  { id: 's06', emoji: '🍩', name: 'Donut',                  khPer100g: 48, defaultAmounts: [50, 80]          },
  { id: 's07', emoji: '🍭', name: 'Lollipop',               khPer100g: 99, defaultAmounts: [10, 20]          },
  { id: 's08', emoji: '🥨', name: 'Brezel (Salz)',          khPer100g: 74, defaultAmounts: [20, 30, 50]      },
  { id: 's09', emoji: '🍿', name: 'Popcorn',                khPer100g: 75, defaultAmounts: [20, 30, 50]      },
  { id: 's10', emoji: '🍪', name: 'Schokoladenkeks',        khPer100g: 65, defaultAmounts: [10, 20, 30]      },
  { id: 's11', emoji: '🥧', name: 'Waffeleis (Kugel)',      khPer100g: 22, defaultAmounts: [60, 100]         },

  // ── Getränke ─────────────────────────────────────────────
  { id: 'd01', emoji: '🧃', name: 'Apfelsaft',              khPer100g: 11, defaultAmounts: [100, 150, 200]   },
  { id: 'd02', emoji: '🧃', name: 'Orangensaft',            khPer100g: 9,  defaultAmounts: [100, 150, 200]   },
  { id: 'd03', emoji: '🥤', name: 'Cola',                   khPer100g: 11, defaultAmounts: [100, 200, 330]   },
  { id: 'd04', emoji: '🥤', name: 'Fanta / Sprite',         khPer100g: 10, defaultAmounts: [100, 200, 330]   },
  { id: 'd05', emoji: '🧃', name: 'Traubensaft',            khPer100g: 17, defaultAmounts: [100, 150, 200]   },
  { id: 'd06', emoji: '🥛', name: 'Kakao fertig (Tetra)',   khPer100g: 10, defaultAmounts: [150, 200, 250]   },
  { id: 'd07', emoji: '🧃', name: 'Multivitaminsaft',       khPer100g: 12, defaultAmounts: [100, 150, 200]   },
  { id: 'd08', emoji: '🧃', name: 'Capri-Sonne',            khPer100g: 10, defaultAmounts: [200]             },

  // ── Hauptgerichte ────────────────────────────────────────
  { id: 'h01', emoji: '🍕', name: 'Pizza Margherita',       khPer100g: 30, defaultAmounts: [100, 150, 200]   },
  { id: 'h02', emoji: '🌮', name: 'Tortilla-Wrap',          khPer100g: 53, defaultAmounts: [40, 70, 100]     },
  { id: 'h03', emoji: '🍔', name: 'Burger-Brötchen',        khPer100g: 49, defaultAmounts: [50, 80]          },
  { id: 'h04', emoji: '🌭', name: 'Hot-Dog-Brötchen',       khPer100g: 50, defaultAmounts: [50, 80]          },
  { id: 'h05', emoji: '🥙', name: 'Döner-Fladenbrot',       khPer100g: 55, defaultAmounts: [80, 120, 160]    },
  { id: 'h06', emoji: '🍱', name: 'Sushi (Nigiri, 2 St.)',  khPer100g: 32, defaultAmounts: [60, 100, 150]    },
  { id: 'h07', emoji: '🥘', name: 'Linsensuppe',            khPer100g: 12, defaultAmounts: [150, 200, 300]   },
  { id: 'h08', emoji: '🍲', name: 'Gulasch mit Nudeln',     khPer100g: 14, defaultAmounts: [200, 250, 300]   },
  { id: 'h09', emoji: '🍗', name: 'Chicken Nuggets (6 St)',  khPer100g: 18, defaultAmounts: [100, 150]        },
  { id: 'h10', emoji: '🥪', name: 'Sandwich (Toast+Füllung)',khPer100g: 28, defaultAmounts: [100, 150, 200]   },

  // ── Schule & Pausenbrot ──────────────────────────────────
  { id: 'sc01', emoji: '🥪', name: 'Schulbrot (Vollkorn)',   khPer100g: 35, defaultAmounts: [60, 90, 120]    },
  { id: 'sc02', emoji: '🥪', name: 'Schulbrot (Weiß)',       khPer100g: 40, defaultAmounts: [60, 90, 120]    },
  { id: 'sc03', emoji: '🍱', name: 'Schulmensa-Mittagessen', khPer100g: 20, defaultAmounts: [200, 300, 400]   },
];
