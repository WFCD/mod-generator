import { writeFileSync, readdirSync } from "node:fs";
import { describe, test } from "mocha";
import { join } from "node:path";
import { RivenMod, Mod } from "warframe-items";
import { find } from "warframe-items/utilities";
import { generateBasicMod, generateRivenMod } from "../src/generator.js";
import * as assert from "node:assert";

describe("Generate a mod", () => {
  test("run test", async () => {
    const mods = [
      "/Lotus/Upgrades/Mods/Warframe/Kahl/KahlAvatarAbilityStrengthMod",
      "/Lotus/Upgrades/Mods/Warframe/AvatarAbilityEfficiencyMod",
      "/Lotus/Upgrades/Mods/Warframe/AvatarHealthMaxMod",
      "/Lotus/Upgrades/Mods/Aura/PlayerMeleeAuraMod",
      "/Lotus/Upgrades/Mods/Randomized/LotusArchgunRandomModRare",
    ];

    for (let i = 0; i < mods.length; i++) {
      const mod = find.findItem(mods[i]);
      if (!mod) continue;
      const isRiven = mod.name?.includes("Riven");
      const modCanvas = isRiven
        ? await generateRivenMod(mod as RivenMod)
        : await generateBasicMod(mod as Mod, 1);
      if (!modCanvas) console.log("failed");

      writeFileSync(
        join(".", "assets/tests", `${mod.name}.png`),
        modCanvas,
      );
    }
    const testFiles = readdirSync(join(".", "assets/tests"));
    assert.equal(testFiles.length, mods.length);
  });
});
