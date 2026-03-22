import { deepClone } from '../utils/helpers.js';

const createGrid = (width, height, ground = 'grass') => Array.from({ length: height }, () => (
  Array.from({ length: width }, () => ({ ground, walkable: true, zone: 'grounds' }))
));

const setGroundRect = (grid, x, y, width, height, ground, zone, walkable = true) => {
  for (let row = y; row < y + height; row += 1) {
    for (let col = x; col < x + width; col += 1) {
      if (grid[row]?.[col]) {
        grid[row][col].ground = ground;
        grid[row][col].zone = zone;
        grid[row][col].walkable = walkable;
      }
    }
  }
};

const createCampus = () => {
  const grid = createGrid(28, 28, 'grass');
  setGroundRect(grid, 0, 0, 28, 28, 'grass', 'grounds', true);
  setGroundRect(grid, 3, 3, 22, 22, 'path', 'campus-spine', true);
  setGroundRect(grid, 7, 0, 4, 7, 'path', 'animal-facility', true);
  setGroundRect(grid, 17, 1, 7, 8, 'tile', 'main-lab', true);
  setGroundRect(grid, 20, 9, 6, 8, 'tile', 'imaging-core', true);
  setGroundRect(grid, 18, 18, 8, 7, 'path', 'engineering', true);
  setGroundRect(grid, 3, 17, 7, 7, 'tile', 'office-maze', true);
  setGroundRect(grid, 4, 10, 7, 4, 'wood', 'break-room', true);
  setGroundRect(grid, 11, 10, 8, 6, 'courtyard', 'courtyard', true);
  setGroundRect(grid, 12, 24, 4, 4, 'dock', 'transit', true);
  
  const props = [
    { id: 'labBlockA', x: 17, y: 1, w: 5, d: 5, h: 1.9, type: 'building', color: '#8ec5ff', roof: '#d9efff', solid: true, label: 'Main Lab' },
    { id: 'labBlockB', x: 22, y: 4, w: 2, d: 4, h: 1.6, type: 'building', color: '#6ea2d6', roof: '#e3f0ff', solid: true, label: 'Cardio Pods' },
    { id: 'imagingNorth', x: 20, y: 10, w: 3, d: 4, h: 1.8, type: 'building', color: '#9dc9c0', roof: '#e0fff7', solid: true, label: 'Imaging Core' },
    { id: 'imagingSouth', x: 23, y: 12, w: 2, d: 3, h: 1.4, type: 'machine', color: '#7bb2ab', roof: '#d6fbf4', solid: true, label: 'Calibration Bay' },
    { id: 'engA', x: 18, y: 18, w: 4, d: 4, h: 1.4, type: 'workshop', color: '#e7b96d', roof: '#fff0cb', solid: true, label: 'Workshop' },
    { id: 'engB', x: 23, y: 19, w: 2, d: 4, h: 1.3, type: 'workshop', color: '#c9964f', roof: '#ffe6b8', solid: true, label: 'Tool Shed' },
    { id: 'officeA', x: 3, y: 17, w: 3, d: 5, h: 1.5, type: 'building', color: '#c9b6f7', roof: '#efe8ff', solid: true, label: 'Admin Burrow' },
    { id: 'officeB', x: 7, y: 18, w: 2, d: 4, h: 1.2, type: 'building', color: '#ad96e3', roof: '#f1eaff', solid: true, label: 'Desk Maze' },
    { id: 'breakBar', x: 4, y: 10, w: 2, d: 3, h: 0.8, type: 'counter', color: '#d48b7f', roof: '#ffe7df', solid: true, label: 'Coffee Hub' },
    { id: 'breakSofas', x: 8, y: 10, w: 2, d: 2, h: 0.6, type: 'couch', color: '#77c8a1', roof: '#dff7ea', solid: true, label: 'Comfy Zone' },
    { id: 'sheepPen', x: 7, y: 1, w: 4, d: 4, h: 0.4, type: 'pen', color: '#b3d898', roof: '#deffd0', solid: false, label: 'Sheep Union Square' },
    { id: 'pigPen', x: 7, y: 5, w: 2, d: 2, h: 0.4, type: 'pen', color: '#f0b0b7', roof: '#ffe1e6', solid: false, label: 'Pig Parade' },
    { id: 'mouseNook', x: 9, y: 5, w: 2, d: 2, h: 0.4, type: 'pen', color: '#b8bbb4', roof: '#eff2eb', solid: false, label: 'Mouse Nook' },
    { id: 'courtyardTree', x: 14, y: 12, w: 1, d: 1, h: 0.5, type: 'tree', color: '#4a9b6b', roof: '#86d8aa', solid: false },
    { id: 'courtyardTree2', x: 16, y: 14, w: 1, d: 1, h: 0.5, type: 'tree', color: '#4a9b6b', roof: '#86d8aa', solid: false },
    { id: 'bench1', x: 12, y: 13, w: 1, d: 1, h: 0.25, type: 'bench', color: '#81634a', roof: '#cda27d', solid: false },
    { id: 'bench2', x: 17, y: 11, w: 1, d: 1, h: 0.25, type: 'bench', color: '#81634a', roof: '#cda27d', solid: false },
    { id: 'scannerStation', x: 18, y: 8, w: 1, d: 1, h: 0.65, type: 'machine', color: '#8db9ff', roof: '#d9e7ff', solid: false, label: 'Field Scanner Dock' },
    { id: 'roofStairs', x: 24, y: 6, w: 1, d: 1, h: 0.7, type: 'stairs', color: '#8895ab', roof: '#dbe4f0', solid: false, label: 'Roof Access' },
    { id: 'clinicStop', x: 25, y: 18, w: 1, d: 1, h: 0.3, type: 'sign', color: '#9fd3d3', roof: '#e3ffff', solid: false, label: 'Clinic Shuttle' },
    { id: 'homeGate', x: 13, y: 25, w: 1, d: 1, h: 0.3, type: 'sign', color: '#e0c37e', roof: '#fff2cb', solid: false, label: 'Home Hop' },
    { id: 'reefGate', x: 15, y: 26, w: 1, d: 1, h: 0.3, type: 'pool', color: '#5c9fd8', roof: '#ccefff', solid: false, label: 'Bluey Reflection Pool' },
  ];

  const npcs = [
    { id: 'james', name: 'James', role: 'Lab Head', map: 'campus', x: 14.5, y: 11.8, color: '#4ab5ff', portrait: '🧠', quest: true },
    { id: 'eddy', name: 'Eddy', role: 'Lab Head', map: 'campus', x: 19.2, y: 8.8, color: '#5da6d1', portrait: '📈', quest: true },
    { id: 'sally', name: 'Sally', role: 'PhD Student / Cardiologist', map: 'campus', x: 21.6, y: 6.5, color: '#f190b1', portrait: '☕', quest: true },
    { id: 'juan', name: 'Juan', role: 'PhD Student / Cardiologist', map: 'campus', x: 23.2, y: 6.2, color: '#ffb35c', portrait: '🫀' },
    { id: 'peter', name: 'Peter', role: 'PhD Student / Cardiologist', map: 'campus', x: 22.1, y: 8.1, color: '#a07cff', portrait: '🧪' },
    { id: 'natsuki', name: 'Natsuki', role: 'PhD Student', map: 'campus', x: 5.7, y: 22.2, color: '#ff7fc6', portrait: '📚' },
    { id: 'ahmad', name: 'Ahmad', role: 'PhD Student', map: 'campus', x: 6.7, y: 19.3, color: '#70d2cc', portrait: '🧬' },
    { id: 'alex', name: 'Alex', role: 'PhD Student', map: 'campus', x: 8.8, y: 21.4, color: '#f0bf5a', portrait: '📓' },
    { id: 'max', name: 'Max', role: 'Postdoc', map: 'campus', x: 21.2, y: 18.5, color: '#ff9a7b', portrait: '🛠️' },
    { id: 'fairooj', name: 'Fairooj', role: 'Postdoc', map: 'campus', x: 22.7, y: 10.2, color: '#56cf9f', portrait: '🔬' },
    { id: 'dhanya', name: 'Dhanya', role: 'Postdoc', map: 'campus', x: 24.2, y: 10.8, color: '#ffcf70', portrait: '📷' },
    { id: 'shinya', name: 'Shinya', role: 'Postdoc', map: 'campus', x: 20.7, y: 7.6, color: '#74b6ff', portrait: '🧭' },
    { id: 'renuka', name: 'Renuka', role: 'Postdoc', map: 'campus', x: 10.5, y: 4.8, color: '#9cf29a', portrait: '🐑' },
    { id: 'leila', name: 'Leila', role: 'Postdoc', map: 'campus', x: 13.1, y: 15.8, color: '#ffe47f', portrait: '✨' },
    { id: 'ivy', name: 'Ivy', role: 'Postdoc', map: 'campus', x: 4.3, y: 18.5, color: '#8ce2ff', portrait: '🪴' },
    { id: 'megan', name: 'Megan', role: 'Research Assistant', map: 'campus', x: 6.5, y: 12.3, color: '#ff9172', portrait: '🥐' },
    { id: 'caitlin', name: 'Caitlin', role: 'Research Assistant', map: 'campus', x: 8.2, y: 12.1, color: '#a0d86f', portrait: '📝' },
    { id: 'joel', name: 'Joel', role: 'Research Assistant', map: 'campus', x: 24.3, y: 20.4, color: '#ffb85a', portrait: '🔧' },
    { id: 'tony', name: 'Tony', role: 'Biomedical Engineer', map: 'campus', x: 20.8, y: 20.9, color: '#ffc25c', portrait: '🧰', quest: true },
    { id: 'vu', name: 'Vu', role: 'Biomedical Engineer', map: 'rooftop', x: 10.2, y: 5.2, color: '#7dc8ff', portrait: '🚁', quest: true },
    { id: 'urja', name: 'Urja', role: 'Biomedical Engineer', map: 'campus', x: 18.7, y: 22.1, color: '#fd89b2', portrait: '⚙️' },
    { id: 'luther', name: 'Luther', role: 'Vet / Engineer', map: 'clinic', x: 4.7, y: 7.6, color: '#b89dff', portrait: '🩺' },
    { id: 'josh', name: 'Josh', role: 'Animal Support Staff', map: 'campus', x: 8.2, y: 6.2, color: '#63d074', portrait: '🐖' },
    { id: 'mel', name: 'Mel', role: 'Animal Support Staff', map: 'campus', x: 9.7, y: 2.3, color: '#d1f071', portrait: '🐑', quest: true },
    { id: 'ross', name: 'Ross', role: 'Welfare Officer / Vet', map: 'clinic', x: 7.1, y: 4.8, color: '#8aceff', portrait: '🗣️', quest: true },
    { id: 'mariko', name: 'Mariko', role: 'Veterinary Cardiologist', map: 'clinic', x: 10.8, y: 8.6, color: '#f181af', portrait: '💓', quest: true },
    { id: 'noah', name: 'Noah', role: 'Tiny Sidekick', map: 'home', x: 6.7, y: 7.2, color: '#ffd36c', portrait: '🛩️', quest: true },
    { id: 'batty', name: 'Batty', role: 'Cat / Senior Management', map: 'home', x: 9.4, y: 3.8, color: '#f2ca63', portrait: '🐈', quest: true },
    { id: 'bluey', name: 'Bluey', role: 'Turtle / Oracle', map: 'home', x: 3.4, y: 5.9, color: '#77d4e9', portrait: '🐢', quest: true },
  ];

  const pickups = [
    { id: 'lostBadge', kind: 'quest', x: 8.5, y: 18.2, label: 'Lost Badge', color: '#ffe27c', quest: 'morning', step: 1 },
    { id: 'hay1', kind: 'resource', x: 11.7, y: 2.2, label: 'Hay Bundle', color: '#f5dd80', quest: 'morning', step: 3 },
    { id: 'hay2', kind: 'resource', x: 6.1, y: 7.3, label: 'Hay Bundle', color: '#f5dd80', quest: 'morning', step: 3 },
    { id: 'hay3', kind: 'resource', x: 14.4, y: 16.7, label: 'Hay Bundle', color: '#f5dd80', quest: 'morning', step: 3 },
    { id: 'memo1', kind: 'collectible', x: 13.8, y: 24.6, label: 'Memo: Coffee Is Not A Metric', color: '#c1f4ff' },
    { id: 'memo2', kind: 'collectible', x: 23.5, y: 22.8, label: 'Memo: Sheep Negotiation Draft', color: '#c1f4ff' },
    { id: 'tagA', kind: 'scan', x: 19.3, y: 16.2, label: 'Reflective Tag', color: '#7db4ff', hidden: true, quest: 'rats', step: 1 },
    { id: 'tagB', kind: 'scan', x: 5.4, y: 16.5, label: 'Reflective Tag', color: '#7db4ff', hidden: true, quest: 'rats', step: 1 },
    { id: 'tagC', kind: 'scan', x: 24.7, y: 5.5, label: 'Reflective Tag', color: '#7db4ff', hidden: true, quest: 'rats', step: 1 },
  ];

  const interactions = [
    { id: 'coffeeHub', x: 5.5, y: 11.5, radius: 1.1, label: 'Brew Coffee', kind: 'coffee' },
    { id: 'imagingConsole', x: 23.6, y: 11.3, radius: 1.2, label: 'Repair Console', kind: 'repair' },
    { id: 'roofPortal', x: 24.4, y: 6.5, radius: 0.9, label: 'Go to Rooftop', kind: 'portal', to: 'rooftop', targetX: 9.2, targetY: 10.5 },
    { id: 'homePortal', x: 13.5, y: 25.6, radius: 0.9, label: 'Go Home', kind: 'portal', to: 'home', targetX: 6.4, targetY: 10.8 },
    { id: 'clinicPortal', x: 25.4, y: 18.2, radius: 0.9, label: 'Ride Clinic Shuttle', kind: 'portal', to: 'clinic', targetX: 8.6, targetY: 11.2 },
    { id: 'reefPortal', x: 15.4, y: 26.3, radius: 0.9, label: 'Peer Into Pool', kind: 'portal', to: 'reef', targetX: 8.2, targetY: 14.5, requires: 'waterproofBoots' },
    { id: 'scannerDock', x: 18.3, y: 8.3, radius: 1.0, label: 'Check Scanner Dock', kind: 'scannerDock' },
    { id: 'backupSwitch', x: 21.1, y: 23.4, radius: 1.0, label: 'Backup Switch', kind: 'backupSwitch' },
  ];

  return {
    key: 'campus',
    title: 'Centre for Oddly Heroic Heart Research',
    width: 28,
    height: 28,
    startX: 13.8,
    startY: 13.8,
    grid,
    props,
    npcs,
    pickups,
    interactions,
    weather: 'breezy',
    theme: 'campus',
    ambience: 'day',
  };
};

const createHome = () => {
  const grid = createGrid(14, 14, 'rug');
  setGroundRect(grid, 0, 0, 14, 14, 'wood', 'home', true);
  setGroundRect(grid, 1, 1, 12, 3, 'rug', 'lounge', true);
  setGroundRect(grid, 2, 5, 10, 6, 'tile', 'kitchen', true);
  const props = [
    { id: 'sofa', x: 3, y: 1, w: 3, d: 2, h: 0.7, type: 'couch', color: '#71c39e', roof: '#dff9ea', solid: true, label: 'Sofa Fort' },
    { id: 'books', x: 8, y: 2, w: 2, d: 1, h: 0.8, type: 'shelf', color: '#c19e78', roof: '#ffeac9', solid: true, label: 'Tiny Library' },
    { id: 'blueyTank', x: 2, y: 5, w: 2, d: 2, h: 0.6, type: 'tank', color: '#7cd0dd', roof: '#dbffff', solid: true, label: 'Bluey Tank' },
    { id: 'kitchen', x: 8, y: 5, w: 3, d: 2, h: 0.8, type: 'counter', color: '#d2b9ea', roof: '#f7eeff', solid: true, label: 'Snack Counter' },
    { id: 'bedroomDoor', x: 11, y: 10, w: 1, d: 1, h: 0.3, type: 'sign', color: '#e2d488', roof: '#fff6ca', solid: false, label: 'Quiet Zone' },
    { id: 'campusDoor', x: 6, y: 12, w: 1, d: 1, h: 0.3, type: 'sign', color: '#e2d488', roof: '#fff6ca', solid: false, label: 'Back to Campus' },
  ];
  const pickups = [
    { id: 'memoHome', kind: 'collectible', x: 11.3, y: 3.6, label: 'Drawing: Alan vs Gigantic Sandwich', color: '#ffd1a1' },
  ];
  const interactions = [
    { id: 'homePortal', x: 6.4, y: 12.6, radius: 1.0, label: 'Return to Campus', kind: 'portal', to: 'campus', targetX: 13.5, targetY: 24.5 },
    { id: 'storyCorner', x: 5.1, y: 2.0, radius: 1.0, label: 'Sit for a Breather', kind: 'rest' },
  ];
  return {
    key: 'home',
    title: 'Alan Home Base',
    width: 14,
    height: 14,
    startX: 6.4,
    startY: 10.8,
    grid,
    props,
    npcs: [],
    pickups,
    interactions,
    weather: 'cozy',
    theme: 'home',
    ambience: 'warm',
  };
};

const createRooftop = () => {
  const grid = createGrid(14, 14, 'roof');
  setGroundRect(grid, 0, 0, 14, 14, 'roof', 'rooftop', true);
  const props = [
    { id: 'ac1', x: 2, y: 2, w: 2, d: 2, h: 0.9, type: 'machine', color: '#a8b5c8', roof: '#eef4ff', solid: true },
    { id: 'ac2', x: 9, y: 7, w: 2, d: 2, h: 0.9, type: 'machine', color: '#a8b5c8', roof: '#eef4ff', solid: true },
    { id: 'rail', x: 0, y: 0, w: 14, d: 1, h: 0.2, type: 'fence', color: '#516275', roof: '#c0d6eb', solid: false },
    { id: 'stairsDown', x: 9, y: 11, w: 1, d: 1, h: 0.3, type: 'sign', color: '#e6d17f', roof: '#fff4ca', solid: false, label: 'Down to Campus' },
    { id: 'dronePad', x: 11, y: 4, w: 2, d: 2, h: 0.2, type: 'pad', color: '#78c7ff', roof: '#e3f8ff', solid: false, label: 'Drone Pad' },
  ];
  const interactions = [
    { id: 'campusPortal', x: 9.4, y: 11.4, radius: 1.0, label: 'Back to Campus', kind: 'portal', to: 'campus', targetX: 24.2, targetY: 7.3 },
    { id: 'droneMinigame', x: 11.7, y: 4.8, radius: 1.1, label: 'Run Drone Check', kind: 'drone' },
  ];
  return {
    key: 'rooftop',
    title: 'Rooftop Drone Zone',
    width: 14,
    height: 14,
    startX: 9.2,
    startY: 10.8,
    grid,
    props,
    npcs: [],
    pickups: [{ id: 'memoRoof', kind: 'collectible', x: 1.5, y: 10.2, label: 'Sticker: SAFETY FIRST, DRAMA SECOND', color: '#c1f4ff' }],
    interactions,
    weather: 'windy',
    theme: 'drone',
    ambience: 'sky',
  };
};

const createClinic = () => {
  const grid = createGrid(14, 14, 'clinic');
  setGroundRect(grid, 0, 0, 14, 14, 'clinic', 'clinic', true);
  setGroundRect(grid, 1, 1, 6, 4, 'tile', 'reception', true);
  setGroundRect(grid, 8, 2, 4, 4, 'tile', 'exam', true);
  const props = [
    { id: 'desk', x: 2, y: 2, w: 2, d: 1, h: 0.8, type: 'counter', color: '#f1c3da', roof: '#fff1f7', solid: true, label: 'Reception' },
    { id: 'kennel', x: 9, y: 3, w: 2, d: 2, h: 0.7, type: 'pen', color: '#c1dbf0', roof: '#eff8ff', solid: true, label: 'Calm Corner' },
    { id: 'pulseRig', x: 6, y: 7, w: 2, d: 2, h: 0.7, type: 'machine', color: '#7ed7d0', roof: '#ddfffb', solid: true, label: 'Pulse Rig' },
    { id: 'campusReturn', x: 7, y: 12, w: 1, d: 1, h: 0.3, type: 'sign', color: '#e6d17f', roof: '#fff4ca', solid: false, label: 'Return Shuttle' },
  ];
  const interactions = [
    { id: 'clinicPortal', x: 7.5, y: 12.4, radius: 1.0, label: 'Back to Campus', kind: 'portal', to: 'campus', targetX: 24.8, targetY: 18.5 },
    { id: 'pulseRig', x: 7.0, y: 8.2, radius: 1.1, label: 'Calibrate Pulse Rig', kind: 'pulse' },
  ];
  return {
    key: 'clinic',
    title: 'Mariko’s Vet Clinic Crossover',
    width: 14,
    height: 14,
    startX: 8.6,
    startY: 11.2,
    grid,
    props,
    npcs: [],
    pickups: [{ id: 'memoClinic', kind: 'collectible', x: 4.4, y: 10.2, label: 'Poster: Rabbits Appreciate Boundaries', color: '#c1f4ff' }],
    interactions,
    weather: 'sterile-but-nice',
    theme: 'clinic',
    ambience: 'soft',
  };
};

const createReef = () => {
  const grid = createGrid(16, 16, 'reef');
  setGroundRect(grid, 0, 0, 16, 16, 'reef', 'dream-reef', true);
  const props = [
    { id: 'coral1', x: 3, y: 4, w: 1, d: 1, h: 0.6, type: 'coral', color: '#ff8ca3', roof: '#ffd6e2', solid: false },
    { id: 'coral2', x: 10, y: 10, w: 1, d: 1, h: 0.6, type: 'coral', color: '#8fd9ff', roof: '#e7fbff', solid: false },
    { id: 'coral3', x: 12, y: 6, w: 1, d: 1, h: 0.6, type: 'coral', color: '#f6d287', roof: '#fff6d1', solid: false },
    { id: 'campBubble', x: 8, y: 14, w: 1, d: 1, h: 0.3, type: 'portal', color: '#a8ecff', roof: '#effdff', solid: false, label: 'Surface Bubble' },
  ];
  const pickups = [
    { id: 'shell1', kind: 'reef', x: 4.4, y: 6.2, label: 'Shimmer Shell', color: '#ffe29b' },
    { id: 'shell2', kind: 'reef', x: 10.3, y: 4.3, label: 'Shimmer Shell', color: '#ffe29b' },
    { id: 'shell3', kind: 'reef', x: 11.6, y: 11.1, label: 'Shimmer Shell', color: '#ffe29b' },
    { id: 'memoReef', kind: 'collectible', x: 7.4, y: 2.8, label: 'Shell Note: Bluey Was Here Somehow', color: '#c1f4ff' },
  ];
  const interactions = [
    { id: 'surfaceBubble', x: 8.2, y: 14.3, radius: 1.0, label: 'Surface', kind: 'portal', to: 'campus', targetX: 15.4, targetY: 25.9 },
  ];
  return {
    key: 'reef',
    title: 'Bluey’s Dream Reef',
    width: 16,
    height: 16,
    startX: 8.2,
    startY: 14.5,
    grid,
    props,
    npcs: [],
    pickups,
    interactions,
    weather: 'bubbly',
    theme: 'reef',
    ambience: 'aquatic',
  };
};

export const QUEST_DEFS = {
  morning: {
    id: 'morning',
    title: 'Morning Vector',
    short: 'Contain the campus before the coffee attains sentience.',
    steps: [
      'Talk to James in the courtyard.',
      'Find Alan’s lost facility badge in the office maze.',
      'Brew a coffee at the hub and deliver it to Sally.',
      'Collect 3 hay bundles and reassure Mel and the sheep.',
      'Repair the imaging console with Tony.',
    ],
    rewardText: 'Unlocked upgrade: Pocket Scanner',
  },
  rats: {
    id: 'rats',
    title: 'Procedure Pirates',
    short: 'Investigate suspiciously organized rats with reflective tags.',
    steps: [
      'Talk to Eddy near the main lab.',
      'Scan 3 reflective tags around campus.',
      'Interrogate Batty, who absolutely knows something.',
      'Complete Vu’s rooftop drone check.',
      'Go home and help Noah unwind after a very serious paper-plane briefing.',
    ],
    rewardText: 'Unlocked upgrade: Drone Access + Snack Pouch',
  },
  bluey: {
    id: 'bluey',
    title: 'Bluey Protocol',
    short: 'Visit Mariko’s clinic and follow the turtle-shaped omen.',
    steps: [
      'Talk to Mariko at the clinic.',
      'Help Ross calibrate the pulse rig without hearing the full speech twice.',
      'Check on Bluey at home.',
      'Collect 3 shimmer shells in Bluey’s dream reef.',
    ],
    rewardText: 'Unlocked upgrade: Waterproof Boots',
  },
  finale: {
    id: 'finale',
    title: 'Controlled Chaos',
    short: 'Campus systems wobble. Alan becomes the plan.',
    steps: [
      'Activate the engineering backup switch.',
      'Run coffee-cart chaos control.',
      'Calm the sheep line with Mel.',
      'Seal the imaging loop one last time.',
    ],
    rewardText: 'Ending unlocked: Campus Saved, Mostly Elegantly.',
  },
};

export const CHAPTERS = [
  { id: 1, name: 'Day 1 — Coffee Has Momentum', flavor: 'A normal morning becomes a heroic logistics ballet.' },
  { id: 2, name: 'Day 2 — The Rats Have Procedure', flavor: 'Patterns appear. Batty smirks. Everyone pretends that is fine.' },
  { id: 3, name: 'Evening — Bluey Protocol', flavor: 'Home warmth meets mystery, with a surprisingly moving turtle cameo.' },
  { id: 4, name: 'Finale — Controlled Chaos', flavor: 'The campus hums, flickers, and dares Alan to keep it together.' },
];

export const UPGRADES = {
  scanner: { id: 'scanner', name: 'Pocket Scanner', description: 'Reveals reflective tags and hidden gossip-grade tech.' },
  dronePass: { id: 'dronePass', name: 'Drone Pass', description: 'Lets Alan run rooftop inspections and feel dramatically windswept.' },
  snackPouch: { id: 'snackPouch', name: 'Snack Pouch', description: 'Improves energy recovery. Heroism is glucose-shaped.' },
  waterproofBoots: { id: 'waterproofBoots', name: 'Waterproof Boots', description: 'Unlocks Bluey’s dream reef and any puddle that feels ambitious.' },
  hardMode: { id: 'hardMode', name: 'After-Hours Hard Mode', description: 'Faster chaos, fancier bragging rights.' },
};

export const MEMOS = [
  'Coffee is a beverage, not a deliverable. Please stop labeling it “critical reagent.”',
  'Sheep Union notice: Baa-rgaining will continue until snacks improve.',
  'Reminder: Batty is not on payroll, but has somehow approved two budgets.',
  'Drone memo: If it hums ominously, that is not “character.” Fix it.',
  'Bluey has once again appeared where no turtle should. Respectfully, how?',
];

export const CHARACTER_COMPENDIUM = [
  { name: 'Alan', role: 'Research veterinarian and player character', personality: 'Kind, dryly funny, spectacular under pressure, permanently one task away from sprinting.', visual: 'Teal scrub jacket, practical shoes, messenger satchel, determined eyebrows.', dialogue: 'Warm one-liners, calm problem-solving, occasional “right, okay, sure, that too.”', gameplay: 'Playable explorer, fixer, negotiator, drone pilot, accidental campus legend.', relationship: 'Centrepoint of the cast. The person everyone trusts when chaos gets ideas.', comic: 'Treats absurd emergencies with suspicious professionalism.', type: 'protagonist' },
  { name: 'Mariko', role: 'Veterinary cardiologist', personality: 'Sharp, caring, playful, never underestimates a mess.', visual: 'Rose-gold stethoscope, clinic coat, quick smile that usually means she has already solved half the problem.', dialogue: 'Dry flirtation, competent banter, warm grounding advice.', gameplay: 'Clinic missions, narrative anchor, late-game upgrade path.', relationship: 'Alan’s partner in life and in witty debriefs.', comic: 'Can defeat nonsense with a single eyebrow raise.', type: 'quest' },
  { name: 'Noah', role: 'Tiny sidekick', personality: 'Curious, dramatic, enthusiastic about paper planes and naming everything.', visual: 'Bright socks, toy plane, impossible amount of momentum for a small human.', dialogue: 'Unfiltered genius statements. “Daddy, maybe the sheep need a meeting hat.”', gameplay: 'Home buffs and morale moments.', relationship: 'Alan’s emotional recharge station.', comic: 'Sees the world as one giant optional side quest.', type: 'buff' },
  { name: 'Batty', role: 'Cat and unofficial administrator', personality: 'Imperious, affectionate on a schedule, aware of secrets.', visual: 'Gold-flecked tuxedo cat with executive posture.', dialogue: 'Wordless stare energy. Everyone interprets it as policy.', gameplay: 'Hints, secret finding, collectible detection.', relationship: 'Alan’s furry supervisor.', comic: 'Appears wherever authority is least convenient.', type: 'quest' },
  { name: 'Bluey', role: 'Turtle oracle', personality: 'Peaceful, mysterious, somehow comedic by existing with total conviction.', visual: 'Blue-green shell sheen, tiny blink, ancient aura in a lunch-sized body.', dialogue: 'Mostly implied. Occasionally represented by suspiciously perfect timing.', gameplay: 'Unlocks dream reef and hidden collectibles.', relationship: 'Alan’s quiet reset button.', comic: 'Teleports emotionally, if not physically.', type: 'quest' },
  { name: 'James', role: 'Lab head', personality: 'Strategic, energetic, supportive.', visual: 'Blue shirt, coffee that has become an accessory.', dialogue: '“Good news: you are exactly the right person. Bad news: that fact is time-sensitive.”', gameplay: 'Main quest kickoff.', relationship: 'Relies on Alan heavily and sincerely.', comic: 'Can turn any briefing into a sports movie speech.', type: 'quest' },
  { name: 'Eddy', role: 'Lab head', personality: 'Precise, thoughtful, quietly hilarious.', visual: 'Slate cardigan, tablet, laser-pointer aura.', dialogue: '“I am not saying the rats are organized. I am saying they have a workflow.”', gameplay: 'Investigation arc.', relationship: 'Sees Alan as the only person with enough common sense.', comic: 'Delivers absurd observations like peer-reviewed facts.', type: 'quest' },
  { name: 'Sally', role: 'PhD student / cardiologist', personality: 'Brilliant, over-caffeinated, earnest.', visual: 'Pink lab accents, highlighter constellation in pocket.', dialogue: '“The data are beautiful and I have become one with this mug.”', gameplay: 'Coffee delivery objective.', relationship: 'Grateful chaos gremlin.', comic: 'Treats caffeine stabilization like a moon landing.', type: 'quest' },
  { name: 'Juan', role: 'PhD student / cardiologist', personality: 'Confident, warm, unintentionally dramatic.', visual: 'Amber tie, rolled sleeves.', dialogue: 'Big metaphors, bigger gratitude.', gameplay: 'Lore and campus hints.', relationship: 'A friendly ally.', comic: 'Narrates minor inconveniences like epic literature.', type: 'lore' },
  { name: 'Peter', role: 'PhD student / cardiologist', personality: 'Analytical, sleepy, sneakily funny.', visual: 'Purple ID lanyard, slightly rumpled.', dialogue: 'Deadpan commentary with excellent timing.', gameplay: 'Quest hints and stats chatter.', relationship: 'Respects Alan’s practicality.', comic: 'Can make a spreadsheet sound haunted.', type: 'lore' },
  { name: 'Natsuki', role: 'PhD student', personality: 'Focused, stylish, softly chaotic.', visual: 'Neon tabs and fast steps.', dialogue: 'Fast, witty, exact.', gameplay: 'Side lore and memo jokes.', relationship: 'Office maze friend.', comic: 'Has opinions about everyone’s labeling system.', type: 'lore' },
  { name: 'Ahmad', role: 'PhD student', personality: 'Patient, sharp, encouraging.', visual: 'Mint hoodie under lab coat.', dialogue: 'Calm lines with sneaky punchlines.', gameplay: 'Tutorial hints.', relationship: 'Trusts Alan with the weird jobs.', comic: 'Understates absolutely everything.', type: 'hint' },
  { name: 'Alex', role: 'PhD student', personality: 'Inquisitive, practical, good under pressure.', visual: 'Golden notebook, tidy workstation energy.', dialogue: 'Friendly and concise.', gameplay: 'Collectible chatter.', relationship: 'Helpful colleague.', comic: 'Keeps accidentally becoming the sensible one.', type: 'lore' },
  { name: 'Max', role: 'Postdoc', personality: 'Builder mindset, enthusiastic.', visual: 'Tool belt, orange gloves.', dialogue: 'Cheerfully alarming engineering optimism.', gameplay: 'Workshop lore.', relationship: 'Alan’s chaos-adjacent ally.', comic: 'Calls unstable prototypes “promising.”', type: 'lore' },
  { name: 'Fairooj', role: 'Postdoc', personality: 'Observant, kind, methodical.', visual: 'Green accents, imaging headset.', dialogue: 'Measured, clear, unexpectedly funny.', gameplay: 'Imaging area hints.', relationship: 'Mutual respect.', comic: 'Can describe a disaster in soothing terms.', type: 'hint' },
  { name: 'Dhanya', role: 'Postdoc', personality: 'Resourceful, bright, calm.', visual: 'Golden scanner band.', dialogue: 'Direct with playful edges.', gameplay: 'Imaging support.', relationship: 'Alan’s dependable collaborator.', comic: 'Treats broken devices like grumpy pets.', type: 'hint' },
  { name: 'Shinya', role: 'Postdoc', personality: 'Elegant, organized, precise.', visual: 'Sky-blue notes, immaculate posture.', dialogue: 'Thoughtful lines with quiet wit.', gameplay: 'Mid-quest clue giver.', relationship: 'Helps Alan map patterns.', comic: 'Can make even panic sound curated.', type: 'lore' },
  { name: 'Renuka', role: 'Postdoc', personality: 'Compassionate, practical, funny.', visual: 'Pastel green field boots.', dialogue: 'Warm and grounded.', gameplay: 'Animal facility lore.', relationship: 'Shared care mindset.', comic: 'Translates sheep politics with alarming confidence.', type: 'lore' },
  { name: 'Leila', role: 'Postdoc', personality: 'Optimistic, stylish, observant.', visual: 'Gold earrings, bright smile.', dialogue: 'Encouraging and playful.', gameplay: 'Side encouragement.', relationship: 'Friendly campus booster.', comic: 'Claps for successful errands.', type: 'buff' },
  { name: 'Ivy', role: 'Postdoc', personality: 'Gentle, clever, excellent listener.', visual: 'Plant pin, cool tones.', dialogue: 'Soft-spoken with strong punchlines.', gameplay: 'Collectible hint NPC.', relationship: 'Office ally.', comic: 'Talks to plants and sometimes gets results.', type: 'hint' },
  { name: 'Megan', role: 'Research assistant', personality: 'Fast, practical, pastry-aware.', visual: 'Coral sleeves, croissant radar.', dialogue: 'Snack-forward competency.', gameplay: 'Coffee hub tutorial.', relationship: 'Morning shift lifesaver.', comic: 'Runs the break room like an airport control tower.', type: 'hint' },
  { name: 'Caitlin', role: 'Research assistant', personality: 'Witty, organized, composed.', visual: 'Green notebook, efficient stride.', dialogue: 'Dry humor with precision.', gameplay: 'Hub side chatter.', relationship: 'Reliable collaborator.', comic: 'Can solve a scheduling issue with one eyebrow.', type: 'lore' },
  { name: 'Joel', role: 'Research assistant', personality: 'Helpful, upbeat, hands-on.', visual: 'Rolled sleeves, toolkit marker pen.', dialogue: 'Friendly and direct.', gameplay: 'Finale flavor support.', relationship: 'Workshop helper.', comic: 'Always somehow carrying exactly the wrong screw first.', type: 'lore' },
  { name: 'Tony', role: 'Biomedical engineer', personality: 'Inventive, confident, slightly theatrical.', visual: 'Bright tool chest, hazard tape aesthetics.', dialogue: '“I have a solution. It is elegant, and by elegant I mean technically legal.”', gameplay: 'Repair minigames and late-game crisis support.', relationship: 'Alan’s engineering counterpart.', comic: 'Every fix sounds like a stage act.', type: 'quest' },
  { name: 'Vu', role: 'Biomedical engineer', personality: 'Cool-headed, dryly funny, drone obsessed.', visual: 'Windbreaker, rotor badge.', dialogue: '“The drone is stable. Emotionally, less so.”', gameplay: 'Drone minigame unlock.', relationship: 'Trusted tech ally.', comic: 'Treats aerial footage as cinema.', type: 'quest' },
  { name: 'Urja', role: 'Biomedical engineer', personality: 'Quick-thinking, vibrant, direct.', visual: 'Magenta accessories, utility boots.', dialogue: 'High-energy competence.', gameplay: 'Workshop hints and upgrade flavor.', relationship: 'Sharp teammate.', comic: 'Can insult a faulty cable poetically.', type: 'lore' },
  { name: 'Luther', role: 'Vet in engineering team', personality: 'Calm, practical, wonderfully unfazed.', visual: 'Lavender scrubs with soldering pen.', dialogue: 'Measured and funny.', gameplay: 'Clinic lore and upgrade flavor.', relationship: 'Understands both animals and gadgets.', comic: 'Treats hardware and patients with the same bedside manner.', type: 'lore' },
  { name: 'Josh', role: 'Animal support staff', personality: 'Cheerful, attentive, grounded.', visual: 'Field cap, green boots.', dialogue: 'Straightforward with warm humor.', gameplay: 'Animal zone hints.', relationship: 'Trusted care teammate.', comic: 'Knows exactly which pig is pretending not to listen.', type: 'hint' },
  { name: 'Mel', role: 'Animal support staff', personality: 'Capable, funny, diplomatic.', visual: 'Union-worthy sheep badge.', dialogue: '“They are not difficult. They are organized.”', gameplay: 'Sheep quest gate and finale support.', relationship: 'Alan’s co-negotiator in animal logistics.', comic: 'Speaks fluent sheep politics.', type: 'quest' },
  { name: 'Ross', role: 'Animal welfare officer / vet', personality: 'Kind, knowledgeable, gloriously verbose.', visual: 'Blue clipboard, unstoppable momentum.', dialogue: 'Begins every answer with context, then further context, then another helpful loop.', gameplay: 'Clinic puzzle and comic obstacle.', relationship: 'Alan respects him and occasionally needs an exit strategy.', comic: 'His dialogue boxes are emotionally long-distance runners.', type: 'quest' },
];

export const getWorldData = () => ({
  campus: createCampus(),
  home: createHome(),
  rooftop: createRooftop(),
  clinic: createClinic(),
  reef: createReef(),
});

export const createDefaultState = () => ({
  version: 1,
  hasStarted: false,
  settings: {
    mute: false,
    music: 0.55,
    sfx: 0.8,
    subtitles: true,
    largeText: false,
    highContrast: false,
    reducedMotion: false,
  },
  progress: {
    chapter: 1,
    dayLabel: 'Day 1',
    currentMap: 'campus',
    checkpoint: { map: 'campus', x: 13.8, y: 13.8 },
    endingSeen: false,
    hardMode: false,
  },
  player: {
    x: 13.8,
    y: 13.8,
    energy: 100,
    maxEnergy: 100,
    morale: 1,
    moveSpeed: 3.2,
    sprintMultiplier: 1.55,
  },
  inventory: {
    coffee: 0,
    hay: 0,
    memos: [],
    shells: 0,
  },
  upgrades: {
    scanner: false,
    dronePass: false,
    snackPouch: false,
    waterproofBoots: false,
  },
  quests: {
    morning: { status: 'available', step: 0 },
    rats: { status: 'locked', step: 0 },
    bluey: { status: 'locked', step: 0 },
    finale: { status: 'locked', step: 0 },
  },
  achievements: [],
  world: {
    picked: {},
    scanned: {},
    spoken: {},
    flags: {
      coffeeDelivered: false,
      sheepCalmed: false,
      imagingFixed: false,
      battyHint: false,
      droneWin: false,
      noahChoice: '',
      clinicVisited: false,
      pulseFixed: false,
      blueyChecked: false,
      reefComplete: false,
      crisisActive: false,
      crisisCart: false,
      backupSwitch: false,
      finaleRepair: false,
      sheepFinale: false,
      badgeRecovered: false,
      scannerDockSeen: false,
    },
  },
  stats: {
    playSeconds: 0,
    tasksCompleted: 0,
    pets: 0,
    perfectRepairs: 0,
  },
});

export const cloneWorldData = () => deepClone(getWorldData());
