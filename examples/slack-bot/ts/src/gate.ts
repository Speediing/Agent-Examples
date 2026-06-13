export type TriagePlan = {
  summary: string;
  steps: string[];
  ticketTitle: string;
};

export type SideEffectRecord = {
  kind: "ticket" | "pr";
  id: string;
  url: string;
};

export type ApprovalState = {
  approved: boolean;
  rejected: boolean;
  sideEffects: SideEffectRecord[];
};

export function createApprovalState(): ApprovalState {
  return {
    approved: false,
    rejected: false,
    sideEffects: []
  };
}

export function approve(state: ApprovalState): void {
  state.approved = true;
  state.rejected = false;
}

export function reject(state: ApprovalState): void {
  state.approved = false;
  state.rejected = true;
}

export function recordSideEffect(
  state: ApprovalState,
  record: SideEffectRecord
): void {
  if (!canExecuteSideEffects(state)) {
    return;
  }

  state.sideEffects.push(record);
}

export function canExecuteSideEffects(state: ApprovalState): boolean {
  return state.approved && !state.rejected;
}
