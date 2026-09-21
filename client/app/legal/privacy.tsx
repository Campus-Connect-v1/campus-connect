import { LegalDocument } from "@/src/components/settings/LegalDocument";

/**
 * A starting draft, not cleared copy.
 *
 * Every claim below describes what the app actually does today (campus
 * location while open, Cloudinary media, device-local saves). It still needs a
 * lawyer's pass and a real contact address before launch.
 */
export default function PrivacyPolicyScreen() {
  return (
    <LegalDocument
      title="Privacy Policy"
      updated="21 September 2026"
      intro="This explains what Campus Connect collects, why, and what control you have over it."
      sections={[
        {
          heading: "What we collect",
          body: [
            "Your account details: name, campus email address, university, and anything you choose to add to your profile such as a bio, programme, year and profile picture.",
            "Content you create: posts, comments, stories, events and study groups, including any photos or videos you attach.",
            "Location, only while the app is open and only if you turn it on. It is used to show you students nearby and to place you on the campus map.",
            "Basic technical information needed to keep the service running, such as your sign-in session and the device you are signed in on.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "To show you people, events and groups on your campus, and to let other students find you.",
            "To deliver the notifications you have switched on.",
            "To keep the service safe, including reviewing content that students report.",
            "We do not sell your personal information, and we do not use your content to advertise to you.",
          ],
        },
        {
          heading: "Who can see what",
          body: [
            "Your privacy settings control your visibility. You can leave people discovery, hide your exact location so only an approximate distance is shown, and hide your activity status.",
            "Stories can be limited to your connections, your university, or everyone on Campus Connect, and they expire after 24 hours.",
            "Turning off discovery removes you from the nearby list. It does not delete content you have already posted.",
          ],
        },
        {
          heading: "Location",
          body: [
            "Location is requested only when you open a feature that needs it, never on first launch.",
            "It is collected while the app is in the foreground. Campus Connect does not track you in the background.",
            "You can switch it off at any time in Settings, or revoke the permission in your device settings.",
          ],
        },
        {
          heading: "Photos and video",
          body: [
            "Media you attach is uploaded to our media host and served from there. Anyone who can see the post, story or profile it belongs to can see the file.",
            "Deleting a post or story removes it from the app.",
          ],
        },
        {
          heading: "Data stored on your device",
          body: [
            "Your sign-in token, your appearance choice and your saved posts are stored on your device. Saved posts are not synced, so they do not follow you to another phone.",
            "Signing out clears the sign-in token from the device.",
          ],
        },
        {
          heading: "Your choices",
          body: [
            "You can edit or remove most profile information at any time from Settings, Account.",
            "You can delete your account from Settings, Account. This removes your profile and your content.",
            "You can ask us for a copy of your data, or ask us to correct it.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "Questions about this policy, or about your data, can be sent to the address published on the Campus Connect support page.",
          ],
        },
      ]}
    />
  );
}
