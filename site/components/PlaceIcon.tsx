// Line icons for the places on the site, shared by the site menu (NavMenu) and the install page's Explore drawer
// (InstallPaths), so both lists read as one family.
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const PATHS: Record<string, React.ReactNode> = {
  prompts: <path {...stroke} d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16h-8l-4.5 3.5V16H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5z" />,
  skills: <path {...stroke} d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8zM3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5" />,
  kits: <path {...stroke} d="m12 3 8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9" />,
  fix: <path {...stroke} d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3zM14.5 6.5 17 4l3 3-2.5 2.5" />,
  start: <path {...stroke} d="M3 9.5 12 5l9 4.5-9 4.5zM7 11.5v4c1.5 1.3 3.2 2 5 2s3.5-.7 5-2v-4M21 9.5V14" />,
};
export const PlaceIcon = ({ name }: { name: string }) => <svg className="i places__i" viewBox="0 0 24 24" aria-hidden="true">{PATHS[name]}</svg>;
export const Chevron = () => <svg className="i places__go" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
