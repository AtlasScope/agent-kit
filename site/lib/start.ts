// The /start guide: one small project, a reading list saved in the browser, from no agent to a
// public URL. One file, no packages, no database, no API keys, so the first win needs no setup
// beyond the agent, GitHub and Vercel. Each step ends in something the reader can see.
//
// Status: written against the official download and sign-up pages on 9 Nov 2026. Not yet tested
// with a first-time user; TESTED stays null until it is.
export const TESTED: string | null = null;

export type Action = { kind: "copy"; label: string; text: string } | { kind: "link"; label: string; href: string };
export type Step = {
  slug: string;
  title: string;      // what the reader does, as a verb
  goal: string;       // one line for the overview
  body: string[];     // plain paragraphs, in order
  actions: Action[];
  expect: string;     // what success looks like
  wrong: [string, string][]; // [what you see, what to do]
  os?: { mac: string; windows: string };
};

export const REQUEST =
  "In this folder, make a reading-list web app as a single index.html file, with no build step and no packages. I can add a book with its title and author, mark it as read, and delete it. Save the list in the browser's localStorage so it survives a refresh. When you're done, tell me how to open it in my browser.";

export const IMPROVE = "/design the reading list feels cramped on my phone";

export const FEATURE =
  "Add a search box above the list that filters books by title or author as I type. Keep everything in index.html. Tell me how to check it works.";

export const STEPS: Step[] = [
  {
    slug: "choose",
    title: "Pick your agent",
    goal: "Choose the coding agent you'll use for the whole guide.",
    body: [
      "A coding agent is an AI that can read and change the files in a folder on your computer. You describe what you want in plain words, it does the work and shows you what changed, and you decide what to keep.",
      "This guide uses the Claude desktop app, which runs Claude Code without a terminal, on Mac and Windows. It needs a paid Claude plan. If you already use Codex or Cursor, keep using it: every request in this guide is plain text you can paste into any agent. Only step 4 has agent-specific commands, and the home page lists them for each agent.",
    ],
    actions: [{ kind: "link", label: "Download the Claude app", href: "https://claude.ai/download" }],
    expect: "The app opens, you're signed in, and you can see the Code section.",
    wrong: [
      ["The app asks you to upgrade before you can use Code.", "Claude Code needs a paid plan. Pick a plan, or use an agent you already pay for."],
      ["You're not sure which agent to choose.", "Use the one you already have an account for. Switching later doesn't change anything you build."],
    ],
  },
  {
    slug: "prepare",
    title: "Set up GitHub and Vercel",
    goal: "Make the two free accounts that save and publish your project.",
    body: [
      "GitHub stores your project's files and every change to them, so you can always go back. Vercel takes what's on GitHub and puts it on the web at a public address. Both are free for a small personal project.",
      "GitHub Desktop is an app for saving changes to GitHub with buttons instead of commands. You won't need a terminal anywhere in this guide.",
    ],
    actions: [
      { kind: "link", label: "Create a GitHub account", href: "https://github.com/signup" },
      { kind: "link", label: "Download GitHub Desktop", href: "https://desktop.github.com/download/" },
      { kind: "link", label: "Sign up for Vercel", href: "https://vercel.com/signup" },
    ],
    os: {
      mac: "Open the downloaded file and drag GitHub Desktop into Applications, then open it from there.",
      windows: "Run the downloaded installer. GitHub Desktop opens when it finishes.",
    },
    expect: "GitHub Desktop shows you as signed in. On Vercel, choose the Hobby plan and Continue with GitHub, so the two accounts are linked.",
    wrong: [
      ["GitHub Desktop asks you to sign in again.", "Choose Sign in to GitHub.com and finish in the browser window it opens."],
      ["Vercel asks for a team name or a card.", "Choose Hobby. It's the free plan and needs no card."],
    ],
  },
  {
    slug: "create",
    title: "Make the app",
    goal: "Create a project folder and ask the agent for a reading-list app.",
    body: [
      "In GitHub Desktop, choose File, then New repository. Name it reading-list, leave the other fields as they are, and choose Create repository. This makes a folder on your computer that GitHub Desktop watches for changes.",
      "In the Claude app, open Code and choose that reading-list folder as the project. Then paste the request below into the chat box.",
      "The agent will ask before it creates a file. Read what it plans to do, then allow it.",
    ],
    actions: [{ kind: "copy", label: "Copy the request", text: REQUEST }],
    expect: "A file called index.html appears in the folder. Double-click it to open it in your browser. Add a book, refresh the page, and the book is still there.",
    wrong: [
      ["The agent made several files, or a package.json.", "Reply: \"Keep it to one index.html with no build step and no packages.\""],
      ["The agent started a server and gave you a localhost address.", "That works too: open the address. When you're done, ask the agent to stop the server."],
      ["The book disappears when you refresh.", "Reply: \"The list is lost on refresh. Save it in localStorage and load it when the page opens.\""],
    ],
  },
  {
    slug: "improve",
    title: "Improve it with Agent Kit",
    goal: "Install design-kit and use /design to fix one concrete problem.",
    body: [
      "A skill is a set of reusable instructions that teaches the agent how an expert would do one kind of job. A kit, also called a plugin, is a group of skills you install together. design-kit is the one to start with. It adds /design, which reads your request and picks the right design skill for it, so you don't have to know their names.",
      "Paste the two install lines into the chat box one at a time. Then start a new session in the same folder, so the agent loads the new skills.",
      "Make the browser window narrow, about as wide as a phone, and look at the list. Then type the /design request below.",
    ],
    actions: [
      { kind: "copy", label: "Copy the install lines", text: "/plugin marketplace add AtlasScope/agent-kit\n/plugin install design-kit@agent-kit" },
      { kind: "copy", label: "Copy the /design request", text: IMPROVE },
    ],
    expect: "The agent's first line names the skill it picked and why. It changes index.html. Refresh the browser at the same narrow width, and the list has more room and larger tap targets.",
    wrong: [
      ["/design isn't recognized.", "Start a new session in the reading-list folder. Skills load when a session starts."],
      ["The agent says a skill it wanted isn't installed.", "That's fine. It uses the closest installed skill and tells you which one. You don't need to install anything else."],
      ["You don't like the change.", "Reply: \"Undo that change.\" Nothing is saved to GitHub until you commit in step 5."],
    ],
  },
  {
    slug: "save",
    title: "Save it to GitHub",
    goal: "Commit the files and publish the repository.",
    body: [
      "GitHub Desktop now lists the changed files. A commit is a saved snapshot with a short note. Type a summary such as \"First version of the reading list\" and choose Commit to main.",
      "Then choose Publish repository. Leave \"Keep this code private\" ticked unless you want anyone to be able to read your code. Vercel works with private repositories.",
      "Never paste a password or API key into a prompt, a file or a commit. Anything committed stays in the project's history, even after you delete it from the file. This project has no secrets, which is one reason it's the first project.",
    ],
    actions: [],
    expect: "Choose View on GitHub. The page shows index.html and your commit note.",
    wrong: [
      ["Publish asks you to sign in.", "Sign in to GitHub.com in GitHub Desktop's settings, then publish again."],
      ["You committed something you didn't mean to.", "In the History tab, right-click the commit and choose Revert changes in commit. That adds a new commit that undoes it."],
    ],
  },
  {
    slug: "deploy",
    title: "Put it on the web",
    goal: "Import the repository into Vercel and get a public address.",
    body: [
      "On Vercel, choose Add New, then Project. Find reading-list in the list of your GitHub repositories and choose Import. If it isn't listed, choose the option to adjust GitHub app permissions and allow access to that repository.",
      "Leave the settings as they are and choose Deploy. Vercel serves index.html as it is; there's nothing to build.",
    ],
    actions: [{ kind: "link", label: "Open Vercel's import page", href: "https://vercel.com/new" }],
    expect: "After about a minute Vercel shows a preview and an address ending in .vercel.app. Open it, and it's your reading list.",
    wrong: [
      ["The deploy shows 404: NOT_FOUND.", "Check that index.html is at the top of the repository on GitHub, not inside another folder."],
      ["Vercel can't see the repository.", "Use Adjust GitHub App Permissions on the import page and grant access to reading-list."],
    ],
  },
  {
    slug: "verify",
    title: "Check the live app",
    goal: "Try it on your phone and learn where the data lives.",
    body: [
      "Open the .vercel.app address on your phone. Add a book, refresh, and check that it's still there.",
      "Now open the same address on your computer. The book you added on your phone isn't there. localStorage keeps the list inside one browser on one device. Clearing your browsing data deletes it, and a private window starts empty. That's the trade-off for needing no database or account, and it's fine for a personal list.",
    ],
    actions: [],
    expect: "The app works on your phone, and you can explain why your phone and your computer show different lists.",
    wrong: [
      ["The phone shows an old version.", "Pull down to refresh, or close the tab and open the address again."],
      ["You want the same list on every device.", "That needs a database and sign-in, which is a bigger project. Finish step 8 first."],
    ],
  },
  {
    slug: "repeat",
    title: "Make a change on your own",
    goal: "Add one feature and ship it, without a tutorial.",
    body: [
      "This is the whole loop: ask the agent for a change, check it in the browser, commit and push in GitHub Desktop, and Vercel publishes it. Try it with the request below, or with a feature you want.",
      "After you commit, choose Push origin in GitHub Desktop. Vercel deploys every push to main by itself.",
    ],
    actions: [{ kind: "copy", label: "Copy the feature request", text: FEATURE }],
    expect: "About a minute after you push, the live address has the search box.",
    wrong: [
      ["The live site didn't change.", "Check that you chose Push origin after committing. On Vercel, the project's Deployments tab shows whether a new deploy ran."],
      ["The change broke the app.", "Ask the agent to fix it, or revert the commit in GitHub Desktop's History tab and push again."],
    ],
  },
];

export const stepIndex = (slug: string) => STEPS.findIndex((s) => s.slug === slug);
