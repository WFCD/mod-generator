import { createCanvas, loadImage } from "canvas";
import { drawImage, drawLegendary, drawNonLegendary, drawText, } from "./drawers.js";
import { flip, getFrameParts, modRarityMap } from "./utils.js";
export async function generateBasicMod(mod, level) {
    const canvas = createCanvas(256, 512);
    const context = canvas.getContext("2d");
    let rarity = modRarityMap[mod.rarity?.toLocaleLowerCase() ?? "common"];
    if (mod.name.includes("Riven"))
        rarity = "Omega";
    const parts = getFrameParts(rarity);
    context.drawImage(await loadImage(parts.background), 0, 0);
    if (mod.imageName) {
        const thumb = await drawImage(`https://cdn.warframestat.us/img/${mod.imageName}`, 239, 200);
        context.drawImage(await loadImage(thumb), 10, 90);
    }
    context.drawImage(await loadImage(parts.top), 0, 70);
    context.drawImage(await loadImage(parts.backer), 205, 95);
    const drawParts = {
        canvas,
        context,
        sideLights: parts.sideLights,
        cornerLights: parts.cornerLights,
        bottom: parts.bottom,
    };
    if (rarity === "Legendary") {
        await drawLegendary(drawParts);
    }
    else {
        await drawNonLegendary(drawParts);
    }
    context.drawImage(await loadImage(parts.tab), 23, 390);
    drawText({
        context,
        name: mod.name,
        description: mod.levelStats[level].stats[0],
        compatName: mod.compatName,
    });
    return canvas.toBuffer();
}
export async function generateRivenMod(riven) {
    const canvas = createCanvas(282, 512);
    const context = canvas.getContext("2d");
    const parts = getFrameParts(modRarityMap["riven"]);
    const magicCenter = 12;
    context.drawImage(await loadImage(parts.background), magicCenter, 0);
    context.drawImage(await loadImage(parts.backer), 205 + magicCenter, 95);
    context.drawImage(await loadImage(parts.top), magicCenter - 10, 70);
    context.drawImage(await loadImage(parts.sideLights), 249, 120);
    let flipped = await flip(await loadImage(parts.sideLights), 16 + magicCenter, 256);
    context.drawImage(await loadImage(flipped), 2, 120);
    context.drawImage(await loadImage(parts.bottom), 8 - magicCenter, 340);
    context.drawImage(await loadImage(parts.cornerLights), 205 + magicCenter, 380);
    flipped = await flip(await loadImage(parts.cornerLights), 64, 64);
    context.drawImage(await loadImage(flipped), 0, 380);
    context.drawImage(await loadImage(parts.tab), 23 + magicCenter, 380);
    const x = 125 + magicCenter;
    context.fillStyle = "white";
    context.textAlign = "center";
    context.fillText(riven.name, x, 300);
    context.fillText(riven.description ?? "", x, 315);
    if (riven.compatName) {
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText(riven.compatName, 125 + magicCenter, 396);
    }
    return canvas.toBuffer();
}
