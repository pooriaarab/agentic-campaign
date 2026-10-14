import { GuardError } from "./core.js";

export type CampaignPlatform = string;
export type SlotStatus = "draft" | "approved" | "scheduled" | "done";

export interface CampaignBrief {
  brand: string;
  goal: string;
  platforms: CampaignPlatform[];
  weeks: number;
  postsPerWeek: number;
  startDate?: string;
  maxPostsPerDayPerPlatform?: number;
  quietHours?: { startHour: number; endHour: number };
}

export interface ContentPillar {
  name: string;
  description: string;
}

export interface CampaignSlot {
  id: string;
  date: string;
  platform: CampaignPlatform;
  format: string;
  pillar: string;
  hook: string;
  status: SlotStatus;
}

export interface Campaign {
  id: string;
  brand: string;
  goal: string;
  platforms: CampaignPlatform[];
  weeks: number;
  postsPerWeek: number;
  startDate: string;
  contentPillars: ContentPillar[];
  schedule: CampaignSlot[];
}

export interface QueueItem {
  brand: string;
  text: string;
  targets: string[];
}

const DISCLOSURE = "[AI-assisted campaign draft — review before publishing]";
const FORMATS = ["short post", "carousel", "video", "story"];

function normalizeDate(input?: string): Date {
  const date = input ? new Date(`${input}T12:00:00.000Z`) : new Date();
  if (Number.isNaN(date.valueOf())) throw new Error("startDate must be an ISO date (YYYY-MM-DD)");
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12));
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function title(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function validateBrief(brief: CampaignBrief): void {
  if (!title(brief.brand)) throw new Error("brief.brand must not be empty");
  if (!title(brief.goal)) throw new Error("brief.goal must not be empty");
  if (!Array.isArray(brief.platforms) || brief.platforms.length === 0 || brief.platforms.some((p) => !title(p))) {
    throw new Error("brief.platforms needs at least one platform");
  }
  for (const [name, value] of [["weeks", brief.weeks], ["postsPerWeek", brief.postsPerWeek]] as const) {
    if (!Number.isInteger(value) || value < 1) throw new Error(`brief.${name} must be an integer of 1 or more`);
  }
  if (brief.maxPostsPerDayPerPlatform !== undefined && (!Number.isInteger(brief.maxPostsPerDayPerPlatform) || brief.maxPostsPerDayPerPlatform < 1)) {
    throw new Error("brief.maxPostsPerDayPerPlatform must be an integer of 1 or more");
  }
}

export function createCampaign(brief: CampaignBrief): Campaign {
  validateBrief(brief);
  const start = normalizeDate(brief.startDate);
  const platforms = [...new Set(brief.platforms.map(title))];
  const goal = title(brief.goal);
  const pillars: ContentPillar[] = [
    { name: "Educate", description: `Help the audience understand ${goal}.` },
    { name: "Proof", description: `Show credible evidence that supports ${goal}.` },
    { name: "Engage", description: `Invite conversation around ${goal}.` },
  ];
  const cap = brief.maxPostsPerDayPerPlatform ?? 1;
  const total = brief.weeks * brief.postsPerWeek;
  const counters = new Map<string, number>();
  const schedule: CampaignSlot[] = [];
  let offset = 0;
  for (let index = 0; index < total; index += 1) {
    const platform = platforms[index % platforms.length];
    let date: Date;
    while (true) {
      date = new Date(start.valueOf());
      date.setUTCDate(start.getUTCDate() + offset);
      const key = `${isoDate(date)}:${platform}`;
      if ((counters.get(key) ?? 0) < cap) {
        counters.set(key, (counters.get(key) ?? 0) + 1);
        break;
      }
      offset += 1;
    }
    const pillar = pillars[index % pillars.length];
    schedule.push({
      id: `slot-${index + 1}`,
      date: isoDate(date),
      platform,
      format: FORMATS[index % FORMATS.length],
      pillar: pillar.name,
      hook: `${goal}: a ${pillar.name.toLowerCase()} angle for ${platform}.`,
      status: "draft",
    });
    offset += 1;
  }
  return {
    id: `campaign-${title(brief.brand).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${isoDate(start)}`,
    brand: title(brief.brand),
    goal,
    platforms,
    weeks: brief.weeks,
    postsPerWeek: brief.postsPerWeek,
    startDate: isoDate(start),
    contentPillars: pillars,
    schedule,
  };
}

export function approveSlot(campaign: Campaign, slotId: string, options: { live?: boolean; approved?: boolean } = {}): Campaign {
  if (options.live !== true || options.approved !== true) {
    throw new GuardError("approving a slot requires --live and explicit approval");
  }
  const slot = campaign.schedule.find((item) => item.id === slotId);
  if (!slot) throw new Error(`slot "${slotId}" was not found`);
  if (slot.status !== "draft") throw new GuardError(`slot "${slotId}" cannot be approved from ${slot.status}`);
  return { ...campaign, schedule: campaign.schedule.map((item) => item.id === slotId ? { ...item, status: "approved" } : { ...item }) };
}

export function exportQueue(campaign: Campaign): QueueItem[] {
  return campaign.schedule
    .filter((slot) => slot.status === "approved" || slot.status === "scheduled")
    .map((slot) => ({
      brand: campaign.brand,
      text: `${DISCLOSURE}\n${slot.hook}\nDraft ${slot.format} for ${slot.pillar}.`,
      targets: [slot.platform],
    }));
}
