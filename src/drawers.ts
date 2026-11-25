import type { ModSet } from '@wfcd/items';
import { find } from '@wfcd/items/utilities';
import { Canvas, type CanvasRenderingContext2D, type Image, ImageData, loadImage } from 'skia-canvas';

import {
  comatTextOptions,
  defaultFontFamily,
  descriptionTextOptions,
  drainTextOptions,
  lineHeight,
  modRarityMap,
  titleTextOptions,
} from './styling.js';
import type {
  BackerProperties,
  BackgroundProps,
  BottomFrameProps,
  CompatTabProps,
  FrameProperties,
  TextOptions,
  TopFrameProps,
} from './types.js';
import {
  getTier,
  hexToRGB,
  modDescription,
  modTextHeight,
  shadePixel,
  textColor,
  tintPixel,
  wrapText,
} from './utils.js';

export const verticalPad = 70;
export const padding = 8;

const drawPolarity = async (tier: string, polarity: Image): Promise<Canvas> => {
  const size = 32;
  const canvas = new Canvas(size, size);
  const context = canvas.getContext('2d');

  context.drawImage(polarity, 0, 0);

  context.globalCompositeOperation = 'source-in';

  context.fillStyle = textColor(tier);
  context.fillRect(0, 0, size, size);

  return canvas;
};

export const tintImage = async (image: Image, tier: string): Promise<Canvas> => {
  const canvas = new Canvas(image.width, image.height);
  const context = canvas.getContext('2d');

  context.drawImage(image, 0, 0);

  const { data } = context.getImageData(0, 0, image.width, image.height);
  const color = hexToRGB(textColor(tier));

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 0) {
      let pixel = { r: data[i], g: data[i + 1], b: data[i + 2] };
      pixel = tintPixel(pixel, color, 0.8);

      data[i] = pixel.r;
      data[i + 1] = pixel.g;
      data[i + 2] = pixel.b;
    }
  }

  context.putImageData(new ImageData(data, image.width, image.height), 0, 0);

  return canvas;
};

/**
 * Darkens the given image
 * @param image Image to darken
 * @returns
 */
export const shadeImage = async (image: Image): Promise<Canvas> => {
  const canvas = new Canvas(image.width, image.height);
  const context = canvas.getContext('2d');

  context.drawImage(image, 0, 0);

  const { data } = context.getImageData(0, 0, image.width, image.height);

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 0) {
      let pixel = { r: data[i], g: data[i + 1], b: data[i + 2] };
      pixel = shadePixel(pixel, 0.7);

      data[i] = pixel.r;
      data[i + 1] = pixel.g;
      data[i + 2] = pixel.b;
    }
  }

  context.putImageData(new ImageData(data, image.width, image.height), 0, 0);

  return canvas;
};

/**
 * Creates a backer image with polarity and drain.
 *
 * - Final drain is based on the `rank`
 * - `rank` starting in the negatives will add a `+` before the drain
 * - Universal polarities will default to `??`
 * - Vieled Riven mods will use their in-game behavior and use `???`
 * @param {BackerInfo} props Props used when creating backer image
 * @returns {Promise<Image>}
 */
export const backerImage = async (props: BackerProperties): Promise<Canvas> => {
  const { backer, tier, baseDrain, polarityName, polarity, rank } = props;
  const canvas = new Canvas(backer.width, backer.height);
  const context = canvas.getContext('2d');

  context.drawImage(backer, 0, 0);

  context.font = 'bold 14px "Roboto"';
  context.fillStyle = textColor(tier);

  const drainHeight = canvas.height * 0.55;
  if (tier === modRarityMap.riven) {
    context.fillText('???', canvas.width * 0.4, drainHeight);
    return canvas;
  }

  if (polarityName === 'universal') {
    // Rivens don't have a universal polarity. The polarity is just random and shows up after it gets unvieled
    context.fillText('??', canvas.width * 0.6, canvas.height * 0.7);
  } else {
    // Draw Polarity into a 16x16 box
    context.drawImage(await drawPolarity(tier, polarity), canvas.width * 0.6, canvas.height * 0.2, 16, 16);
  }

  const drain = `${baseDrain < 0 ? '+' : ''}${Math.abs(baseDrain) + (rank ?? 0)}`;
  if (drain.length >= 2) {
    drawText(context, `${drain}`, canvas.width * 0.2, drainHeight, tier, drainTextOptions);
  } else {
    drawText(context, `${drain}`, canvas.width * 0.4, drainHeight, tier, drainTextOptions);
  }

  return canvas;
};

/**
 * Creates a compatibility name tab
 * @param {CompatTabProps} props Props used in creating the lower tab
 * @returns {Promise<Image>}
 */
export const compatNameTab = async (props: CompatTabProps): Promise<Canvas> => {
  const { tier, compat, compatTab } = props;
  const canvas = new Canvas(compatTab.width, compatTab.height);
  const context = canvas.getContext('2d');

  context.drawImage(compatTab, 0, 0);
  drawText(context, compat.toUpperCase(), canvas.width * 0.5, canvas.height * 0.55, tier, comatTextOptions);

  return canvas;
};

/**
 * Draws a mod background complete with thumbnail, text, and sidelights.
 * @param {BackerInfo} backgroundProps Props used in create the background image
 * @returns {Promise<Image>}
 */
export const drawBackground = async (backgroundProps: BackgroundProps): Promise<Canvas> => {
  const { mod, rank, imagePath } = backgroundProps;
  const { background, compatTab, frameBottom } = backgroundProps.assets;

  let setBonus = backgroundProps.setBonus ?? 0;
  const tier = getTier(mod);
  const canvas = new Canvas(background.width, background.height);
  const context = canvas.getContext('2d');
  context.textRendering = 'geometricPrecision';

  context.drawImage(background, 0, 0);

  const maxWidth = background.width * 0.85;
  const description = modDescription(rank, mod.description, mod.levelStats);

  const modSetProgressHeight = 12;
  let modSet: ModSet | undefined;
  if (mod.modSet) {
    modSet = find.findItem(mod.modSet) as ModSet;
    setBonus = Math.min(setBonus, modSet.numUpgradesInSet - 1);
  }

  const textHeight = modTextHeight(lineHeight, maxWidth, mod.name, description, modSet?.stats[setBonus]);

  // Track Y after image is drawn to know where to start drawing the text
  let position = canvas.height * 0.17;
  if (imagePath || mod.imageName) {
    const thumb = await loadImage(imagePath ?? `https://cdn.warframestat.us/img/${mod.imageName}`);
    const thumbWidth = canvas.width - padding * 2;
    const thumbHeight = thumb.height - textHeight;

    const ratio = Math.min(thumbWidth / thumb.width, thumbHeight / thumb.height);
    const dw = thumbWidth;
    const dh = thumb.height * ratio;
    const dx = padding + (thumbWidth - dw) / 2;
    const dy = position + (thumbHeight - dh) / 2;

    context.imageSmoothingQuality = 'high';
    context.drawImage(thumb, dx, dy, thumbWidth, thumbHeight);

    // context.drawImage(thumb, 0, 0, thumbWidth, thumbHeight, horizontalPad, position, thumbWidth, thumbHeight);
    position += thumbHeight;
  }

  position = drawText(context, mod.name, canvas.width * 0.5, position + padding * 2.5, tier, titleTextOptions).y;
  if (description) {
    position += padding; // Just a little padding between the name and description
    position = drawText(context, description ?? '', canvas.width * 0.5, position, tier, descriptionTextOptions).y;
  }

  if (modSet) {
    const stats = Math.min(setBonus, modSet.stats.length - 1);
    const y = position - padding * 2;
    const segment = { width: canvas.width * 0.12, height: modSetProgressHeight };
    const color = textColor(tier);
    context.fillStyle = '#CA9A8766';
    context.strokeStyle = color;

    let x = canvas.width / modSet.stats.length;
    for (let i = 0; i < modSet.stats.length; i++) {
      // default to negative to imply disabled
      const bonus = setBonus - 1;
      if (bonus < i) {
        context.strokeRect(x, y, segment.width, segment.height);
      } else {
        context.strokeRect(x, y, segment.width, segment.height);
        context.fillRect(x, y, segment.width, segment.height);
      }

      x += segment.width - 1;
    }

    position = y + segment.height + padding * 2;
    position = drawText(context, modSet.stats[stats], canvas.width * 0.5, position, tier, descriptionTextOptions).y;
  }

  if (mod.compatName) {
    // DE has this sitting right on top of the bottom piece but it bothers me
    const padding = tier === modRarityMap.riven ? 16 : 8;
    const assembledCompatTab = await compatNameTab({ compatTab, tier, compat: mod.compatName });
    context.drawCanvas(assembledCompatTab, background.width * 0.09, background.height - frameBottom.height - padding);
  }

  return canvas;
};

export const drawTopFrame = async (props: TopFrameProps): Promise<Canvas> => {
  const { frameTop, header, tier } = props;
  const canvas = new Canvas(frameTop.width, frameTop.height);
  const context = canvas.getContext('2d');

  context.drawImage(frameTop, 0, 0);

  if (header) {
    const tintedHeader = await tintImage(header, tier);

    context.drawImage(
      tintedHeader,
      frameTop.width * 0.3,
      frameTop.height * 0.13,
      header.width * 0.8,
      header.height * 0.8
    );
  }

  return canvas;
};

/**
 * Creates the lower frame piece of a mod with inactive/active rank slots up to the `max` rank
 *
 * - if no `rank` is given the default is inactive slots up to `max`
 * - if `rank` equals `max` a `RankCompleteLine` will be drawn across the slots
 * @param {BottomFrameProps} props Props used in the creation of the lower frame
 * @returns {Promise<Image>}
 */
export const drawBottomFrame = async (tier: string, props: BottomFrameProps): Promise<Canvas> => {
  const { max, rank } = props;
  const { frameBottom, cornerLights, rankSlotEmpy, rankCompleted, rankSlotActive } = props.assets;

  const canvas = new Canvas(frameBottom.width, frameBottom.height);
  const context = canvas.getContext('2d');

  context.drawImage(frameBottom, 0, 0);

  if (tier === modRarityMap.riven) {
    const cornerLightsHeight = canvas.height * 0.27;

    context.drawImage(cornerLights.left, canvas.width * 0.04, cornerLightsHeight);
    context.drawImage(cornerLights.right, canvas.width * 0.73, cornerLightsHeight);
  } else if (tier === modRarityMap.legendary) {
    const cornerLightsHeight = canvas.height * 0.32;

    context.drawImage(cornerLights.left, -(canvas.width * 0.01), cornerLightsHeight);
    context.drawImage(cornerLights.right, canvas.width * 0.76, cornerLightsHeight);
  } else {
    const cornerLightsHeight = canvas.height * 0.24;

    context.drawImage(cornerLights.left, -(canvas.width * 0.01), cornerLightsHeight);
    context.drawImage(cornerLights.right, canvas.width * 0.76, cornerLightsHeight);
  }

  const isRare = tier === modRarityMap.riven || tier === modRarityMap.legendary;
  const slotLineHeight = isRare ? canvas.height * 0.84 : canvas.height * 0.74;
  const slotHeight = isRare ? canvas.height * 0.82 : canvas.height * 0.72;

  // At the time of writing I saw /Lotus/Upgrades/Mods/Randomized/LotusArchgunRandomModRare with a fusionLimit of 32756
  const maxRank = Math.min(10, max);
  if (rank === maxRank) context.drawImage(rankCompleted, 0, slotLineHeight);

  let rankSlotStart = canvas.width * 0.29;
  if (maxRank <= 3) rankSlotStart = canvas.width * 0.425;
  if (maxRank <= 5 && maxRank >= 4) rankSlotStart = canvas.width * 0.39;

  for (let i = 0; i < maxRank; i += 1) {
    const slot = i < (rank ?? 0) ? rankSlotActive : rankSlotEmpy;
    context.drawImage(slot, rankSlotStart, slotHeight);
    rankSlotStart += 11;
  }

  return canvas;
};

export const drawFrame = async (props: FrameProperties): Promise<Canvas> => {
  const { width: backgroundWidth, height: backgroundHeight } = props.canvasProps.background;
  const canvas = new Canvas(backgroundWidth, backgroundHeight);
  const context = canvas.getContext('2d');

  const assets = props.assets;
  const backer = await backerImage({
    baseDrain: props.baseDrain,
    tier: props.tier,
    polarityName: props.polarity,
    polarity: props.assets.polarity,
    backer: props.assets.backer,
  });

  const topFrame = await drawTopFrame({
    frameTop: assets.frameTop,
    tier: props.tier,
  });

  const lowerFrame = await drawBottomFrame(props.tier, {
    assets,
    rank: props.rank,
    max: props.maxRank,
  });

  context.drawImage(backer, backgroundWidth * 0.8, backgroundHeight * 0.18);

  const sideLightsY = backgroundHeight * 0.21;
  context.drawImage(assets.sideLights.left, 0, sideLightsY);
  context.drawImage(assets.sideLights.right, canvas.width * 0.93, sideLightsY);

  const topOfBackground = backgroundHeight * 0.14;
  if (topFrame.width > backgroundWidth) {
    const widthDiff = topFrame.width - backgroundWidth;
    context.drawImage(topFrame, -widthDiff / 2, topOfBackground);
  } else {
    context.drawImage(topFrame, props.canvasProps.centerX, topOfBackground);
  }

  if (lowerFrame.width > backgroundWidth) {
    const widthDiff = lowerFrame.width - backgroundWidth;
    context.drawImage(lowerFrame, -widthDiff / 2, backgroundHeight * 0.65);
  } else {
    context.drawImage(lowerFrame, props.canvasProps.centerX, backgroundHeight * 0.65);
  }

  return canvas;
};

export const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tier: string,
  textOptions: TextOptions
): { x: number; y: number } => {
  const { width, height } = ctx.canvas;
  const { scale, fontWeight, size } = textOptions;
  const hi = new Canvas(width * scale, height * scale);
  const h = hi.getContext('2d');
  h.font = `${fontWeight} ${size * scale}px ${defaultFontFamily}`;
  h.fillStyle = textColor(tier);
  h.textAlign = 'center';
  h.textBaseline = 'middle';
  h.shadowBlur = 25;
  h.shadowOffsetX = 12;
  h.shadowOffsetY = 12;
  h.shadowColor = 'black';
  h.textWrap = true;

  // wrapText expects unscaled units and applies `scale` itself
  const maxWidth = hi.width * 0.85;
  const lines = wrapText(text, textOptions, maxWidth);

  lines.forEach((line, i) => {
    h.fillText(line, x * scale, (y + i * lineHeight) * scale);
  });

  ctx.drawCanvas(hi, 0, 0, width, height);

  return { x, y: y + lines.length * lineHeight };
};
