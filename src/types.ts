import type { Mod } from '@wfcd/items';
import type { ExportFormat, Image } from 'skia-canvas';

export type Format = ExportFormat;

export interface Size {
  width: number;
  height: number;
}

export interface ModCanvasProps {
  canvas: Size;
  background: Size;
  centerX: number;
  centerY: number;
}

export interface SideDecorations {
  left: Image;
  right: Image;
}

export interface ModAssets {
  background: Image;
  backer: Image;
  frameTop: Image;
  frameBottom: Image;
  compatTab: Image;
  header?: Image;
  sideLights: SideDecorations;
  cornerLights: SideDecorations;
  polarity: Image;
  rankSlotEmpy: Image;
  rankCompleted: Image;
  rankSlotActive: Image;
}

export interface ModAssetNames {
  background: string;
  backer: string;
  frameTop: string;
  frameBottom: string;
  compatTab: string;
  header?: string;
  sideLights: string;
  cornerLights: string;
  equippedLight?: string;
}

export interface FrameProperties {
  baseDrain: number;
  rank: number;
  maxRank: number;
  tier: string;
  polarity: string;
  canvasProps: ModCanvasProps;
  assets: ModAssets;
}

/**
 * Props used in creating the image of a backer
 */
export interface BackerProperties {
  baseDrain: number;
  rank?: number;
  tier: string;
  polarityName: string;
  polarity: Image;
  backer: Image;
}

export interface TopFrameProps {
  frameTop: Image;
  header?: Image;
  tier: string;
}

/**
 * Props used to crete bottom image
 */
export interface BottomFrameProps {
  assets: ModAssets;
  max: number;
  rank?: number;
}

/**
 * Props used to create the background image
 */
export interface BackgroundProps {
  mod: Mod;
  assets: ModAssets;
  imagePath?: string;
  rank?: number;
  setBonus?: number;
}

/**
 * Props used in creating the lower tab
 */
export interface CompatTabProps {
  tier: string;
  compat: string;
  compatTab: Image;
}

export interface TextOptions {
  size: number;
  scale: number;
  fontWeight: number | string;
}

export interface GenerateModProps {
  mod: Mod;
  rank?: number;
  setBonus?: number;
  imagePath?: string;
  output?: Format;
}
