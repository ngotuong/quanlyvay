export function captureRender(document, location) {
  return { revision: document.querySelector("[data-render-revision]")?.getAttribute("data-render-revision"), url: location.href };
}

export function recoverUncommittedRender(before, { document, location, schedule = setTimeout }) {
  if (!before.revision) return;
  schedule(() => {
    const after = captureRender(document, location);
    if (after.url === before.url && after.revision === before.revision) {
      // GET only: never retry the financial write. Native beforeunload guards still
      // protect any other dirty form. A successful render or navigation cancels this.
      location.reload();
    }
  }, 3000);
}
