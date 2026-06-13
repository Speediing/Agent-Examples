import type { SDKJsonValue } from "@cursor/sdk";
import { canExecuteSideEffects, recordSideEffect, type ApprovalState } from "./gate.js";

export function createRecord(args: { plan?: SDKJsonValue; approval?: ApprovalState }) {
  if (!args.approval || !canExecuteSideEffects(args.approval)) {
    return { created: false, reason: "Side effects require an explicit human approval.", record: null };
  }
  const record = { id: "alert-triage-bot-1", url: "https://tracker.example.com/alert-triage-bot/1" };
  recordSideEffect(args.approval, { kind: "ticket", id: record.id, url: record.url });
  return { created: true, reason: null, record };
}
