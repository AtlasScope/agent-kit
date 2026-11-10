// The sign-in screens and the account menu, drawn in the site's own colours and type. Every value is a CSS
// variable from globals.css, so Clerk follows the light and dark settings like the rest of the page.
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--color-accent)",
    colorPrimaryForeground: "var(--color-accent-ink)",
    colorBackground: "var(--color-paper-2)",
    colorForeground: "var(--color-ink)",
    colorMuted: "var(--color-paper-3)",
    colorMutedForeground: "var(--color-muted)",
    colorNeutral: "var(--color-ink)",
    colorInput: "var(--color-paper)",
    colorInputForeground: "var(--color-ink)",
    colorBorder: "var(--color-rule-2)",
    colorRing: "var(--color-focus)",
    colorShadow: "transparent",
    fontFamily: "var(--font-body)",
    fontFamilyButtons: "var(--font-body)",
    borderRadius: "10px",
  },
  elements: {
    cardBox: { boxShadow: "none", border: "1px solid var(--color-rule)", borderRadius: "14px" },
    card: { boxShadow: "none" },
    headerTitle: { fontWeight: 650, letterSpacing: "-0.015em" },
    formButtonPrimary: { borderRadius: "999px", backgroundImage: "none", boxShadow: "none", fontWeight: 600, minHeight: "40px" },
    socialButtonsBlockButton: { borderRadius: "999px", boxShadow: "none", minHeight: "40px", border: "1px solid var(--color-rule-2)" },
    formFieldInput: { boxShadow: "none", minHeight: "40px" },
    footer: { backgroundImage: "none", background: "var(--color-paper-2)" },
  },
};
