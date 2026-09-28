import {
  activeMentionQuery,
  hasMentions,
  parseMentions,
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

  it("allows one space so a surname still matches", () => {
    expect(at("hi @kofi men")).toEqual({ query: "kofi men", start: 3 });
  });

  it("closes after two spaces, where the user has moved on", () => {
    expect(at("hi @kofi mensah said")).toBeNull();
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
