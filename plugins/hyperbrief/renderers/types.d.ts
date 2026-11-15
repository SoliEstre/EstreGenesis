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
  /**
   * v0.7.7 — either form. The `_md` suffix reads as a markdown blob, so implementers write one;
   * normalize with `normalizeTriggerPhrases` from the renderer engine rather than branching here.
   */
  trigger_phrases_md?: string[] | string;
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
  /**
   * Markdown full brief and stub only: called once for every value placeholder the block-template engine
   * evaluates (`path` as written, template `line`, `empty` = the value was missing or empty). A test hook;
   * it does not change the output.
   */
  on_template_value?: (e: { path: string; line: number; empty: boolean }) => void;
}

export interface ExpandBlockTemplateOptions {
  /** Template name used in error messages (`name:line:col: …`). */
  name?: string;
  /**
   * Receives one entry per problem of the data's shape: a structure (object / list) a template asked to print
   * as text, an `each` over a value that is neither list nor object (nothing is printed there), `@key` inside
   * an `each` over a list (printed as empty). Each entry names the template and line; the last two also name
   * the path of the `each`.
   */
  warnings?: string[];
  onValue?: (e: { path: string; line: number; empty: boolean }) => void;
  /**
   * Called with every printed value whose tag sits in code in the template (inside an inline code span of its
   * line, or between the lines of a literal code fence); the engine emits what it returns instead of the value.
   * Table-row escaping has already been applied to the value it receives (for a value in code: each `|` written
   * as `\|`, backslashes kept). When the code span holds that value alone, the engine prints the span's
   * delimiters around what this returns, chosen from the value it received.
   */
  protect?: (printed: string) => string;
  /**
   * Applied to the template's own text and to the literal of each `ifEquals` before the comparison, for a caller
   * whose context has every string (object keys included) passed through the same function; values are printed
   * as the context holds them. renderMd uses it to escape the lead character of its protected-value markers.
   */
  escape?: (text: string) => string;
}

export declare function renderMd(ir: HyperbriefIR, opts?: RendererOptions): RenderResult;
export declare function renderHtml(ir: HyperbriefIR, opts?: RendererOptions): RenderResult;
export declare function canonicalIrHash(ir: HyperbriefIR): string;
/**
 * The Markdown block-template engine (each / if / else / unless / ifEquals, this, `this.path`, @index, @key, @last,
 * `../`). Throws `HyperbriefTemplateError` (message `name:line:col: …`) on a problem of the template itself — an
 * unknown, unclosed or unmatched block, for one; a problem of the data's shape is a warning instead.
 */
export declare function expandBlockTemplate(template: string, context: unknown, opts?: ExpandBlockTemplateOptions): string;

export interface McpRenderToolInput {
  ir: HyperbriefIR;
  format: "md" | "html";
  options?: RendererOptions;
}
