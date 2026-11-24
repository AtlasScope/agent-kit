import { KIT_GUIDE } from "@/lib/site";

// What a person types in Claude Code to run a skill installed with its kit. A kit whose KIT_GUIDE commands are
// namespaced (/experience-architecture:diagnose) namespaces every one of its skills, including ones KIT_GUIDE
// doesn't list (/experience-architecture:verify); every other skill runs as /<name>. A skill installed alone with
// `npx skills` is a plain skill and always runs as /<name>.
export function commandFor(kit: string, name: string) {
  const namespaced = KIT_GUIDE[kit]?.type.some((t) => t.startsWith(`/${kit}:`));
  return namespaced ? `/${kit}:${name}` : `/${name}`;
}
