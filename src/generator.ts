import { Canvas, loadImage } from 'skia-canvas';

import { drawBackground, drawBottomFrame, drawFrame, drawText, padding, shadeImage, tintImage } from './drawers';
import { modRarityMap, titleTextOptions } from './styling';
import type { GenerateModProps } from './types';
import * as utils from './utils';

export const generateCollapsed = async (options: GenerateModProps): Promise<Buffer<ArrayBufferLike>> => {
  utils.registerFonts();

  const { mod, output, imagePath } = options;
  const tier = utils.getTier(mod);
  const rank = Math.min(options.rank ?? mod.fusionLimit, mod.fusionLimit, 10);
  const isRiven = tier === modRarityMap.riven;

  const canvas = new Canvas(isRiven ? 292 : 256, 256);
  const context = canvas.getContext('2d');

  const assets = await utils.fetchModAssets(tier, mod.polarity, mod.modSet);
  const { header, frameTop, frameBottom } = assets;

  if (imagePath || mod.imageName) {
    const thumb = await loadImage(imagePath ?? `https://cdn.warframestat.us/img/${mod.imageName}`);
    const thumbWidth = canvas.width - padding * 2;
    const thumbHeight = frameTop.height / 2 + frameBottom.height / 2;
    const shadedImage = await shadeImage(thumb);

    context.drawImage(shadedImage, frameTop.width * 0.03, frameTop.height * 0.3, thumbWidth, thumbHeight);
  }

  drawText(context, mod.name, canvas.width * 0.5, frameBottom.height * 0.65, tier, titleTextOptions);
  context.drawImage(frameTop, 0, 0);

  if (header) {
    const tintedHeader = await tintImage(header, tier);
    context.drawImage(tintedHeader, frameTop.width * 0.35, 0, header.width * 0.6, header.height * 0.6);
  }

  const assembledLowerFrame = await drawBottomFrame(tier, {
    assets,
    max: mod.fusionLimit,
    rank,
  });

  const positionY = frameTop.height * 0.5;
  if (frameBottom.width > canvas.width) {
    const newXPadding = padding * 5;
    const widthDiff = frameBottom.width - canvas.width - newXPadding;
    context.drawImage(assembledLowerFrame, -widthDiff / 2, positionY);
  } else {
    context.drawImage(assembledLowerFrame, 0, positionY);
  }

  const trimmed = utils.trimCanvas(canvas, 10);
  return trimmed.toBufferSync(output ?? 'png');
};

/**
 * Generates a complete mod image
 *
 * Supported types:
 *  - common
 *  - uncommon
 *  - gold
 *  - primed
 *  - rivens
 *  - mod sets
 *
 * None supported mod types will default to using common as it's frame
 *
 * Notes:
 *  - Archon mods will use the gold mod frame
 * @param {GenerateModProps} options Properties to use when creating mod image
 * @returns {Promise<Buffer<ArrayBufferLike>>}
 */
const generate = async (options: GenerateModProps): Promise<Buffer<ArrayBufferLike>> => {
  utils.registerFonts();

  // All values here should be percentages based on the background size and NOT on the canvas size.
  // The reason for this is that special mod pieces have a bigger width then the base 256 width of the background,
  // so the canvas has to be big enough to keep those parts in view.
  const { mod, output, setBonus, imagePath } = options;
  const rank = Math.min(options.rank ?? mod.fusionLimit, mod.fusionLimit, 10);
  const tier = utils.getTier(mod);

  const assets = await utils.fetchModAssets(utils.getTier(mod), mod.polarity, mod.modSet);

  const width = Math.max(assets.background.width, assets.frameTop.width, assets.frameBottom.width);
  const canvas = new Canvas(width, assets.background.height);
  const context = canvas.getContext('2d');

  const modCanvasProps = utils.calCanvasProps(
    { width: canvas.width, height: canvas.height },
    { width: assets.background.width, height: assets.background.height }
  );

  const assembledBackground = await drawBackground({ mod, assets, rank, setBonus, imagePath });
  context.drawCanvas(assembledBackground, modCanvasProps.centerX, modCanvasProps.centerY);

  const frame = await drawFrame({
    baseDrain: mod.baseDrain,
    rank: rank,
    tier,
    polarity: mod.polarity,
    maxRank: mod.fusionLimit,
    canvasProps: modCanvasProps,
    assets,
  });

  if (frame.width > modCanvasProps.background.width) {
    const newXPadding = padding * 6;
    const widthDiff = frame.width - modCanvasProps.background.width - newXPadding;
    context.drawCanvas(frame, -widthDiff / 2, 0);
  } else {
    context.drawCanvas(frame, modCanvasProps.centerX, 0);
  }

  const trimmed = utils.trimCanvas(canvas, 10);
  return trimmed.toBufferSync(output ?? 'png');
};

export default generate;
