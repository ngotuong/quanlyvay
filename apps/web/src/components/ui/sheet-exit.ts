/** Keep a native modal mounted until its selected CSS exit completes. */
export function afterSheetExit(element: HTMLDialogElement | null, complete: () => void): () => void {
  if (!element?.open || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    complete();
    return () => {};
  }
  element.classList.add("is-closing");
  const style = getComputedStyle(element);
  const durations = style.animationDuration.split(",").map(value => parseFloat(value) * (value.trim().endsWith("ms") ? 1 : 1000));
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    element.removeEventListener("animationend", ended);
    element.classList.remove("is-closing");
    complete();
  };
  const ended = (event: AnimationEvent) => { if (event.target === element && !event.pseudoElement) finish(); };
  const timer = setTimeout(finish, Math.max(0, ...durations) + 50);
  element.addEventListener("animationend", ended);
  return () => { done = true; clearTimeout(timer); element.removeEventListener("animationend", ended); element.classList.remove("is-closing"); };
}
