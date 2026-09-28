import { useCallback, useEffect, useRef, useState } from "react";
import type { NativeSyntheticEvent, TextInputSelectionChangeEventData } from "react-native";

import { searchUsers, type ApiUserCard } from "@/src/services/userServices";

import { activeMentionQuery } from "./parse";

/** Long enough that a fast typist issues one request per word, not per letter. */
const DEBOUNCE_MS = 220;
const MAX_SUGGESTIONS = 6;

/**
 * Drives an @-mention picker over a plain TextInput.
 *
 * The caret position is the whole problem. "@" is only a mention when it
 * starts a word AND the caret is still inside the token it opened, which means
 * the hook has to track selection, not just text -- otherwise moving the caret
 * back into an old word silently reopens a picker for it, and typing an email
 * address opens one for the domain.
 */
export function useMentionAutocomplete({
  text,
  onChange,
}: {
  text: string;
  onChange: (next: string) => void;
}) {
  const [caret, setCaret] = useState(0);
  const [suggestions, setSuggestions] = useState<ApiUserCard[]>([]);
  const [loading, setLoading] = useState(false);
  /**
   * Set immediately after an insert and cleared on the next change.
   *
   * A permanently controlled `selection` fights the user for the caret on
   * every keystroke, so it is handed to the TextInput for exactly the one
   * render that has to move it.
   */
  const [pendingSelection, setPendingSelection] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const active = activeMentionQuery(text, caret);
  const query = active?.query ?? null;

  // Guards against a slow response for an old query overwriting a fast one for
  // the current query.
  const requestId = useRef(0);

  useEffect(() => {
    if (query === null) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const id = ++requestId.current;
    setLoading(true);

    const timer = setTimeout(async () => {
      // A bare "@" has nothing to search yet. The picker still opens, showing
      // its prompt, so the gesture feels answered before the first letter.
      if (query.trim().length === 0) {
        if (requestId.current === id) {
          setSuggestions([]);
          setLoading(false);
        }
        return;
      }

      const result = await searchUsers(query.trim());
      if (requestId.current !== id) return;

      setSuggestions(result.success ? result.data.slice(0, MAX_SUGGESTIONS) : []);
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const onSelectionChange = useCallback(
    (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      setCaret(event.nativeEvent.selection.start);
    },
    []
  );

  const handleChangeText = useCallback(
    (next: string) => {
      setPendingSelection(null);
      onChange(next);
    },
    [onChange]
  );

  /**
   * Replaces the typed token with the stored marker.
   *
   * The visible text grows from `@kof` to `@kofi.mensah`, but what is stored
   * is `@[kofi.mensah](user_12)`, so the caret has to be placed past the whole
   * marker rather than past the label the user can see.
   */
  const select = useCallback(
    (person: ApiUserCard) => {
      if (!active) return;

      const label =
        person.mention_handle ||
        [person.first_name, person.last_name].filter(Boolean).join(" ") ||
        "campus.user";

      const marker = `@[${label}](${person.user_id})`;
      const before = text.slice(0, active.start);
      const after = text.slice(caret);
      // A trailing space so the next word is not swallowed into the mention.
      const next = `${before}${marker} ${after}`;
      const cursor = before.length + marker.length + 1;

      onChange(next);
      setCaret(cursor);
      setPendingSelection({ start: cursor, end: cursor });
      setSuggestions([]);
    },
    [active, caret, onChange, text]
  );

  return {
    /** True whenever the caret sits in an @-token, even before results land. */
    open: query !== null,
    query,
    suggestions,
    loading,
    select,
    onSelectionChange,
    handleChangeText,
    selection: pendingSelection ?? undefined,
  };
}
