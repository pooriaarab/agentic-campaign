---
name: agentic-campaign
description: Plan a social campaign calendar across brands and platforms. Keywords: campaign,calendar,planning,agentic-suite,cli,mcp.
---

# agentic-campaign

Plan a social campaign calendar across brands and platforms.

## Use the SDK

```js
import { summarizeText, dispatchText } from "agentic-campaign";

summarizeText("some text");
await dispatchText("some text", { dryRun: true });
```

## Use the CLI

```sh
agentic-campaign summary --text "some text"
agentic-campaign dispatch --text "some text" --dry-run
```

## Use the MCP server

Start the server with `agentic-campaign mcp`. Call `summarize_text`
for stats, `dispatch_text` for routes, `get_cost_report` for costs.

## Rules

- Preview each route with dry run first.
- Report guard denials and adapter errors as failures.
- Read the cost report at the end.
