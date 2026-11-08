# Build the site on Next.js from the start, with accounts alongside the library

We considered keeping the site as a static Node build and moving to Next.js only once traffic justified accounts, but chose to build on Next.js on Vercel now and add sign-in (Clerk) at the same time as the public library pages. Library pages stay pre-rendered and public, so search reach is the same either way; doing the switch once avoids porting the site later.
