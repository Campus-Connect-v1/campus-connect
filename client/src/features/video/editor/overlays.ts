import { videoUploadConfig } from "../config";
import type { EmojiOverlay, StickerOverlay, TextOverlay } from "../types";

/**
 * Factories for the three overlay kinds. The editor never builds these
 * objects by hand -- every overlay is created here, at the same default
 * position/scale/rotation, so "where does a new overlay land" is answered
 * in exactly one place.
 */

let counter = 0;
function overlayId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now()}_${counter}`;
}

const CENTER = { x: 0.5, y: 0.5 };

export function createTextOverlay(text: string): TextOverlay {
  return {
    id: overlayId("text"),
    type: "text",
    text,
    position: { ...CENTER },
    scale: 1,
    rotation: 0,
    color: videoUploadConfig.text.palette[0],
    fontSize: videoUploadConfig.text.defaultFontSize,
    align: "center",
    fontFamily: "bold",
  };
}

export function createEmojiOverlay(value: string): EmojiOverlay {
  return {
    id: overlayId("emoji"),
    type: "emoji",
    value,
    position: { ...CENTER },
    scale: 1,
    rotation: 0,
  };
}

export function createStickerOverlay(packId: string, stickerId: string, glyph: string): StickerOverlay {
  return {
    id: overlayId("sticker"),
    type: "sticker",
    packId,
    stickerId,
    glyph,
    position: { ...CENTER },
    scale: 1,
    rotation: 0,
  };
}
