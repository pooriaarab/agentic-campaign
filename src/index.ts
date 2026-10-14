export { VERSION } from "./version.js";
export {
  defineBrand, createLogger, GuardError, VendorError, createGuards, LocalRouterAdapter,
  HttpRouterAdapter, recordCost, getCostReport, resetCosts, createDryRunResult, dispatchText, summarizeText,
} from "./core.js";
export type {
  BrandConfig, LogLevel, Logger, LoggerOptions, CapsConfig, QuietHoursConfig, GuardsConfig, Guards,
  DispatchReceipt, RouterAdapter, HttpRouterOptions, CostEntry, CostReport, DispatchOptions, DispatchResult,
  TopWord, TextSummary, SummarizeOptions,
} from "./core.js";
export { createCampaign, approveSlot, exportQueue } from "./campaign.js";
export type { CampaignBrief, Campaign, CampaignSlot, ContentPillar, QueueItem, SlotStatus } from "./campaign.js";

import { defineBrand, type BrandConfig } from "./core.js";
import { VERSION } from "./version.js";
export const DEFAULT_BRAND: BrandConfig = defineBrand({
  name: "Agentic Campaign", command: "agentic-campaign",
  description: "Plan a social campaign calendar across brands and platforms.",
  keywords: ["campaign", "calendar", "planning", "agentic-suite", "cli", "mcp"], version: VERSION,
});
