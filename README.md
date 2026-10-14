# Agentic Campaign

`agentic-campaign` plans social campaign calendars; it never publishes.

## Install and verify

```sh
npm install
npm run build && npm run typecheck && npm test
node dist/cli.js --help
```

## CLI

```sh
agentic-campaign campaign create --brand Acme --goal "launch a new feature" \
  --platforms linkedin,x --weeks 2 --posts-per-week 3
```

Use `campaign list`, `campaign show --id <id>`, and `campaign export --id <id>`.
Approving a slot is a guarded state change and requires both `--live` and `--approve`:

```sh
agentic-campaign campaign approve-slot --id <id> --slot slot-1 --live --approve
```

Exports contain only approved or scheduled slots and return queue items shaped as `{ brand, text, targets }`. Generated draft text carries an AI-assistance disclosure.

## Library

```ts
import { createCampaign, approveSlot, exportQueue } from "agentic-campaign";
const campaign = createCampaign({ brand: "Acme", goal: "launch", platforms: ["linkedin"], weeks: 1, postsPerWeek: 2 });
const approved = approveSlot(campaign, "slot-1", { live: true, approved: true });
console.log(exportQueue(approved));
```

## MCP

Run `agentic-campaign mcp`. Tools: `create_campaign`, `list_campaigns`, `show_campaign`, `approve_campaign_slot`, `export_campaign_queue`, and `get_cost_report`.
