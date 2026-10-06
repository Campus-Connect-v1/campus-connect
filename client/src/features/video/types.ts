import type { VideoQualityId } from "./config";

/** The raw file as it came off the picker or the camera -- never mutated. */
export interface SourceVideo {
  uri: string;
  fileName: string | null;
  mimeType: string;
  fileSizeBytes: number;
  durationMs: number;
  width: number;
  height: number;
}

export interface VideoValidationError {
  code:
    | "too_long"
    | "too_short"
    | "too_large"
    | "unsupported_format"
    | "unreadable"
    | "no_dimensions";
  message: string;
}

export type Point = { x: number; y: number };

export interface TrimState {
  /** Milliseconds, relative to the source video. */
  startMs: number;
  endMs: number;
}

export type RotationDegrees = 0 | 90 | 180 | 270;

export type CropAspect = "original" | "square" | "portrait" | "landscape" | "free";

export interface CropState {
  aspect: CropAspect;
  /** Unit rect (0..1 of frame width/height), present once the user has
   * actually adjusted the crop; absent means "full frame". */
  rect: { x: number; y: number; width: number; height: number } | null;
}

export type FilterId =
  | "original"
  | "bright"
  | "contrast"
  | "warm"
  | "cool"
  | "vintage"
  | "mono"
  | "dramatic";

export type TextFontStyleId = "classic" | "bold" | "display" | "retro" | "handwritten";

export interface OverlayBase {
  id: string;
  position: Point;
  /** Unit scale, 1 = the size the overlay was created at. */
  scale: number;
  rotation: number;
}

export interface TextOverlay extends OverlayBase {
  type: "text";
  text: string;
  color: string;
  fontSize: number;
  align: "left" | "center" | "right";
  fontFamily: TextFontStyleId;
}

export interface EmojiOverlay extends OverlayBase {
  type: "emoji";
  value: string;
}

export interface StickerOverlay extends OverlayBase {
  type: "sticker";
  packId: string;
  stickerId: string;
  glyph: string;
}

export type EditorOverlay = TextOverlay | EmojiOverlay | StickerOverlay;

export interface DrawingStroke {
  id: string;
  color: string;
  brushSize: number;
  /** Unit-space points (0..1 of frame width/height) so strokes stay correct
   * regardless of the preview size they were drawn at. */
  points: Point[];
}

export interface BlurRegion {
  id: string;
  /** Unit rect, 0..1 of frame width/height. */
  rect: { x: number; y: number; width: number; height: number };
}

export interface AudioState {
  /** Whether the source clip's own audio plays. */
  originalMuted: boolean;
  track: {
    uri: string;
    name: string;
    durationMs: number | null;
    volume: number;
  } | null;
}

export interface VideoEditorState {
  trim: TrimState;
  rotation: RotationDegrees;
  crop: CropState;
  filter: FilterId;
  audio: AudioState;
  caption: string;
  textOverlays: TextOverlay[];
  emojiOverlays: EmojiOverlay[];
  stickerOverlays: StickerOverlay[];
  drawingStrokes: DrawingStroke[];
  blurRegions: BlurRegion[];
}

export type VideoEditorAction =
  | { type: "SET_TRIM"; trim: TrimState }
  | { type: "ROTATE"; direction: 1 | -1 }
  | { type: "SET_ROTATION"; rotation: RotationDegrees }
  | { type: "SET_CROP"; crop: CropState }
  | { type: "APPLY_FILTER"; filter: FilterId }
  | { type: "MUTE_AUDIO"; muted: boolean }
  | { type: "ADD_AUDIO_TRACK"; track: NonNullable<AudioState["track"]> }
  | { type: "REMOVE_AUDIO_TRACK" }
  | { type: "SET_AUDIO_VOLUME"; volume: number }
  | { type: "SET_CAPTION"; caption: string }
  | { type: "ADD_TEXT"; overlay: TextOverlay }
  | { type: "UPDATE_TEXT"; id: string; patch: Partial<Omit<TextOverlay, "id" | "type">> }
  | { type: "REMOVE_TEXT"; id: string }
  | { type: "ADD_EMOJI"; overlay: EmojiOverlay }
  | { type: "UPDATE_EMOJI"; id: string; patch: Partial<Omit<EmojiOverlay, "id" | "type">> }
  | { type: "REMOVE_EMOJI"; id: string }
  | { type: "ADD_STICKER"; overlay: StickerOverlay }
  | { type: "UPDATE_STICKER"; id: string; patch: Partial<Omit<StickerOverlay, "id" | "type">> }
  | { type: "REMOVE_STICKER"; id: string }
  | { type: "ADD_DRAWING"; stroke: DrawingStroke }
  | { type: "CLEAR_DRAWING" }
  | { type: "ADD_BLUR"; region: BlurRegion }
  | { type: "UPDATE_BLUR"; id: string; rect: BlurRegion["rect"] }
  | { type: "REMOVE_BLUR"; id: string }
  | { type: "RESET" };

/** One entry in the history stack: an action plus the state it produced,
 * so undo/redo replay by index rather than by inverting operations. */
export interface HistoryEntry {
  action: VideoEditorAction;
  state: VideoEditorState;
}

export type UploadStage =
  | "idle"
  | "selecting"
  | "selected"
  | "editing"
  | "processing"
  | "compressing"
  | "generating_thumbnail"
  | "uploading"
  | "verifying"
  | "completed"
  | "failed"
  | "cancelled";

export interface VideoUploadProgress {
  bytesSent: number;
  bytesTotal: number;
  /** 0..1 */
  fraction: number;
}

export type VideoProcessingStatus = "pending" | "processing" | "ready" | "failed";

export interface VideoMetadataRecord {
  id: string;
  originalName: string | null;
  mimeType: string;
  originalFileSizeBytes: number;
  processedFileSizeBytes: number | null;
  durationMs: number;
  width: number;
  height: number;
  thumbnailUrl: string | null;
  quality: VideoQualityId;
  caption: string;
  processingStatus: VideoProcessingStatus;
  uploadStatus: UploadStage;
  storagePath: string | null;
  createdAt: string;
}

/** What a consuming screen gets back from a completed session. Deliberately
 * thin -- storage/provider details do not leak past this. */
export interface VideoUploadResult {
  url: string;
  thumbnailUrl: string | null;
  durationMs: number;
  width: number;
  height: number;
  caption: string;
  quality: VideoQualityId;
  metadata: VideoMetadataRecord;
}
