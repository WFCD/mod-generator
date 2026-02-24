import * as assert from 'node:assert';
import { existsSync, mkdirSync } from 'node:fs';
import { readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, test } from 'mocha';
import type { Mod } from 'warframe-items';
import { find } from 'warframe-items/utilities';

import generate from '../src/generator.js';
import type { Format } from '../src/utils.js';

describe('Generate a mod', () => {
  test('run test', async () => {
    const formats: Format[] = ['webp', 'jpeg', 'png', 'avif'];
    const mods = [
      '/Lotus/Upgrades/Mods/Warframe/Kahl/KahlAvatarAbilityStrengthMod',
      '/Lotus/Upgrades/Mods/Warframe/AvatarAbilityEfficiencyMod',
      '/Lotus/Upgrades/Mods/Warframe/AvatarHealthMaxMod',
      '/Lotus/Upgrades/Mods/Aura/PlayerMeleeAuraMod',
      '/Lotus/Upgrades/Mods/Randomized/LotusArchgunRandomModRare',
      '/Lotus/Powersuits/Dragon/DragonBreathAugmentCard',
      '/Lotus/Upgrades/Mods/Warframe/Expert/AvatarPowerMaxModExpert',
      '/Lotus/Upgrades/Mods/Sets/Augur/WarframeAugurMessageMod',
    ];

    const testPath = join('.', 'assets', 'tests');
    if (!existsSync(testPath)) mkdirSync(testPath, { recursive: true });

    for (let i = 0; i <= mods.length; i += 1) {
      await Promise.all(
        formats.map(async (format) => {
          const imagePath = join(testPath, format);
          if (!existsSync(imagePath)) mkdirSync(imagePath, { recursive: true });

          const mod = find.findItem(mods[i]) as Mod;

          if (!mod) return;
          const modCanvas = await generate({ mod, rank: mod.fusionLimit, output: { format } });
          assert.ok(modCanvas);

          if (modCanvas) await writeFile(join(imagePath, `${mod.name.replaceAll(' ', '_')}.${format}`), modCanvas);
        })
      );
    }

    await Promise.all(
      formats.map(async (format) => {
        const testFiles = await readdir(join(testPath, format));
        assert.equal(testFiles.length, mods.length);
      })
    );
  });
});
