import { randomUUID } from "node:crypto";

// A server-only marker acknowledges that the new page tree actually reached the DOM.
export function RenderRevision() {
  return <span hidden data-render-revision={randomUUID()} />;
}
