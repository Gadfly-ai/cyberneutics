import { describe, expect, it } from "vitest";
import { buildLocalCommitteeRound1 } from "./localDemo";
import { inferMajority, inferVoteWithSource } from "./voteInference";

describe("inferVoteWithSource", () => {
  it("parses declared votes including Undetermined", () => {
    expect(inferVoteWithSource("...\nCurrent vote: Aye")).toEqual({
      vote: "Aye",
      source: "declared",
    });
    expect(inferVoteWithSource("Current vote: Nay")).toEqual({ vote: "Nay", source: "declared" });
    expect(inferVoteWithSource("Current vote: Undetermined")).toEqual({
      vote: "Undetermined",
      source: "declared",
    });
    expect(inferVoteWithSource("Vote: undetermined")).toEqual({
      vote: "Undetermined",
      source: "declared",
    });
  });

  it("uses the latest declared vote in appended multi-round text", () => {
    expect(
      inferVoteWithSource("Round 2\nCurrent vote: Undetermined\n\nRound 3\nCurrent vote: Aye"),
    ).toEqual({
      vote: "Aye",
      source: "declared",
    });
  });

  it("parses declared votes from local demo round 1 transcripts", () => {
    const r1 = buildLocalCommitteeRound1("test question");
    expect(inferVoteWithSource(r1.maya)).toEqual({ vote: "Aye", source: "declared" });
    expect(inferVoteWithSource(r1.frankie)).toEqual({ vote: "Nay", source: "declared" });
    expect(inferVoteWithSource(r1.tammy)).toEqual({
      vote: "Undetermined",
      source: "declared",
    });
  });

  it("uses lexical fallback when no declaration", () => {
    expect(inferVoteWithSource("We should approve this now.")).toMatchObject({
      vote: "Aye",
      source: "fallback",
    });
    expect(inferVoteWithSource("Defer until we have data.")).toMatchObject({
      vote: "Nay",
      source: "fallback",
    });
    expect(inferVoteWithSource("Interesting trade-offs on both sides.")).toMatchObject({
      vote: "Undetermined",
      source: "fallback",
    });
  });
});

describe("inferMajority", () => {
  it("requires a clear majority rather than a plurality", () => {
    expect(inferMajority(["Aye", "Undetermined", "Undetermined", "Undetermined", "Nay"])).toBe(
      "Undetermined",
    );
    expect(inferMajority(["Aye", "Aye", "Aye", "Undetermined", "Nay"])).toBe("Aye");
    expect(inferMajority(["Nay", "Nay", "Nay", "Undetermined", "Aye"])).toBe("Nay");
  });
});
