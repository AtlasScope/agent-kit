// Five short lessons that build on the /start reading-list app. One idea and one action each:
// explain, act, see the result, and know the usual way it goes wrong.
export type Lesson = {
  slug: string;
  title: string;
  idea: string[];        // plain explanation
  terms?: [string, string][]; // words introduced here, defined in one line each
  action: { label: string; text: string; note?: string };
  contrast?: { label: string; text: string; note: string }; // the weaker version, for comparison
  expect: string;
  wrong: [string, string];
};

export const STARTER = {
  kit: "design-kit",
  skills: [
    ["design", "Describe what you want changed on a page in plain words. It picks the right design skill and says why."],
    ["ux-writing", "Button labels, empty states, error messages: the words inside the interface."],
    ["web-typography", "Fonts, sizes and spacing so text is easy to read on any screen."],
  ] as [string, string][],
};

export const LESSONS: Lesson[] = [
  {
    slug: "agents",
    title: "What a coding agent does",
    idea: [
      "A coding agent reads the files in your project folder, decides what to change, and changes them. It can also run commands, such as starting a preview. It works from what you type plus what it finds in the folder, so it only knows your project as well as those files describe it.",
      "Asking for an explanation is the safest first request, because it changes nothing. It also shows you whether the agent understood the project before you ask it to change anything.",
    ],
    action: {
      label: "Copy the request",
      text: "Explain what index.html does, section by section, in plain words. Don't change any files.",
      note: "Paste it into the agent, in the reading-list folder from the guide.",
    },
    expect: "A short tour of the file: the page layout, the form, the list, and the part that saves to localStorage. GitHub Desktop shows no changed files.",
    wrong: ["The agent edited the file anyway.", "Undo it in GitHub Desktop (right-click the file, Discard changes), then repeat the request and keep the last sentence."],
  },
  {
    slug: "asking",
    title: "How to ask for a change",
    idea: [
      "A good request says three things: what to change, what to leave alone, and how you'll know it's done. Agents fill gaps with guesses. A vague request like \"make it better\" invites a rewrite you didn't want.",
      "Keep each request to one change. If you want three things, ask three times and check each one.",
    ],
    action: {
      label: "Copy the request",
      text: "In index.html, show how many books are still unread above the list, for example \"3 to read\". Don't change anything else. It's done when the number updates as I add, mark and delete books.",
    },
    contrast: {
      label: "The vague version",
      text: "Make the reading list better.",
      note: "This leaves every decision to the agent: what \"better\" means, how much to change, and when to stop.",
    },
    expect: "One new line above the list, and a change to one file. Add a book, mark it read, delete it, and the count follows.",
    wrong: ["The agent changed the layout or colors too.", "Reply: \"Undo everything except the unread count.\" Then name the part you wanted kept."],
  },
  {
    slug: "prompts",
    title: "What a prompt is",
    idea: [
      "A prompt is any text you paste into an agent. The ones in Agent Kit's library add what a quick request leaves out: what to look at, what evidence to bring back, and what not to touch. That way you can check the answer yourself instead of trusting that the agent looked.",
      "Compare the two below. The short one lets the agent decide what \"checked\" means, so a confident \"looks good\" can rest on nothing. The longer one names the cases, asks for steps you can repeat, and says not to fix anything yet, so you see the problems before any code changes. Neither is guaranteed to find every bug; the second one shows its work.",
    ],
    terms: [
      ["Prompt", "Words you paste into the agent. Nothing to install."],
      ["MCP server", "An optional way for an agent to fetch prompts from the library itself. You don't need it to use any of this."],
    ],
    action: {
      label: "Copy the prompt",
      text: "Find where the reading list can lose data or show the wrong thing. Try: refreshing, having the app open in two tabs, a very long title, an empty title, and deleting the last book. For each case give the steps, what you expected, what happened, and the line in index.html responsible. Don't fix anything yet.",
    },
    contrast: {
      label: "The generic version",
      text: "Check my app for bugs.",
      note: "You get an answer, but no way to tell what was tried.",
    },
    expect: "A list of cases, each with steps you can repeat in the browser. Try one yourself and see whether you get the same result.",
    wrong: ["The agent fixed things without being asked.", "Reply: \"Undo the changes and just report.\" Then decide which fixes you want, one request at a time."],
  },
  {
    slug: "skills",
    title: "When a skill helps",
    idea: [
      "A skill is a set of instructions the agent loads for one kind of job, written by someone who does that job well. You call it by name, like /design, and it brings checks and habits you'd otherwise have to type every time.",
      "A plugin, which Agent Kit calls a kit, is a group of skills you install together. Start with design-kit and the three skills below. The rest of the catalog is there when you need it, not before.",
      "A skill helps when the job has known pitfalls. Writing an empty-state message sounds simple, but good ones tell people what to do next, and a skill like ux-writing knows that. A one-line text change doesn't need a skill.",
    ],
    terms: [
      ["Skill", "Reusable instructions for one kind of job. You call it with a slash, like /design."],
      ["Kit or plugin", "A group of skills you install in one step."],
    ],
    action: {
      label: "Copy the request",
      text: "/design write a friendlier message for when the reading list has no books yet",
      note: "Needs design-kit, which step 4 of the guide installs.",
    },
    expect: "The first line names the skill /design picked (likely ux-writing) and why. Delete every book and the new message shows, with a hint about what to do first.",
    wrong: ["/design isn't recognized.", "Start a new session in the project folder. Skills load when a session starts."],
  },
  {
    slug: "checking",
    title: "How to check a change",
    idea: [
      "An agent saying \"done\" isn't proof. Before you commit, check three things: which files changed and how (GitHub Desktop shows each changed line), that the feature works in the browser, and that what worked before still works.",
      "The easiest habit is to ask for the check before the change. The agent tells you how you'll know it worked, and you have a test to run that doesn't depend on its say-so.",
    ],
    action: {
      label: "Copy the request",
      text: "I want a button that sorts the list by title. Before you change anything, tell me exactly how I'll check it works, including at phone width. Then make the change and list what changed in which file.",
    },
    expect: "A short checklist first, then the change. Run the checklist yourself, look at the changed lines in GitHub Desktop, and only then commit.",
    wrong: ["Something that used to work is now broken.", "Don't commit. Discard the changes in GitHub Desktop, or reply: \"Adding a book stopped working after your change. Find out why and fix only that.\""],
  },
];

export const lessonIndex = (slug: string) => LESSONS.findIndex((l) => l.slug === slug);
