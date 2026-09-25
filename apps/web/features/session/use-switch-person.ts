"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signOutAction, switchPerson } from "./actions";

/**
 * Signs in as another seed person and re-renders the current page with the new
 * session, so the isolation is visible right where you are (TASK-003, Q11).
 */
export function useSwitchPerson() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function switchTo(key: string, onDone?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await switchPerson(key);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onDone?.();
      router.refresh();
    });
  }

  function signOut(onDone?: () => void) {
    startTransition(async () => {
      await signOutAction();
      onDone?.();
      router.push("/");
      router.refresh();
    });
  }

  return { switchTo, signOut, isPending, error };
}
