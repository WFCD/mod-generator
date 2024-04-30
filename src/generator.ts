import { createCanvas, loadImage } from 'canvas';
import { Mod, RivenMod } from 'warframe-items';

import { drawBackground, drawFrame, drawLegendaryFrame } from './drawers.js';
import { flip, getBackground, getFrame, modDescription, modRarityMap } from './utils.js';

interface CanvasSize {
  width: number;
  height: number;
}

export const generateBasicMod = async (mod: Mod, rank: number): Promise<Buffer> => {
  const { width, height }: CanvasSize = { width: 256, height: 512 };
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  let tier = modRarityMap[mod.rarity?.toLocaleLowerCase() ?? 'common'];
  if (mod.name.includes('Riven')) tier = 'Omega';

  const background = await drawBackground(
    {
      tier,
      thumbnail: mod.imageName,
      name: mod.name,
      description: modDescription(mod.description, mod.levelStats, rank) ?? '',
      compatName: mod.compatName,
    },
    width,
    height
  );
  context.drawImage(await loadImage(background), 0, 0);

  let frame = await drawFrame(tier, width, height);
  if (tier === 'Legendary') {
    frame = await drawLegendaryFrame(tier, width, height);
  }
  context.drawImage(await loadImage(frame), 0, 0);

  return canvas.toBuffer();
};

export const generateRivenMod = async (riven: RivenMod): Promise<Buffer> => {
  const canvas = createCanvas(282, 512);
  const context = canvas.getContext('2d');
  const tier = modRarityMap.riven;

  const magicCenter = 12;

  const surface = await getBackground(tier);
  context.drawImage(surface.background, magicCenter, 0);
  if (riven.imageName) {
    const thumb = `https://cdn.warframestat.us/img/${riven.imageName}`;
    context.drawImage(await loadImage(thumb), 10 + magicCenter, 110, 239, 200);
  }

  context.drawImage(surface.backer, 205 + magicCenter, 95);
  context.drawImage(surface.lowerTab, 23 + magicCenter, 380);

  const x = 125 + magicCenter;
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.fillText(riven.name, x, 300);
  context.fillText(riven.description ?? '', x, 315);

  if (riven.compatName) {
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.fillText(riven.compatName, 125 + magicCenter, 396);
  }

  const frame = await getFrame(tier);
  context.drawImage(frame.top, magicCenter - 10, 70);
  context.drawImage(frame.sideLights, 249, 120);

  let flipped = flip(frame.sideLights, 16 + magicCenter, 256);
  context.drawImage(await loadImage(flipped), 2, 120);
  context.drawImage(frame.bottom, 8 - magicCenter, 340);

  context.drawImage(frame.cornerLights, 205 + magicCenter, 380);
  flipped = flip(frame.cornerLights, 64, 64);
  context.drawImage(await loadImage(flipped), 0, 380);

  return canvas.toBuffer();
};
