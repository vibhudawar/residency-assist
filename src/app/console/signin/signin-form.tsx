"use client";

import { useActionState } from "react";
import { signInOfficer, type SignInState } from "@/app/console/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERRORS = {
  wrong: "That passcode isn't right. Check it and try again.",
  not_set: "No officer passcode is configured. Add OFFICER_PASSCODE to .env and restart the server.",
} as const;

export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInOfficer, {});
  return (
    <form action={action} className="mt-6 grid gap-2">
      <Label htmlFor="passcode" className="text-[14px] font-medium">
        Officer passcode
      </Label>
      <Input
        id="passcode"
        name="passcode"
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        aria-invalid={!!state.error || undefined}
        aria-describedby={state.error ? "passcode-error" : undefined}
        className="h-11 rounded-[6px] border-input bg-paper px-3.5 font-mono text-[15px] focus-visible:border-ink focus-visible:ring-ring/30"
      />
      {state.error && (
        <p id="passcode-error" role="alert" className="text-[13px] text-officer">
          {ERRORS[state.error]}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} className="mt-3 w-full">
        {pending ? "Checking…" : "Open the console"}
      </Button>
    </form>
  );
}
