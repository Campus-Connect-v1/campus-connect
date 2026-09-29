import { videoUploadConfig } from "./config";
import type { SourceVideo, VideoEditorAction, VideoEditorState } from "./types";

export function initialEditorState(source: SourceVideo): VideoEditorState {
  return {
    trim: { startMs: 0, endMs: source.durationMs },
    rotation: 0,
    crop: { aspect: "original", rect: null },
    filter: "original",
    audio: { originalMuted: false, track: null },
    caption: "",
    textOverlays: [],
    emojiOverlays: [],
    stickerOverlays: [],
    drawingStrokes: [],
    blurRegions: [],
  };
}

/** Every edit goes through this reducer -- there is no path that mutates
 * `VideoEditorState` directly. That is what makes serialization, undo/redo,
 * and "reopen this draft later" all trivial: they all just operate on plain
 * state snapshots this function produces. */
export function editorReducer(state: VideoEditorState, action: VideoEditorAction): VideoEditorState {
  switch (action.type) {
    case "SET_TRIM":
      return { ...state, trim: action.trim };

    case "ROTATE": {
      const order = [0, 90, 180, 270] as const;
      const index = order.indexOf(state.rotation);
      const nextIndex = (index + action.direction + order.length) % order.length;
      return { ...state, rotation: order[nextIndex] };
    }

    case "SET_ROTATION":
      return { ...state, rotation: action.rotation };

    case "SET_CROP":
      return { ...state, crop: action.crop };

    case "APPLY_FILTER":
      return { ...state, filter: action.filter };

    case "MUTE_AUDIO":
      return { ...state, audio: { ...state.audio, originalMuted: action.muted } };

    case "ADD_AUDIO_TRACK":
      return { ...state, audio: { ...state.audio, track: action.track } };

    case "REMOVE_AUDIO_TRACK":
      return { ...state, audio: { ...state.audio, track: null } };

    case "SET_AUDIO_VOLUME":
      return state.audio.track
        ? { ...state, audio: { ...state.audio, track: { ...state.audio.track, volume: action.volume } } }
        : state;

    case "SET_CAPTION":
      return { ...state, caption: action.caption };

    case "ADD_TEXT":
      return { ...state, textOverlays: [...state.textOverlays, action.overlay] };
    case "UPDATE_TEXT":
      return {
        ...state,
        textOverlays: state.textOverlays.map((o) => (o.id === action.id ? { ...o, ...action.patch } : o)),
      };
    case "REMOVE_TEXT":
      return { ...state, textOverlays: state.textOverlays.filter((o) => o.id !== action.id) };

    case "ADD_EMOJI":
      return { ...state, emojiOverlays: [...state.emojiOverlays, action.overlay] };
    case "UPDATE_EMOJI":
      return {
        ...state,
        emojiOverlays: state.emojiOverlays.map((o) => (o.id === action.id ? { ...o, ...action.patch } : o)),
      };
    case "REMOVE_EMOJI":
      return { ...state, emojiOverlays: state.emojiOverlays.filter((o) => o.id !== action.id) };

    case "ADD_STICKER":
      return { ...state, stickerOverlays: [...state.stickerOverlays, action.overlay] };
    case "UPDATE_STICKER":
      return {
        ...state,
        stickerOverlays: state.stickerOverlays.map((o) =>
          o.id === action.id ? { ...o, ...action.patch } : o
        ),
      };
    case "REMOVE_STICKER":
      return { ...state, stickerOverlays: state.stickerOverlays.filter((o) => o.id !== action.id) };

    case "ADD_DRAWING":
      return { ...state, drawingStrokes: [...state.drawingStrokes, action.stroke] };
    case "CLEAR_DRAWING":
      return { ...state, drawingStrokes: [] };

    case "ADD_BLUR":
      return { ...state, blurRegions: [...state.blurRegions, action.region] };
    case "UPDATE_BLUR":
      return {
        ...state,
        blurRegions: state.blurRegions.map((r) => (r.id === action.id ? { ...r, rect: action.rect } : r)),
      };
    case "REMOVE_BLUR":
      return { ...state, blurRegions: state.blurRegions.filter((r) => r.id !== action.id) };

    case "RESET":
      return state;

    default:
      return state;
  }
}

/**
 * Undo/redo history.
 *
 * Operations are recorded as the ACTION plus the state it produced (section
 * 13 of the brief: "treat operations as editor actions rather than
 * destructive file modifications"), so undo/redo replay by moving a cursor
 * through recorded snapshots rather than by writing an inverse for every
 * action type. Bounded by `maxHistoryEntries` so an hour of fiddly drawing
 * strokes cannot grow this without limit.
 */
export interface EditorHistory {
  entries: VideoEditorState[];
  cursor: number;
}

export function createHistory(initial: VideoEditorState): EditorHistory {
  return { entries: [initial], cursor: 0 };
}

export function pushHistory(history: EditorHistory, next: VideoEditorState): EditorHistory {
  const truncated = history.entries.slice(0, history.cursor + 1);
  const entries = [...truncated, next].slice(-videoUploadConfig.maxHistoryEntries);
  return { entries, cursor: entries.length - 1 };
}

export function undo(history: EditorHistory): EditorHistory {
  return { ...history, cursor: Math.max(0, history.cursor - 1) };
}

export function redo(history: EditorHistory): EditorHistory {
  return { ...history, cursor: Math.min(history.entries.length - 1, history.cursor + 1) };
}

export function currentState(history: EditorHistory): VideoEditorState {
  return history.entries[history.cursor];
}

export function canUndo(history: EditorHistory): boolean {
  return history.cursor > 0;
}

export function canRedo(history: EditorHistory): boolean {
  return history.cursor < history.entries.length - 1;
}
