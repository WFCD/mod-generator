import * as assert from 'node:assert';
import { existsSync, mkdirSync } from 'node:fs';
import { readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { Mod } from '@wfcd/items';
import { find } from '@wfcd/items/utilities';
import { describe, test } from 'mocha';

import generate, { generateCollapsed } from '../src/generator.js';
import type { Format } from '../src/types.js';

describe('Generate a mod', () => {
  test('run test', async () => {
    const formats: Format[] = ['webp', 'jpeg', 'png'];
    const mods = [
      '/Lotus/Upgrades/Mods/Randomized/LotusArchgunRandomModRare',
      '/Lotus/Powersuits/Dragon/DragonBreathAugmentCard',
      '/Lotus/Upgrades/Mods/Warframe/Expert/AvatarPowerMaxModExpert',
      '/Lotus/Upgrades/Mods/Sets/Augur/WarframeAugurMessageMod',
      '/Lotus/Upgrades/Mods/DualSource/Rifle/ArgonakDaggerMod',
      '/Lotus/Upgrades/Mods/Aura/PlayerMeleeAuraMod',
    ];

    const testPath = join('.', 'assets', 'tests');
    if (!existsSync(testPath)) mkdirSync(testPath, { recursive: true });

    for (let i = 0; i < mods.length; i += 1) {
      await Promise.all(
        formats.map(async (format) => {
          const imagePath = join(testPath, format);
          if (!existsSync(imagePath)) mkdirSync(imagePath, { recursive: true });

          const mod = find.findItem(mods[i]) as Mod;
          const modFull = await generate({ mod, rank: mod.fusionLimit, setBonus: 6, output: format });
          const modMin = await generateCollapsed({ mod, rank: mod.fusionLimit, output: format });
          assert.ok(modFull);

          if (modFull) await writeFile(join(imagePath, `${mod.name.replaceAll(' ', '_')}.${format}`), modFull);
          if (modMin) await writeFile(join(imagePath, `${mod.name.replaceAll(' ', '_')}_collpased.${format}`), modMin);
        })
      );
    }

    await Promise.all(
      formats.map(async (format) => {
        const testFiles = await readdir(join(testPath, format));
        assert.equal(testFiles.length, mods.length * 2);
      })
    );
  });
});
