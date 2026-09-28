import * as Haptics from "expo-haptics";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

import type { PickedMedia } from "./media";
import { uploadMedia, type UploadKind } from "./uploadServices";

export type UploadStatus = "uploading" | "publishing" | "done" | "failed";

export interface UploadJob {
  id: string;
  /** "Post" or "Story" -- what the toast calls it. */
  label: string;
  status: UploadStatus;
  /** 0..1 while uploading; held at 1 once the bytes are up. */
  progress: number;
  error?: string;
}

interface EnqueueInput {
  label: string;
  kind: UploadKind;
  media: PickedMedia | null;
  /**
   * Creates the post or story once the media is hosted.
   *
   * Passed in rather than switched on inside here, so this file knows nothing
   * about posts or stories -- it owns the queue, not the payloads.
   */
  commit: (mediaUrl: string | null) => Promise<{ ok: boolean; error?: string }>;
}

interface UploadQueueValue {
  jobs: UploadJob[];
  /** The one currently worth drawing a bar for, if any. */
  active: UploadJob | null;
  /** Set when something just finished; cleared by the toast. */
  finished: UploadJob | null;
  enqueue: (input: EnqueueInput) => void;
  dismiss: (id: string) => void;
}

const UploadQueueContext = createContext<UploadQueueValue | null>(null);

/**
 * Uploads that do not hold the user still.
 *
 * Composing used to block on the upload: you watched a spinner until
 * Cloudinary had the whole file, on a campus connection, before the screen
 * would even close. This publishes optimistically instead -- the composer
 * closes at once and the work finishes behind whatever you do next.
 *
 * Deliberately NOT persisted across launches. A job holds a commit closure and
 * a local file URI, neither of which survives a restart, and a queue that
 * silently resurrects a half-finished post is worse than one that admits it
 * lost it. Killing the app cancels the upload, which matches what the user
 * just did.
 */
export function UploadQueueProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [finished, setFinished] = useState<UploadJob | null>(null);
  const counter = useRef(0);

  const patch = useCallback((id: string, next: Partial<UploadJob>) => {
    setJobs((current) => current.map((job) => (job.id === id ? { ...job, ...next } : job)));
  }, []);

  const settle = useCallback((job: UploadJob) => {
    setFinished(job);
    setJobs((current) => current.filter((existing) => existing.id !== job.id));
  }, []);

  const enqueue = useCallback(
    ({ label, kind, media, commit }: EnqueueInput) => {
      const id = `upload_${++counter.current}`;
      const job: UploadJob = { id, label, status: "uploading", progress: media ? 0 : 1 };
      setJobs((current) => [...current, job]);

      (async () => {
        let mediaUrl: string | null = null;

        if (media) {
          const uploaded = await uploadMedia(media, kind, (fraction) =>
            patch(id, { progress: fraction })
          );
          if (!uploaded.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            settle({ ...job, status: "failed", progress: 0, error: uploaded.error });
            return;
          }
          mediaUrl = uploaded.url;
        }

        // The bytes are up but the row does not exist yet. Held at 1 rather
        // than jumping to done, so the bar does not claim success early.
        patch(id, { status: "publishing", progress: 1 });

        const committed = await commit(mediaUrl);
        if (!committed.ok) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          settle({ ...job, status: "failed", progress: 1, error: committed.error });
          return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        settle({ ...job, status: "done", progress: 1 });
      })();
    },
    [patch, settle]
  );

  const dismiss = useCallback((id: string) => {
    setFinished((current) => (current?.id === id ? null : current));
  }, []);

  const value = useMemo<UploadQueueValue>(
    () => ({ jobs, active: jobs[0] ?? null, finished, enqueue, dismiss }),
    [jobs, finished, enqueue, dismiss]
  );

  return <UploadQueueContext.Provider value={value}>{children}</UploadQueueContext.Provider>;
}

export function useUploadQueue(): UploadQueueValue {
  const value = useContext(UploadQueueContext);
  if (!value) throw new Error("useUploadQueue must be used inside UploadQueueProvider");
  return value;
}
