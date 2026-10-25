/**
 * Coalesce bursts of calls into one run, `delayMs` after the first call.
 *
 * Every caller gets the same promise and should await it: on 2nd-gen
 * functions CPU is throttled once a handler returns, so a fire-and-forget
 * timer may never run. Calls that arrive while a run is in progress start
 * the next window, so a write during a publish is never lost.
 */
function createCoalescedRunner(task, delayMs = 8000, { sleep } = {}) {
  const wait = sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  let pending = null;
  return function schedule() {
    if (pending) return pending;
    pending = (async () => {
      await wait(delayMs);
      pending = null;
      return task();
    })();
    return pending;
  };
}

module.exports = { createCoalescedRunner };
