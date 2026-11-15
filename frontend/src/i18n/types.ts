import type { ClimateVariable } from '../types/climate.types';

export type Locale = 'en' | 'es';

export interface GlossaryItemCopy {
  term: string;
  definition: string;
  inPlainWords: string;
  caveat?: string;
}

export interface VariableGlossaryCopy {
  tagline: string;
  plain: string;
  whyMatters: string;
  askAbout: string;
  exampleRegionLabel: string;
  unit: string;
}

export interface MilestoneCopy {
  title: string;
  categoryLabel: string;
  summary: string;
  scientificImpact: string;
}

export interface CommonTranslations {
  meta: { pageTitle: string; pageDescription: string };
  header: {
    projectIdentityAria: string;
    domain: string;
    projectName: string;
    edition: string;
    actionsAria: string;
    casesLabel: string;
    casesAria: string;
    casesTitle: string;
    glossaryLabel: string;
    glossaryAria: string;
    glossaryTitle: string;
    investigateLabel: string;
    investigateAria: string;
    investigateTitle: string;
    tourLabel: string;
    tourAria: string;
    tourTitle: string;
    langGroupAria: string;
    langEnAria: string;
    langEsAria: string;
  };
  workspace: {
    dragDesktop: string;
    dragTouch: string;
    guidanceTrend: string;
    guidanceHex: string;
    guidanceSurface: string;
    globeFallback: string;
    globeDegraded: string;
    teleconnectionIllustrative: string;
  };
  context: {
    ariaLabel: string;
    kicker: string;
    activeBadge: string;
    diagramCaption: string;
    variableLabel: string;
    sourceLabel: string;
    unitLabel: string;
  };
  rail: {
    navAria: string;
    indexLabel: string;
    variables: string;
    time: string;
    timeDetail: string;
    scene: string;
    sceneDetail: string;
    locate: string;
    locating: string;
    locateAria: string;
    inspect: string;
    inspectAria: string;
    recenter: string;
    recenterAria: string;
  };
  layers: {
    kickerData: string;
    kickerView: string;
    titleData: string;
    titleView: string;
    closeAria: string;
    tabsAria: string;
    tabData: string;
    tabView: string;
    liveHeading: string;
    matrixSummary: string;
    matrixAria: string;
    readingHeading: string;
    readingAria: string;
    readingAnnual: string;
    readingTrend: string;
    repHeading: string;
    repTitleDisabled: string;
    repAria: string;
    repHex: string;
    repHeat: string;
    repNone: string;
    trendNote: string;
    oceansLabel: string;
    oceansDesc: string;
    variableGroupAria: string;
    magnitudeLabel: string;
    oceanLabel: string;
    oceanDesc: string;
    teleLabel: string;
    teleDesc: string;
    radarLabel: string;
    radarDesc: string;
    satLabel: string;
    satDesc: string;
    motionHeading: string;
    adaptiveLabel: string;
    adaptiveDesc: string;
    autoRotateLabel: string;
    autoRotateDesc: string;
    starsLabel: string;
    starsDesc: string;
    gridLabel: string;
    gridDesc: string;
    visibilityHeading: string;
    atmosphereLabel: string;
    atmosphereDesc: string;
    integratedSummary: string;
    integratedTitle: string;
    integratedAria: string;
    soon: string;
    switchOn: string;
    switchOff: string;
  };
  timeline: {
    navAria: string;
    eyebrow: string;
    selectedYearAria: string;
    adjustYear: string;
    playingSpeed: string;
    selectedState: string;
    selectedProduct: string;
    explorationRange: string;
    currentSpeed: string;
    msPerYr: string;
    transportAria: string;
    prevYearAria: string;
    prevYearTitle: string;
    play: string;
    pause: string;
    playAria: string;
    pauseAria: string;
    playTitle: string;
    pauseTitle: string;
    nextYearAria: string;
    nextYearTitle: string;
    speedAria: string;
    speedTitle: string;
    loopOnAria: string;
    loopOffAria: string;
    loopOnTitle: string;
    loopOffTitle: string;
    resetTo: string;
    closeArchiveAria: string;
    closeArchiveTitle: string;
    milestoneSuffix: string;
    closeMilestoneAria: string;
    satelliteImpact: string;
  };
}

export interface ScienceTranslations {
  variables: Record<ClimateVariable, {
    name: string;
    shortLabel: string;
    unit: string;
    description: string;
    colorScheme: string;
  }>;
  lenses: Record<ClimateVariable, { domain: string; medium: string; focus: string }>;
  scales: Record<ClimateVariable, { unit: string; label: string; ramp: readonly [string, string, string] }>;
  hexPresentation: Record<ClimateVariable, {
    heading: string;
    subject: string;
    increase: string;
    decrease: string;
    explanation: string;
  }>;
  upcomingVariables: Record<string, { name: string; status: string }>;
  scientificOverlays: Record<string, { name: string; status: string }>;
  visualSystemRows: Record<string, { name: string; status: string }>;
  regions: Record<string, { label: string; description: string }>;
  periods: Record<string, { label: string; description: string }>;
  caseRegions: Record<string, string>;
  biomes: Record<string, { biome: string; contextNote: string }>;
  teleconnectionPairs: Record<string, string>;
  teleconnectionRegions: Record<string, string>;
}
