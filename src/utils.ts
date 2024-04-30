import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { CanvasRenderingContext2D, createCanvas, Image, loadImage } from 'canvas';
import { LevelStat } from 'warframe-items';

const assetPath = join('.', 'assets', 'modFrames');

type RarityType = {
  [key: string]: string;
};

export const modRarityMap: RarityType = {
  common: 'Bronze',
  uncommon: 'Silver',
  rare: 'Gold',
  legendary: 'Legendary',
  riven: 'Omega',
};

export const flip = (frame: Image, width: number, height: number): Buffer => {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(frame, 0, 0);

  return canvas.toBuffer();
};

export interface ModFrame {
  top: Image;
  sideLights: Image;
  bottom: Image;
  cornerLights: Image;
}

const downloadModPiece = async (name: string) => {
  const base = 'https://cdn.warframestat.us/genesis/modFrames';
  const image = await fetch(`${base}/${name}`);
  const blob = await image.blob();

  return Buffer.from(await blob.arrayBuffer());
};

const fetchImage = async (name: string) => {
  if (existsSync(join(assetPath, name))) readFileSync(join(assetPath, name));

  const image = await downloadModPiece(name);

  if (!existsSync(assetPath)) mkdirSync(assetPath, { recursive: true });
  writeFileSync(join(assetPath, name), image);

  return loadImage(image);
};

export const getFrame = async (tier: string): Promise<ModFrame> => {
  return {
    cornerLights: await fetchImage(`${tier}CornerLights.png`),
    bottom: await fetchImage(`${tier}FrameBottom.png`),
    top: await fetchImage(`${tier}FrameTop.png`),
    sideLights: await fetchImage(`${tier}SideLight.png`),
  };
};

// backer is drawn under the frame and over the thumbnail.
// So we want to draw at the same time we draw the background
export interface ModBackground {
  background: Image;
  backer: Image;
  lowerTab: Image;
}

export const getBackground = async (tier: string): Promise<ModBackground> => {
  const isRiven = tier === 'Omega';

  const background = isRiven ? 'LegendaryBackground.png' : `${tier}Background.png`;

  const backer = isRiven ? 'RivenTopRightBacker.png' : `${tier}TopRightBacker.png`;

  const lowerTab = isRiven ? 'RivenLowerTab.png' : `${tier}LowerTab.png`;

  return {
    background: await fetchImage(background),
    backer: await fetchImage(backer),
    lowerTab: await fetchImage(lowerTab),
  };
};

export const modDescription = (
  description: string | undefined,
  levelStats: LevelStat[] | undefined,
  rank: number
): string | undefined => {
  if (description && description.length !== 0) return description;

  if (levelStats) {
    const { stats } = levelStats[rank];

    let desc = '';
    for (let i = 0; i < stats.length; i += 1) {
      desc = desc.concat(`${stats[i]} \n`);
    }

    return desc;
  }
};

export const wrapText = (context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  let currentLine = '';
  const lines = [];

  words.forEach((word) => {
    const testLine = `${currentLine} ${word}`;
    const testLineWidth = context.measureText(testLine).width;

    if (testLineWidth > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  lines.push(currentLine);
  return lines;
};
