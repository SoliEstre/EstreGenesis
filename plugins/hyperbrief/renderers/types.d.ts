// Hyperbrief renderer interface — v0.4.0 (Phase 2)
// Same IR → same output bytes (deterministic invariant).
// See Hyperbrief.md §7 for the IR-driven rendering pipeline contract.

export interface AudienceProfile {
  audience: 1 | 2 | 3 | 4 | 5;
  abbreviation: 1 | 2 | 3 | 4 | 5;
  jargon: 1 | 2 | 3 | 4 | 5;
}

export interface AudienceProfileFallback {
  enabled?: boolean;
  button_label?: string;
  trigger_phrases_md?: string[];
}

export interface HyperbriefIR {
  status: "active" | "blocked_low_escalation";
  decision_id: string;
  [section: string]: unknown;
}

export interface RenderResult {
  output: string;
  output_hash: string;
  ir_hash: string;
  audience_profile_applied: AudienceProfile;
  warnings: string[];
}

export interface RendererOptions {
  audience_profile_override?: AudienceProfile;
  self_contained_assets?: boolean;
  skip_validate?: boolean;
}

export declare function renderMd(ir: HyperbriefIR, opts?: RendererOptions): RenderResult;
export declare function renderHtml(ir: HyperbriefIR, opts?: RendererOptions): RenderResult;
export declare function canonicalIrHash(ir: HyperbriefIR): string;

export interface McpRenderToolInput {
  ir: HyperbriefIR;
  format: "md" | "html";
  options?: RendererOptions;
}
