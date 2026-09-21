import { ScrollView, View } from "react-native";

import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { Text } from "@/src/components/ui";
import { spacing } from "@/src/styles/theme";

export interface LegalSection {
  heading: string;
  body: string[];
}

/**
 * Shared shell for the policy documents.
 *
 * Deliberately plain: legal copy is read, not browsed, so it gets one column,
 * generous line length and no cards or accent colour competing with the text.
 */
export function LegalDocument({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <SettingsShell title={title}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing["3xl"],
          gap: spacing.lg,
        }}
      >
        <View style={{ gap: spacing.xs }}>
          <Text variant="micro" color="textMuted">
            LAST UPDATED {updated.toUpperCase()}
          </Text>
          <Text variant="body" color="textSecondary">
            {intro}
          </Text>
        </View>

        {sections.map((section) => (
          <View key={section.heading} style={{ gap: spacing.xs }}>
            <Text variant="heading">{section.heading}</Text>
            {section.body.map((paragraph) => (
              <Text key={paragraph} variant="body" color="textSecondary">
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </SettingsShell>
  );
}
