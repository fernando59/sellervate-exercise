"use server";

import { signInAsDemoPerson, signOut, type DemoSignInResult } from "@/server/auth/demo-users";

/**
 * Server actions behind the user switcher. The person key is checked against
 * the fixed list on the server; nothing else from the client is used.
 */
export async function switchPerson(key: string): Promise<DemoSignInResult> {
  return signInAsDemoPerson(key);
}

export async function signOutAction(): Promise<void> {
  await signOut();
}
