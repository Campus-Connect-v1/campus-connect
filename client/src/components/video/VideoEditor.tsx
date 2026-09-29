import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";

import { Button, Icon, PressableScale, Text, type IconName } from "@/src/components/ui";
import {
  canRedo,
  canUndo,
  createHistory,
  currentState,
  editorReducer,
  pushHistory,
  redo as historyRedo,
  undo as historyUndo,
  type EditorHistory,
} from "@/src/features/video/editorReducer";
import { getFilterPreset } from "@/src/features/video/editor/filters";
import { createBlurRegion, defaultBlurRect } from "@/src/features/video/editor/blur";
import { createStroke } from "@/src/features/video/editor/drawing";
import { createEmojiOverlay, createStickerOverlay, createTextOverlay } from "@/src/features/video/editor/overlays";
import type { StickerDefinition } from "@/src/features/video/editor/stickers";
import type { SourceVideo, VideoEditorState } from "@/src/features/video/types";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

import { OverlayLayer } from "./OverlayLayer";
import { VideoAudioEditor } from "./VideoAudioEditor";
import { BlurRegionOverlay, VideoBlurTool } from "./VideoBlurTool";
import { VideoCaptionInput } from "./VideoCaptionInput";
import { VideoCropper } from "./VideoCropper";
import { VideoDrawingCanvas } from "./VideoDrawingCanvas";
import { VideoEmojiPicker } from "./VideoEmojiPicker";
import { VideoFilterPanel } from "./VideoFilterPanel";
import { VideoQualitySelector } from "./VideoQualitySelector";
import { VideoRotationControl } from "./VideoRotationControl";
import { VideoStickerPicker } from "./VideoStickerPicker";
import { VideoTextEditor } from "./VideoTextEditor";
import { VideoTimeline } from "./VideoTimeline";
import { videoUploadConfig, type VideoQualityId } from "@/src/features/video/config";

// "filters" is not one of these -- it's not a destination you switch to, it's
// a strip that's always visible under whichever tool panel is showing (see
// the always-rendered VideoFilterPanel below the ToolPanel).
type Tool = "trim" | "crop" | "rotate" | "text" | "emoji" | "stickers" | "draw" | "blur" | "audio" | "caption" | "quality";

const TOOLS: { id: Tool; label: string; icon: IconName }[] = [
  { id: "trim", label: "Trim", icon: "trim" },
  { id: "crop", label: "Crop", icon: "crop" },
  { id: "rotate", label: "Rotate", icon: "rotate" },
  { id: "text", label: "Text", icon: "text" },
  { id: "emoji", label: "Emoji", icon: "emoji" },
  { id: "stickers", label: "Stickers", icon: "sticker" },
  { id: "draw", label: "Draw", icon: "draw" },
  { id: "blur", label: "Blur", icon: "blur" },
  { id: "audio", label: "Audio", icon: "volume" },
  { id: "caption", label: "Caption", icon: "edit" },
  { id: "quality", label: "Quality", icon: "settings" },
];

export interface VideoEditorResult {
  state: VideoEditorState;
  quality: VideoQualityId;
  frameWidth: number;
  frameHeight: number;
}

interface VideoEditorProps {
  source: SourceVideo;
  thumbnailUri: string | null;
  initialState: VideoEditorState;
  /** Label for the final action button. This button uploads the edited
   * video and hands the URL back to whatever screen opened the module --
   * it does not itself create a post or story, so the default names that
   * accurately; a screen that publishes in this same step can override it. */
  submitLabel?: string;
  onCancel: () => void;
  onContinue: (result: VideoEditorResult, overlayLayerRef: React.RefObject<View | null>) => void;
}

/**
 * The editor screen. Owns its own history (undo/redo) end to end and hands
 * back a plain, serializable `VideoEditorState` when the person taps the
 * submit button -- nothing about upload, storage, or processing is known
 * here (see `videoUpload.ts` and `videoProcessor.ts` for what happens to
 * the state after this). There is no separate preview stop before this
 * screen or a confirmation after it: picking/recording a valid video leads
 * straight here, and this button IS the post/upload action.
 */
export function VideoEditor({
  source,
  thumbnailUri,
  initialState,
  submitLabel = "Upload",
  onCancel,
  onContinue,
}: VideoEditorProps) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  // No tool panel is shown until the person actually taps a rail icon --
  // matching the reference this was modeled on, where the video (plus the
  // rail and the filter strip) is the whole screen by default, not a trim
  // timeline pinned open before anyone asked for it.
  const [tool, setTool] = useState<Tool | null>(null);
  const [history, setHistory] = useState<EditorHistory>(() => createHistory(initialState));
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [quality, setQuality] = useState<VideoQualityId>(videoUploadConfig.defaultQuality);
  const [paused, setPaused] = useState(false);
  const overlayLayerRef = useRef<View>(null);

  const state = currentState(history);
  const dispatch = (action: Parameters<typeof editorReducer>[1]) =>
    setHistory((h) => pushHistory(h, editorReducer(currentState(h), action)));

  const player = useVideoPlayer(source.uri, (instance) => {
    instance.loop = true;
    // Default interval is coarser than this; the trim timeline's playhead
    // reads directly off this event, so it needs to tick often enough to
    // look like continuous motion rather than visible jumps.
    instance.timeUpdateEventInterval = 0.1;
    instance.play();
  });
  // Re-renders on every timeUpdate event -- this is what drives the moving
  // playhead on the trim timeline below. No initial value is passed: the
  // event payload carries a few fields beyond currentTime that aren't worth
  // fabricating just to satisfy the type, so this reads as null until the
  // first real event instead.
  const currentTime = useEvent(player, "timeUpdate")?.currentTime ?? 0;

  // Confines the live preview to the trimmed section: as soon as playback
  // reaches the trim's end, it jumps back to the trim's start, rather than
  // continuing on through the rest of the source (which `player.loop` alone
  // would do, since that only knows about the whole file, not the trim
  // selection). Also re-fires whenever the trim range itself changes --
  // dragging the end handle behind the current playback position, or
  // sliding the whole window elsewhere on the timeline, should snap
  // playback back inside the new range immediately rather than leaving it
  // stuck outside the very thing being previewed.
  useEffect(() => {
    const startSec = state.trim.startMs / 1000;
    const endSec = state.trim.endMs / 1000;
    if (currentTime < startSec - 0.05 || currentTime >= endSec) {
      player.currentTime = startSec;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, state.trim.startMs, state.trim.endMs]);

  const previewWidth = windowWidth - spacing.lg * 2;
  const frameAspect = source.width / source.height;
  // Capped lower than a portrait video's natural aspect would otherwise take
  // (it was 420, leaving very little of the screen for the tool panel and
  // the always-visible filter strip below it once a tall tool panel, like
  // Crop's own preview box, needed room too).
  const previewHeight = Math.min(340, previewWidth / frameAspect);

  const filterPreview = getFilterPreset(state.filter).preview;
  const rotated = state.rotation === 90 || state.rotation === 270;

  const cropRect = state.crop.rect;

  const editedText = state.textOverlays.find((o) => o.id === selectedOverlayId) ?? null;

  const selectOverlayAndSwitchTool = (id: string | null) => {
    setSelectedOverlayId(id);
    if (!id) return;
    if (state.textOverlays.some((o) => o.id === id)) setTool("text");
    else if (state.emojiOverlays.some((o) => o.id === id)) setTool("emoji");
    else if (state.stickerOverlays.some((o) => o.id === id)) setTool("stickers");
  };

  return (
    <View style={{ flex: 1, gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <PressableScale accessibilityRole="button" accessibilityLabel="Cancel editing" onPress={onCancel} style={{ padding: spacing.xs }}>
          <Icon name="close" size={20} color={colors.textPrimary} />
        </PressableScale>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Undo"
            disabled={!canUndo(history)}
            onPress={() => setHistory(historyUndo)}
            style={{ opacity: canUndo(history) ? 1 : 0.35 }}
          >
            <Icon name="undo" size={20} color={colors.textPrimary} />
          </PressableScale>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Redo"
            disabled={!canRedo(history)}
            onPress={() => setHistory(historyRedo)}
            style={{ opacity: canRedo(history) ? 1 : 0.35 }}
          >
            <Icon name="redo" size={20} color={colors.textPrimary} />
          </PressableScale>
        </View>
      </View>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={paused ? "Play preview" : "Pause preview"}
        onPress={() => {
          setPaused((p) => {
            if (p) player.play();
            else player.pause();
            return !p;
          });
        }}
        style={{
          width: previewWidth,
          height: previewHeight,
          alignSelf: "center",
          borderRadius: radius.lg,
          overflow: "hidden",
          backgroundColor: "#000",
        }}
      >
        <View
          style={{
            width: cropRect ? previewWidth : previewWidth,
            height: cropRect ? previewHeight : previewHeight,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: cropRect ? previewWidth / cropRect.width : previewWidth,
              height: cropRect ? previewHeight / cropRect.height : previewHeight,
              marginLeft: cropRect ? -cropRect.x * (previewWidth / cropRect.width) : 0,
              marginTop: cropRect ? -cropRect.y * (previewHeight / cropRect.height) : 0,
              transform: [{ rotate: `${state.rotation}deg` }],
            }}
          >
            <VideoView player={player} style={{ width: "100%", height: "100%" }} contentFit="cover" nativeControls={false} />
          </View>
        </View>

        {filterPreview ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: filterPreview.color, opacity: filterPreview.opacity }]}
          />
        ) : null}

        <View pointerEvents={tool === "text" || tool === "emoji" || tool === "stickers" ? "box-none" : "none"} style={StyleSheet.absoluteFill}>
          <OverlayLayer
            state={state}
            width={previewWidth}
            height={previewHeight}
            interactive
            selectedId={selectedOverlayId}
            onSelect={selectOverlayAndSwitchTool}
            onMove={(id, position, scale, rotation) => {
              if (state.textOverlays.some((o) => o.id === id)) dispatch({ type: "UPDATE_TEXT", id, patch: { position, scale, rotation } });
              else if (state.emojiOverlays.some((o) => o.id === id)) dispatch({ type: "UPDATE_EMOJI", id, patch: { position, scale, rotation } });
              else dispatch({ type: "UPDATE_STICKER", id, patch: { position, scale, rotation } });
            }}
            onDelete={(id) => {
              if (state.emojiOverlays.some((o) => o.id === id)) dispatch({ type: "REMOVE_EMOJI", id });
              else if (state.stickerOverlays.some((o) => o.id === id)) dispatch({ type: "REMOVE_STICKER", id });
              if (selectedOverlayId === id) setSelectedOverlayId(null);
            }}
          />
        </View>

        {tool === "blur" ? (
          <View style={StyleSheet.absoluteFill}>
            <BlurRegionOverlay
              regions={state.blurRegions}
              width={previewWidth}
              height={previewHeight}
              onMove={(id, rect) => dispatch({ type: "UPDATE_BLUR", id, rect })}
              onRemove={(id) => dispatch({ type: "REMOVE_BLUR", id })}
            />
          </View>
        ) : null}

        {/* The tool rail: a vertical, scrollable column of icon-only
            buttons down the right edge of the video, the way Snapchat's
            editor lays its tools out -- not a bar below the preview. It
            overlays the video rather than sitting in the layout flow, so
            the video keeps the full preview area to itself. */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ position: "absolute", right: spacing.sm, top: spacing.md, bottom: spacing.md }}
          contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.xs }}
        >
          {TOOLS.map((option) => {
            const active = tool === option.id;
            return (
              <PressableScale
                key={option.id}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: active }}
                onPress={() => {
                  // Tapping the open tool again collapses it, so the video
                  // isn't permanently left with a panel pinned under it once
                  // someone is done with it.
                  setTool(active ? null : option.id);
                  if (!["text", "emoji", "stickers"].includes(option.id)) setSelectedOverlayId(null);
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: radius.full,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? colors.textPrimary : "rgba(7,18,25,0.4)",
                }}
              >
                <Icon name={option.icon} size={18} color={active ? colors.background : culture.warmWhite} />
              </PressableScale>
            );
          })}
        </ScrollView>
      </PressableScale>

      {/* flex: 1 is load-bearing here: React Native's flex items default to
          flexShrink: 0 (unlike web). Deliberately NOT flex: 1 here, though:
          that made this box always claim every last bit of remaining space
          whether the active tool needed it or not, which pushed the filter
          strip and the submit button as far down as the screen allowed
          instead of sitting right after whatever content this actually
          has. A capped maxHeight sizes it to its content -- short for Crop
          or Rotate, so the filter strip sits close under them -- and only
          falls back to scrolling internally on a tool tall enough to need
          it (Crop's own preview box, on a short screen). */}
      <ScrollView
        style={{ maxHeight: previewHeight }}
        contentContainerStyle={{ paddingBottom: spacing.sm }}
        keyboardShouldPersistTaps="handled"
      >
        <ToolPanel
          tool={tool}
          state={state}
          source={source}
          quality={quality}
          onQualityChange={setQuality}
          editedText={editedText}
          dispatch={dispatch}
          setSelectedOverlayId={setSelectedOverlayId}
          previewWidth={previewWidth}
          previewHeight={previewHeight}
          currentPositionMs={currentTime * 1000}
        />
      </ScrollView>

      {/* Its own fixed-height row, deliberately NOT inside the ScrollView
          above: sharing that flexing space with whichever tool panel is
          active meant the filter strip was whatever was left over after a
          taller tool panel (or nothing, once the panel alone filled the
          available height) -- squeezed down to a sliver or clipped
          entirely. Always visible, directly under whichever tool panel is
          showing (the trim timeline by default), the way Snapchat's filter
          strip sits under its editor regardless of which tool is selected. */}
      <VideoFilterPanel
        thumbnailUri={thumbnailUri}
        selected={state.filter}
        onSelect={(filter) => dispatch({ type: "APPLY_FILTER", filter })}
      />

      <Button
        label={submitLabel}
        onPress={() =>
          onContinue(
            { state, quality, frameWidth: rotated ? source.height : source.width, frameHeight: rotated ? source.width : source.height },
            overlayLayerRef
          )
        }
      />

      {/* Off-screen, non-interactive render of the same overlays at export
          resolution -- captured by videoCompositor.flattenOverlays right
          before upload. Positioned off-canvas rather than unmounted so the
          view is always ready to capture with no extra render pass. */}
      <View style={{ position: "absolute", left: -9999, top: 0 }} pointerEvents="none">
        <OverlayLayer
          ref={overlayLayerRef}
          state={state}
          width={rotated ? source.height : source.width}
          height={rotated ? source.width : source.height}
        />
      </View>
    </View>
  );
}

function ToolPanel({
  tool,
  state,
  source,
  quality,
  onQualityChange,
  editedText,
  dispatch,
  setSelectedOverlayId,
  previewWidth,
  previewHeight,
  currentPositionMs,
}: {
  tool: Tool | null;
  state: VideoEditorState;
  source: SourceVideo;
  quality: VideoQualityId;
  onQualityChange: (quality: VideoQualityId) => void;
  editedText: VideoEditorState["textOverlays"][number] | null;
  dispatch: (action: Parameters<typeof editorReducer>[1]) => void;
  setSelectedOverlayId: (id: string | null) => void;
  previewWidth: number;
  previewHeight: number;
  currentPositionMs: number;
}) {
  switch (tool) {
    case "trim":
      return (
        <VideoTimeline
          durationMs={source.durationMs}
          trim={state.trim}
          onChange={(trim) => dispatch({ type: "SET_TRIM", trim })}
          width={previewWidth}
          currentPositionMs={currentPositionMs}
        />
      );
    case "crop":
      return (
        <VideoCropper
          crop={state.crop}
          onChange={(crop) => dispatch({ type: "SET_CROP", crop })}
          frameWidth={source.width}
          frameHeight={source.height}
          previewWidth={previewWidth}
          previewHeight={previewHeight}
        />
      );
    case "rotate":
      return (
        <VideoRotationControl
          rotation={state.rotation}
          onChange={(rotation) => dispatch({ type: "SET_ROTATION", rotation })}
        />
      );
    case "text":
      return (
        <VideoTextEditor
          editing={editedText}
          onSubmit={(text, color, fontSize) => {
            if (editedText) {
              dispatch({ type: "UPDATE_TEXT", id: editedText.id, patch: { text, color, fontSize } });
            } else {
              const overlay = createTextOverlay(text);
              dispatch({ type: "ADD_TEXT", overlay: { ...overlay, color, fontSize } });
              setSelectedOverlayId(overlay.id);
            }
          }}
          onDelete={() => {
            if (editedText) dispatch({ type: "REMOVE_TEXT", id: editedText.id });
            setSelectedOverlayId(null);
          }}
          onCancel={() => setSelectedOverlayId(null)}
        />
      );
    case "emoji":
      return (
        <VideoEmojiPicker
          onSelect={(emoji) => {
            const overlay = createEmojiOverlay(emoji);
            dispatch({ type: "ADD_EMOJI", overlay });
            setSelectedOverlayId(overlay.id);
          }}
        />
      );
    case "stickers":
      return (
        <VideoStickerPicker
          onSelect={(packId, sticker) => {
            const overlay = createStickerOverlay(packId, sticker.id, sticker.glyph);
            dispatch({ type: "ADD_STICKER", overlay });
            setSelectedOverlayId(overlay.id);
          }}
        />
      );
    case "draw":
      return (
        <VideoDrawingCanvas
          width={previewWidth}
          height={previewHeight}
          strokes={state.drawingStrokes}
          onStrokeComplete={(stroke) => dispatch({ type: "ADD_DRAWING", stroke })}
          onClear={() => dispatch({ type: "CLEAR_DRAWING" })}
          canUndo={state.drawingStrokes.length > 0}
          onUndo={() => {
            if (state.drawingStrokes.length === 0) return;
            const withoutLast = state.drawingStrokes.slice(0, -1);
            dispatch({ type: "CLEAR_DRAWING" });
            withoutLast.forEach((stroke) => dispatch({ type: "ADD_DRAWING", stroke }));
          }}
        />
      );
    case "blur":
      return (
        <VideoBlurTool
          regionCount={state.blurRegions.length}
          onAdd={() => dispatch({ type: "ADD_BLUR", region: createBlurRegion(defaultBlurRect()) })}
        />
      );
    case "audio":
      return (
        <VideoAudioEditor
          audio={state.audio}
          onMuteChange={(muted) => dispatch({ type: "MUTE_AUDIO", muted })}
          onTrackAdded={(track) => dispatch({ type: "ADD_AUDIO_TRACK", track })}
          onTrackRemoved={() => dispatch({ type: "REMOVE_AUDIO_TRACK" })}
          onVolumeChange={(volume) => dispatch({ type: "SET_AUDIO_VOLUME", volume })}
        />
      );
    case "caption":
      return <VideoCaptionInput value={state.caption} onChange={(caption) => dispatch({ type: "SET_CAPTION", caption })} />;
    case "quality":
      return <VideoQualitySelector quality={quality} onChange={onQualityChange} />;
    default:
      return null;
  }
}

export type { StickerDefinition };
