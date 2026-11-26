/* REPLACE: what the studio knows about the project. Fill this in; the engine below it is built from the skill and stays as it is. */
const PROJECT={
  name:'Your project',                 // shown in the title and the spec
  noun:'main button',                  // what is being designed: 'install button', 'checkout button'
  measured:false,                      // true when the values in `today` were measured from the project
  startName:'',                        // first starting point; default 'Today' when measured, else 'Simple start'
  brand:['Blue',255,.17,.64],          // [plain name, oklch hue, chroma, lightness] of today's button colour
  pageBg:'',                           // the project's page background, e.g. '#000000'; adds a "Your page" background and starts there
  column:0,                            // width in px of the content column the button sits in on a computer; 0 means 440
  font:'',                             // CSS font-family of today's button; adds a "Your project's" lettering choice
  fontCss:'',                          // optional @font-face or @import CSS so that font loads here
  labels:['Get started','Continue','Try it free','Start now'], // words to offer: 'text' or ['text','why it fits']; first is today's
  subs:[],                             // optional second-line choices: 'text' or ['text','why']
  action:{copy:'',done:'Done',nextLine:'',nextSteps:[],cta:''}, // copy: text put on the clipboard; done: the word shown after; cta: the next step's button
  choices:{noun:'option',items:[]},    // a choice the button can carry: items are [name, colour, letter, one-line description]; none drops those steps
  secondary:[],                        // quieter actions that can sit beside it, e.g. ['Preview','Learn more']
  system:[],                           // how the project's buttons are built today, in plain sentences; the spec passes them on as context, never as limits
  specRules:'Honour reduced motion.',  // sentence after "Build the ... to this spec."
  afterNote:'',                        // one plain sentence about what happens after pressing, e.g. 'The prompt is never shown.'
  dropSteps:[],                        // step ids to leave out: 'motion','split','confirm','menu'
  today:{}                             // measured values keyed like DEFAULTS in the engine (shape, h, rr, material, label, wt, font, case, hover, press ...)
};
