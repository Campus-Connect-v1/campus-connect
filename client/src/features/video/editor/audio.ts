import type { AudioState } from "../types";

/**
 * AudioEngine: how the editor's audio state becomes Cloudinary parameters.
 *
 * V1 supports muting the original track and laying one picked audio file
 * over the clip (a "music track" in the sense the brief asks for, sourced
 * from the device rather than a licensed catalog this app does not have).
 * The shape below is deliberately ready for more: a future multi-track
 * mixer, fade in/out, or a licensed music library only needs to produce a
 * richer `AudioState.track` and extend `toCloudinaryEffects` -- nothing
 * about how audio flows through the editor, the reducer, or the upload
 * pipeline needs to change.
 *
 * `overlayPublicId` is the Cloudinary public id of the picked track, which
 * must be uploaded (as a `video` resource -- Cloudinary treats standalone
 * audio that way) before this runs. VideoUploadManager owns that upload; this
 * function only knows how to turn the *result* of it into effect strings.
 */
export function toCloudinaryEffects(audio: AudioState, overlayPublicId?: string): string[] {
  const effects: string[] = [];

  if (audio.track && overlayPublicId) {
    // Mute the source first, so the added track is what's heard rather than
    // a mix of both, then lay the track over the full clip.
    effects.push("ac_none");
    const volumePercent = Math.round(audio.track.volume * 100);
    effects.push(`l_video:${overlayPublicId}`, `e_volume:${volumePercent}`, "fl_layer_apply");
    return effects;
  }

  if (audio.originalMuted) {
    effects.push("ac_none");
  }

  return effects;
}

export function isMutedEffectively(audio: AudioState): boolean {
  return audio.originalMuted && !audio.track;
}
