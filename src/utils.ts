import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import {
  type AvifConfig,
  type Canvas,
  createCanvas,
  GlobalFonts,
  type Image,
  loadImage,
  type SKRSContext2D,
} from '@napi-rs/canvas';
import type { LevelStat, Mod } from '@wfcd/items';

import { descriptionFont, modRarityMap, tierColor, titleFont } from './styling';

const assetPath = join('.', 'genesis-assets');

export const getTier = (mod: Mod) => {
  if (mod.type.includes('Riven')) return modRarityMap.riven;
  if (mod.name.includes('Archon')) return modRarityMap.rare;

  return modRarityMap[mod.rarity?.toLocaleLowerCase() ?? 'common'];
};

export const flip = async (image: Image): Promise<Image> => {
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext('2d');

  context.translate(image.width, 0);
  context.scale(-1, 1);
  context.drawImage(image, 0, 0);

  return loadImage(await canvas.encode('png'));
};

export const fetchModPiece = async (name: string) => {
  const filePath = join(assetPath, 'modFrames', name);
  const image = await readFile(filePath);

  return loadImage(image);
};

export const fetchHeader = async (modSet: string): Promise<Image> => {
  const name = modSet.split('/').reverse()[1]; // i.e /Lotus/Upgrades/Mods/Sets/Strain/StrainSetMod = Strain
  return fetchModPiece(`${name}Header.png`);
};

export interface ModFrame {
  top: Image;
  sideLights: Image;
  bottom: Image;
  cornerLights: Image;
}

export const getFrame = async (tier: string): Promise<ModFrame> => {
  return {
    cornerLights: await fetchModPiece(`${tier}CornerLights.png`),
    bottom: await fetchModPiece(`${tier}FrameBottom.png`),
    top: await fetchModPiece(`${tier}FrameTop.png`),
    sideLights: await fetchModPiece(`${tier}SideLight.png`),
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
  const filePath = join(assetPath, 'img', 'polarities', `${polarity}.png`);
  const image = await readFile(filePath);

  return loadImage(image);
};

export const modDescription = (
  rank: number = 0,
  description?: string | undefined,
  levelStats?: LevelStat[] | undefined
): string | undefined => {
  if (description && description.length !== 0) return description;

  if (levelStats?.[rank]) {
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
    const line = `${currentLine} ${word}`;
    const lineWidth = context.measureText(line).width;

    if (lineWidth > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = line;
    }
  });

  lines.push(currentLine);
  return lines;
};

export const registerFonts = () => {
  const nameAlies = 'Roboto';
  const require = createRequire(import.meta.url);
  const fontPath = join(
    require.resolve('@fontsource-variable/roboto'),
    '../../files/roboto-latin-wght-normal.woff2'
  );
  if (!GlobalFonts.has(nameAlies)) GlobalFonts.registerFromPath(fontPath, nameAlies);
};

export const textColor = (tier: string) => {
  if (tier === 'Legendary') return tierColor.Silver;

  return tierColor[tier];
};

export type Format = 'webp' | 'jpeg' | 'avif' | 'png';

export interface CanvasOutput {
  quality?: number;
  format: Format;
  cfg?: AvifConfig;
}

export const exportCanvas = async (canvas: Canvas, output: CanvasOutput = { format: 'png' }) => {
  const quality = output.quality || 100;

  try {
    switch (output.format) {
      case 'png':
        return await canvas.encode('png');
      case 'webp':
        return await canvas.encode('webp', quality);
      case 'jpeg':
        return await canvas.encode('jpeg', quality);
      case 'avif':
        return await canvas.encode('avif', output.cfg ?? { quality: 0 });
    }
  } catch {
    throw Error(`failed to export canvas as ${output.format}`);
  }
};

export const textHeight = (context: SKRSContext2D, maxWidth: number, title?: string, lines?: string[]): number => {
  const tempFont = context.font;
  const bottomLineSpacing = 15;

  context.font = titleFont;

  let titleMetrics: TextMetrics;
  if (title) titleMetrics = context.measureText(title);

  let height = !title ? 0 : titleMetrics!.actualBoundingBoxAscent + titleMetrics!.actualBoundingBoxDescent;

  context.font = descriptionFont;
  if (lines) {
    lines.forEach((line) => {
      const text = wrapText(context, line, maxWidth);
      text.forEach((t) => {
        const metrics = context.measureText(t);
        height += metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      });
    });
  }

  context.font = tempFont;
  return height + bottomLineSpacing;
};

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export const hexToRGB = (hex: string): RGB => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return { r, g, b };
};

// https://medium.com/@carlosabpreciado/adding-tint-shade-dynamically-to-a-color-with-javascript-or-any-language-fa5b51ef5777
export const shadePixel = (pixel: RGB, percentage: number): RGB => {
  const redShade = Math.round(Math.max(0, pixel.r - pixel.r * percentage));
  const greenShade = Math.round(Math.max(0, pixel.g - pixel.g * percentage));
  const blueShade = Math.round(Math.max(0, pixel.b - pixel.b * percentage));

  return { r: redShade, g: greenShade, b: blueShade };
};

export const tintPixel = (pixel: RGB, tint: RGB, percentage: number = 0.8): RGB => {
  const maxColors = 255;

  // Adjust these values to control darkness
  const originalWeight = 0.2;
  const brightness = (pixel.r + pixel.g + pixel.b) / 3 / maxColors;

  const tintedRed = Math.min(maxColors, pixel.r * originalWeight + tint.r * brightness * percentage);
  const tintedGreen = Math.min(maxColors, pixel.g * originalWeight + tint.g * brightness * percentage);
  const tintedBlue = Math.min(maxColors, pixel.b * originalWeight + tint.b * brightness * percentage);

  return { r: tintedRed, g: tintedGreen, b: tintedBlue };
};
