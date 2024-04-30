import * as assert from 'node:assert';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, test } from 'mocha';
import { Mod, RivenMod } from 'warframe-items';
import { find } from 'warframe-items/utilities';

import { generateBasicMod, generateRivenMod } from '../src/generator.js';

describe('Generate a mod', () => {
  test('run test', async () => {
    const mods = [
      '/Lotus/Upgrades/Mods/Warframe/Kahl/KahlAvatarAbilityStrengthMod',
      '/Lotus/Upgrades/Mods/Warframe/AvatarAbilityEfficiencyMod',
      '/Lotus/Upgrades/Mods/Warframe/AvatarHealthMaxMod',
      '/Lotus/Upgrades/Mods/Aura/PlayerMeleeAuraMod',
      '/Lotus/Upgrades/Mods/Randomized/LotusArchgunRandomModRare',
    ];

    const testPath = join('.', 'assets', 'tests');
    if (!existsSync(testPath)) mkdirSync(testPath);

    for (let i = 0; i < mods.length; i += 1) {
      const mod = find.findItem(mods[i]);
      if (!mod) continue;
      const isRiven = mod.name?.includes('Riven');
      const modCanvas = isRiven ? await generateRivenMod(mod as RivenMod) : await generateBasicMod(mod as Mod, 1);
      if (!modCanvas) assert.equal(true, false, 'Failed to generate mod');

      writeFileSync(join('.', 'assets', 'tests', `${mod.name}.png`), modCanvas);
    }
    const testFiles = readdirSync(join('.', 'assets/tests'));
    assert.equal(testFiles.length, mods.length);
  });
});
