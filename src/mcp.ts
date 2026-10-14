import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { approveSlot, createCampaign, exportQueue, getCostReport, GuardError, VendorError, type Campaign } from "./index.js";
import { DEFAULT_BRAND } from "./index.js";
export interface McpDeps { campaigns?: Map<string, Campaign>; }
const ok = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value) }] });
const fail = (error: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }) }], isError: true as const });
export function createMcpServer(deps: McpDeps = {}): McpServer {
 const campaigns = deps.campaigns ?? new Map<string, Campaign>(); const server = new McpServer({ name: DEFAULT_BRAND.command, version: DEFAULT_BRAND.version });
 server.registerTool("create_campaign", { description: "Create a draft campaign calendar. Planning only; no posts are sent.", inputSchema: { brand: z.string(), goal: z.string(), platforms: z.array(z.string()).min(1), weeks: z.number().int().positive(), postsPerWeek: z.number().int().positive(), startDate: z.string().optional() }, annotations: { readOnlyHint: false, destructiveHint: false } }, async (input) => { try { const campaign = createCampaign(input); campaigns.set(campaign.id, campaign); return ok(campaign); } catch (e) { return fail(e); } });
 server.registerTool("list_campaigns", { description: "List campaign calendars in this session.", inputSchema: {}, annotations: { readOnlyHint: true } }, async () => ok([...campaigns.values()]));
 server.registerTool("show_campaign", { description: "Show one campaign calendar.", inputSchema: { id: z.string() }, annotations: { readOnlyHint: true } }, async ({ id }) => { const campaign = campaigns.get(id); return campaign ? ok(campaign) : fail(new Error(`campaign "${id}" was not found`)); });
 server.registerTool("approve_campaign_slot", { description: "Approve a draft slot. Requires live=true and approved=true; it still never publishes.", inputSchema: { id: z.string(), slotId: z.string(), live: z.boolean(), approved: z.boolean() }, annotations: { readOnlyHint: false, destructiveHint: false } }, async ({ id, slotId, live, approved }) => { try { const campaign = campaigns.get(id); if (!campaign) throw new Error(`campaign "${id}" was not found`); const updated = approveSlot(campaign, slotId, { live, approved }); campaigns.set(id, updated); return ok(updated); } catch (e) { return fail(e); } });
 server.registerTool("export_campaign_queue", { description: "Export approved campaign slots as agentic-publish-compatible queue items.", inputSchema: { id: z.string() }, annotations: { readOnlyHint: true } }, async ({ id }) => { const campaign = campaigns.get(id); return campaign ? ok(exportQueue(campaign)) : fail(new Error(`campaign "${id}" was not found`)); });
 server.registerTool("get_cost_report", { description: "Read session costs.", inputSchema: {}, annotations: { readOnlyHint: true } }, async () => ok(getCostReport()));
 return server;
}
export async function startMcp(deps: McpDeps = {}): Promise<void> { const server = createMcpServer(deps); await server.connect(new StdioServerTransport()); }
