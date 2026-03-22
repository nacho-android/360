import { CHARACTER_COMPENDIUM, CHAPTERS, cloneWorldData } from '../data/gameData.js';
import { Player, NPCActor } from '../entities/actors.js';
import { clamp, directionLabel, distance, isoProject, lerp, pick, randomRange } from '../utils/helpers.js';

const TILE_COLORS = {
  grass: { top: '#3b8d63', left: '#255f42', right: '#2d734f' },
  path: { top: '#6ea96c', left: '#48714a', right: '#56895a' },
  tile: { top: '#9fc6d9', left: '#6d91a8', right: '#7ba4bb' },
  wood: { top: '#aa7a55', left: '#7a5339', right: '#8f6445' },
  courtyard: { top: '#83bf8d', left: '#588467', right: '#669674' },
  dock: { top: '#d6c7a4', left: '#b19b73', right: '#c3ae86' },
  rug: { top: '#cf7e86', left: '#8c4c51', right: '#a05a60' },
  roof: { top: '#7689a6', left: '#55647f', right: '#61718b' },
  clinic: { top: '#c5d9ed', left: '#8fa5be', right: '#a1b8d0' },
  reef: { top: '#3f8ec3', left: '#27648f', right: '#3077a8' },
};

const DEFAULT_LINES = {
  james: [
    'I believe in you, Alan. This is either inspiring or a scheduling emergency. Possibly both.',
    'Heroism today looks like cardio science plus very brisk walking.',
  ],
  eddy: [
    'I have a chart for the situation. The chart is mostly concern.',
    'The rats are not unionized. They are simply suspiciously punctual.',
  ],
  sally: ['If this coffee cools, the data lose morale. That is basic physics.'],
  juan: ['A campus crisis is just a symphony with more clipboards.'],
  peter: ['I made a spreadsheet for optimism. It has conditional formatting.'],
  natsuki: ['Somebody labelled a drawer “misc cables / destiny.” I have questions.'],
  ahmad: ['The good news is Alan is here. The better news is he brought sensible shoes.'],
  alex: ['I am collecting observations and absolutely not gossip.'],
  max: ['If it rattles, it is either broken or inventing a personality.'],
  fairooj: ['The scanner is moody. We respect that, but not forever.'],
  dhanya: ['Imaging likes patience. Machines like snacks. People also like snacks.'],
  shinya: ['I admire how Alan turns chaos into a to-do list.'],
  renuka: ['The sheep are firm negotiators. The key is to respect the committee.'],
  leila: ['You are doing amazing, which is inconvenient because now everyone knows.'],
  ivy: ['Batty moved a pen onto my notes. I assume that means editorial feedback.'],
  megan: ['The coffee hub is stable for now. Please admire this rare weather event.'],
  caitlin: ['I have the schedule, the backup schedule, and the “somehow sheep” schedule.'],
  joel: ['I brought spare screws and emotional support.'],
  tony: ['I call this solution “mostly elegant.” It tested well in my imagination.'],
  vu: ['The drone wants purpose. Also maybe a less dramatic propeller angle.'],
  urja: ['If a cable lies to me twice, it loses connector privileges.'],
  luther: ['Engineering and veterinary work both reward calm voices and clean timing.'],
  josh: ['The pigs are great. The pigs also know where the snack bucket lives.'],
  mel: ['The sheep respect honesty, snacks, and not being rushed in that order.'],
  ross: ['Excellent question. To answer briefly, and by briefly I mean with context—'],
  mariko: ['You look like the campus asked for a miracle again. Need backup?'],
  noah: ['Daddy! My plane is doing science. Also crime.'],
  batty: ['Batty squints with the authority of a senior manager reviewing expenses.'],
  bluey: ['Bluey blinks once, as if approving a plan Alan has not explained yet.'],
};

export class WorldScene {
  constructor(game) {
    this.game = game;
    this.worlds = cloneWorldData();
    this.masterNPCs = this.worlds.campus.npcs;
    this.player = new Player(game);
    this.tileW = 86;
    this.tileH = 43;
    this.viewCenter = { x: 0, y: 0 };
    this.cameraLerp = { x: 0, y: 0 };
    this.particles = this.createParticles();
    this.currentMapKey = game.state.progress.currentMap;
    this.currentMap = null;
    this.loadMap(this.currentMapKey, game.state.player.x, game.state.player.y, true);
  }

  createParticles() {
    return Array.from({ length: 26 }, () => ({
      x: randomRange(0, 1),
      y: randomRange(0, 1),
      speed: randomRange(0.015, 0.06),
      size: randomRange(1, 4),
      phase: randomRange(0, Math.PI * 2),
    }));
  }

  loadMap(key, x = null, y = null, silent = false) {
    this.currentMapKey = key;
    this.currentMap = this.worlds[key];
    this.game.state.progress.currentMap = key;
    const startX = x ?? this.currentMap.startX;
    const startY = y ?? this.currentMap.startY;
    this.player.setPosition(startX, startY);
    this.game.audio.setTheme(this.currentMap.theme || 'campus');
    this.game.state.progress.checkpoint = { map: key, x: startX, y: startY };
    if (!silent) this.game.ui.showToast(this.currentMap.title);
    this.game.save(true);
  }

  getNPCsForCurrentMap() {
    return this.masterNPCs.filter((npc) => npc.map === this.currentMapKey).map((npc) => new NPCActor(npc));
  }

  getPickupsForCurrentMap() {
    return this.currentMap.pickups.filter((pickup) => !this.game.state.world.picked[pickup.id]);
  }

  getInteractionsForCurrentMap() {
    return this.currentMap.interactions || [];
  }

  getCurrentTile() {
    const tx = clamp(Math.floor(this.game.state.player.x), 0, this.currentMap.width - 1);
    const ty = clamp(Math.floor(this.game.state.player.y), 0, this.currentMap.height - 1);
    return this.currentMap.grid[ty][tx];
  }

  isBlocked(x, y, radius = 0.25) {
    if (x < radius || y < radius || x > this.currentMap.width - radius || y > this.currentMap.height - radius) return true;
    const sample = [
      [x - radius, y - radius],
      [x + radius, y - radius],
      [x - radius, y + radius],
      [x + radius, y + radius],
    ];
    for (const [sx, sy] of sample) {
      const tile = this.currentMap.grid[Math.floor(sy)]?.[Math.floor(sx)];
      if (!tile || !tile.walkable) return true;
    }
    return this.currentMap.props.some((prop) => prop.solid && x > prop.x && x < prop.x + prop.w && y > prop.y && y < prop.y + prop.d);
  }

  update(dt) {
    if (this.currentMapKey === 'campus' && this.game.state.quests.finale.status === 'active') this.game.audio.setTheme('finale');
    else this.game.audio.setTheme(this.currentMap.theme || 'campus');
    this.player.update(dt, this);
    this.particles.forEach((particle) => {
      particle.y += particle.speed * dt * (this.currentMapKey === 'reef' ? 0.2 : 1);
      particle.phase += dt;
      if (particle.y > 1.1) {
        particle.y = -0.1;
        particle.x = randomRange(0, 1);
      }
    });

    if (this.game.input.consumeAction()) {
      if (this.game.ui.activeDialogue) {
        this.game.ui.advanceDialogue();
      } else if (!this.game.minigames.isActive()) {
        this.handleInteract();
      }
    }

    const activeQuest = this.game.quests.getActiveQuestId();
    if (activeQuest === 'bluey' && this.game.state.quests.bluey.status === 'active' && this.game.state.quests.bluey.step === 3 && this.game.state.inventory.shells >= 3) {
      this.game.state.world.flags.reefComplete = true;
      this.game.quests.complete('bluey');
    }

    this.cameraLerp.x = lerp(this.cameraLerp.x, this.game.state.player.x, 0.12);
    this.cameraLerp.y = lerp(this.cameraLerp.y, this.game.state.player.y, 0.12);
  }

  handleInteract() {
    const player = this.game.state.player;
    const npcs = this.getNPCsForCurrentMap();
    const npc = npcs.find((actor) => actor.isNear(player.x, player.y, 1.2));
    if (npc) {
      this.interactNPC(npc.def);
      return;
    }

    const pickup = this.getPickupsForCurrentMap().find((item) => distance(item.x, item.y, player.x, player.y) <= 1.05 && (!item.hidden || this.game.state.upgrades.scanner));
    if (pickup) {
      this.collectPickup(pickup);
      return;
    }

    const interaction = this.getInteractionsForCurrentMap().find((item) => distance(item.x, item.y, player.x, player.y) <= item.radius + 0.15);
    if (interaction) {
      this.interactObject(interaction);
      return;
    }

    this.game.ui.showToast('Nothing useful in reach except Alan’s heroic posture.');
  }

  collectPickup(pickup) {
    this.game.state.world.picked[pickup.id] = true;
    if (pickup.kind === 'quest' && pickup.id === 'lostBadge') {
      this.game.state.world.flags.badgeRecovered = true;
      this.game.ui.showToast('Recovered: facility badge. Authority restored.');
      if (this.game.state.quests.morning.status === 'active' && this.game.state.quests.morning.step === 1) this.game.quests.advance('morning');
    }
    if (pickup.kind === 'resource') {
      this.game.state.inventory.hay += 1;
      this.game.ui.showToast(`Collected hay (${this.game.state.inventory.hay} / 3).`);
    }
    if (pickup.kind === 'collectible') {
      this.game.state.inventory.memos.push(pickup.label);
      this.game.unlockAchievement(`Found memo ${this.game.state.inventory.memos.length}`);
      this.game.ui.showToast(`Collectible found: ${pickup.label}`);
    }
    if (pickup.kind === 'scan') {
      this.game.state.world.scanned[pickup.id] = true;
      const count = Object.keys(this.game.state.world.scanned).length;
      this.game.ui.showToast(`Scanner ping ${count} / 3.`);
      if (count >= 3 && this.game.state.quests.rats.status === 'active' && this.game.state.quests.rats.step === 1) this.game.quests.advance('rats');
    }
    if (pickup.kind === 'reef') {
      this.game.state.inventory.shells += 1;
      this.game.ui.showToast(`Shimmer shell ${this.game.state.inventory.shells} / 3.`);
    }
    this.game.audio.playSfx('pickup');
    this.game.save();
  }

  interactObject(interaction) {
    const questState = this.game.state.quests;
    if (interaction.kind === 'portal') {
      const reefQuestOpen = interaction.to === 'reef'
        && this.game.state.quests.bluey.status === 'active'
        && this.game.state.quests.bluey.step === 3;
      if (interaction.requires && !this.game.state.upgrades[interaction.requires] && !reefQuestOpen) {
        this.game.ui.showToast('Something wise and watery suggests you are not ready yet.');
        return;
      }
      this.loadMap(interaction.to, interaction.targetX, interaction.targetY);
      return;
    }

    if (interaction.kind === 'coffee') {
      if (questState.morning.status === 'active' && questState.morning.step === 2) {
        this.game.state.inventory.coffee = 1;
        this.game.audio.playSfx('pickup');
        this.game.ui.showToast('Coffee secured. Handle like it is diplomatic cargo.');
        this.game.save();
      } else {
        this.game.ui.showToast('The coffee hub salutes you. No urgent beverage currently assigned.');
      }
      return;
    }

    if (interaction.kind === 'repair') {
      if ((questState.morning.status === 'active' && questState.morning.step === 4) || (questState.finale.status === 'active' && questState.finale.step === 3)) {
        this.startRepairMiniGame();
      } else {
        this.game.ui.showToast('The console hums politely. It is currently pretending to be stable.');
      }
      return;
    }

    if (interaction.kind === 'drone') {
      if (questState.rats.status === 'active' && questState.rats.step === 3) {
        this.startDroneMiniGame();
      } else {
        this.game.ui.showToast('Vu has left the pad in dramatic readiness.');
      }
      return;
    }

    if (interaction.kind === 'pulse') {
      if (questState.bluey.status === 'active' && questState.bluey.step === 1) {
        this.startPulseMiniGame();
      } else {
        this.game.ui.showToast('The pulse rig is calm. Ross would love to explain why for twelve minutes.');
      }
      return;
    }

    if (interaction.kind === 'backupSwitch') {
      if (questState.finale.status === 'active' && questState.finale.step === 0) {
        this.game.state.world.flags.backupSwitch = true;
        this.game.quests.advance('finale');
        this.startDashMiniGame();
      } else {
        this.game.ui.showToast('Backup system armed. Alan resists the urge to salute it.');
      }
      return;
    }

    if (interaction.kind === 'rest') {
      this.game.state.player.energy = this.game.state.player.maxEnergy;
      this.game.ui.showToast('Alan sits for a quiet minute. Heroism restored.');
      this.game.audio.playSfx('pet');
      this.game.save();
      return;
    }

    if (interaction.kind === 'scannerDock') {
      this.game.state.world.flags.scannerDockSeen = true;
      this.game.ui.showToast(this.game.state.upgrades.scanner ? 'Pocket Scanner charged and smug.' : 'Scanner dock detected. Someday soon.');
    }
  }

  startRepairMiniGame() {
    this.game.minigames.start('repair', {
      onSuccess: () => {
        if (this.game.state.quests.morning.status === 'active' && this.game.state.quests.morning.step === 4) {
          this.game.state.world.flags.imagingFixed = true;
          this.game.quests.advance('morning');
        } else if (this.game.state.quests.finale.status === 'active' && this.game.state.quests.finale.step === 3) {
          this.game.state.world.flags.finaleRepair = true;
          this.game.quests.complete('finale');
          this.game.showEnding();
        }
      },
      onFail: () => this.game.ui.showToast('Repair slipped. The console remains dramatically unconvinced.'),
    });
  }

  startPulseMiniGame() {
    this.game.minigames.start('pulse', {
      onSuccess: () => {
        this.game.state.world.flags.pulseFixed = true;
        this.game.quests.advance('bluey');
      },
      onFail: () => this.game.ui.showToast('Ross says the pulse pattern was “almost elegantly aligned.”'),
    });
  }

  startDroneMiniGame() {
    this.game.minigames.start('drone', {
      onSuccess: () => {
        this.game.state.world.flags.droneWin = true;
        this.game.quests.advance('rats');
      },
      onFail: () => this.game.ui.showToast('The drone survived. Vu calls that a promising rehearsal.'),
    });
  }

  startDashMiniGame() {
    this.game.minigames.start('dash', {
      onSuccess: () => {
        this.game.state.world.flags.crisisCart = true;
        this.game.quests.advance('finale');
      },
      onFail: () => this.game.ui.showToast('Coffee crisis escalated. James believes in a second attempt.'),
    });
  }

  interactNPC(npc) {
    const q = this.game.state.quests;
    const lines = [];
    const say = (speaker, text) => lines.push({ speaker, text });
    const completeDialogue = (after) => this.game.ui.openDialogue(lines, after);

    if (npc.id === 'james') {
      if (q.morning.status === 'available') {
        say('James', 'Alan! Lovely timing. The campus is stable in the technical sense, which is to say briefly.');
        say('Alan', 'That sounded like a quest marker wearing a tie.');
        say('James', 'Correct. Find your badge, rescue Sally’s coffee situation, calm the sheep committee, and help Tony with imaging. Heroic, achievable, lightly absurd.');
        completeDialogue(() => {
          this.game.quests.start('morning');
          this.game.quests.advance('morning');
        });
        return;
      }
      if (q.finale.status === 'available' && this.currentMapKey === 'campus') {
        say('James', 'Small update: the campus power loop is improvising. We need calm, speed, and someone with spectacularly sensible shoes.');
        say('Alan', 'I hate how flattering that is.');
        say('James', 'Start the backup switch in engineering. Then we improvise with confidence.');
        completeDialogue(() => this.game.quests.start('finale'));
        return;
      }
      say('James', pick(DEFAULT_LINES.james));
      completeDialogue();
      return;
    }

    if (npc.id === 'eddy') {
      if (q.rats.status === 'available') {
        say('Eddy', 'Alan, I need an outside eye on something unsettlingly tidy.');
        say('Alan', 'Please do not tell me the rats made a workflow.');
        say('Eddy', 'I cannot. Because that is exactly what happened.');
        say('Eddy', 'Use the scanner, find the reflective tags, then consult Batty. He appears to have leadership energy in this matter.');
        completeDialogue(() => {
          this.game.quests.start('rats');
          this.game.quests.advance('rats');
        });
        return;
      }
      say('Eddy', pick(DEFAULT_LINES.eddy));
      completeDialogue();
      return;
    }

    if (npc.id === 'sally') {
      if (q.morning.status === 'active' && q.morning.step === 2 && this.game.state.inventory.coffee > 0) {
        say('Sally', 'Is that for me? You magnificent logistics comet.');
        say('Alan', 'One stabilized coffee. Please perform science responsibly.');
        say('Sally', 'No promises, but yes.');
        completeDialogue(() => {
          this.game.state.inventory.coffee = 0;
          this.game.state.world.flags.coffeeDelivered = true;
          this.game.quests.advance('morning');
        });
        return;
      }
      say('Sally', pick(DEFAULT_LINES.sally));
      completeDialogue();
      return;
    }

    if (npc.id === 'mel') {
      if (q.morning.status === 'active' && q.morning.step === 3) {
        if (this.game.state.inventory.hay >= 3) {
          say('Mel', 'Perfect. With hay in hand, diplomacy becomes possible.');
          say('Alan', 'I am ready to negotiate with the fluff caucus.');
          say('Mel', 'They respect snacks and sincerity. Luckily you brought both.');
          completeDialogue(() => {
            this.game.state.inventory.hay = 0;
            this.game.state.world.flags.sheepCalmed = true;
            this.game.quests.advance('morning');
          });
        } else {
          say('Mel', `We need 3 hay bundles. Current diplomacy budget: ${this.game.state.inventory.hay}.`);
          completeDialogue();
        }
        return;
      }
      if (q.finale.status === 'active' && q.finale.step === 2) {
        say('Mel', 'The sheep sensed the power wobble and formed a line. Respectfully, iconic.');
        say('Alan', 'How do we get through?');
        say('Mel', 'Stand calm, hold scanner light steady, and acknowledge their concerns.');
        completeDialogue(() => {
          this.game.state.world.flags.sheepFinale = true;
          this.game.quests.advance('finale');
        });
        return;
      }
      say('Mel', pick(DEFAULT_LINES.mel));
      completeDialogue();
      return;
    }

    if (npc.id === 'tony') {
      if (q.morning.status === 'active' && q.morning.step === 4) {
        say('Tony', 'Excellent. The console is only mostly offended. Want to help me charm it back to life?');
        say('Alan', 'That sentence should worry me more than it does.');
        completeDialogue(() => this.startRepairMiniGame());
        return;
      }
      if (q.finale.status === 'active' && q.finale.step === 3) {
        say('Tony', 'Final loop seal. Elegant, swift, and preferably not sparking at eye level.');
        say('Alan', 'Classic endgame language.');
        completeDialogue(() => this.startRepairMiniGame());
        return;
      }
      say('Tony', pick(DEFAULT_LINES.tony));
      completeDialogue();
      return;
    }

    if (npc.id === 'batty') {
      this.game.state.stats.pets += 1;
      this.game.audio.playSfx('pet');
      if (!this.game.state.achievements.includes('Batty Approved')) this.game.unlockAchievement('Batty Approved');
      if (q.rats.status === 'active' && q.rats.step === 2) {
        say('Batty', 'Batty hops onto the windowsill and stares toward the rooftop access door.');
        say('Alan', 'Right. A clue. Very subtle. Thank you, management.');
        completeDialogue(() => {
          this.game.state.world.flags.battyHint = true;
          this.game.quests.advance('rats');
        });
        return;
      }
      say('Batty', pick(DEFAULT_LINES.batty));
      completeDialogue();
      return;
    }

    if (npc.id === 'vu') {
      if (q.rats.status === 'active' && q.rats.step === 3) {
        say('Vu', 'Perfect timing. The inspection drone is stable enough to be funny. Want to prove it can behave?');
        say('Alan', 'I have made worse choices this week. Start it up.');
        completeDialogue(() => this.startDroneMiniGame());
        return;
      }
      say('Vu', pick(DEFAULT_LINES.vu));
      completeDialogue();
      return;
    }

    if (npc.id === 'noah') {
      if (q.rats.status === 'active' && q.rats.step === 4) {
        say('Noah', 'Daddy! We should do either paper planes or a story with the brave turtle captain. Important science choice.');
        completeDialogue(() => {
          this.game.ui.showChoices('Choose a home-time buff:', [
            { label: 'Paper plane practice (+move speed)', value: 'planes' },
            { label: 'Story time (+max energy)', value: 'story' },
          ], (value) => {
            this.game.state.world.flags.noahChoice = value;
            if (value === 'planes') this.game.state.player.moveSpeed = 3.45;
            if (value === 'story') this.game.state.player.maxEnergy = 115;
            this.game.state.player.energy = this.game.state.player.maxEnergy;
            this.game.quests.advance('rats');
          });
        });
        return;
      }
      say('Noah', pick(DEFAULT_LINES.noah));
      completeDialogue();
      return;
    }

    if (npc.id === 'mariko') {
      if (q.bluey.status === 'available') {
        say('Mariko', 'You have “I solved three things and discovered two more” written all over your face.');
        say('Alan', 'Accurate. Also the turtle has become narratively significant.');
        say('Mariko', 'Excellent. Help Ross with the pulse rig, then go see Bluey. I trust the turtle more than the schedule.');
        completeDialogue(() => {
          this.game.state.world.flags.clinicVisited = true;
          this.game.quests.start('bluey');
          this.game.quests.advance('bluey');
        });
        return;
      }
      say('Mariko', pick(DEFAULT_LINES.mariko));
      completeDialogue();
      return;
    }

    if (npc.id === 'ross') {
      if (q.bluey.status === 'active' && q.bluey.step === 1) {
        say('Ross', 'Wonderful, Alan. The pulse rig simply requires a careful alignment of timing, posture, cable respect, and—');
        say('Alan', 'Say no more. I have already heard four more paragraphs approaching.');
        completeDialogue(() => this.startPulseMiniGame());
        return;
      }
      say('Ross', pick(DEFAULT_LINES.ross));
      completeDialogue();
      return;
    }

    if (npc.id === 'bluey') {
      this.game.state.stats.pets += 1;
      this.game.audio.playSfx('pet');
      if (q.bluey.status === 'active' && q.bluey.step === 2) {
        say('Bluey', 'Bluey slowly turns toward the reflection pool.');
        say('Alan', 'Understood. Mysterious turtle business. On it.');
        completeDialogue(() => {
          this.game.state.world.flags.blueyChecked = true;
          this.game.quests.advance('bluey');
        });
        return;
      }
      say('Bluey', pick(DEFAULT_LINES.bluey));
      completeDialogue();
      return;
    }

    const summary = CHARACTER_COMPENDIUM.find((entry) => entry.name.toLowerCase() === npc.name.toLowerCase());
    const pool = DEFAULT_LINES[npc.id] || [summary?.dialogue || `${npc.name} nods supportively.`];
    say(npc.name, pick(pool));
    completeDialogue();
  }

  getObjectiveTarget() {
    const q = this.game.state.quests;
    const target = { map: 'campus', x: this.game.state.player.x, y: this.game.state.player.y, label: 'Explore' };

    if (q.morning.status === 'available') return { map: 'campus', x: 14.5, y: 11.8, label: 'James' };
    if (q.morning.status === 'active') {
      if (q.morning.step === 0) return { map: 'campus', x: 14.5, y: 11.8, label: 'James' };
      if (q.morning.step === 1) return { map: 'campus', x: 8.5, y: 18.2, label: 'Badge' };
      if (q.morning.step === 2) return this.game.state.inventory.coffee > 0
        ? { map: 'campus', x: 21.6, y: 6.5, label: 'Sally' }
        : { map: 'campus', x: 5.5, y: 11.5, label: 'Coffee Hub' };
      if (q.morning.step === 3) return this.game.state.inventory.hay >= 3
        ? { map: 'campus', x: 9.7, y: 2.3, label: 'Mel' }
        : { map: 'campus', x: 11.7, y: 2.2, label: 'Hay' };
      if (q.morning.step === 4) return { map: 'campus', x: 20.8, y: 20.9, label: 'Tony' };
    }

    if (q.rats.status === 'available') return { map: 'campus', x: 19.2, y: 8.8, label: 'Eddy' };
    if (q.rats.status === 'active') {
      if (q.rats.step === 0) return { map: 'campus', x: 19.2, y: 8.8, label: 'Eddy' };
      if (q.rats.step === 1) return { map: 'campus', x: 19.3, y: 16.2, label: 'Tag' };
      if (q.rats.step === 2) return { map: 'home', x: 9.4, y: 3.8, label: 'Batty' };
      if (q.rats.step === 3) return { map: 'rooftop', x: 11.7, y: 4.8, label: 'Drone Pad' };
      if (q.rats.step === 4) return { map: 'home', x: 6.7, y: 7.2, label: 'Noah' };
    }

    if (q.bluey.status === 'available') return { map: 'clinic', x: 10.8, y: 8.6, label: 'Mariko' };
    if (q.bluey.status === 'active') {
      if (q.bluey.step === 0) return { map: 'clinic', x: 10.8, y: 8.6, label: 'Mariko' };
      if (q.bluey.step === 1) return { map: 'clinic', x: 7.0, y: 8.2, label: 'Pulse Rig' };
      if (q.bluey.step === 2) return { map: 'home', x: 3.4, y: 5.9, label: 'Bluey' };
      if (q.bluey.step === 3) return { map: 'reef', x: 4.4, y: 6.2, label: 'Shells' };
    }

    if (q.finale.status === 'available') return { map: 'campus', x: 14.5, y: 11.8, label: 'James' };
    if (q.finale.status === 'active') {
      if (q.finale.step === 0) return { map: 'campus', x: 21.1, y: 23.4, label: 'Backup' };
      if (q.finale.step === 1) return { map: 'campus', x: 21.1, y: 23.4, label: 'Coffee Cart' };
      if (q.finale.step === 2) return { map: 'campus', x: 9.7, y: 2.3, label: 'Mel' };
      if (q.finale.step === 3) return { map: 'campus', x: 23.6, y: 11.3, label: 'Console' };
    }

    return target;
  }

  getGuidance() {
    const target = this.getObjectiveTarget();
    const player = this.game.state.player;
    if (target.map !== this.currentMapKey) {
      if (this.currentMapKey !== 'campus') {
        const returnPortal = this.currentMap.interactions.find((item) => item.kind === 'portal' && item.to === 'campus');
        if (returnPortal) return { x: returnPortal.x, y: returnPortal.y, label: `Exit to campus → ${target.label}` };
      }
      if (this.currentMapKey === 'campus') {
        const portal = this.currentMap.interactions.find((item) => item.kind === 'portal' && item.to === target.map);
        if (portal) return { x: portal.x, y: portal.y, label: `${portal.label}` };
      }
    }
    return target;
  }

  getHUDSnapshot() {
    const tile = this.getCurrentTile();
    const guidance = this.getGuidance();
    const dx = guidance.x - this.game.state.player.x;
    const dy = guidance.y - this.game.state.player.y;
    return {
      location: `${this.currentMap.title} • ${tile.zone.replace(/-/g, ' ')}`,
      chapter: CHAPTERS.find((chapter) => chapter.id === this.game.state.progress.chapter)?.name || 'Free Roam',
      quest: this.game.quests.getCurrentObjectiveText(),
      compass: `${guidance.label} • ${directionLabel(dx, dy)} • ${Math.round(distance(guidance.x, guidance.y, this.game.state.player.x, this.game.state.player.y))}m`,
      energy: this.game.state.player.energy,
      maxEnergy: this.game.state.player.maxEnergy,
      energyRatio: this.game.state.player.energy / this.game.state.player.maxEnergy,
      inventory: [
        { icon: '📋', text: `${this.game.state.inventory.memos.length} memos` },
        { icon: '🔧', text: `${this.game.quests.getUpgradeList().length} upgrades` },
        { icon: '🐚', text: `${this.game.state.inventory.shells} shells` },
        { icon: '🐾', text: `${this.game.state.stats.pets} pets` },
      ],
      achievements: this.game.state.achievements.slice(-3),
    };
  }

  render(ctx, width, height) {
    const player = this.game.state.player;
    const focus = isoProject(this.cameraLerp.x, this.cameraLerp.y, this.tileW, this.tileH, 0, 0);
    this.viewCenter.x = width * 0.5;
    this.viewCenter.y = height * 0.3;

    const bgTop = this.currentMapKey === 'reef' ? '#10355e' : this.currentMapKey === 'home' ? '#53324c' : '#18263b';
    const bgBottom = this.currentMapKey === 'reef' ? '#1f79a8' : this.currentMapKey === 'home' ? '#131722' : '#345f7c';
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, bgTop);
    gradient.addColorStop(1, bgBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    this.renderParticles(ctx, width, height);

    const toScreen = (wx, wy, extraY = 0) => {
      const point = isoProject(wx, wy, this.tileW, this.tileH, 0, 0);
      return {
        x: point.x - focus.x + this.viewCenter.x,
        y: point.y - focus.y + this.viewCenter.y + extraY,
      };
    };

    for (let y = 0; y < this.currentMap.height; y += 1) {
      for (let x = 0; x < this.currentMap.width; x += 1) {
        const tile = this.currentMap.grid[y][x];
        const screen = toScreen(x, y);
        this.drawTile(ctx, screen.x, screen.y, TILE_COLORS[tile.ground] || TILE_COLORS.grass);
      }
    }

    const renderables = [];

    this.currentMap.props.forEach((prop) => renderables.push({ sort: prop.y + prop.d, type: 'prop', data: prop }));
    this.getPickupsForCurrentMap().forEach((pickup) => {
      if (pickup.hidden && !this.game.state.upgrades.scanner) return;
      renderables.push({ sort: pickup.y + 0.1, type: 'pickup', data: pickup });
    });
    this.getNPCsForCurrentMap().forEach((npc) => renderables.push({ sort: npc.y, type: 'npc', data: npc.def }));
    renderables.push({ sort: player.y + 0.2, type: 'player', data: player });
    renderables.sort((a, b) => a.sort - b.sort);

    renderables.forEach((entry) => {
      if (entry.type === 'prop') {
        const prop = entry.data;
        const screen = toScreen(prop.x, prop.y);
        this.drawProp(ctx, screen.x, screen.y, prop, toScreen);
      }
      if (entry.type === 'pickup') {
        const pickup = entry.data;
        const screen = toScreen(pickup.x, pickup.y, -10 + Math.sin(performance.now() / 280 + pickup.x) * 4);
        this.drawPickup(ctx, screen.x, screen.y, pickup);
      }
      if (entry.type === 'npc') {
        const npc = entry.data;
        const screen = toScreen(npc.x, npc.y - 0.05);
        const objective = this.getObjectiveTarget().label;
        this.drawCharacter(ctx, screen.x, screen.y, npc.color, npc.name, npc.portrait, npc.quest && objective.toLowerCase().includes(npc.name.toLowerCase()));
      }
      if (entry.type === 'player') {
        const screen = toScreen(player.x, player.y - 0.08 + Math.sin(this.player.bob) * 0.03);
        this.drawCharacter(ctx, screen.x, screen.y, '#5ff0cc', 'Alan', '🩺', false, true);
      }
    });

    if (this.game.state.progress.hardMode) {
      ctx.fillStyle = 'rgba(255, 90, 90, 0.18)';
      ctx.fillRect(0, 0, width, height);
    }
  }

  renderParticles(ctx, width, height) {
    this.particles.forEach((particle) => {
      const px = particle.x * width + Math.sin(particle.phase) * 16;
      const py = particle.y * height;
      ctx.fillStyle = this.currentMapKey === 'reef' ? 'rgba(193, 244, 255, 0.28)' : 'rgba(255,255,255,0.14)';
      ctx.beginPath();
      ctx.arc(px, py, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawTile(ctx, x, y, colors) {
    const w = this.tileW;
    const h = this.tileH;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w / 2, y + h / 2);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x - w / 2, y + h / 2);
    ctx.closePath();
    ctx.fillStyle = colors.top;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x - w / 2, y + h / 2);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + h + 10);
    ctx.lineTo(x - w / 2, y + h / 2 + 10);
    ctx.closePath();
    ctx.fillStyle = colors.left;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h / 2);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + h + 10);
    ctx.lineTo(x + w / 2, y + h / 2 + 10);
    ctx.closePath();
    ctx.fillStyle = colors.right;
    ctx.fill();
  }

  drawProp(ctx, x, y, prop, toScreen) {
    const width = prop.w * this.tileW * 0.5;
    const depth = prop.d * this.tileH * 0.5;
    const height = prop.h * 42;
    const end = toScreen(prop.x + prop.w - 0.02, prop.y + prop.d - 0.02);
    const left = x - prop.d * this.tileW * 0.5;
    const right = end.x + this.tileW * 0.5;
    const topY = y - height;
    const baseY = end.y + this.tileH;

    ctx.fillStyle = prop.color;
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(end.x, topY + (prop.w + prop.d - 2) * this.tileH * 0.5);
    ctx.lineTo(right, baseY - height);
    ctx.lineTo(x + prop.w * this.tileW * 0.5, y + prop.w * this.tileH * 0.5 - height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = prop.roof || '#f2f5fb';
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x + prop.w * this.tileW * 0.5, y + prop.w * this.tileH * 0.5 - height);
    ctx.lineTo(right, baseY - height);
    ctx.lineTo(end.x, topY + (prop.w + prop.d - 2) * this.tileH * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse((left + right) / 2, baseY + 8, Math.max(22, width * 0.72), Math.max(10, depth * 0.38), 0, 0, Math.PI * 2);
    ctx.fill();

    if (prop.label) {
      ctx.fillStyle = 'rgba(15, 23, 38, 0.85)';
      ctx.beginPath();
      ctx.roundRect((left + right) / 2 - 66, topY - 30, 132, 22, 10);
      ctx.fill();
      ctx.fillStyle = '#eef5ff';
      ctx.font = '600 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(prop.label, (left + right) / 2, topY - 14);
    }
  }

  drawPickup(ctx, x, y, pickup) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + 28, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = pickup.color;
    ctx.beginPath();
    ctx.arc(x, y + 8, pickup.kind === 'collectible' ? 14 : 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#09162d';
    ctx.font = '700 12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(pickup.kind === 'collectible' ? '!' : pickup.kind === 'reef' ? '🐚' : pickup.kind === 'scan' ? '◉' : '•', x, y + 13);
  }

  drawCharacter(ctx, x, y, color, name, portrait, objective = false, player = false) {
    ctx.fillStyle = 'rgba(0,0,0,0.26)';
    ctx.beginPath();
    ctx.ellipse(x, y + 28, 24, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y + 6, player ? 18 : 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f6fbff';
    ctx.fillRect(x - 12, y + 15, 24, 22);
    ctx.fillStyle = '#122544';
    ctx.font = '16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(portrait, x, y + 11);

    ctx.fillStyle = 'rgba(15, 22, 38, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x - 50, y - 30, 100, 22, 10);
    ctx.fill();
    ctx.fillStyle = '#eff6ff';
    ctx.font = '600 12px system-ui';
    ctx.fillText(name, x, y - 14);

    if (objective) {
      ctx.fillStyle = '#ffe67a';
      ctx.beginPath();
      ctx.arc(x + 32, y - 20 + Math.sin(performance.now() / 180) * 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1d253b';
      ctx.font = 'bold 11px system-ui';
      ctx.fillText('!', x + 32, y - 16);
    }
  }
}
