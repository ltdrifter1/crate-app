import {
  physicalStatusFor,
  normalizePhysicalStatus,
  canBuyPhysical,
  canPurchasePhysical,
  physicalCommerceHint,
  PHYSICAL_COMMERCE_LIVE,
  memberPrice,
} from "./physicalStatus";
import {
  collectorStatusForArtist,
  buildCollectorRows,
  addDigitalOwned,
  normalizeCollection,
} from "./collections";
import {
  buildMonthlyChoiceState,
  buildChoosePayload,
  buildSkipPayload,
  mergeMonthChoice,
  MONTHLY_CHOICE,
} from "./monthlyChoice";
import {
  canPlayOnFreeTier,
  bumpPlayMeter,
  freePlaysRemaining,
  freePlaysMeterLabel,
  shouldNudgeFreePlays,
} from "./freePlays";

describe("physicalStatus", () => {
  test("defaults to digital", () => {
    expect(physicalStatusFor({}).id).toBe("digital");
  });

  test("infers announced from catalog number", () => {
    expect(physicalStatusFor({ catalogNumber: "CC-026" }).id).toBe("announced");
  });

  test("memberPrice discounts", () => {
    expect(memberPrice(28, { member: true })).toBe(22.4);
    expect(memberPrice(28, { member: true, memberRetail: 22 })).toBe(22);
    expect(canBuyPhysical(normalizePhysicalStatus("preorder"))).toBe(true);
  });

  test("purchase stays off until commerce is live", () => {
    expect(PHYSICAL_COMMERCE_LIVE).toBe(false);
    expect(canPurchasePhysical(normalizePhysicalStatus("preorder"))).toBe(false);
    expect(physicalCommerceHint(normalizePhysicalStatus("announced"))).toMatch(/coming soon/i);
  });
});

describe("collections", () => {
  test("complete the copy", () => {
    const tracks = [
      { id: "1", artist: "Inlet Knight", title: "A", catalogNumber: "CC-1" },
      { id: "2", artist: "Inlet Knight", title: "B", catalogNumber: "CC-2" },
      { id: "3", artist: "Inlet Knight", title: "C", genre: "Jazz" },
    ];
    const col = addDigitalOwned(normalizeCollection({ clubcopy: ["1"] }), "x");
    const status = collectorStatusForArtist(tracks, { ...col, clubcopy: ["1"] });
    expect(status.total).toBe(2);
    expect(status.owned).toBe(1);
    expect(status.cta.line).toMatch(/One copy missing/);
  });

  test("buildCollectorRows filters digital-only artists", () => {
    const tracks = [
      { id: "1", artist: "A", catalogNumber: "CC-1" },
      { id: "2", artist: "B", title: "Only digital" },
    ];
    const rows = buildCollectorRows(tracks, {});
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("A");
  });
});

describe("monthlyChoice", () => {
  const tracks = Array.from({ length: 20 }, (_, i) => ({
    id: `t${i}`,
    genre: "Jazz",
    playCount: i,
    energy: 5,
    duration: 180,
  }));

  test("pending then choose", () => {
    const state = buildMonthlyChoiceState(tracks, { genres: ["Jazz"] }, {
      userKey: "u1",
      monthKey: "2026-08",
    });
    expect(state.picks.length).toBe(3);
    expect(state.canChoose).toBe(true);
    const choice = buildChoosePayload(state.picks[0].track.id);
    expect(choice.status).toBe(MONTHLY_CHOICE.CHOSEN);
    const merged = mergeMonthChoice({}, "2026-08", choice);
    const next = buildMonthlyChoiceState(tracks, { genres: ["Jazz"], monthlyChoices: merged }, {
      userKey: "u1",
      monthKey: "2026-08",
    });
    expect(next.canChoose).toBe(false);
    expect(next.choice.trackId).toBe(state.picks[0].track.id);
  });

  test("skip month", () => {
    expect(buildSkipPayload().status).toBe(MONTHLY_CHOICE.SKIPPED);
  });
});

describe("freePlays", () => {
  const limited = { streaming: "limited", freePlaysPerDay: 20 };
  const full = { streaming: "full", freePlaysPerDay: 20 };

  test("caps free tier", () => {
    expect(canPlayOnFreeTier({ playsToday: 19, playsDayKey: "2026-08-14" }, limited, new Date("2026-08-14T12:00:00Z"))).toBe(true);
    expect(canPlayOnFreeTier({ playsToday: 20, playsDayKey: "2026-08-14" }, limited, new Date("2026-08-14T12:00:00Z"))).toBe(false);
    expect(freePlaysRemaining({ playsToday: 5, playsDayKey: "2026-08-14" }, limited, new Date("2026-08-14T12:00:00Z"))).toBe(15);
  });

  test("full streaming ignores meter", () => {
    expect(canPlayOnFreeTier({ playsToday: 99, playsDayKey: "2026-08-14" }, full, new Date("2026-08-14T12:00:00Z"))).toBe(true);
    expect(bumpPlayMeter({}, full)).toBeNull();
  });

  test("bump increments", () => {
    const next = bumpPlayMeter(
      { playsToday: 2, playsDayKey: "2026-08-14" },
      limited,
      new Date("2026-08-14T12:00:00Z")
    );
    expect(next.playsToday).toBe(3);
  });

  test("meter labels and soft nudge", () => {
    expect(freePlaysMeterLabel(15, limited)).toBe("15 of 20 plays left");
    expect(freePlaysMeterLabel(3, limited)).toBe("3 plays left today");
    expect(freePlaysMeterLabel(0, limited)).toBe("0 plays left today");
    expect(freePlaysMeterLabel(99, full)).toBeNull();
    expect(shouldNudgeFreePlays(5, limited)).toBe(true);
    expect(shouldNudgeFreePlays(6, limited)).toBe(false);
    expect(shouldNudgeFreePlays(0, limited)).toBe(false);
  });
});
