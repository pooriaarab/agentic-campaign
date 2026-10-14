#!/usr/bin/env node
import { readFileSync, realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { approveSlot, createCampaign, exportQueue, getCostReport, GuardError, VendorError, type Campaign, type CampaignBrief } from "./index.js";
import { DEFAULT_BRAND } from "./index.js";
import { VERSION } from "./version.js";

export class UsageError extends Error { constructor(message: string) { super(message); this.name = "UsageError"; } }
export type CliCommand = "campaign" | "costs" | "mcp" | "help" | "version";
export interface CliRequest { command: CliCommand; action?: "create" | "list" | "show" | "approve-slot" | "export"; brand?: string; goal?: string; platforms?: string[]; weeks?: number; postsPerWeek?: number; startDate?: string; id?: string; slotId?: string; live: boolean; approved: boolean; }

function integer(value: string, flag: string): number { const result = Number(value); if (!Number.isInteger(result) || result < 1) throw new UsageError(`${flag} needs an integer of 1 or more`); return result; }
export function parseArgs(argv: string[]): CliRequest {
  const request: CliRequest = { command: "help", live: false, approved: false }; const args = [...argv]; const first = args.shift();
  if (!first || first === "--help" || first === "-h") return request;
  if (first === "--version" || first === "-V") return { ...request, command: "version" };
  if (first === "costs" || first === "mcp") { request.command = first; return request; }
  if (first !== "campaign") throw new UsageError(`unknown command "${first}"`);
  const action = args.shift(); if (!action || !["create", "list", "show", "approve-slot", "export"].includes(action)) throw new UsageError("campaign needs create, list, show, approve-slot, or export");
  request.command = "campaign"; request.action = action as CliRequest["action"];
  while (args.length) { const flag = args.shift()!; if (flag === "--live") { request.live = true; continue; } if (flag === "--approve") { request.approved = true; continue; } const value = args.shift(); if (!value) throw new UsageError(`${flag} needs a value`); if (flag === "--brand") request.brand = value; else if (flag === "--goal") request.goal = value; else if (flag === "--platforms") request.platforms = value.split(",").map((p) => p.trim()).filter(Boolean); else if (flag === "--weeks") request.weeks = integer(value, flag); else if (flag === "--posts-per-week") request.postsPerWeek = integer(value, flag); else if (flag === "--start-date") request.startDate = value; else if (flag === "--id") request.id = value; else if (flag === "--slot") request.slotId = value; else throw new UsageError(`unknown flag "${flag}"`); }
  if (request.action === "create" && (!request.brand || !request.goal || !request.platforms || !request.weeks || !request.postsPerWeek)) throw new UsageError("campaign create needs --brand --goal --platforms --weeks --posts-per-week");
  if (["show", "approve-slot", "export"].includes(request.action!) && !request.id) throw new UsageError(`campaign ${request.action} needs --id`);
  if (request.action === "approve-slot" && !request.slotId) throw new UsageError("campaign approve-slot needs --slot");
  return request;
}
export interface CliIo { out(line: string): void; err(line: string): void; campaigns: Map<string, Campaign>; }
function defaultIo(): CliIo { return { out: console.log, err: console.error, campaigns: new Map() }; }
function helpText(): string { return `${DEFAULT_BRAND.name} ${VERSION}\n\nUsage: agentic-campaign campaign <create|list|show|approve-slot|export> [flags]\n\nCommands:\n  campaign create --brand <name> --goal <goal> --platforms <a,b> --weeks <n> --posts-per-week <n>\n  campaign list\n  campaign show --id <id>\n  campaign approve-slot --id <id> --slot <slot-id> --live --approve\n  campaign export --id <id>\n  costs\n  mcp`; }
export async function runCli(argv: string[], io: CliIo = defaultIo()): Promise<number> { try { const request = parseArgs(argv); if (request.command === "help") { io.out(helpText()); return 0; } if (request.command === "version") { io.out(VERSION); return 0; } if (request.command === "costs") { io.out(JSON.stringify(getCostReport())); return 0; } if (request.command === "mcp") { const { startMcp } = await import("./mcp.js"); await startMcp(); return 0; } if (request.action === "create") { const campaign = createCampaign({ brand: request.brand!, goal: request.goal!, platforms: request.platforms!, weeks: request.weeks!, postsPerWeek: request.postsPerWeek!, startDate: request.startDate } satisfies CampaignBrief); io.campaigns.set(campaign.id, campaign); io.out(JSON.stringify(campaign)); return 0; } if (request.action === "list") { io.out(JSON.stringify([...io.campaigns.values()])); return 0; } const campaign = io.campaigns.get(request.id!); if (!campaign) throw new UsageError(`campaign "${request.id}" was not found`); if (request.action === "show") { io.out(JSON.stringify(campaign)); return 0; } if (request.action === "export") { io.out(JSON.stringify(exportQueue(campaign))); return 0; } const updated = approveSlot(campaign, request.slotId!, { live: request.live, approved: request.approved }); io.campaigns.set(updated.id, updated); io.out(JSON.stringify(updated)); return 0; } catch (error) { io.err(`${error instanceof Error ? error.name : "Error"}: ${error instanceof Error ? error.message : String(error)}`); return error instanceof UsageError ? 2 : 1; } }
function isMainModule(): boolean { try { return typeof process.argv[1] === "string" && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href; } catch { return false; } }
if (isMainModule()) runCli(process.argv.slice(2)).then((code) => { if (code) process.exit(code); });
