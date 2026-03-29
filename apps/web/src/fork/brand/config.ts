import { SIDEBAR_BRAND_IMAGE_PATH } from "./assets";

export interface BrandConfig {
  readonly baseName: string;
  readonly stageLabel: string;
  readonly displayName: string;
  readonly version: string;
  readonly sidebarBrandImagePath: string;
}

function getStageLabel(): string {
  return import.meta.env.DEV ? "Dev" : "Alpha";
}

const stageLabel = getStageLabel();

export const brandConfig: BrandConfig = {
  baseName: "T3 Code",
  stageLabel,
  displayName: `T3 Code (${stageLabel})`,
  version: import.meta.env.APP_VERSION || "0.0.0",
  sidebarBrandImagePath: SIDEBAR_BRAND_IMAGE_PATH,
};
