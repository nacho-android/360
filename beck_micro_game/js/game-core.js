export const ROOM_W = 960;
export const ROOM_H = 540;

export const DIRECTIONS = {
  se: ['walk_se_0', 'walk_se_1', 'walk_se_2'],
  sw: ['walk_sw_0', 'walk_sw_1', 'walk_sw_2'],
  ne: ['walk_ne_0', 'walk_ne_1', 'walk_ne_2'],
  nw: ['walk_nw_0', 'walk_nw_1', 'walk_nw_2'],
  idle: ['idle'],
};

export const ROOMS = [
  {
    id: 'lab',
    title: 'Room 1 · The Shrinking Lab',
    background: 'lab',
    entry: { x: 84, y: 438 },
    leftEntry: { x: 84, y: 438 },
    rightEntry: { x: 874, y: 438 },
    intro: 'Beck blinks. The Shrink-O-Matic hums. Everything is suddenly desk-leg sized. Find the clues, solve the experiments, and get home for birthday treats.',
    prompt: 'Run the lab protocol near the glowing machine.',
    exitHint: 'Exit right to Room 2.',
  },
  {
    id: 'market',
    title: 'Room 2 · Supply & Demand Hall',
    background: 'market',
    entry: { x: 86, y: 342 },
    leftEntry: { x: 86, y: 342 },
    rightEntry: { x: 874, y: 352 },
    intro: 'A market experiment has inflated to dungeon scale. The equilibrium point is the path forward.',
    prompt: 'Solve the equilibrium question near the floor graph.',
    exitHint: 'Exit right to Room 3.',
  },
  {
    id: 'elasticity',
    title: 'Room 3 · Elasticity Maze',
    background: 'elasticity',
    entry: { x: 85, y: 334 },
    leftEntry: { x: 85, y: 334 },
    rightEntry: { x: 884, y: 330 },
    intro: 'Elastic bands snap across the maze. Price changes are tiny, but the consequences are not.',
    prompt: 'Answer the elasticity test near the calculator.',
    exitHint: 'Exit right to Room 4.',
  },
  {
    id: 'dessert',
    title: 'Room 4 · Birthday Table Gauntlet',
    background: 'dessert',
    entry: { x: 90, y: 274 },
    leftEntry: { x: 90, y: 274 },
    rightEntry: { x: 874, y: 172 },
    intro: 'The birthday table is a giant edible landscape. Collect the essentials: wine, chocolate licorice bullets, and cake.',
    prompt: 'Gather the birthday treats before leaving.',
    exitHint: 'Exit right to the Key Chamber.',
  },
  {
    id: 'key_chamber',
    title: 'Room 5 · The Key Chamber',
    background: 'key_chamber',
    entry: { x: 90, y: 352 },
    leftEntry: { x: 90, y: 352 },
    rightEntry: { x: 874, y: 352 },
    intro: 'The final experiment awaits: restore balance, grab the key, and open the way home.',
    prompt: 'Solve the final protocol at the key pedestal.',
    exitHint: 'Use the right exit after the key is acquired.',
  },
  {
    id: 'home',
    title: 'Home · Happy Birthday Beck!',
    background: 'home',
    entry: { x: 84, y: 330 },
    leftEntry: { x: 84, y: 330 },
    rightEntry: { x: 874, y: 330 },
    intro: 'Normal size restored. Birthday wine, chocolate licorice bullets, and cake are waiting. Happy Birthday, Beck!',
    prompt: 'You made it home in time.',
    exitHint: 'Victory!',
  },
];

export const HOTSPOTS = [
  {
    id: 'lab_protocol', room: 'lab', x: 688, y: 304, radius: 88, prop: 'clipboard',
    label: 'Shrink-O-Matic Protocol', requires: [], grants: 'labSolved',
    quiz: {
      question: 'The Shrink-O-Matic asks: when Beck chooses the next step, what does a good microeconomist compare?',
      choices: [
        'Average cost only',
        'Marginal benefits and marginal costs',
        'Last year’s birthday cake consumption',
        'The height of the nearest desk leg',
      ],
      answer: 1,
      success: 'Correct. Think at the margin! The lab door unlocks.',
      failure: 'Close, but the machine wants marginal reasoning.',
    },
  },
  {
    id: 'equilibrium', room: 'market', x: 482, y: 326, radius: 92, prop: 'coin',
    label: 'Equilibrium Calibration', requires: ['labSolved'], grants: 'marketSolved',
    quiz: {
      question: 'On the giant graph, which point balances buyers and sellers?',
      choices: [
        'Where supply and demand intersect',
        'Where price is as high as possible',
        'Where demand floats away from supply',
        'Where the chalkboard says “no free lunch”',
      ],
      answer: 0,
      success: 'Market balanced. A gold token of equilibrium pings into existence.',
      failure: 'Try again: balance happens when supply meets demand.',
    },
  },
  {
    id: 'elasticity_test', room: 'elasticity', x: 238, y: 258, radius: 92, prop: 'calculator',
    label: 'Elasticity Test', requires: ['marketSolved'], grants: 'elasticitySolved',
    quiz: {
      question: 'If demand is elastic, what does quantity demanded do when price changes?',
      choices: [
        'Barely moves at all',
        'Changes proportionally less than price',
        'Responds more than proportionally',
        'Turns into chocolate licorice',
      ],
      answer: 2,
      success: 'Stretch test passed. The elastic maze relaxes.',
      failure: 'Elastic means responsive. Look for the bigger quantity response.',
    },
  },
  {
    id: 'final_protocol', room: 'key_chamber', x: 480, y: 326, radius: 94, prop: 'key_glow',
    label: 'Final Resizing Protocol', requires: ['labSolved', 'marketSolved', 'elasticitySolved', 'wine', 'licorice', 'cake'], grants: 'key',
    quiz: {
      question: 'Final equation: what restores Beck to normal size?',
      choices: [
        'Balance, evidence, and birthday dessert',
        'A price ceiling on all cake slices',
        'Ignoring opportunity cost',
        'Making the key more inelastic',
      ],
      answer: 0,
      success: 'The golden key is yours. The portal home is open!',
      failure: 'The portal sputters. It needs balance, evidence, and dessert.',
    },
  },
];

export const COLLECTIBLES = [
  { id: 'data', room: 'lab', x: 312, y: 380, radius: 46, prop: 'clipboard', label: 'tiny data note', grants: 'data' },
  { id: 'coin1', room: 'market', x: 184, y: 434, radius: 44, prop: 'coin', label: 'gold coin', grants: 'coin1' },
  { id: 'coin2', room: 'market', x: 716, y: 270, radius: 44, prop: 'coin', label: 'gold coin', grants: 'coin2' },
  { id: 'spark1', room: 'elasticity', x: 190, y: 404, radius: 44, prop: 'sparkle', label: 'elastic sparkle', grants: 'spark1' },
  { id: 'spark2', room: 'elasticity', x: 814, y: 374, radius: 44, prop: 'sparkle', label: 'elastic sparkle', grants: 'spark2' },
  { id: 'wine', room: 'dessert', x: 328, y: 130, radius: 52, prop: 'wine', label: 'glass of wine', grants: 'wine' },
  { id: 'licorice', room: 'dessert', x: 655, y: 116, radius: 54, prop: 'licorice_bowl', label: 'chocolate licorice bullets', grants: 'licorice' },
  { id: 'cake', room: 'dessert', x: 480, y: 272, radius: 58, prop: 'cake_slice', label: 'cake slice', grants: 'cake' },
];

export const REQUIRED_FLAGS_BY_ROOM_EXIT = {
  lab: ['labSolved'],
  market: ['marketSolved'],
  elasticity: ['elasticitySolved'],
  dessert: ['wine', 'licorice', 'cake'],
  key_chamber: ['key'],
};

export function createInitialState() {
  const room = ROOMS[0];
  return {
    roomIndex: 0,
    player: { x: room.entry.x, y: room.entry.y, speed: 164, dir: 'se', moving: false, faceX: 1 },
    flags: {},
    collected: {},
    time: 0,
    messages: [room.intro],
    transition: null,
    won: false,
  };
}

export function getRoom(state) {
  return ROOMS[state.roomIndex];
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function hasFlags(state, flags) {
  return (flags || []).every((flag) => !!state.flags[flag]);
}

export function missingFlags(state, flags) {
  return (flags || []).filter((flag) => !state.flags[flag]);
}

export function flagsSummary(flags) {
  const names = {
    labSolved: 'lab protocol',
    marketSolved: 'equilibrium calibration',
    elasticitySolved: 'elasticity test',
    wine: 'wine',
    licorice: 'chocolate licorice bullets',
    cake: 'cake',
    key: 'golden key',
  };
  return flags.map((f) => names[f] || f).join(', ');
}

export function currentRoomCollectibles(state) {
  const roomId = getRoom(state).id;
  return COLLECTIBLES.filter((item) => item.room === roomId && !state.collected[item.id]);
}

export function currentRoomHotspots(state) {
  const roomId = getRoom(state).id;
  return HOTSPOTS.filter((spot) => spot.room === roomId && !state.flags[spot.grants]);
}

export function nearestHotspot(state) {
  let best = null;
  let bestDist = Infinity;
  for (const spot of currentRoomHotspots(state)) {
    const d = distance(state.player, spot);
    if (d < spot.radius && d < bestDist) {
      best = spot;
      bestDist = d;
    }
  }
  return best;
}

export function collectNearby(state) {
  const found = [];
  for (const item of currentRoomCollectibles(state)) {
    if (distance(state.player, item) <= item.radius) {
      state.collected[item.id] = true;
      state.flags[item.grants] = true;
      found.push(item);
    }
  }
  return found;
}

export function solveHotspot(state, hotspotId) {
  const spot = HOTSPOTS.find((h) => h.id === hotspotId);
  if (!spot) throw new Error(`Unknown hotspot: ${hotspotId}`);
  const missing = missingFlags(state, spot.requires);
  if (missing.length) {
    return { ok: false, reason: 'missing', missing, message: `Still needed: ${flagsSummary(missing)}.` };
  }
  state.flags[spot.grants] = true;
  if (spot.grants === 'key') state.won = true;
  return { ok: true, grant: spot.grants, message: spot.quiz.success };
}

export function movePlayer(state, input, dt) {
  const p = state.player;
  const vx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const vy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const mag = Math.hypot(vx, vy) || 1;
  const dx = (vx / mag) * p.speed * dt;
  const dy = (vy / mag) * p.speed * dt;
  p.moving = Math.abs(vx) + Math.abs(vy) > 0;
  if (p.moving) {
    if (vx > 0) p.faceX = 1;
    else if (vx < 0) p.faceX = -1;
    if (vx >= 0 && vy >= 0) p.dir = 'se';
    else if (vx < 0 && vy >= 0) p.dir = 'sw';
    else if (vx >= 0 && vy < 0) p.dir = 'ne';
    else p.dir = 'nw';
  }
  // Soft room bounds: vertical clamps keep Beck on the floor, horizontal overscroll triggers room changes.
  p.x += dx;
  p.y = clamp(p.y + dy, 92, ROOM_H - 44);
  return { dx, dy };
}

export function canExitRight(state) {
  const room = getRoom(state);
  if (room.id === 'home') return false;
  const needs = REQUIRED_FLAGS_BY_ROOM_EXIT[room.id] || [];
  return hasFlags(state, needs);
}

export function exitRequirementMessage(state) {
  const room = getRoom(state);
  const needs = REQUIRED_FLAGS_BY_ROOM_EXIT[room.id] || [];
  const missing = missingFlags(state, needs);
  if (!missing.length) return '';
  return `The exit hums, but Beck still needs: ${flagsSummary(missing)}.`;
}

export function transitionIfNeeded(state) {
  const p = state.player;
  if (p.x > ROOM_W + 20) {
    if (!canExitRight(state)) {
      p.x = ROOM_W - 38;
      return { type: 'blocked', message: exitRequirementMessage(state) };
    }
    if (state.roomIndex < ROOMS.length - 1) {
      state.roomIndex += 1;
      const room = getRoom(state);
      p.x = room.leftEntry.x;
      p.y = room.leftEntry.y;
      if (room.id === 'home') state.won = true;
      return { type: 'room', direction: 'right', room, message: room.intro };
    }
  }
  if (p.x < -20) {
    if (state.roomIndex > 0) {
      state.roomIndex -= 1;
      const room = getRoom(state);
      p.x = room.rightEntry.x;
      p.y = room.rightEntry.y;
      return { type: 'room', direction: 'left', room, message: room.title };
    }
    p.x = 34;
  }
  return null;
}

export function progressPercent(state) {
  const goals = ['labSolved', 'marketSolved', 'elasticitySolved', 'wine', 'licorice', 'cake', 'key'];
  const done = goals.filter((g) => state.flags[g]).length;
  return Math.round((done / goals.length) * 100);
}

export function inventoryLabels(state) {
  const labels = [];
  if (state.flags.labSolved) labels.push('Lab');
  if (state.flags.marketSolved) labels.push('Equilibrium');
  if (state.flags.elasticitySolved) labels.push('Elasticity');
  if (state.flags.wine) labels.push('Wine');
  if (state.flags.licorice) labels.push('Licorice');
  if (state.flags.cake) labels.push('Cake');
  if (state.flags.key) labels.push('Key');
  return labels;
}

export function exposedForTests() {
  return { ROOM_W, ROOM_H, ROOMS, HOTSPOTS, COLLECTIBLES, REQUIRED_FLAGS_BY_ROOM_EXIT };
}
