import { Community } from "@prisma/client";

export interface CommunityInfo {
  name: string;
  color: string;
  shortName: string;
  exclusiveColors: [string, string];
  logoPath: string;
}

export const COMMUNITIES: Record<Community, CommunityInfo> = {
  DC: {
    name: "디시인사이드",
    color: "#3b468f",
    shortName: "DC",
    exclusiveColors: ["#3b468f", "#8f843b"],
    logoPath: "/community_logo/dc.png",
  },
  FM: {
    name: "FM코리아",
    color: "#466bc1",
    shortName: "FM",
    exclusiveColors: ["#466bc1", "#c19c46"],
    logoPath: "/community_logo/fm.png",
  },
  THEQOO: {
    name: "더쿠",
    color: "#375472",
    shortName: "더쿠",
    exclusiveColors: ["#375472", "#725537"],
    logoPath: "/community_logo/theqoo.png",
  },
  PPOMPPU: {
    name: "뽐뿌",
    color: "#fdb846",
    shortName: "뽐뿌",
    exclusiveColors: ["#fdb846", "#e61bfe"],
    logoPath: "/community_logo/ppomppu.png",
  },
  RULIWEB: {
    name: "루리웹",
    color: "#0756c4",
    shortName: "루리",
    exclusiveColors: ["#0756c4", "#c47507"],
    logoPath: "/community_logo/ruriweb.png",
  },
  INVEN: {
    name: "인벤",
    color: "#6db929",
    shortName: "인벤",
    exclusiveColors: ["#6db929", "#ffb601"],
    logoPath: "/community_logo/inven.png",
  },
  MLBPARK: {
    name: "MLB파크",
    color: "#ff6801",
    shortName: "MLB",
    exclusiveColors: ["#ff6801", "#0198ff"],
    logoPath: "/community_logo/mlbpark.png",
  },
  ARCALIVE: {
    name: "아카라이브",
    color: "#3d414d",
    shortName: "아카",
    exclusiveColors: ["#3d414d", "#4d493d"],
    logoPath: "/community_logo/arcalive.png",
  },
  NATEPANN: {
    name: "네이트판",
    color: "#fa3214",
    shortName: "네판",
    exclusiveColors: ["#fa3214", "#14dcfa"],
    logoPath: "/community_logo/natepann.png",
  },
  CLIEN: {
    name: "클리앙",
    color: "#374271",
    shortName: "클량",
    exclusiveColors: ["#374271", "#716637"],
    logoPath: "/community_logo/clien.png",
  },
  BOBAE: {
    name: "보배드림",
    color: "#004ea0",
    shortName: "보배",
    exclusiveColors: ["#004ea0", "#a05200"],
    logoPath: "/community_logo/bobae.png",
  },
  INSTIZ: {
    name: "인스티즈",
    color: "#13bd6b",
    shortName: "인티",
    exclusiveColors: ["#13bd6b", "#bd1365"],
    logoPath: "/community_logo/instiz.png",
  },
  HUMORUNIV: {
    name: "웃긴대학",
    color: "#e82b47",
    shortName: "웃대",
    exclusiveColors: ["#e82b47", "#adadad"],
    logoPath: "/community_logo/humoruniv.png",
  },
  ORBI: {
    name: "오르비",
    color: "#4d5ca0",
    shortName: "오르",
    exclusiveColors: ["#4d5ca0", "#a0914d"],
    logoPath: "/community_logo/orbi.png",
  },
  ETC: {
    name: "기타",
    color: "#9E9E9E",
    shortName: "기타",
    exclusiveColors: ["#757575", "#BDBDBD"],
    logoPath: "",
  },
};

export const COMMUNITY_CHANGE_COOLDOWN_DAYS = 30;

export const COMMON_COLORS = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FF8800",
  "#88FF00",
  "#0088FF",
  "#8800FF",
  "#FF0088",
  "#808080",
];

export function getAvailableColors(community: Community | null): string[] {
  const colors = [...COMMON_COLORS];
  if (community) {
    colors.push(...COMMUNITIES[community].exclusiveColors);
  }
  return colors;
}

export function isColorAllowedForCommunity(
  color: string,
  community: Community | null
): boolean {
  if (COMMON_COLORS.includes(color)) {
    return true;
  }

  if (!community) {
    return false;
  }

  return COMMUNITIES[community].exclusiveColors.includes(color);
}
