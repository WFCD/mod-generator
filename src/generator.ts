import { createCanvas, loadImage } from '@napi-rs/canvas';
import { Mod, RivenMod } from 'warframe-items';

import { CommonFrameParams, drawBackground, drawFrame, drawLegendaryFrame } from './drawers.js';
import { flip, getBackground, getFrame, modRarityMap } from './utils.js';

interface CanvasSize {
  width: number;
  height: number;
}

export const generateBasicMod = async (mod: Mod, rank: number): Promise<Buffer> => {
  const { width, height }: CanvasSize = { width: 256, height: 512 };
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  const tier = modRarityMap[mod.rarity?.toLocaleLowerCase() ?? 'common'];

  const background = await drawBackground(mod, width, height, rank);
  context.drawImage(await loadImage(background), 0, 0);

  const commonFrameParams: CommonFrameParams = { tier, currentRank: rank, maxRank: mod.fusionLimit, width, height };
  let frame = await drawFrame(commonFrameParams);
  if (tier === 'Legendary') {
    frame = await drawLegendaryFrame(commonFrameParams);
  }
  context.drawImage(await loadImage(frame), 0, 0);

  const outterCanvas = createCanvas(width, 370);
  const outterContext = outterCanvas.getContext('2d');

  const image = await canvas.encode('png');
  outterContext.drawImage(await loadImage(image), 0, -80);

  return outterCanvas.encode('png');
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

  if (riven.compatName) context.fillText(riven.compatName, 125 + magicCenter, 396);

  const frame = await getFrame(tier);
  context.drawImage(frame.top, magicCenter - 10, 70);
  context.drawImage(frame.sideLights, 249, 120);

  let flipped = await flip(frame.sideLights, 16 + magicCenter, 256);
  context.drawImage(await loadImage(flipped), 2, 120);
  context.drawImage(frame.bottom, 8 - magicCenter, 340);

  context.drawImage(frame.cornerLights, 205 + magicCenter, 380);
  flipped = await flip(frame.cornerLights, 64, 64);
  context.drawImage(await loadImage(flipped), 0, 380);

  return canvas.encode('png');
};
