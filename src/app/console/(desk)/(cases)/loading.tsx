import { CaseFileWaiting } from "@/components/console/waiting";

/** Opening another case: the queue stays on the desk, only the case file waits. */
export default function Loading() {
  return <CaseFileWaiting />;
}
