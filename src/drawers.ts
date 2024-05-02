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
  textColor,
  wrapText,
} from './utils.js';

export interface CommonFrameParams {
  tier: string;
  currentRank: number;
  maxRank: number;
  width: number;
  height: number;
}

const drawCommonFrame = async (frameParms: CommonFrameParams) => {
  const canvas = createCanvas(frameParms.width, frameParms.height);
  const context = canvas.getContext('2d');
  const frame = await getFrame(frameParms.tier);

  context.drawImage(frame.top, 0, 70);
  context.drawImage(frame.bottom, 0, 340);

  context.drawImage(frame.sideLights, 238, 120);
  const flipped = await flip(frame.sideLights, 16, 256);
  context.drawImage(await loadImage(flipped), 2, 120);
  return { context, frame, canvas };
};

export const drawLegendaryFrame = async (frameParms: CommonFrameParams): Promise<Buffer> => {
  const { context, frame, canvas } = await drawCommonFrame(frameParms);

  context.drawImage(frame.cornerLights, 200, 380);
  const flipped = await flip(frame.cornerLights, 64, 64);
  context.drawImage(await loadImage(flipped), -5, 380);

  if (frameParms.currentRank === frameParms.maxRank) context.drawImage(frame.rankCompleted, 0, 448);

  let rankSlotStart = 50;
  if (frameParms.maxRank <= 3) rankSlotStart *= 2;
  if (frameParms.maxRank <= 5) rankSlotStart += 40;

  for (let i = 0; i < frameParms.maxRank; i += 1) {
    const slot = i < frameParms.currentRank ? frame.rankSlotActive : frame.rankSlotEmpy;
    context.drawImage(slot, rankSlotStart, 445);
    rankSlotStart += 16;
  }

  return canvas.encode('png');
};

export const drawFrame = async (frameParms: CommonFrameParams): Promise<Buffer> => {
  const { context, frame, canvas } = await drawCommonFrame(frameParms);

  // corner lights
  context.drawImage(frame.cornerLights, 200, 375);
  const flipped = await flip(frame.cornerLights, 16, 256);
  context.drawImage(await loadImage(flipped), -5, 375);

  if (frameParms.currentRank === frameParms.maxRank) context.drawImage(frame.rankCompleted, 0, 437);

  let rankSlotStart = 50;
  if (frameParms.maxRank <= 3) rankSlotStart = 100;
  if (frameParms.maxRank <= 5 && frameParms.maxRank >= 4) rankSlotStart += 40;

  for (let i = 0; i < frameParms.maxRank; i += 1) {
    const slot = i < frameParms.currentRank ? frame.rankSlotActive : frame.rankSlotEmpy;
    context.drawImage(slot, rankSlotStart, 435);
    rankSlotStart += 16;
  }

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
  compatName: string | undefined,
  tier: string
) => {
  registerFonts();
  const x = 125;

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = 'bold 14px "DroidSans"';
  context.fillStyle = textColor(tier);
  context.fillText(name, x, 280);

  if (description) {
    context.font = '12px "OpenSans"';
    let start = 300;
    const lines = description.split('\n');

    lines.forEach((line) => {
      const texts = wrapText(context, line, 190);
      texts.forEach((text) => {
        context.fillText(text, x, start, 190);
        start += 15;
      });
    });
  }

  if (compatName) {
    context.font = '12px "OpenSans"';
    context.fillText(compatName, 125, 404);
  }
};

const drawPolarity = async (tier: string, polarity: string): Promise<Buffer> => {
  const size = 32;
  const canvas = createCanvas(size, size);
  const context = canvas.getContext('2d');

  context.drawImage(await fetchPolarity(polarity), 0, 0);

  context.globalCompositeOperation = 'source-in';

  context.fillStyle = textColor(tier);
  context.fillRect(0, 0, size, size);

  return canvas.encode('png');
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
  drawText(context, mod.name, modDescription(mod.description, mod.levelStats, rank), mod.compatName, tier);

  if (mod.baseDrain) {
    context.font = '16px "Khula"';
    context.fillText(mod.baseDrain?.toString(), 222, 108);
  }

  const polarity = await drawPolarity(tier, mod.polarity);
  context.drawImage(await loadImage(polarity), 230, 100, 18, 18);

  return canvas.encode('png');
};
