const test = require("node:test");
const assert = require("node:assert/strict");
const { createCoalescedRunner } = require("./coalesce");

test("a burst of calls runs the task once and every caller waits for it", async () => {
  let runs = 0;
  const schedule = createCoalescedRunner(async () => { runs += 1; return runs; }, 5);
  const results = await Promise.all([schedule(), schedule(), schedule()]);
  assert.equal(runs, 1);
  assert.deepEqual(results, [1, 1, 1]);
});

test("a call during a run starts the next window instead of being dropped", async () => {
  let runs = 0;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const schedule = createCoalescedRunner(async () => { runs += 1; if (runs === 1) await gate; }, 1);
  const first = schedule();
  await new Promise((r) => setTimeout(r, 10)); // first run is now in progress
  const second = schedule();
  assert.notEqual(first, second);
  release();
  await Promise.all([first, second]);
  assert.equal(runs, 2);
});

test("task errors reach the callers", async () => {
  const schedule = createCoalescedRunner(async () => { throw new Error("boom"); }, 1);
  await assert.rejects(schedule(), /boom/);
});
