import { QUEST_DEFS, UPGRADES } from '../data/gameData.js';

export class QuestManager {
  constructor(game) {
    this.game = game;
    this.defs = QUEST_DEFS;
  }

  get(id) {
    return this.game.state.quests[id];
  }

  getDef(id) {
    return this.defs[id];
  }

  unlock(id) {
    const quest = this.get(id);
    if (quest && quest.status === 'locked') {
      quest.status = 'available';
      quest.step = 0;
      this.game.ui.showToast(`New quest: ${this.getDef(id).title}`);
      this.game.audio.playSfx('quest');
    }
  }

  start(id) {
    const quest = this.get(id);
    if (!quest) return;
    quest.status = 'active';
    quest.step = 0;
    this.game.ui.showToast(`Started: ${this.getDef(id).title}`);
    this.game.audio.playSfx('quest');
    this.game.save();
  }

  advance(id) {
    const quest = this.get(id);
    const def = this.getDef(id);
    if (!quest || quest.status !== 'active') return;
    quest.step += 1;
    this.game.state.stats.tasksCompleted += 1;
    if (quest.step >= def.steps.length) {
      this.complete(id);
      return;
    }
    this.game.ui.showToast(`Objective updated: ${def.steps[quest.step]}`);
    this.game.audio.playSfx('quest');
    this.game.save();
  }

  complete(id) {
    const quest = this.get(id);
    const def = this.getDef(id);
    if (!quest) return;
    quest.status = 'complete';
    this.game.ui.showToast(`${def.title} complete!`, 3.5);
    this.game.audio.playSfx('quest');

    if (id === 'morning') {
      this.game.state.upgrades.scanner = true;
      this.game.state.progress.chapter = 2;
      this.game.state.progress.dayLabel = 'Day 2';
      this.unlock('rats');
      this.game.unlockAchievement('Pocket Scanner');
      this.game.ui.showChapter('Day 2 — The Rats Have Procedure', def.rewardText);
    }
    if (id === 'rats') {
      this.game.state.upgrades.dronePass = true;
      this.game.state.upgrades.snackPouch = true;
      this.game.state.progress.chapter = 3;
      this.game.state.progress.dayLabel = 'Evening';
      this.unlock('bluey');
      this.game.unlockAchievement('Drone Licensed-ish');
      this.game.ui.showChapter('Evening — Bluey Protocol', def.rewardText);
    }
    if (id === 'bluey') {
      this.game.state.upgrades.waterproofBoots = true;
      this.game.state.progress.chapter = 4;
      this.game.state.progress.dayLabel = 'Finale';
      this.unlock('finale');
      this.game.state.world.flags.crisisActive = true;
      this.game.unlockAchievement('Bluey Approved');
      this.game.ui.showChapter('Finale — Controlled Chaos', def.rewardText);
    }
    if (id === 'finale') {
      this.game.state.progress.endingSeen = true;
      this.game.state.progress.hardMode = true;
      this.game.state.upgrades.hardMode = true;
      this.game.unlockAchievement('Campus Saved');
      this.game.unlockAchievement('After-Hours Hard Mode');
    }
    this.game.save(true);
  }

  getCurrentObjectiveText() {
    const entries = Object.entries(this.game.state.quests);
    const active = entries.find(([, value]) => value.status === 'active');
    if (!active) {
      const available = entries.find(([, value]) => value.status === 'available');
      if (!available) return 'Free roam. Pet somebody powerful.';
      return this.defs[available[0]].steps[0];
    }
    const [id, quest] = active;
    return this.defs[id].steps[quest.step] || this.defs[id].short;
  }

  getActiveQuestId() {
    const active = Object.entries(this.game.state.quests).find(([, value]) => value.status === 'active');
    if (active) return active[0];
    const available = Object.entries(this.game.state.quests).find(([, value]) => value.status === 'available');
    return available?.[0] || null;
  }

  getUpgradeList() {
    return Object.values(UPGRADES).filter((upgrade) => this.game.state.upgrades[upgrade.id]);
  }
}
