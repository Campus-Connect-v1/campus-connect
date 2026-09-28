import { conversationPreview } from "../preview";

const at = "2026-09-28T10:00:00.000Z";

describe("conversationPreview", () => {
  it("falls back when there is no message yet", () => {
    expect(conversationPreview({})).toBe("No messages yet");
    expect(
      conversationPreview({ lastMessage: { content: "", senderId: "u1", timestamp: at } })
    ).toBe("No messages yet");
  });

  it("shows an ordinary message as-is", () => {
    expect(
      conversationPreview(
        { lastMessage: { content: "on my way", senderId: "u1", timestamp: at } },
        "u2"
      )
    ).toBe("on my way");
  });

  it("names the story when they replied to yours", () => {
    expect(
      conversationPreview(
        { lastMessage: { content: "😂", senderId: "u1", timestamp: at, contextKind: "story" } },
        "u2"
      )
    ).toBe("Replied to your story: 😂");
  });

  it("names the story when you replied to theirs", () => {
    expect(
      conversationPreview(
        { lastMessage: { content: "😂", senderId: "u1", timestamp: at, contextKind: "story" } },
        "u1"
      )
    ).toBe("Replied to their story: 😂");
  });

  it("does not claim authorship when the viewer is unknown", () => {
    expect(
      conversationPreview(
        { lastMessage: { content: "🔥", senderId: "u1", timestamp: at, contextKind: "story" } },
        undefined
      )
    ).toBe("Replied to your story: 🔥");
  });

  it("ignores a context kind it does not know", () => {
    expect(
      conversationPreview(
        { lastMessage: { content: "hi", senderId: "u1", timestamp: at, contextKind: null } },
        "u2"
      )
    ).toBe("hi");
  });
});

describe("conversationPreview with an attachment", () => {
  const at = "2026-09-28T10:00:00.000Z";

  it("names a photo that has no caption", () => {
    // An image-only message carries a blank body, so without the media branch
    // this row would read "No messages yet" on a conversation with a photo.
    expect(
      conversationPreview(
        { lastMessage: { content: " ", senderId: "u1", timestamp: at, mediaType: "image" } },
        "u2"
      )
    ).toBe("Photo");
  });

  it("names a video", () => {
    expect(
      conversationPreview(
        { lastMessage: { content: "", senderId: "u1", timestamp: at, mediaType: "video" } },
        "u2"
      )
    ).toBe("Video");
  });

  it("keeps the caption alongside the label", () => {
    expect(
      conversationPreview(
        { lastMessage: { content: "look", senderId: "u1", timestamp: at, mediaType: "image" } },
        "u2"
      )
    ).toBe("Photo: look");
  });

  it("prefers the attachment label over a story quote", () => {
    expect(
      conversationPreview(
        {
          lastMessage: {
            content: "",
            senderId: "u1",
            timestamp: at,
            mediaType: "image",
            contextKind: "story",
          },
        },
        "u2"
      )
    ).toBe("Photo");
  });
});
