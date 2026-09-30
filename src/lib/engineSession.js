/**
 * Session energy arcs — split from engine.js so ranking can read profiles
 * without a circular import (engine → ranking → engine).
 */

export const SESSION_PROFILES = {
  night:      { label: "Night out",     blurb: "Builds up, peaks, then eases down", phases: [{ name: "Warm up", p: 0.25, e: 5 }, { name: "Peak", p: 0.5, e: 9 }, { name: "Chill out", p: 0.25, e: 3 }] },
  party:      { label: "Party",         blurb: "High energy from start to finish", phases: [{ name: "Warm up", p: 0.2, e: 5 }, { name: "Peak", p: 0.55, e: 9 }, { name: "Chill out", p: 0.25, e: 5 }] },
  predrinks:  { label: "Getting ready", blurb: "Starts easy, gets livelier", phases: [{ name: "Warm up", p: 0.3, e: 4 }, { name: "Peak", p: 0.5, e: 7 }, { name: "Chill out", p: 0.2, e: 6 }] },
  drive:      { label: "Drive",         blurb: "Steady music for the road", phases: [{ name: "Warm up", p: 0.2, e: 5 }, { name: "Cruise", p: 0.55, e: 6 }, { name: "Chill out", p: 0.25, e: 3 }] },
  chill:      { label: "Chill",         blurb: "Calm and unhurried", phases: [{ name: "Warm up", p: 0.25, e: 3 }, { name: "Cruise", p: 0.5, e: 2 }, { name: "Chill out", p: 0.25, e: 2 }] },
  recovery:   { label: "Rest",          blurb: "Soft and restorative", phases: [{ name: "Warm up", p: 0.2, e: 2 }, { name: "Cruise", p: 0.55, e: 1 }, { name: "Chill out", p: 0.25, e: 2 }] },
  run:        { label: "Run",           blurb: "Keeps you moving", phases: [{ name: "Warm up", p: 0.2, e: 6 }, { name: "Peak", p: 0.55, e: 9 }, { name: "Chill out", p: 0.25, e: 4 }] },
  workout:    { label: "Workout",       blurb: "Warm up, push, then stretch", phases: [{ name: "Warm up", p: 0.2, e: 5 }, { name: "Peak", p: 0.55, e: 9 }, { name: "Chill out", p: 0.25, e: 3 }] },
  focus:      { label: "Focus",         blurb: "Steady background for work", phases: [{ name: "Warm up", p: 0.15, e: 4 }, { name: "Cruise", p: 0.7, e: 3 }, { name: "Chill out", p: 0.15, e: 3 }] },
  dinner:     { label: "Dinner",        blurb: "Good company, good volume", phases: [{ name: "Warm up", p: 0.25, e: 4 }, { name: "Cruise", p: 0.5, e: 3 }, { name: "Chill out", p: 0.25, e: 3 }] },
  study:      { label: "Study",         blurb: "Quiet focus with soft breaks", phases: [{ name: "Warm up", p: 0.15, e: 3 }, { name: "Cruise", p: 0.7, e: 2 }, { name: "Chill out", p: 0.15, e: 2 }] },
};
