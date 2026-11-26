import type { ModAssetNames, TextOptions } from './types';

export const lineHeight = 18;
export const defaultFontFamily = 'Roboto';
export const modSetProgressHeight = 12;

export const titleTextOptions: TextOptions = {
  size: 20,
  fontWeight: 400,
  scale: 4,
};
export const descriptionTextOptions: TextOptions = {
  size: 16,
  fontWeight: 'normal',
  scale: titleTextOptions.scale * 2,
};
export const comatTextOptions: TextOptions = {
  size: 16,
  fontWeight: 500,
  scale: titleTextOptions.scale,
};

export const drainTextOptions: TextOptions = {
  size: 16,
  fontWeight: 500,
  scale: descriptionTextOptions.scale,
};

type UniquenameType = {
  [key: string]: string;
};

export const modRarityMap: UniquenameType = {
  common: 'Bronze',
  uncommon: 'Silver',
  rare: 'Gold',
  legendary: 'Legendary',
  riven: 'Omega',
};

export const tierColor: UniquenameType = {
  Bronze: '#CA9A87',
  Silver: '#DFDFDF',
  Gold: '#FEEBC1',
  Omega: '#AC83D5',
};

export const modHeaders: UniquenameType = {};

export const modTypes: { [key: string]: ModAssetNames } = {
  bronze: {
    background: 'BronzeBackground',
    backer: 'BronzeTopRightBacker',
    frameTop: 'BronzeFrameTop',
    frameBottom: 'BronzeFrameBottom',
    compatTab: 'BronzeLowerTab',
    sideLights: 'BronzeSideLight',
    cornerLights: 'BronzeCornerLights',
  },
  silver: {
    background: 'SilverBackground',
    backer: 'SilverTopRightBacker',
    frameTop: 'SilverFrameTop',
    frameBottom: 'SilverFrameBottom',
    compatTab: 'SilverLowerTab',
    sideLights: 'SilverSideLight',
    cornerLights: 'SilverCornerLights',
  },
  gold: {
    background: 'GoldBackground',
    backer: 'GoldTopRightBacker',
    frameTop: 'GoldFrameTop',
    frameBottom: 'GoldFrameBottom',
    compatTab: 'GoldLowerTab',
    sideLights: 'GoldSideLight',
    cornerLights: 'GoldCornerLights',
  },
  legendary: {
    background: 'LegendaryBackground',
    backer: 'LegendaryTopRightBacker',
    frameTop: 'LegendaryFrameTop',
    frameBottom: 'LegendaryFrameBottom',
    compatTab: 'LegendaryLowerTab',
    sideLights: 'LegendarySideLight',
    cornerLights: 'LegendaryCornerLights',
  },
  omega: {
    background: 'SilverBackground',
    backer: 'RivenTopRightBacker',
    frameTop: 'OmegaFrameTop',
    frameBottom: 'OmegaFrameBottom',
    compatTab: 'RivenLowerTab',
    sideLights: 'OmegaSideLight',
    cornerLights: 'OmegaCornerLights',
    equippedLight: 'OmegaEquippedLight',
  },
  amalgam: {
    background: 'AmalgamBackground',
    backer: 'SilverTopRightBacker',
    frameTop: 'AmalgamFrameTop',
    frameBottom: 'AmalgamFrameBottom',
    compatTab: 'SilverLowerTab',
    sideLights: 'AmalgamSideLight',
    cornerLights: 'AmalgamCornerLights',
  },
  peculiar: {
    background: 'LegendaryBackground',
    backer: 'LegendaryTopRightBacker',
    frameTop: 'PeculiarFrameTop',
    frameBottom: 'PeculiarFrameBottom',
    compatTab: 'LegendaryLowerTab',
    sideLights: 'PeculiarSideSmoke',
    cornerLights: 'PeculiarCornerLights',
  },
  galvanized: {
    background: '',
    backer: '',
    frameTop: '',
    frameBottom: '',
    compatTab: '',
    sideLights: '',
    cornerLights: '',
  },
  avionice_bronze: {
    background: 'BronzeBackground',
    backer: 'BronzeTopRightBacker',
    frameTop: 'AvionicBronzeFrameTop',
    frameBottom: 'AvionicBronzeFrameBottom',
    compatTab: 'BronzeLowerTab',
    sideLights: 'BronzeSideLight',
    cornerLights: 'BronzeCornerLights',
  },
  avionice_silver: {
    background: 'SilverBackground',
    backer: 'SilverTopRightBacker',
    frameTop: 'AvionicSilverFrameTop',
    frameBottom: 'AvionicSilverFrameBottom',
    compatTab: 'SilverLowerTab',
    sideLights: 'SilverSideLight',
    cornerLights: 'SIlverCornerLights',
  },
  avionice_gold: {
    background: 'GoldBackground',
    backer: 'GoldTopRightBacker',
    frameTop: 'AvionicGoldFrameTop',
    frameBottom: 'AvionicGoldFrameBottom',
    compatTab: 'GoldLowerTab',
    sideLights: 'GoldSideLight',
    cornerLights: 'GoldCornerLights',
  },
};
