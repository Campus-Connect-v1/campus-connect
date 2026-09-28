import {
  activeMentionQuery,
  hasMentions,
  hydrateMentions,
  parseMentions,
  serializeMentions,
  stripMentions,
} from "../parse";

describe("parseMentions", () => {
  it("returns nothing for empty content", () => {
    expect(parseMentions("")).toEqual([]);
    expect(parseMentions(null)).toEqual([]);
    expect(parseMentions(undefined)).toEqual([]);
  });

  it("returns one text segment when there is no mention", () => {
    expect(parseMentions("just a post")).toEqual([{ type: "text", text: "just a post" }]);
  });

  it("splits text around a mention, keeping order", () => {
    expect(parseMentions("hi @[Kofi Mensah](user_12) welcome")).toEqual([
      { type: "text", text: "hi " },
      { type: "mention", label: "Kofi Mensah", userId: "user_12" },
      { type: "text", text: " welcome" },
    ]);
  });

  it("handles a mention at the very start and very end", () => {
    expect(parseMentions("@[A](user_1) x @[B](user_2)")).toEqual([
      { type: "mention", label: "A", userId: "user_1" },
      { type: "text", text: " x " },
      { type: "mention", label: "B", userId: "user_2" },
    ]);
  });

  it("does not treat an email as a mention", () => {
    expect(parseMentions("mail kofi.mensah@ug.edu.gh now")).toEqual([
      { type: "text", text: "mail kofi.mensah@ug.edu.gh now" },
    ]);
  });

  it("leaves malformed markers as plain text", () => {
    const malformed = "@[unclosed(user_1) and @[x](bad id!) and @[y]()";
    expect(parseMentions(malformed)).toEqual([{ type: "text", text: malformed }]);
  });

  it("is not stateful across calls", () => {
    const content = "@[A](user_1)";
    expect(parseMentions(content)).toEqual(parseMentions(content));
    expect(hasMentions(content)).toBe(true);
    expect(hasMentions(content)).toBe(true);
  });
});

describe("stripMentions", () => {
  it("reduces a marker to its readable label", () => {
    expect(stripMentions("hi @[Kofi Mensah](user_12)!")).toBe("hi @Kofi Mensah!");
  });

  it("leaves content without mentions untouched", () => {
    expect(stripMentions("nothing here")).toBe("nothing here");
  });
});

describe("activeMentionQuery", () => {
  const at = (text: string) => activeMentionQuery(text, text.length);

  it("opens on @ at the start of the text", () => {
    expect(at("@kof")).toEqual({ query: "kof", start: 0 });
  });

  it("opens on @ after a space", () => {
    expect(at("hello @kof")).toEqual({ query: "kof", start: 6 });
  });

  it("opens on a bare @ so the picker can show suggestions immediately", () => {
    expect(at("hello @")).toEqual({ query: "", start: 6 });
  });

  it("closes at the first space, because a handle has none", () => {
    // This is what stops the picker staying open over the next word once a
    // mention has been inserted as plain text.
    expect(at("hi @kofi mensah")).toBeNull();
    expect(at("hi @kofi.mensah said")).toBeNull();
  });

  it("stays open across the dots inside a handle", () => {
    expect(at("hi @kofi.mensah.ug")).toEqual({ query: "kofi.mensah.ug", start: 3 });
  });

  it("does not open inside an email address", () => {
    expect(at("write to kofi@ug")).toBeNull();
  });

  it("does not re-open on an already completed mention", () => {
    expect(at("hi @[Kofi](user_1)")).toBeNull();
  });

  it("reads from the caret, not the end of the text", () => {
    const text = "hi @kof trailing words";
    expect(activeMentionQuery(text, 7)).toEqual({ query: "kof", start: 3 });
  });

  it("gives up on an absurdly long token", () => {
    expect(at("@" + "a".repeat(41))).toBeNull();
  });
});

describe("serializeMentions", () => {
  const registry = new Map([
    ["kofi.mensah.ug", "user_1"],
    ["kofi.mensah.knust", "user_2"],
    ["joyce.elli", "user_3"],
  ]);

  it("leaves text alone when nothing was picked", () => {
    expect(serializeMentions("hi @kofi.mensah.ug", new Map())).toBe("hi @kofi.mensah.ug");
  });

  it("converts a picked handle into a marker", () => {
    expect(serializeMentions("hi @joyce.elli!", registry)).toBe("hi @[joyce.elli](user_3)!");
  });

  it("converts at the very start of the text", () => {
    expect(serializeMentions("@joyce.elli hi", registry)).toBe("@[joyce.elli](user_3) hi");
  });

  it("keeps two same-name people apart by their campus suffix", () => {
    expect(serializeMentions("@kofi.mensah.ug and @kofi.mensah.knust", registry)).toBe(
      "@[kofi.mensah.ug](user_1) and @[kofi.mensah.knust](user_2)"
    );
  });

  it("does not let a shorter handle eat a longer one", () => {
    const overlapping = new Map([
      ["kofi.mensah", "user_9"],
      ["kofi.mensah.ug", "user_1"],
    ]);
    expect(serializeMentions("@kofi.mensah.ug", overlapping)).toBe(
      "@[kofi.mensah.ug](user_1)"
    );
    expect(serializeMentions("@kofi.mensah", overlapping)).toBe("@[kofi.mensah](user_9)");
  });

  it("leaves a hand-typed handle that was never picked as plain text", () => {
    expect(serializeMentions("hi @someone.else", registry)).toBe("hi @someone.else");
  });

  it("does not touch an email that contains a picked handle", () => {
    expect(serializeMentions("mail joyce.elli@ug.edu.gh", registry)).toBe(
      "mail joyce.elli@ug.edu.gh"
    );
  });

  it("round-trips back to the same handle through the parser", () => {
    const stored = serializeMentions("hi @joyce.elli", registry);
    expect(parseMentions(stored)).toEqual([
      { type: "text", text: "hi " },
      { type: "mention", label: "joyce.elli", userId: "user_3" },
    ]);
  });
});

describe("hydrateMentions", () => {
  it("shows the writer a plain handle, never the marker", () => {
    const { text } = hydrateMentions("hi @[joyce.elli](user_3), see you");
    expect(text).toBe("hi @joyce.elli, see you");
  });

  it("restores the registry so a save re-writes the same marker", () => {
    const stored = "hi @[joyce.elli](user_3)";
    const { text, registry } = hydrateMentions(stored);
    expect(registry.get("joyce.elli")).toBe("user_3");
    expect(serializeMentions(text, registry)).toBe(stored);
  });

  it("survives an edit around the mention", () => {
    const { text, registry } = hydrateMentions("@[joyce.elli](user_3) hello");
    const edited = text.replace("hello", "good morning");
    expect(serializeMentions(edited, registry)).toBe("@[joyce.elli](user_3) good morning");
  });

  it("drops the mention when the writer edits the handle itself", () => {
    // Deliberate: an edited handle no longer names anyone, so it must not
    // silently keep pointing at the person who was there before.
    const { text, registry } = hydrateMentions("@[joyce.elli](user_3) hi");
    const edited = text.replace("@joyce.elli", "@joyce.ellison");
    expect(serializeMentions(edited, registry)).toBe("@joyce.ellison hi");
  });

  it("handles content with no mentions", () => {
    const { text, registry } = hydrateMentions("nothing here");
    expect(text).toBe("nothing here");
    expect(registry.size).toBe(0);
  });
});
