import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { GlobalFonts, Image, SKRSContext2D, createCanvas, loadImage } from '@napi-rs/canvas';
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

export const flip = (frame: Image, width: number, height: number): Promise<Buffer> => {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(frame, 0, 0);

  return canvas.encode('png');
};

const downloadModPiece = async (name: string) => {
  const base = 'https://cdn.warframestat.us/genesis/modFrames';
  const image = await fetch(`${base}/${name}`);
  const blob = await image.blob();

  return Buffer.from(await blob.arrayBuffer());
};

const fetchModPiece = async (name: string) => {
  if (existsSync(join(assetPath, name))) readFileSync(join(assetPath, name));

  const image = await downloadModPiece(name);

  if (!existsSync(assetPath)) mkdirSync(assetPath, { recursive: true });
  writeFileSync(join(assetPath, name), image);

  return loadImage(image);
};

export interface ModFrame {
  top: Image;
  sideLights: Image;
  bottom: Image;
  cornerLights: Image;
  rankSlotActive: Image;
  rankSlotEmpy: Image;
  rankCompleted: Image;
}

export const getFrame = async (tier: string): Promise<ModFrame> => {
  return {
    cornerLights: await fetchModPiece(`${tier}CornerLights.png`),
    bottom: await fetchModPiece(`${tier}FrameBottom.png`),
    top: await fetchModPiece(`${tier}FrameTop.png`),
    sideLights: await fetchModPiece(`${tier}SideLight.png`),
    rankSlotActive: await fetchModPiece('RankSlotActive.png'),
    rankSlotEmpy: await fetchModPiece('RankSlotEmpty.png'),
    rankCompleted: await fetchModPiece('RankCompleteLine.png'),
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
    background: await fetchModPiece(background),
    backer: await fetchModPiece(backer),
    lowerTab: await fetchModPiece(lowerTab),
  };
};

export const fetchPolarity = async (polarity: string): Promise<Image> => {
  if (existsSync(join(assetPath, polarity))) readFileSync(join(assetPath, polarity));

  const base = 'https://cdn.warframestat.us/genesis/img/polarities';
  const res = await fetch(`${base}/${polarity}.png`);
  const image = Buffer.from(await (await res.blob()).arrayBuffer());

  if (!existsSync(assetPath)) mkdirSync(assetPath, { recursive: true });
  writeFileSync(join(assetPath, `${polarity}.png`), image);

  return loadImage(image);
};

export const modDescription = (
  description: string | undefined,
  levelStats: LevelStat[] | undefined,
  rank: number
): string | undefined => {
  if (description && description.length !== 0) return description;

  if (levelStats && levelStats[rank]) {
    const { stats } = levelStats[rank];

    let desc = '';
    for (let i = 0; i < stats.length; i += 1) {
      desc = desc.concat(`${stats[i]} \n`);
    }

    return desc;
  }
};

export const wrapText = (context: SKRSContext2D, text: string, maxWidth: number): string[] => {
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

export const registerFonts = () => {
  const fontPath = join('.', 'assets', 'fonts');
  GlobalFonts.registerFromPath(join(fontPath, 'Khula-Light.ttf'), 'Khula');
  GlobalFonts.registerFromPath(join(fontPath, 'Khula-Regular.ttf'), 'Khula');
  GlobalFonts.registerFromPath(join(fontPath, 'Khula-SemiBold.ttf'), 'Khula');
  GlobalFonts.registerFromPath(join(fontPath, 'Khula-Bold.ttf'), 'Khula');
  GlobalFonts.registerFromPath(join(fontPath, 'Khula-ExtraBold.ttf'), 'Khula');
};
