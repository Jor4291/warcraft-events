export const CLASS_ORDER = [
  "warrior",
  "paladin",
  "hunter",
  "rogue",
  "priest",
  "shaman",
  "mage",
  "warlock",
  "druid",
] as const;

export type ClassId = (typeof CLASS_ORDER)[number];
export type Faction = "alliance" | "horde";

export type ClassNote = string | { muted: true; text: string };

export type Racial = {
  name: string;
  type: "active" | "passive";
  cd?: string;
  text: string;
  change?: string;
  cls?: Partial<Record<ClassId, ClassNote>> | ((classId: ClassId) => ClassNote | undefined);
};

export type Race = {
  id: string;
  name: string;
  sub?: string;
  faction: Faction;
  home: string;
  lore: string;
  newRace?: boolean;
  pack?: boolean;
  classes: ClassId[];
  newClasses: ClassId[];
  racials: Racial[];
};

export type WowClass = {
  name: string;
  color: string;
  roles: string[];
  resource: string;
  blurb: string;
};

const CASTERS: ClassId[] = ["priest", "mage", "warlock"];

export const CLASSES: Record<ClassId, WowClass> = {
  warrior: {
    name: "Warrior",
    color: "#C69B6D",
    roles: ["Tank", "Melee DPS"],
    resource: "Rage",
    blurb:
      "A master of arms who builds Rage by dealing and taking damage. Holds the line as a tank or cleaves through enemies in melee.",
  },
  paladin: {
    name: "Paladin",
    color: "#F48CBA",
    roles: ["Healer", "Tank", "Melee DPS"],
    resource: "Mana",
    blurb:
      "A holy warrior empowered by the Light, using seals, auras and blessings to heal allies, protect the group, or smite foes.",
  },
  hunter: {
    name: "Hunter",
    color: "#AAD372",
    roles: ["Ranged DPS"],
    resource: "Mana",
    blurb:
      "A ranged marksman who fights alongside a tamed beast, controlling the battlefield with traps, stings and tracking.",
  },
  rogue: {
    name: "Rogue",
    color: "#FFF468",
    roles: ["Melee DPS"],
    resource: "Energy",
    blurb:
      "A stealthy combatant who spends Energy and combo points on burst, stuns and poisons, striking from the shadows.",
  },
  priest: {
    name: "Priest",
    color: "#FFFFFF",
    roles: ["Healer", "Ranged DPS"],
    resource: "Mana",
    blurb:
      "A devoted healer and shield-caster who can also embrace Shadow magic for damage over time and mind control.",
  },
  shaman: {
    name: "Shaman",
    color: "#0070DD",
    roles: ["Healer", "Ranged DPS", "Melee DPS"],
    resource: "Mana",
    blurb:
      "A spiritual guide of the elements who drops totems to empower the group, and can heal, cast lightning, or fight in melee.",
  },
  mage: {
    name: "Mage",
    color: "#3FC7EB",
    roles: ["Ranged DPS"],
    resource: "Mana",
    blurb:
      "A scholar of Arcane, Fire and Frost with heavy burst damage, strong crowd control, and conjured food and water.",
  },
  warlock: {
    name: "Warlock",
    color: "#8788EE",
    roles: ["Ranged DPS"],
    resource: "Mana",
    blurb:
      "A wielder of shadow and fel magic who weakens foes with curses and damage over time while commanding summoned demons.",
  },
  druid: {
    name: "Druid",
    color: "#FF7C0A",
    roles: ["Tank", "Healer", "Melee DPS", "Ranged DPS"],
    resource: "Mana / Energy / Rage",
    blurb: "A shapeshifter who tanks as a bear, fights as a cat, heals with nature magic, or casts as a moonkin.",
  },
};

function emblem(inner: string) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

export const CLASS_ICONS: Record<ClassId, string> = {
  warrior: emblem(
    `<path d="M5 3 L15 13 M19 3 L9 13"/><path d="M13 15.5 L17.5 11 M11 15.5 L6.5 11"/><path d="M15 13 L19.5 17.5 M9 13 L4.5 17.5"/><circle cx="20.3" cy="18.3" r="1.2" fill="currentColor"/><circle cx="3.7" cy="18.3" r="1.2" fill="currentColor"/>`,
  ),
  paladin: emblem(
    `<rect x="5" y="3" width="14" height="6.5" rx="1.2" fill="currentColor"/><path d="M12 9.5 V21"/><path d="M9.5 20.5 H14.5"/><path d="M12 13 V13" stroke-width="3"/>`,
  ),
  hunter: emblem(
    `<path d="M7 3 Q19 12 7 21"/><path d="M7 3 V21" stroke-width="1.1"/><path d="M3 12 H20"/><path d="M17 9 L20.5 12 L17 15"/><path d="M3 12 L5 10 M3 12 L5 14"/>`,
  ),
  rogue: emblem(
    `<path d="M20.5 3.5 L12.3 14.2 L9.8 11.7 Z" fill="currentColor"/><path d="M8.2 11.4 L12.6 15.8"/><path d="M10.4 13.6 L5.2 18.8"/><circle cx="4.4" cy="19.6" r="1.3" fill="currentColor"/>`,
  ),
  priest: emblem(
    `<circle cx="12" cy="12" r="3.6" fill="currentColor"/><path d="M12 2.5 V5.5 M12 18.5 V21.5 M2.5 12 H5.5 M18.5 12 H21.5 M5.3 5.3 L7.4 7.4 M16.6 16.6 L18.7 18.7 M18.7 5.3 L16.6 7.4 M7.4 16.6 L5.3 18.7"/>`,
  ),
  shaman: emblem(
    `<path d="M13.5 2 L5.5 13 H11 L9.5 22 L18.5 9.5 H13 L15 2 Z" fill="currentColor" stroke-width="1.2"/>`,
  ),
  mage: emblem(
    `<path d="M11 3 L12.9 9.6 L19.5 11.5 L12.9 13.4 L11 20 L9.1 13.4 L2.5 11.5 L9.1 9.6 Z" fill="currentColor" stroke-width="1"/><path d="M18.5 2.5 L19.3 4.7 L21.5 5.5 L19.3 6.3 L18.5 8.5 L17.7 6.3 L15.5 5.5 L17.7 4.7 Z" fill="currentColor" stroke-width=".8"/>`,
  ),
  warlock: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5c-4.6 0-8 3.2-8 7.6 0 2.6 1.2 4.3 3 5.3V19c0 .8.6 1.5 1.5 1.5h.8v-2h1.6v2h2.2v-2h1.6v2h.8c.9 0 1.5-.7 1.5-1.5v-3.6c1.8-1 3-2.7 3-5.3 0-4.4-3.4-7.6-8-7.6z"/><ellipse cx="8.9" cy="11" rx="2" ry="2.3" fill="#8788EE"/><ellipse cx="15.1" cy="11" rx="2" ry="2.3" fill="#8788EE"/><path d="M12 13.4 L11 15.6 H13 Z" fill="#8788EE"/></svg>`,
  druid: emblem(
    `<path d="M4.5 19.5 C4.5 10 10 4.5 19.5 4.5 C19.5 14 14 19.5 4.5 19.5 Z" fill="currentColor" stroke-width="1.2"/><path d="M4.5 19.5 L14 10" stroke="#FF7C0A" stroke-width="1.4"/><path d="M9 15 L9 11.5 M11.5 12.5 L11.5 9.5 M9 15 L12.5 15 M11.5 12.5 L14.5 12.5" stroke="#FF7C0A" stroke-width="1.1"/>`,
  ),
};

export const RACES: Race[] = [
  {
    id: "human",
    name: "Human",
    faction: "alliance",
    home: "Stormwind",
    lore: "Resilient and adaptable, Humans are the backbone of the Alliance and its most versatile people.",
    classes: ["warrior", "paladin", "hunter", "rogue", "priest", "mage", "warlock"],
    newClasses: ["hunter"],
    racials: [
      { name: "Will to Survive", type: "active", cd: "3 min cooldown", text: "Instantly removes all Stun effects." },
      {
        name: "Perception",
        type: "active",
        cd: "3 min cooldown · 20 sec",
        text: "Dramatically increases stealth detection for 20 sec.",
      },
      {
        name: "Ruthless",
        type: "passive",
        text: "Increases your critical strike chance with all spells and attacks by 1%.",
        change: "Oct 26: reduced to 1% (was 2%). Replaced Sword Specialization on Oct 15.",
      },
      {
        name: "The Human Spirit",
        type: "passive",
        text: "Spirit increased by 10%.",
        change: "Oct 26: increased to 10% (was 5%).",
      },
    ],
  },
  {
    id: "dwarf",
    name: "Dwarf",
    faction: "alliance",
    home: "Ironforge",
    lore: "Stout explorers and smiths from the mountains of Khaz Modan, Dwarves are tough, steady and fond of treasure.",
    classes: ["warrior", "paladin", "hunter", "rogue", "priest", "shaman"],
    newClasses: ["shaman"],
    racials: [
      {
        name: "Stoneform",
        type: "active",
        cd: "3 min cooldown · 8 sec",
        text: "Instantly removes and grants immunity to all Bleed, Poison and Disease effects, and reduces all Physical damage taken by 10% for 8 sec.",
      },
      {
        name: "Find Treasure",
        type: "active",
        cd: "No cooldown",
        text: "Sense nearby treasure, making it appear on the minimap. Also grants a chance to find additional items in most chests.",
      },
      {
        name: "Artisan's Precision",
        type: "passive",
        text: "Increases hit chance with spells and attacks by 1%.",
        change: "Oct 26: new. Replaces Earth Fury (2% critical damage and healing).",
      },
      { name: "Big Game Hunter", type: "passive", text: "Damage dealt versus Beasts increased by 5%." },
    ],
  },
  {
    id: "nightelf",
    name: "Night Elf",
    faction: "alliance",
    home: "Darnassus",
    lore: "Ancient guardians of nature beneath the boughs of Teldrassil, the Night Elves walk in shadow and moonlight.",
    classes: ["warrior", "hunter", "rogue", "priest", "druid"],
    newClasses: [],
    racials: [
      {
        name: "Elune's Light",
        type: "active",
        cd: "3 min cooldown · 15 sec",
        text: "Increases your critical strike chance with all spells and attacks by 10% for 15 sec.",
      },
      {
        name: "Shadowmeld",
        type: "active",
        cd: "10 sec cooldown (2 min if used in combat)",
        text: "Slip into the shadows, reducing the chance for enemies to detect you. Lasts until cancelled or you move. Using it in combat discourages enemies from attacking you.",
      },
      {
        name: "Quickness",
        type: "passive",
        text: "Dodge chance increased by 1% and movement speed increased by 2% (stacks with other speed increases).",
        cls: {
          rogue: "Rogue bonus: harder to detect in Stealth, as if 1 level higher.",
          druid: "Druid bonus: harder to detect while Prowling, as if 1 level higher.",
        },
      },
      {
        name: "Wisp Spirit",
        type: "passive",
        text: "Transform into a wisp upon death, increasing movement speed by 75%.",
      },
    ],
  },
  {
    id: "gnome",
    name: "Gnome",
    faction: "alliance",
    home: "Gnomeregan",
    lore: "Brilliant tinkerers driven from their capital, Gnomes make up for their size with ingenuity and arcane talent.",
    classes: ["warrior", "rogue", "priest", "mage", "warlock"],
    newClasses: ["priest"],
    racials: [
      {
        name: "Escape Artist",
        type: "active",
        cd: "2 min cooldown · 3 sec",
        text: "Instantly escape any movement impairing effect and gain immunity to those effects for 3 sec.",
      },
      {
        name: "Eureka!",
        type: "active",
        cd: "2 min cooldown · 8 sec",
        text: "For 8 sec, your non-periodic damaging abilities cost 10% less Energy, Rage or Mana and deal 10% more damage.",
        cls: {
          priest: "Priest bonus: also applies to healing abilities (+10% healing) and benefits Power Word: Shield.",
        },
      },
      {
        name: "Expansive Mind",
        type: "passive",
        text: "Maximum Mana, Rage and Energy increased by 5%.",
        cls: (classId) =>
          `For your ${CLASSES[classId].name}: +5% maximum ${classId === "warrior" ? "Rage" : classId === "rogue" ? "Energy" : "Mana"}.`,
      },
      {
        name: "Engineering Specialization",
        type: "passive",
        text: "Reduces the rate of engineering devices failing or backfiring by 20%.",
      },
    ],
  },
  {
    id: "skyborne-a",
    name: "Skyborne",
    sub: "High Order",
    faction: "alliance",
    home: "Isle of Zephras",
    lore: "A new race of wind-touched elves. The High Order joins the Alliance and begins on Zephras Isle (levels 1 to 12).",
    newRace: true,
    pack: true,
    classes: ["warrior", "hunter", "rogue", "mage", "druid"],
    newClasses: ["warrior", "hunter", "rogue", "mage", "druid"],
    racials: [
      {
        name: "Walk on Air",
        type: "active",
        cd: "90 sec cooldown · 10 sec",
        text: "Glide downward through the air for 10 sec while controlling your direction of travel.",
      },
      {
        name: "Read Leyline",
        type: "active",
        cd: "2 min cooldown · 15 sec",
        text: "Increases Health and Mana regeneration by 50% for 15 sec. Used at a Ley Line, also grants Attuned for 1 hour, raising the bonus to 100%. Attuned persists through death.",
        change: "Oct 26: now 50% for 15 sec (was 100% for 30 sec, or 15 min at a Ley Line). Attuned added.",
        cls: {
          druid: "Druid note: cannot be used while Innervate is active; Innervate replaces it as the stronger effect.",
        },
      },
      {
        name: "Wind Blessed",
        type: "passive",
        text: "Increases spellcasting, melee and ranged Haste by 2%.",
        change: "Oct 26: reduced to 2% (was 3%).",
      },
      { name: "Elemental Insight", type: "passive", text: "Damage dealt versus Elementals increased by 5%." },
    ],
  },
  {
    id: "orc",
    name: "Orc",
    faction: "horde",
    home: "Orgrimmar",
    lore: "Fierce warriors bound by honor, the Orcs carved a new home in Durotar and lead the Horde.",
    classes: ["warrior", "hunter", "rogue", "shaman", "mage", "warlock"],
    newClasses: ["mage"],
    racials: [
      {
        name: "Blood Fury",
        type: "active",
        cd: "3 min cooldown · 15 sec",
        text: "Increases Attack Power and Spell Power by 10% for 15 sec.",
      },
      {
        name: "Shatter Curse",
        type: "active",
        cd: "3 min cooldown · 8 sec",
        text: "Instantly removes all Curses and Banes, and reduces all Magic damage taken by 5% for 8 sec.",
      },
      { name: "Hardiness", type: "passive", text: "Duration of Stun effects on you reduced by 20%." },
      {
        name: "Command",
        type: "passive",
        text: "Increases damage dealt by Hunter and Warlock pets by 5%.",
        change: "Oct 26: re-added. Replaces Savage (1% critical strike chance).",
        cls: (classId) =>
          classId === "hunter" || classId === "warlock"
            ? `For your ${CLASSES[classId].name}: your pet deals 5% more damage.`
            : { muted: true, text: `No effect for a ${CLASSES[classId].name}.` },
      },
    ],
  },
  {
    id: "undead",
    name: "Undead",
    faction: "horde",
    home: "Undercity",
    lore: "Freed from the Lich King's will, the Forsaken cling to their unlife beneath the ruins of Lordaeron.",
    classes: ["warrior", "paladin", "rogue", "priest", "mage", "warlock"],
    newClasses: ["paladin"],
    racials: [
      {
        name: "Will of the Forsaken",
        type: "active",
        cd: "2 min cooldown",
        text: "Instantly removes all Charm, Fear and Sleep effects. Not usable while under Scatter Shot.",
      },
      {
        name: "Cannibalize",
        type: "active",
        cd: "2 min cooldown · 10 sec",
        text: "Regenerates 7% of total Health and 7% of total Mana every 2 sec for 10 sec. Only works on Humanoid or Undead corpses within 5 yds. Movement, actions or damage cancel it.",
      },
      {
        name: "Touch of the Grave",
        type: "passive",
        cd: "25 sec internal cooldown",
        text: "Your spells and attacks have a 20% chance to drain Health from the target, up to 5% of your maximum Health.",
        cls: (classId) =>
          CASTERS.includes(classId)
            ? `For your ${CLASSES[classId].name}: 30% chance to trigger.`
            : `For your ${CLASSES[classId].name}: 20% chance to trigger.`,
      },
      { name: "Underwater Breathing", type: "passive", text: "Underwater breath lasts 300% longer than normal." },
    ],
  },
  {
    id: "tauren",
    name: "Tauren",
    faction: "horde",
    home: "Thunder Bluff",
    lore: "Gentle giants of the plains of Mulgore, the Tauren honor the Earth Mother and roam far and wide.",
    classes: ["warrior", "hunter", "shaman", "druid"],
    newClasses: [],
    racials: [
      {
        name: "War Stomp",
        type: "active",
        cd: "90 sec cooldown",
        text: "Stuns up to 5 enemies within 8 yds for 2 sec.",
      },
      {
        name: "Cultivation",
        type: "active",
        cd: "15 min cooldown",
        text: "Cultivate a nearby herb, growing a duplicate you can harvest without Herbalism skill. Each herb may only be cultivated once.",
      },
      {
        name: "Plainsrunning",
        type: "passive",
        text: "Gain 2% movement speed for every 5 sec spent moving, up to 60%. Taking damage or standing still reduces the effect, and you must keep covering ground to hold it. Does not affect mounted speed.",
        change: "Oct 26: 2% per stack up to 60% (was 1% up to 30%). No longer increases mounted speed.",
      },
      {
        name: "Endurance",
        type: "passive",
        text: "Total Health increased by 5%.",
        change: "Oct 26: now Health only (critical damage and healing bonus removed).",
      },
    ],
  },
  {
    id: "troll",
    name: "Troll",
    faction: "horde",
    home: "Echo Isles",
    lore: "The cunning Darkspear tribe, masters of voodoo and the hunt, who pledged themselves to the Horde.",
    classes: ["warrior", "hunter", "rogue", "priest", "shaman", "mage", "warlock"],
    newClasses: ["warlock"],
    racials: [
      {
        name: "Berserking",
        type: "active",
        cd: "3 min cooldown · 10 sec",
        text: "Increases your spellcasting and attack speed by 10% for 10 sec.",
      },
      {
        name: "Rapid Regeneration",
        type: "active",
        cd: "3 min cooldown · 6 sec",
        text: "Regenerate 50% of your maximum Health over 6 sec. Movement, actions or damage cancel the effect.",
      },
      { name: "Beast Slaying", type: "passive", text: "Damage dealt versus Beasts increased by 5%." },
      {
        name: "Regeneration",
        type: "passive",
        text: "Health regeneration rate increased by 20%, and 20% of total Health regeneration continues during combat.",
      },
    ],
  },
  {
    id: "skyborne-h",
    name: "Skyborne",
    sub: "Windshaper",
    faction: "horde",
    home: "Isle of Zephras",
    lore: "A new race of wind-touched elves. The Windshapers join the Horde and begin on Zephras Isle (levels 1 to 12).",
    newRace: true,
    pack: true,
    classes: ["warrior", "hunter", "rogue", "shaman", "druid"],
    newClasses: ["warrior", "hunter", "rogue", "shaman", "druid"],
    racials: [
      {
        name: "Walk on Air",
        type: "active",
        cd: "90 sec cooldown · 10 sec",
        text: "Glide downward through the air for 10 sec while controlling your direction of travel.",
      },
      {
        name: "Skysight",
        type: "active",
        cd: "2 min cooldown · 15 sec",
        text: "Increases movement speed by 15% for 15 sec. Used at an elemental convergence, also grants Charged for 1 hour, raising the bonus to 30%. Charged persists through death.",
        change: "Oct 26: now 15% for 15 sec (was 10% for 30 sec, or 15 min at a convergence). Charged added.",
      },
      {
        name: "Wind Blessed",
        type: "passive",
        text: "Increases spellcasting, melee and ranged Haste by 2%.",
        change: "Oct 26: reduced to 2% (was 3%).",
      },
      { name: "Elemental Insight", type: "passive", text: "Damage dealt versus Elementals increased by 5%." },
    ],
  },
];

const NAME_PARTS: Record<Faction, { a: string[]; b: string[] }> = {
  alliance: {
    a: [
      "Al",
      "Bren",
      "Cor",
      "Dar",
      "El",
      "Fen",
      "Gar",
      "Hal",
      "Is",
      "Jor",
      "Kel",
      "Lor",
      "Mar",
      "Ner",
      "Or",
      "Per",
      "Quin",
      "Ros",
      "Syl",
      "Tal",
      "Ul",
      "Vel",
      "Wyn",
    ],
    b: ["adin", "wyn", "ric", "iel", "ora", "wen", "thas", "dor", "anna", "eth", "ion", "mira", "ston", "bert", "lyn"],
  },
  horde: {
    a: [
      "Gro",
      "Thra",
      "Zul",
      "Kar",
      "Mok",
      "Vol",
      "Dra",
      "Rok",
      "Grim",
      "Zan",
      "Nar",
      "Jin",
      "Ur",
      "Kro",
      "Sha",
      "Bol",
      "Tor",
      "Vash",
      "Raz",
      "Gor",
    ],
    b: ["gash", "mak", "jin", "rok", "zul", "tar", "nok", "ka", "ash", "dra", "thul", "ga", "zor", "mu", "tok"],
  },
};

export function raceById(id: string) {
  const race = RACES.find((item) => item.id === id);
  if (!race) {
    throw new Error(`Unknown race: ${id}`);
  }
  return race;
}

export function raceLabel(race: Race) {
  return race.sub ? `${race.name} (${race.sub})` : race.name;
}

export function raceInitials(race: Race) {
  if (race.sub) {
    return `S${race.sub[0]}`;
  }
  return race.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);
}

export function classNote(racial: Racial, classId: ClassId): ClassNote | undefined {
  if (!racial.cls) {
    return undefined;
  }
  const note = typeof racial.cls === "function" ? racial.cls(classId) : racial.cls[classId];
  return note || undefined;
}

export function rollName(faction: Faction) {
  const parts = NAME_PARTS[faction];
  const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)] ?? "";
  return (pick(parts.a) + pick(parts.b)).slice(0, 12);
}

export function validateCharacterName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: true, message: "" };
  }
  if (!/^[A-Za-z]+$/.test(trimmed)) {
    return { ok: false, message: "Letters only, no spaces or numbers" };
  }
  if (trimmed.length < 2) {
    return { ok: false, message: "Name must be at least 2 letters" };
  }
  return { ok: true, message: "" };
}

export function formatCharacterName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "(unnamed)";
  }
  return trimmed[0]!.toUpperCase() + trimmed.slice(1).toLowerCase();
}

export function buildSummary(race: Race, classId: ClassId, rawName: string) {
  const wowClass = CLASSES[classId];
  const lines = [
    formatCharacterName(rawName),
    `${raceLabel(race)} ${wowClass.name} · ${race.faction === "alliance" ? "Alliance" : "Horde"}${race.newClasses.includes(classId) ? " · new combo in Forever" : ""}`,
    `Roles: ${wowClass.roles.join(", ")} · Resource: ${wowClass.resource}`,
    "",
    "Racials:",
  ];
  for (const racial of race.racials) {
    lines.push(`- ${racial.name} (${racial.type}${racial.cd ? `, ${racial.cd}` : ""}): ${racial.text}`);
    const note = classNote(racial, classId);
    if (note) {
      lines.push(`    ${typeof note === "object" ? note.text : note}`);
    }
  }
  if (race.pack) {
    lines.push("", "Note: Skyborne requires the Heroic pack or higher.");
  }
  return lines.join("\n");
}
