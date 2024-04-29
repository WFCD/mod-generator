import * as fs from "fs";
import { describe, test } from "mocha";
import * as path from "path";
import { find } from "warframe-items/utilities";
import { generateBasicMod, generateRivenMod } from "../src/generator.js";
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
            const isRiven = mod.name.includes("Riven");
            const modCanvas = isRiven
                ? await generateRivenMod(mod)
                : await generateBasicMod(mod, 1);
            if (!modCanvas)
                console.log("failed");
            fs.writeFileSync(path.join(".", "assets", `${mod.name}.png`), modCanvas);
        }
    });
});
