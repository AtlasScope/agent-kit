"use client";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export function AuthNav() {
  return (
    <>
      <Show when="signed-out"><SignInButton mode="modal"><button className="btn" type="button">Sign in</button></SignInButton></Show>
      <Show when="signed-in"><a className="btn" href="/account">Collections</a><UserButton /></Show>
    </>
  );
}
