"use client";

import { useActionState, useState } from "react";
import { resetDemoAction, type ResetState } from "@/app/console/actions";
import { Button } from "@/components/ui/button";

/** Two-step: the first press asks, the second wipes. Confirm sits apart from Cancel. */
export function ResetDemo() {
  const [asking, setAsking] = useState(false);
  const [state, action, pending] = useActionState<ResetState>(async () => {
    const next = await resetDemoAction();
    setAsking(false);
    return next;
  }, {});

  if (!asking) {
    return (
      <div className="flex items-center gap-3">
        {state.done && <span role="status" className="text-[12.5px] text-led-green">Demo reset</span>}
        {state.error && <span role="alert" className="text-[12.5px] text-led-red">Reset failed</span>}
        <Button variant="board" size="sm" onClick={() => setAsking(true)}>
          Reset demo
        </Button>
      </div>
    );
  }
  return (
    <form action={action} className="flex items-center gap-3">
      <span className="text-[12.5px] text-led-text/80 max-md:hidden">Wipes every case and reseeds the 7 demo cases.</span>
      <Button type="button" variant="board" size="sm" onClick={() => setAsking(false)}>
        Cancel
      </Button>
      <span aria-hidden className="w-4" />
      <Button type="submit" size="sm" disabled={pending} className="bg-led-red text-board hover:bg-led-red/85">
        {pending ? "Resetting…" : "Confirm reset"}
      </Button>
    </form>
  );
}
