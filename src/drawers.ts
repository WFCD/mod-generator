import { SKRSContext2D, createCanvas, loadImage } from '@napi-rs/canvas';
import { Mod } from 'warframe-items';

import {
  fetchPolarity,
  flip,
  getBackground,
  getFrame,
  modDescription,
  modRarityMap,
  registerFonts,
  wrapText,
} from './utils.js';

const drawCommonFrame = async (tier: string, width: number, height: number) => {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  const frame = await getFrame(tier);

  context.drawImage(frame.top, 0, 70);
  context.drawImage(frame.bottom, 0, 340);

  // side lights
  context.drawImage(frame.sideLights, 238, 120);
  const flipped = await flip(frame.sideLights, 16, 256);
  context.drawImage(await loadImage(flipped), 2, 120);
  return { context, frame, canvas };
};

export const drawLegendaryFrame = async (tier: string, width: number, height: number): Promise<Buffer> => {
  const { context, frame, canvas } = await drawCommonFrame(tier, width, height);

  // corner lights
  context.drawImage(frame.cornerLights, 200, 380);
  const flipped = await flip(frame.cornerLights, 64, 64);
  context.drawImage(await loadImage(flipped), -5, 380);

  return canvas.encode('png');
};

export const drawFrame = async (tier: string, width: number, height: number): Promise<Buffer> => {
  const { context, frame, canvas } = await drawCommonFrame(tier, width, height);

  // corner lights
  context.drawImage(frame.cornerLights, 200, 375);
  const flipped = await flip(frame.cornerLights, 16, 256);
  context.drawImage(await loadImage(flipped), -5, 375);

  return canvas.encode('png');
};

export interface DrawBackground {
  tier: string;
  thumbnail: string | undefined;
  name: string;
  description: string;
  compatName: string | undefined;
}

export const drawText = (
  context: SKRSContext2D,
  name: string,
  description: string | undefined,
  compatName: string | undefined
) => {
  registerFonts();
  const x = 125;

  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = 'bold 18px "Khula"';
  context.fillText(name, x, 280);

  if (description) {
    context.font = '400 12px "Khula"';
    let start = 300;
    const lines = description.split('\n');

    lines.forEach((line) => {
      const texts = wrapText(context, line, 207);
      texts.forEach((text) => {
        context.fillText(text, x, start);
        start += 15;
      });
    });
  }

  if (compatName) {
    context.font = '600 12px "Khula"';
    context.fillText(compatName, 125, 404);
  }
};

export const drawBackground = async (mod: Mod, width: number, height: number, rank: number = 0): Promise<Buffer> => {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  const tier = modRarityMap[mod.rarity?.toLocaleLowerCase() ?? 'common'];
  const surface = await getBackground(tier);

  context.drawImage(surface.background, 0, 0);
  context.drawImage(surface.lowerTab, 23, 390);
  if (mod.imageName) {
    const thumb = `https://cdn.warframestat.us/img/${mod.imageName}`;
    context.drawImage(await loadImage(thumb), 0, 0, 239, 180, 10, 90, 239, 170);
  }

  context.drawImage(surface.backer, 205, 95);
  drawText(context, mod.name, modDescription(mod.description, mod.levelStats, rank), mod.compatName);

  if (mod.baseDrain) {
    context.font = '16px "Khula"';
    context.fillText(mod.baseDrain?.toString(), 222, 110);
  }

  context.filter = 'invert(100%)';
  context.drawImage(await fetchPolarity(mod.polarity), 228, 98, 20, 20);

  return canvas.encode('png');
};
