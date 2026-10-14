import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, test } from "vitest";
import { createMcpServer } from "./mcp.js";
const textOf = (r: unknown) => (r as { content: { text: string }[] }).content[0].text;
describe("mcp campaign tools", () => { test("serves campaign lifecycle tools", async () => { const [ct, st] = InMemoryTransport.createLinkedPair(); const server = createMcpServer(); await server.connect(st); const client = new Client({ name: "probe", version: "0" }); await client.connect(ct); try { expect((await client.listTools()).tools.map((x) => x.name).sort()).toEqual(["approve_campaign_slot", "create_campaign", "export_campaign_queue", "get_cost_report", "list_campaigns", "show_campaign"]); const result = await client.callTool({ name: "create_campaign", arguments: { brand: "Acme", goal: "launch", platforms: ["x"], weeks: 1, postsPerWeek: 1 } }); expect(JSON.parse(textOf(result))).toMatchObject({ brand: "Acme" }); } finally { await client.close(); await server.close(); } }); });
