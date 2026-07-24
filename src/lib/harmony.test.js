import {
  parseCamelot,
  camelotCompatible,
  getEnergyRangeForHour,
  fmtTime,
  hexToRgbStr,
} from "./harmony";

describe("parseCamelot", () => {
  test("parses standard keys", () => {
    expect(parseCamelot("8A")).toEqual({ num: 8, mode: "A" });
    expect(parseCamelot("12b")).toEqual({ num: 12, mode: "B" });
  });

  test("rejects invalid keys", () => {
    expect(parseCamelot(null)).toBeNull();
    expect(parseCamelot("xx")).toBeNull();
    expect(parseCamelot("13A")).toBeNull();
  });
});

describe("camelotCompatible", () => {
  test("is permissive when either key is missing or invalid", () => {
    expect(camelotCompatible(null, "8A")).toBe(true);
    expect(camelotCompatible("8A", null)).toBe(true);
    expect(camelotCompatible("xx", "yy")).toBe(true);
  });

  test("same number mixes including relative major/minor", () => {
    expect(camelotCompatible("8A", "8A")).toBe(true);
    expect(camelotCompatible("8A", "8B")).toBe(true);
  });

  test("adjacent same-letter keys within range are compatible", () => {
    expect(camelotCompatible("8A", "9A")).toBe(true);
    expect(camelotCompatible("8A", "10A", 2)).toBe(true);
  });

  test("adjacent opposite-letter keys are not compatible", () => {
    expect(camelotCompatible("8A", "9B", 2)).toBe(false);
    expect(camelotCompatible("5B", "6A", 2)).toBe(false);
  });

  test("keys outside range are incompatible", () => {
    expect(camelotCompatible("1A", "6A", 2)).toBe(false);
  });

  test("wraps around the wheel (12 → 1)", () => {
    expect(camelotCompatible("12A", "1A", 2)).toBe(true);
    expect(camelotCompatible("11A", "1A", 2)).toBe(true);
  });
});

describe("getEnergyRangeForHour", () => {
  test("returns a defined window for known hours", () => {
    expect(getEnergyRangeForHour(0)).toEqual([7, 9]);
    expect(getEnergyRangeForHour(3)).toEqual([2, 4]);
    expect(getEnergyRangeForHour(12)).toEqual([5, 8]);
  });

  test("falls back to the full range for unknown hours", () => {
    expect(getEnergyRangeForHour(99)).toEqual([1, 10]);
  });
});

describe("fmtTime", () => {
  test("formats seconds as m:ss", () => {
    expect(fmtTime(0)).toBe("0:00");
    expect(fmtTime(5)).toBe("0:05");
    expect(fmtTime(65)).toBe("1:05");
    expect(fmtTime(600)).toBe("10:00");
  });

  test("handles invalid input", () => {
    expect(fmtTime(NaN)).toBe("0:00");
    expect(fmtTime(undefined)).toBe("0:00");
  });
});

describe("hexToRgbStr", () => {
  test("converts a hex color to an r,g,b string", () => {
    expect(hexToRgbStr("#ffffff")).toBe("255,255,255");
    expect(hexToRgbStr("#000000")).toBe("0,0,0");
    expect(hexToRgbStr("#8899aa")).toBe("136,153,170");
  });

  test("falls back to a neutral gray for missing/short input", () => {
    expect(hexToRgbStr("")).toBe("160,165,175");
    expect(hexToRgbStr("#fff")).toBe("160,165,175");
  });
});
