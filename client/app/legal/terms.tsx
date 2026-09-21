import { LegalDocument } from "@/src/components/settings/LegalDocument";

/** A starting draft. It needs a legal review before launch. */
export default function TermsScreen() {
  return (
    <LegalDocument
      title="Terms of Service"
      updated="21 September 2026"
      intro="These terms cover your use of Campus Connect. By creating an account you agree to them."
      sections={[
        {
          heading: "Who can use Campus Connect",
          body: [
            "You need a valid email address at a participating university, and you must be old enough to hold an account under the law where you live.",
            "One account per person. You are responsible for what happens under your account, so keep your sign-in details to yourself.",
          ],
        },
        {
          heading: "Your content",
          body: [
            "You keep ownership of what you post. You give us permission to host and display it so the app can show it to the people you posted it to.",
            "Only post content you have the right to share. That includes photos and video of other people.",
            "You can delete your content at any time.",
          ],
        },
        {
          heading: "What is not allowed",
          body: [
            "Harassment, bullying, threats, or hate speech directed at anyone.",
            "Sexual content involving minors, or any content that is illegal where you or your university is located.",
            "Spam, scams, impersonating another person, or bulk messaging students.",
            "Sharing another student's location, contact details, or private information without their agreement.",
            "Attempting to break, overload or reverse engineer the service.",
          ],
        },
        {
          heading: "Reporting and moderation",
          body: [
            "You can report any post from its options menu, and you can hide posts you would rather not see.",
            "We review reports and may remove content or suspend accounts that break these terms.",
            "We will tell you if we act on your account, unless doing so would put someone at risk.",
          ],
        },
        {
          heading: "Events and groups",
          body: [
            "Events and study groups are created by students, not by us. We do not organise them and we are not responsible for what happens at them.",
            "Use ordinary judgement when meeting people you have met through the app, and meet in public where you can.",
          ],
        },
        {
          heading: "The service itself",
          body: [
            "Campus Connect is provided as is. We work to keep it available but we cannot promise it will never be interrupted.",
            "Features may change. If we make a significant change to these terms we will tell you in the app before it takes effect.",
          ],
        },
        {
          heading: "Ending your account",
          body: [
            "You can delete your account at any time from Settings, Account.",
            "We may suspend or close an account that repeatedly or seriously breaks these terms.",
          ],
        },
      ]}
    />
  );
}
