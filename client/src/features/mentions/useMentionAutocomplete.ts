import { useCallback, useEffect, useRef, useState } from "react";
import type { NativeSyntheticEvent, TextInputSelectionChangeEventData } from "react-native";

import { searchUsers, type ApiUserCard } from "@/src/services/userServices";

import { activeMentionQuery, hydrateMentions, serializeMentions } from "./parse";

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
  /**
   * handle -> user_id for everyone picked from the picker in this draft.
   *
   * This is the only record of who a `@handle` in the text actually meant, so
   * it is what makes the plain-text composer resolvable on submit.
   */
  const [registry, setRegistry] = useState<ReadonlyMap<string, string>>(new Map());

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
   * Replaces the typed token with the PLAIN handle, and remembers who it meant.
   *
   * Not the marker. A React Native TextInput cannot style part of its own
   * value, so writing `@[Joyce Elli](user_123)` into it shows the writer the
   * id and the brackets while they type. They see `@joyce.elli`; the marker is
   * assembled from this registry on submit.
   */
  const select = useCallback(
    (person: ApiUserCard) => {
      if (!active) return;

      const handle =
        person.mention_handle ||
        [person.first_name, person.last_name]
          .filter(Boolean)
          .join(".")
          .toLowerCase()
          .replace(/\s+/g, ".") ||
        "campus.user";

      const inserted = `@${handle}`;
      const before = text.slice(0, active.start);
      const after = text.slice(caret);
      // A trailing space, so the next word is not read as part of the handle
      // and the picker closes on the whitespace.
      const next = `${before}${inserted} ${after}`;
      const cursor = before.length + inserted.length + 1;

      setRegistry((current) => {
        const updated = new Map(current);
        updated.set(handle, person.user_id);
        return updated;
      });

      onChange(next);
      setCaret(cursor);
      setPendingSelection({ start: cursor, end: cursor });
      setSuggestions([]);
    },
    [active, caret, onChange, text]
  );

  /**
   * Call this on submit to get what should actually be stored.
   *
   * Handles nobody picked stay plain, so typing `@someone` by hand, or editing
   * a picked name until it no longer matches, produces no link and notifies
   * nobody -- which is the safe direction for a mistake to fall.
   */
  const serialize = useCallback(
    (value: string = text) => serializeMentions(value, registry),
    [registry, text]
  );

  /**
   * Seeds the composer from stored content for an edit: returns the plain text
   * to show, and restores the registry so saving re-writes the same markers.
   */
  const hydrate = useCallback((content: string | null | undefined) => {
    const { text: plain, registry: restored } = hydrateMentions(content);
    setRegistry(restored);
    setCaret(plain.length);
    setPendingSelection(null);
    return plain;
  }, []);

  const reset = useCallback(() => {
    setRegistry(new Map());
    setSuggestions([]);
    setPendingSelection(null);
    setCaret(0);
  }, []);

  return {
    /** True whenever the caret sits in an @-token, even before results land. */
    open: query !== null,
    query,
    suggestions,
    loading,
    select,
    serialize,
    hydrate,
    reset,
    onSelectionChange,
    handleChangeText,
    selection: pendingSelection ?? undefined,
  };
}
