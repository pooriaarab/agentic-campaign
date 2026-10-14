import { describe, expect, test } from "vitest";
import { parseArgs, runCli, type CliIo } from "./cli.js";
function io(): CliIo & { outLines: string[]; errLines: string[] } { const outLines: string[] = []; const errLines: string[] = []; return { outLines, errLines, out: (x) => outLines.push(x), err: (x) => errLines.push(x), campaigns: new Map() }; }
describe("campaign CLI", () => {
 test("parses campaign create", () => expect(parseArgs(["campaign", "create", "--brand", "Acme", "--goal", "launch", "--platforms", "x,linkedin", "--weeks", "1", "--posts-per-week", "2"]).action).toBe("create"));
 test("creates, approves and exports", async () => { const output = io(); expect(await runCli(["campaign", "create", "--brand", "Acme", "--goal", "launch", "--platforms", "x", "--weeks", "1", "--posts-per-week", "1"], output)).toBe(0); const campaign = JSON.parse(output.outLines[0]); expect(await runCli(["campaign", "approve-slot", "--id", campaign.id, "--slot", "slot-1", "--live", "--approve"], output)).toBe(0); expect(await runCli(["campaign", "export", "--id", campaign.id], output)).toBe(0); expect(JSON.parse(output.outLines[2])[0]).toMatchObject({ brand: "Acme", targets: ["x"] }); });
 test("approval needs live flags", async () => { const output = io(); await runCli(["campaign", "create", "--brand", "Acme", "--goal", "launch", "--platforms", "x", "--weeks", "1", "--posts-per-week", "1"], output); const id = JSON.parse(output.outLines[0]).id; expect(await runCli(["campaign", "approve-slot", "--id", id, "--slot", "slot-1"], output)).toBe(1); });
});
