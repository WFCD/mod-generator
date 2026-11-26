import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { LevelStat, Mod } from '@wfcd/items';
import { Canvas, FontLibrary, type Image, loadImage } from 'skia-canvas';

import {
  defaultFontFamily,
  descriptionTextOptions,
  modRarityMap,
  modSetProgressHeight,
  modTypes,
  tierColor,
  titleTextOptions,
} from './styling';
import type { ModAssets, ModCanvasProps, Size, TextOptions } from './types';

const modulePath = join(dirname(fileURLToPath(import.meta.url)), 'genesis-assets', 'img');
const assetPath = existsSync(modulePath) ? modulePath : join('.', 'genesis-assets', 'img');

export const getTier = (mod: Mod) => {
  if (mod.type.includes('Riven')) return modRarityMap.riven;
  if (mod.name.includes('Archon')) return modRarityMap.rare;

  return modRarityMap[mod.rarity?.toLocaleLowerCase() ?? 'common'];
};

export const flip = async (image: Image): Promise<Image> => {
  const canvas = new Canvas(image.width, image.height);
  const context = canvas.getContext('2d');

  context.translate(image.width, 0);
  context.scale(-1, 1);
  context.drawImage(image, 0, 0);

  return loadImage(await canvas.png);
};

export const fetchModPiece = async (name: string) => {
  const filePath = join(assetPath, 'mod_assets', name);
  const image = await readFile(filePath);

  return loadImage(image);
};

export const fetchModAssets = async (tier: string, polarity: string, modSet?: string): Promise<ModAssets> => {
  const header = modSet?.split('/').reverse()[1]; // i.e /Lotus/Upgrades/Mods/Sets/Strain/StrainSetMod = Strain
  const assets = modTypes[tier.toLowerCase()];

  const filePath = join(assetPath, 'polarities', `${polarity}.png`);
  const image = await readFile(filePath);

  const cornerLight = await fetchModPiece(`${assets.cornerLights}.png`);
  const sideLight = await fetchModPiece(`${assets.sideLights}.png`);

  return {
    background: await fetchModPiece(`${assets.background}.png`),
    backer: await fetchModPiece(`${assets.backer}.png`),
    frameTop: await fetchModPiece(`${assets.frameTop}.png`),
    frameBottom: await fetchModPiece(`${assets.frameBottom}.png`),
    cornerLights: { left: await flip(cornerLight), right: cornerLight },
    sideLights: { left: await flip(sideLight), right: sideLight },
    compatTab: await fetchModPiece(`${assets.compatTab}.png`),
    header: header ? await fetchModPiece(`${header}Header.png`) : undefined,
    polarity: await loadImage(image),
    rankSlotEmpy: await fetchModPiece('RankSlotEmpty.png'),
    rankCompleted: await fetchModPiece('RankCompleteLine.png'),
    rankSlotActive: await fetchModPiece('RankSlotActive.png'),
  };
};

export const modDescription = (
  rank: number,
  description?: string | undefined,
  levelStats?: LevelStat[] | undefined
): string | undefined => {
  let desc: string | undefined;
  if (description && description.length !== 0) desc = description;

  if (levelStats?.[rank]) {
    const { stats } = levelStats[rank];

    desc = '';
    for (let i = 0; i < stats.length; i += 1) {
      desc = desc.concat(`${stats[i]}\n`);
    }
  }

  return desc?.replaceAll(/<\w+>|/g, '').replaceAll(/\\n/g, '\n');
};

const createMeasureContext = ({ scale, fontWeight, size }: TextOptions) => {
  const c = new Canvas(1, 1).getContext('2d');
  c.font = `${fontWeight} ${size * scale}px ${defaultFontFamily}`;
  c.textWrap = true; // needed so measureText populates `lines`
  return c;
};

export const wrapText = (text: string, textOptions: TextOptions, maxWidth: number): string[] => {
  const temp = createMeasureContext(textOptions);
  const { lines } = temp.measureText(text, maxWidth);
  return lines.map((line) => text.slice(line.startIndex, line.endIndex).trimEnd());
};

export const textHeight = (text: string, maxWidth: number, textOptions: TextOptions): number => {
  const { scale } = textOptions;
  const temp = createMeasureContext(textOptions);
  temp.textWrap = false;

  const wrapped = wrapText(text, textOptions, maxWidth * scale);
  const total = wrapped.reduce((sum, line) => {
    const metric = temp.measureText(line);
    return sum + metric.actualBoundingBoxAscent + metric.actualBoundingBoxDescent;
  }, 0);

  return total / scale;
};

export const registerFonts = () => {
  const nameAlies = 'Roboto';
  const require = createRequire(import.meta.url);
  const fontPath = join(require.resolve('@fontsource-variable/roboto'), '../files/roboto-latin-wght-normal.woff2');
  if (!FontLibrary.has(nameAlies)) FontLibrary.use(nameAlies, fontPath);
};

export const modTextHeight = (
  padding: number,
  maxWidth: number,
  name: string,
  description?: string,
  modSet?: string
) => {
  const titleHeight = textHeight(name, maxWidth, titleTextOptions);
  const descriptionHeight = description ? textHeight(description, maxWidth, descriptionTextOptions) : 0;
  const mainHeight = titleHeight + descriptionHeight + padding * 2;

  if (modSet) {
    const modSetDescriptionHeight = textHeight(modSet, maxWidth, descriptionTextOptions);
    return mainHeight + modSetProgressHeight + modSetDescriptionHeight - padding;
  }

  return mainHeight;
};

export const textColor = (tier: string) => {
  if (tier === 'Legendary') return tierColor.Silver;

  return tierColor[tier];
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

export const calCanvasProps = (canvasSize: Size, backgroundSize: Size): ModCanvasProps => {
  const x = (canvasSize.width - backgroundSize.width) / 2;
  const y = (canvasSize.height - backgroundSize.height) / 2;
  return { canvas: canvasSize, background: backgroundSize, centerX: x, centerY: y };
};

// MIT http://rem.mit-license.org
export const trimCanvas = (canvas: Canvas, padding: number = 0): Canvas => {
  const context = canvas.getContext('2d');
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;
  const bound: { top?: number; left?: number; right?: number; bottom?: number } = {};

  var i: number, x: number, y: number;

  // Iterate over every pixel to find the highest
  // and where it ends on every axis ()
  for (i = 0; i < data.length; i += 4) {
    if (data[i + 3] !== 0) {
      x = (i / 4) % canvas.width;
      y = ~~(i / 4 / canvas.width);

      if (bound.top === undefined) {
        bound.top = y;
      }

      if (bound.left === undefined) {
        bound.left = x;
      } else if (x < bound.left) {
        bound.left = x;
      }

      if (bound.right === undefined) {
        bound.right = x;
      } else if (bound.right < x) {
        bound.right = x;
      }

      if (bound.bottom === undefined) {
        bound.bottom = y;
      } else if (bound.bottom < y) {
        bound.bottom = y;
      }
    }
  }

  const safeBound = (bound?: number) => bound ?? 0;

  // Calculate the height and width of the content
  const trimHeight = safeBound(bound.bottom) - safeBound(bound.top);
  const trimWidth = safeBound(bound.right) - safeBound(bound.left);
  const trimmed = context.getImageData(safeBound(bound.left), safeBound(bound.top), trimWidth, trimHeight);

  const copy = new Canvas(trimWidth + padding, trimHeight + padding).getContext('2d');
  copy.putImageData(trimmed, padding / 2, padding / 2);

  // Return trimmed canvas
  return copy.canvas;
};
