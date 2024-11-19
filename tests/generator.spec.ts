import * as assert from 'node:assert';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { readdir, writeFile } from 'node:fs/promises';

import { describe, test } from 'mocha';
import { Mod } from 'warframe-items';
import { find } from 'warframe-items/utilities';

import { generateMod } from '../src/generator.js';
import { Format } from '../src/utils.js';

describe('Generate a mod', () => {
  test('run test', () => {
    const formats = ['webp', 'jpeg', 'avif', 'png'];
    const mods = [
      '/Lotus/Upgrades/Mods/Warframe/Kahl/KahlAvatarAbilityStrengthMod',
      '/Lotus/Upgrades/Mods/Warframe/AvatarAbilityEfficiencyMod',
      '/Lotus/Upgrades/Mods/Warframe/AvatarHealthMaxMod',
      '/Lotus/Upgrades/Mods/Aura/PlayerMeleeAuraMod',
      '/Lotus/Upgrades/Mods/Randomized/LotusArchgunRandomModRare',
      '/Lotus/Powersuits/Dragon/DragonBreathAugmentCard',
    ];

    const testPath = join('.', 'assets', 'tests');
    if (!existsSync(testPath)) mkdirSync(testPath, { recursive: true });

    for (let i = 0; i < mods.length; i += 1) {
      formats.forEach((format) => {
        return async () => {
          const imagePath = join(testPath, format);
          if (!existsSync(imagePath)) mkdirSync(imagePath, { recursive: true });

          const mod = find.findItem(mods[i]) as Mod;
          if (!mod) return;
          const modCanvas = await generateMod(mod, undefined, { format: format as Format });
          if (!modCanvas) assert.equal(true, false, 'Failed to generate mod');

          if (modCanvas) await writeFile(join(imagePath, `${mod.name}.${format}`), modCanvas);
        };
      });
    }

    formats.forEach((format) => {
      return async () => {
        const testFiles = await readdir(join(testPath, format));
        assert.equal(testFiles.length, mods.length);
      };
    });
  });
});
