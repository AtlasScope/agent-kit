// Design commands on the site are grouped by the job they do, not by who wrote them. The author stays on each
// card ("By Impeccable") and on its page. Every design command in library/library.json must be listed here
// exactly once; build-content fails otherwise, so a new command gets a job when it is added.
export const DESIGN_JOBS = [
  ["Start here", "The routers that pick a skill for you, and one-time setup.",
    ["UI028", "UI106", "UI100", "UI001", "UI002", "UI025", "UI026", "UI027"]],
  ["Plan and build screens", "Work out how a screen should work, then build it or try versions.",
    ["UI003", "UI004", "UI005", "UI051", "UI054", "UI055", "UI056", "UI058", "UI036", "UI062", "UI023", "UI024", "UI075", "UI076", "UI082", "UI032"]],
  ["Review and test", "Find what's wrong before people do: usability, accessibility, craft and broken states.",
    ["UI006", "UI007", "UI038", "UI029", "UI039", "UI040", "UI052", "UI057", "UI074", "UI031", "UI061", "UI081"]],
  ["Polish and refine", "Make a working screen feel finished: louder, quieter, simpler or sturdier.",
    ["UI008", "UI034", "UI059", "UI009", "UI010", "UI011", "UI012", "UI018", "UI019", "UI053", "UI021", "UI022", "UI060", "UI072"]],
  ["Type, colour and layout", "Fonts, colour systems, contrast and spacing.",
    ["UI016", "UI033", "UI015", "UI044", "UI045", "UI017"]],
  ["Motion", "Plan, build, review and fix anything that moves.",
    ["UI101", "UI102", "UI103", "UI104", "UI105", "UI014", "UI063", "UI035", "UI064", "UI065", "UI066", "UI067", "UI068", "UI069"]],
  ["Words in the product", "Clear interface text, and finding and removing signs of AI writing.",
    ["UI020", "UI046", "UI083", "UI084", "UI091", "UI092", "UI093", "UI094", "UI095", "UI096", "UI097", "UI098", "UI099", "UI085", "UI086", "UI087", "UI088", "UI089", "UI090"]],
  ["Growth and onboarding", "First-run screens, landing copy, sign-ups and people coming back.",
    ["UI013", "UI047", "UI048", "UI049", "UI041", "UI042", "UI043"]],
  ["Native apps", "iPhone and iPad design, SwiftUI and Swift.",
    ["UI037", "UI050", "UI073"]],
  ["Libraries, art and media", "Picking UI libraries, notices, posters, generative art and GIFs.",
    ["UI070", "UI071", "UI077", "UI078", "UI079", "UI080"]],
];
