import { createCanvas } from '@napi-rs/canvas';
import type { Mod } from 'warframe-items';

import { backgroundImage, bottomImage, horizantalPad, verticalPad } from './drawers.js';
import {
  type CanvasOutput,
  exportCanvas,
  getBackground,
  getFrame,
  getTier,
  modRarityMap,
  registerFonts,
} from './utils.js';

/**
 * Generates a complete mod image
 *
 * Supported types:
 *  - common
 *  - uncommon
 *  - gold
 *  - primed
 *  - rivens
 *
 * None supported mod types will default to using common as it's frame
 *
 * Notes:
 *  - Archon mods will use the gold mod frame
 * @param {Mod} mod The Mod to build the image on
 * @param {CanvasOutput} output The image format to export as (png, webp, avif, jpeg)
 * @param {number | undefined} rank The rank the mod would be at. Can be empty to show unranked
 * @param {string | undefined} image Optional thumbnail to show instead of the mod default thumbnail (Good for memes)
 * @returns {Promise<Buffer<ArrayBufferLike> | undefined>}
 */
const generate = async (
  mod: Mod,
  output: CanvasOutput = { format: 'png' },
  rank?: number,
  image?: string
): Promise<Buffer<ArrayBufferLike> | undefined> => {
  // All values here should be percentages based on the background size and NOT on the canvas size.
  // The reason for this is that special mod pieces have a bigger width then the base 256 width of the background,
  // so the canvas has to be big enough to keep those parts in view.
  const tier = getTier(mod);
  const isRiven = tier === modRarityMap.riven;

  const canvas = createCanvas(isRiven ? 292 : 256, 512);
  const context = canvas.getContext('2d');

  const { background, backer, lowerTab } = await getBackground(tier);
  const { cornerLights, bottom, top, sideLights } = await getFrame(tier);

  const centerX = (canvas.width - background.width) / 2;
  const centerY = (canvas.height - background.height) / 2;

  registerFonts();

  const backgroundGen = await backgroundImage({
    background,
    sideLights,
    backer,
    lowerTab,
    bottom: { width: bottom.width, height: bottom.height },
    mod,
    rank,
    image,
  });
  context.drawImage(backgroundGen, centerX, centerY);

  if (top.width > background.width) {
    const newXPadding = horizantalPad * 6;
    const widthDiff = top.width - background.width - newXPadding;
    context.drawImage(top, -widthDiff / 2, background.height * 0.14);
  } else {
    context.drawImage(top, centerX, background.height * 0.14);
  }

  if (bottom.width > background.width) {
    const newXPadding = horizantalPad * 6;
    const widthDiff = bottom.width - background.width - newXPadding;
    context.drawImage(
      await bottomImage({
        bottom,
        cornerLights,
        tier,
        max: mod.fusionLimit,
        rank,
      }),
      -widthDiff / 2,
      background.height * 0.65
    );
  } else {
    context.drawImage(
      await bottomImage({
        bottom,
        cornerLights,
        tier,
        max: mod.fusionLimit,
        rank,
      }),
      centerX,
      background.height * 0.65
    );
  }

  const outterCanvas = createCanvas(isRiven ? 292 : 256, 512 - verticalPad);
  const outterContext = outterCanvas.getContext('2d');

  outterContext.drawImage(canvas, (outterCanvas.width - canvas.width) / 2, (outterCanvas.height - canvas.height) / 2);

  return exportCanvas(outterCanvas, output);
};

export default generate;
