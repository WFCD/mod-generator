import { Image, ImageData, createCanvas, loadImage } from '@napi-rs/canvas';
import Items, { Mod, ModSet } from 'warframe-items';

import { fetchPolarity, fetchModPiece, textColor, wrapText, modDescription, flip, getTier, hexToRgb } from './utils.js';
import { modRarityMap } from './data.js';

export const verticalPad = 70;
export const horizontalPad = 7;

const drawPolarity = async (tier: string, polarity: string): Promise<Image> => {
  const image = await fetchPolarity(polarity);

  const size = 32;
  const canvas = createCanvas(size, size);
  const context = canvas.getContext('2d');

  context.drawImage(image, 0, 0);

  context.globalCompositeOperation = 'source-in';

  context.fillStyle = textColor(tier);
  context.fillRect(0, 0, size, size);

  return loadImage(await canvas.encode('png'));
};

export const drawHeader = async (image: Image, tier: string): Promise<Image> => {
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext('2d');

  context.drawImage(image, 0, 0);

  const { data } = context.getImageData(0, 0, image.width, image.height);
  const color = hexToRgb(textColor(tier));

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 0) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3 / 255;

      // Adjust these values to control darkness
      const originalWeight = 0.2;
      const tintWeight = 0.8;

      data[i] = Math.min(255, data[i] * originalWeight + color.r * brightness * tintWeight);
      data[i + 1] = Math.min(255, data[i + 1] * originalWeight + color.g * brightness * tintWeight);
      data[i + 2] = Math.min(255, data[i + 2] * originalWeight + color.b * brightness * tintWeight);
    }
  }

  context.putImageData(new ImageData(data, image.width, image.height), 0, 0);

  return loadImage(await canvas.encode('png'));
};

/**
 * Props used in creating the image of a backer
 */
interface BackerImageProps {
  backer: Image;
  tier: string;
  base: number;
  polarity: string;
  rank?: number;
}

/**
 * Creates a backer image with polarity and drain.
 *
 * - Final drain is based on the `rank`
 * - `rank` starting in the negatives will add a `+` before the drain
 * - Universal polarities will default to `??`
 * - Vieled Riven mods will use their in-game behavior and use `???`
 * @param {BackerImageProps} props Props used when creating backer image
 * @returns {Promise<Image>}
 */
export const backerImage = async (props: BackerImageProps): Promise<Image> => {
  const { backer, tier, base, polarity, rank } = props;
  const canvas = createCanvas(backer.width, backer.height);
  const context = canvas.getContext('2d');

  context.drawImage(backer, 0, 0);

  context.font = 'bold 14px "Roboto"';
  context.fillStyle = textColor(tier);

  const drainHeight = canvas.height * 0.7;
  if (tier === modRarityMap.riven) {
    context.fillText('???', canvas.width * 0.4, drainHeight);
    return loadImage(await canvas.encode('png'));
  }

  if (polarity === 'universal') {
    // Rivens don't have a universal polarity. The polarity is just random and shows up after it gets unvieled
    context.fillText('??', canvas.width * 0.6, canvas.height * 0.7);
  } else {
    // Draw Polarity into a 16x16 box
    context.drawImage(await drawPolarity(tier, polarity), canvas.width * 0.6, canvas.height * 0.2, 16, 16);
  }

  const drain = `${base < 0 ? '+' : ''}${Math.abs(base) + (rank ?? 0)}`;
  if (drain.length >= 2) {
    context.fillText(`${drain}`, canvas.width * 0.2, drainHeight);
  } else {
    context.fillText(`${drain}`, canvas.width * 0.35, drainHeight);
  }

  return loadImage(await canvas.encode('png'));
};

/**
 * Props used in creating the lower tab
 */
interface LowerTabProps {
  lowerTab: Image;
  tier: string;
  compatName?: string;
}

/**
 * Creates a lower tab (the part that's positioned under the desciption with compat name)
 * @param {LowerTabProps} props Props used in creating the lower tab
 * @returns {Promise<Image>}
 */
export const lowerTabImage = async (props: LowerTabProps): Promise<Image> => {
  const { lowerTab, tier, compatName } = props;
  const canvas = createCanvas(lowerTab.width, lowerTab.height);
  const context = canvas.getContext('2d');

  context.drawImage(lowerTab, 0, 0);

  if (compatName) {
    context.font = '300 16px "Roboto"';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = textColor(tier);

    context.fillText(compatName, canvas.width * 0.5, canvas.height * 0.5);
  }

  return loadImage(await canvas.encode('png'));
};

/**
 * Props used to create the background image
 */
interface BackgroundProps {
  background: Image;
  sideLights: Image;
  backer: Image;
  lowerTab: Image;
  bottom: { width: number; height: number };
  mod: Mod;
  rank?: number;
  setBonus?: number;
  image?: string;
}

/**
 * Draws a mod background complete with thumbnail, text, and sidelights.
 * @param {BackerImageProps} props Props used in create the background image
 * @returns {Promise<Image>}
 */
export const backgroundImage = async (props: BackgroundProps): Promise<Image> => {
  const { background, sideLights, backer, lowerTab, bottom, mod, rank, setBonus, image } = props;
  const tier = getTier(mod);
  const canvas = createCanvas(background.width, background.height);
  const context = canvas.getContext('2d');

  context.drawImage(background, 0, 0);

  if (mod.imageName || image) {
    const thumb = await loadImage(image ?? `https://cdn.warframestat.us/img/${mod.imageName}`);
    const thumbWidth = canvas.width - horizontalPad * 2;
    const thumbHeight = 170;

    context.drawImage(thumb, horizontalPad, canvas.height * 0.17, thumbWidth, thumbHeight);
  }

  const sideLightsY = background.height * 0.21;
  const sideLightsLeft = await flip(sideLights);

  context.drawImage(sideLights, canvas.width * 0.93, sideLightsY);
  context.drawImage(sideLightsLeft, 0, sideLightsY);

  context.drawImage(
    await backerImage({ backer, tier, base: mod.baseDrain, polarity: mod.polarity, rank }),
    background.width * 0.8,
    background.height * 0.2
  );

  // DE has this sitting right on top of the bottom piece but it bothers me
  const padding = tier === modRarityMap.riven ? 16 : 8;
  context.drawImage(
    await lowerTabImage({ lowerTab, tier, compatName: mod.compatName }),
    background.width * 0.09,
    background.height - bottom.height - padding
  );

  context.fillStyle = textColor(tier);
  context.strokeStyle = textColor(tier);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '400 16px "Roboto"';
  context.fillText(mod.name, canvas.width * 0.5, canvas.height * 0.55);

  const textHeight = canvas.width * 0.5;
  const maxWidth = background.width * 0.9;
  const description = modDescription(rank ?? 0, mod.description, mod.levelStats);

  let start = canvas.height * 0.59;
  if (description && description.length > 0) {
    const lines = description.split('\n');

    context.font = '12px "Roboto"';

    lines.forEach((line) => {
      const texts = wrapText(context, line, maxWidth);
      texts.forEach((text) => {
        context.fillText(text, textHeight, start, maxWidth);
        start += 15;
      });
    });
  }

  if (mod.modSet) {
    const items = new Items({ category: ['Mods'] });
    const set = items.find((i) => i.uniqueName === mod.modSet) as ModSet;
    const recWidth = 25;
    const recHeight = 10;

    let startX = canvas.width * 0.16;
    for (let i = 0; i <= set.stats.length; i += 1) {
      const coord = { x: startX, y: start - recHeight - horizontalPad };

      context.strokeRect(coord.x, coord.y, recWidth, recHeight);

      if (setBonus && setBonus >= i) {
        context.fillRect(coord.x, coord.y, recWidth, recHeight);
      }

      startX += recWidth;
    }

    // Add the previous so that the mod set stat isn't ontop of the bonus count
    start += recHeight;
    const stat = setBonus ? setBonus - 1 : 0;
    const lines = modDescription(undefined, set.stats[stat])?.split('\n');
    lines?.forEach((l) => {
      const texts = wrapText(context, l, maxWidth);
      texts.forEach((text) => {
        context.fillText(text, textHeight, start, maxWidth);
        start += 15;
      });
    });
  }

  return loadImage(await canvas.encode('png'));
};

/**
 * Props used to crete bottom image
 */
interface BottomImageProps {
  bottom: Image;
  cornerLights: Image;
  tier: string;
  max: number;
  rank?: number;
}
/**
 * Creates the lower frame piece of a mod with inactive/active rank slots up to the `max` rank
 *
 * - if no `rank` is given the default is inactive slots up to `max`
 * - if `rank` equals `max` a `RankCompleteLine` will be drawn across the slots
 * @param {BottomImageProps} props Props used in the creation of the lower frame
 * @returns {Promise<Image>}
 */
export const bottomImage = async (props: BottomImageProps): Promise<Image> => {
  const { bottom, cornerLights, tier, max, rank } = props;

  const rankSlotEmpy = await fetchModPiece('RankSlotEmpty.png');
  const rankCompleted = await fetchModPiece('RankCompleteLine.png');
  const rankSlotActive = await fetchModPiece('RankSlotActive.png');

  const canvas = createCanvas(bottom.width, bottom.height);
  const context = canvas.getContext('2d');

  context.drawImage(bottom, 0, 0);

  const cornerLightsLeft = await flip(cornerLights);
  if (tier === modRarityMap.riven) {
    const cornerLightsHeight = canvas.height * 0.27;

    context.drawImage(cornerLights, canvas.width * 0.73, cornerLightsHeight);
    context.drawImage(cornerLightsLeft, canvas.width * 0.04, cornerLightsHeight);
  } else if (tier === modRarityMap.legendary) {
    const cornerLightsHeight = canvas.height * 0.32;

    context.drawImage(cornerLights, canvas.width * 0.76, cornerLightsHeight);
    context.drawImage(cornerLightsLeft, -(canvas.width * 0.01), cornerLightsHeight);
  } else {
    const cornerLightsHeight = canvas.height * 0.24;

    context.drawImage(cornerLights, canvas.width * 0.76, cornerLightsHeight);
    context.drawImage(cornerLightsLeft, -(canvas.width * 0.01), cornerLightsHeight);
  }

  const isRare = tier === modRarityMap.riven || tier === modRarityMap.legendary;
  const slotLineHeight = isRare ? canvas.height * 0.84 : canvas.height * 0.74;
  const slotHeight = isRare ? canvas.height * 0.82 : canvas.height * 0.72;

  // At the time of writing I saw /Lotus/Upgrades/Mods/Randomized/LotusArchgunRandomModRare with a fusionLimit of 32756
  const maxRank = max > 10 ? 10 : max;
  if (rank === maxRank) context.drawImage(rankCompleted, 0, slotLineHeight);

  let rankSlotStart = canvas.width * 0.29;
  if (maxRank <= 3) rankSlotStart = canvas.width * 0.43;
  if (maxRank <= 5 && maxRank >= 4) rankSlotStart = canvas.width * 0.39;

  for (let i = 0; i < maxRank; i += 1) {
    const slot = i < (rank ?? 0) ? rankSlotActive : rankSlotEmpy;
    context.drawImage(slot, rankSlotStart, slotHeight);
    rankSlotStart += 11;
  }

  return loadImage(await canvas.encode('png'));
};
