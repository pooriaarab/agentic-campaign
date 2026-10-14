# agentic-campaign

[![npm version](https://img.shields.io/npm/v/agentic-campaign)](https://www.npmjs.com/package/agentic-campaign)
[![Downloads/month](https://img.shields.io/npm/dm/agentic-campaign)](https://www.npmjs.com/package/agentic-campaign)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/license/mit)

[Package](https://www.npmjs.com/package/agentic-campaign) · [Quickstart](#export-your-first-campaign-draft) · [Runtime surfaces](#runtime-surfaces)

agentic-campaign is an open-source social campaign planner for developers who need draft calendars, explicit slot approval, and text queue exports.
It runs as a TypeScript SDK, command-line interface (CLI), or Model Context Protocol (MCP) server.
Campaign planning and approval run locally; this package never publishes social posts.

## Install

```sh
npm install agentic-campaign
```

Node.js 18 or later is required. TypeScript declarations are included, with two direct runtime dependencies.

## Export your first campaign draft

Save this as `campaign-demo.mjs`. No credentials, environment variables, or `.env` loader are required.

```js
import { createCampaign, approveSlot, exportQueue } from "agentic-campaign";

const campaign = createCampaign({
  brand: "Acme",
  goal: "launch a feature",
  platforms: ["linkedin", "x"],
  weeks: 1,
  postsPerWeek: 2,
  startDate: "2026-11-01",
});
console.log(campaign.schedule.length);
console.log(exportQueue(campaign).length);
const approved = approveSlot(campaign, "slot-1", { live: true, approved: true });
const queue = exportQueue(approved);
console.log(queue.length, queue[0].brand, queue[0].targets[0]);
```

```sh
node campaign-demo.mjs
```

Success prints `2`, `0`, and `1 Acme linkedin`.
The approval flags change local state; they do not send a post.
Export text includes an AI-assistance disclosure and needs editorial review.

## How it works

```text
Brief -> deterministic pillars and daily draft slots
Draft slot + explicit approval -> approved slot
Approved or scheduled slots -> { brand, text, targets } queue
Queue -> a downstream publisher you implement separately
```

## Why it exists

Developers need campaign planning data they can inspect and pass between tools.
Buffer and Hootsuite provide social calendars with publishing workflows.
agentic-campaign supplies local plan generation and approval-filtered text exports for code and agent sessions.

## Compare

Scope checked on 2026-10-14 against the official pages linked below.

| Scope | agentic-campaign | [Buffer](https://buffer.com/publish) | [Hootsuite](https://www.hootsuite.com/platform/publishing) |
| --- | --- | --- | --- |
| Main workflow | Generate local plans and export drafts | Plan, schedule, and publish social posts | Plan, schedule, and publish social posts |
| Calendar representation | In-memory campaign objects | Product content calendar | Product content calendar |
| Publishing in this package | None | No Buffer adapter | No Hootsuite adapter |

## Coverage

| Surface | Status | Behavior |
| --- | --- | --- |
| Campaign brief | ✓ | Brand, goal, platform labels, slot count, and start date |
| Content pillars | ✓ | Three fixed pillars: Educate, Proof, Engage |
| Format labels | ✓ | Four rotating labels: short post, carousel, video, story |
| Slot approval | ✓ | Draft-to-approved transition with two explicit flags |
| Queue export | ✓ | Approved and scheduled slots become text queue items |
| LinkedIn and X (Twitter) | Labels only | Example target strings; no network adapters |
| Other platform names | Labels only | Arbitrary nonempty strings; no support registry |
| Local text router | scaffold | Receipt generation only |
| Generic HTTP text router | ✓ | Posts `{text}` to your endpoint; separate from campaign export |
| Cloudflare Workers handler | scaffold for campaigns | Health and text summary only; no campaign routes |

There are zero social publishing connectors, two shared text-routing adapters, three fixed pillars, and four format labels.
The source and local tests verify planning behavior. Zero external integrations were credential-checked for this rewrite.

## Common use cases

1. Node.js release teams generate draft slots for LinkedIn and X (Twitter) labels.
2. TypeScript agencies plan separate campaign objects for client brands.
3. MCP client developers review and approve slots within one agent session.
4. Custom publisher developers consume `{brand, text, targets}` queue items through their own pipeline.

## Features

- **Campaign plans:** `createCampaign` builds draft slots; see the [quickstart](#export-your-first-campaign-draft).
- **Explicit approvals:** `approveSlot` requires `live: true` and `approved: true`.
- **Queue exports:** `exportQueue` keeps approved or scheduled slots and includes draft disclosure text.
- **Agent sessions:** MCP tools retain campaigns in the server's in-memory map.
- **Shared utilities:** Text summaries, generic dispatch, guards, logging, and in-memory cost reports are SDK exports.

## Runtime surfaces

The Node.js SDK exports `createCampaign`, `approveSlot`, `exportQueue`, and shared text utilities.

| CLI command | Behavior |
| --- | --- |
| `campaign create --brand Acme --goal launch --platforms linkedin,x --weeks 1 --posts-per-week 2` | Print a new campaign; accepts `--start-date` |
| `campaign list` | List campaigns from the current process map |
| `campaign show --id <id>` | Read a campaign from that map |
| `campaign approve-slot --id <id> --slot slot-1 --live --approve` | Approve a draft in that map |
| `campaign export --id <id>` | Export approved or scheduled slots from that map |
| `costs` | Print current process cost units |
| `mcp` | Start the stdio server |

Run commands with `npx agentic-campaign`. `--help` and `--version` print help and version output.
Separate CLI invocations start fresh maps. Use the SDK or a persistent MCP session for the full lifecycle.

All six MCP tools: `create_campaign`, `list_campaigns`, `show_campaign`, `approve_campaign_slot`, `export_campaign_queue`, and `get_cost_report`.
Start them with `npx agentic-campaign mcp` or `npx agentic-campaign-mcp`.

The Worker source exposes `GET /health` and `POST /summarize` only.
Optional `PACK_NAME` changes its health response label. You deploy and secure the Worker yourself.

## Delivery and behavior limits

- `weeks * postsPerWeek` sets total slots across all labels, rather than slots per platform.
- Slots advance one calendar day each. `weeks` does not bound the schedule to that many weeks.
- Brief `quietHours` is accepted but ignored. Slots contain dates, without posting times.
- The daily cap is SDK-only input; the generator still advances a day after each slot.
- Pillars, hooks, and formats use fixed code templates. No language model generates campaign text.
- Format labels do not create carousel images, videos, stories, or attachments.
- Campaign IDs use normalized brand and start date. Same-brand, same-date plans can overwrite a session map entry.
- CLI and MCP storage is in memory. There is no file store, database, or restart recovery.
- Only draft-to-approved transitions have an exported helper. Scheduling and completion need application code.
- Queue items omit dates, slot IDs, and media. Downstream code must preserve scheduling metadata separately.
- There is no automatic delivery, retry, deduplication, platform authentication, or engagement analytics.
- Cost reports track generic text dispatch units. Campaign planning and approvals record no costs.

## Integration guides

- [Node.js campaign approval and export example](#export-your-first-campaign-draft)
- [CLI and MCP campaign lifecycle reference](#runtime-surfaces)
- [Export and storage constraints](#delivery-and-behavior-limits)

The export tool describes its shape as agentic-publish-compatible in source.
This package does not call agentic-publish or verify delivery compatibility.
No separate public documentation site is configured.

## Status

Version 0.1.0 is an early release; APIs can change before 1.0.
Report problems through [GitHub issues](https://github.com/pooriaarab/agentic-campaign/issues).
Public case studies are not published in this repository.

## FAQ

### What is agentic-campaign?

agentic-campaign generates local campaign plans and exports reviewed draft text.
It provides SDK, CLI, and MCP interfaces for developers.

### Which integrations are verified?

agentic-campaign has no social publishing connectors or platform credential verification.
Its shared generic HTTP text router is separate from the campaign workflow.

### Does agentic-campaign provide a managed publishing service?

agentic-campaign produces data inside your process.
You supply storage, deployment, editorial review, and any publisher.

### How is agentic-campaign different from Buffer?

agentic-campaign generates campaign objects and approval-filtered queues in code.
Buffer provides a social planning and publishing product; see its [publishing overview](https://buffer.com/publish).

### How is agentic-campaign different from Hootsuite?

agentic-campaign exposes a local planning SDK and agent tools.
Hootsuite provides a content calendar and publishing workflows; see its [publishing overview](https://www.hootsuite.com/platform/publishing).

### Does agentic-campaign publish to LinkedIn or X (Twitter)?

agentic-campaign stores those names as target labels.
It makes no social network requests and validates no platform-specific constraints.

### Why does agentic-campaign list show no campaigns after create?

agentic-campaign starts a fresh in-memory map for each standalone CLI invocation.
Use a shared SDK object or one persistent MCP server session to retain campaigns.

### Does agentic-campaign generate copy with a language model?

agentic-campaign uses fixed pillar descriptions and hook templates.
Its export includes an AI-assistance disclosure, but no model API is called.

### What does live approval do?

agentic-campaign requires both live and approval flags to change a draft slot to approved.
That local state change makes the slot eligible for export and sends nothing externally.

## Contributing

Run `npm ci`, `npm run build`, `npm run typecheck`, and `npm test` from the repository.

## License

MIT. See the [license text](https://opensource.org/license/mit).
