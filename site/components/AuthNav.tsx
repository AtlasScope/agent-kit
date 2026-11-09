"use client";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export function AuthNav() {
  return (
    <>
      <Show when="signed-out"><SignInButton mode="modal" withSignUp><button className="btn btn--sm" type="button">Sign in</button></SignInButton></Show>
      <Show when="signed-in">
        <a className="btn btn--sm" href="/account">
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>
          Starred
        </a>
        <UserButton />
      </Show>
    </>
  );
}
