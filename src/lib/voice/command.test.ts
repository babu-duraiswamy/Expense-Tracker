import { describe, expect, it } from "vitest";
import { parseVoiceCommand } from "./command";
import { extractDate, type VoiceCategory } from "./parse-entry";

const CATS: VoiceCategory[] = [
  { id: "c1", name: "Entertainment", kind: "expense" },
  { id: "c2", name: "Fuel", kind: "expense" },
  { id: "c3", name: "Salary", kind: "income" },
];
const TODAY = "2026-11-07";

describe("extractDate", () => {
  it.each([
    ["700 entertainment today", "2026-11-07"],
    ["700 entertainment yesterday", "2026-11-06"],
    ["700 entertainment on 5 november", "2026-11-05"],
    ["700 entertainment november 5th", "2026-11-05"],
    ["700 entertainment 3rd of july", "2026-07-03"],
  ])("reads the date in %s", (text, expected) => {
    expect(extractDate(text, TODAY).date).toBe(expected);
  });

  it("keeps the amount intact when the date is spoken as a number", () => {
    expect(extractDate("700 entertainment 5 november", TODAY).rest).not.toMatch(/\b5\b/);
  });

  it("returns no date when none is spoken", () => {
    expect(extractDate("700 entertainment", TODAY).date).toBeNull();
  });
});

describe("parseVoiceCommand", () => {
  it("treats a plain phrase as an addition", () => {
    const r = parseVoiceCommand("700 entertainment", { categories: CATS, today: TODAY });
    expect(r.ok && r.command.kind).toBe("add");
  });

  it("reads a delete with amount, category and date", () => {
    const r = parseVoiceCommand("delete 700 entertainment yesterday", {
      categories: CATS,
      today: TODAY,
    });
    expect(r).toEqual({
      ok: true,
      command: {
        kind: "delete",
        amountMinor: 70000,
        categoryId: "c1",
        categoryName: "Entertainment",
        occurredOn: "2026-11-06",
      },
    });
  });

  it("allows a delete by category alone", () => {
    const r = parseVoiceCommand("remove the fuel entry", { categories: CATS, today: TODAY });
    expect(r.ok && r.command).toMatchObject({
      kind: "delete",
      categoryName: "Fuel",
      amountMinor: null,
      occurredOn: null,
    });
  });

  it("allows a delete by date and amount with no category", () => {
    const r = parseVoiceCommand("cancel 1200 on 5 november", { categories: CATS, today: TODAY });
    expect(r.ok && r.command).toMatchObject({
      kind: "delete",
      amountMinor: 120000,
      occurredOn: "2026-11-05",
      categoryId: null,
    });
  });

  it("refuses a delete that names nothing", () => {
    expect(parseVoiceCommand("delete it", { categories: CATS, today: TODAY }).ok).toBe(false);
  });

  it("still reads an addition with a date and no delete word", () => {
    const r = parseVoiceCommand("250 fuel on 5 november", { categories: CATS, today: TODAY });
    expect(r.ok && r.command).toMatchObject({ kind: "add" });
    expect(r.ok && r.command.kind === "add" && r.command.entry.occurredOn).toBe("2026-11-05");
  });
});
