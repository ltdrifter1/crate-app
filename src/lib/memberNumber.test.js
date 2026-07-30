import {
  CLUB_NAME,
  formatJoinedMonth,
  formatMemberNumber,
  memberNumberLabel,
  provisionalMemberNumber,
} from "./memberNumber";
import {
  COMMUNITY_MIX_TITLE,
  buildCommunityMix,
  buildMixFromPlaylist,
  communityMixId,
  communityPlaylistStub,
  formatMonthLabel,
  isCommunityPlaylist,
  monthKey,
} from "./mixes";

describe("memberNumber", () => {
  test("formats padded membership stamp", () => {
    expect(formatMemberNumber(4231)).toBe("004231");
    expect(memberNumberLabel(4231)).toBe("Member #004231");
    expect(CLUB_NAME).toBe("PLANET CLUB");
  });

  test("provisional number is stable per uid", () => {
    expect(provisionalMemberNumber("abc")).toBe(provisionalMemberNumber("abc"));
    expect(provisionalMemberNumber("abc")).not.toBe(provisionalMemberNumber("xyz"));
  });

  test("formatJoinedMonth", () => {
    expect(formatJoinedMonth("2026-09-15T00:00:00.000Z")).toBe("September 2026");
  });
});

describe("mixes", () => {
  test("monthKey and community id", () => {
    expect(monthKey(new Date("2026-09-15T12:00:00.000Z"))).toBe("2026-09");
    expect(communityMixId("2026-09")).toBe("community-2026-09");
    expect(formatMonthLabel("2026-09")).toBe("September 2026");
  });

  test("buildMixFromPlaylist", () => {
    const mix = buildMixFromPlaylist(
      { id: "pl_1", name: "Late Drive", trackIds: ["a", "b"] },
      { ownerUid: "u1", ownerName: "Luke", now: new Date("2026-09-01T00:00:00.000Z") }
    );
    expect(mix.id).toBe("pl_1");
    expect(mix.title).toBe("Late Drive");
    expect(mix.visibility).toBe("public");
    expect(mix.kind).toBe("user");
  });

  test("buildCommunityMix + stub", () => {
    const mix = buildCommunityMix({
      trackIds: ["1", "2"],
      curatorUid: "u1",
      curatorName: "Ava",
      now: new Date("2026-09-01T00:00:00.000Z"),
    });
    expect(mix.id).toBe("community-2026-09");
    expect(mix.title).toBe(COMMUNITY_MIX_TITLE);
    expect(mix.featuredCurator.displayName).toBe("Ava");
    const stub = communityPlaylistStub(mix);
    expect(stub.isCommunity).toBe(true);
    expect(isCommunityPlaylist(stub)).toBe(true);
  });
});
