import { ActionAuditor, type AuditLogEntry } from "./action-auditor";
import { ActionValidator, ValidationError } from "./action-validator";
import type { ActionType, SideEffect } from "./types";

/**
 * Result of action execution
 */
export interface ActionExecutionResult {
  /** Unique identifier for this execution */
  actionId: string;
  /** Execution status: "success" | "failure" | "approval_pending" */
  status: "success" | "failure" | "approval_pending";
  /** Result data from action execution (if successful) */
  data?: unknown;
  /** Error message if execution failed */
  error?: string;
  /** Duration of execution in milliseconds */
  duration: number;
  /** Audit log entry ID (if logging enabled) */
  auditLogId?: string;
}

/**
 * Options for action execution
 */
export interface ActionExecutionOptions {
  /** Whether to skip validation (for testing purposes) */
  skipValidation?: boolean;
  /** Whether to skip approval check (for testing purposes) */
  skipApproval?: boolean;
  /** Whether to skip audit logging (for testing purposes) */
  skipAudit?: boolean;
}

/**
 * Context for side effect execution
 */
export interface SideEffectContext {
  /** ID of the action being executed */
  actionId: string;
  /** ID of the action type */
  actionTypeId: string;
  /** User ID who triggered the action */
  userId: string;
  /** Result of action execution */
  result: unknown;
  /** Timestamp of action execution */
  timestamp: string;
}

/**
 * Result of side effect execution
 */
export interface SideEffectResult {
  /** Type of side effect */
  type: string;
  /** Whether execution was successful */
  success: boolean;
  /** Error message if execution failed */
  error?: string;
  /** Duration of execution in milliseconds */
  duration: number;
}

/**
 * Payload for a notification side effect.
 *
 * Mirrors the free-form `SideEffect.config` declared on the ActionType.
 * Well-known keys (see the supply-chain examples): `recipients` (string[]),
 * `channel` (string), `message` (string).
 */
export type NotificationPayload = Record<string, unknown>;

/**
 * Payload for a webhook side effect.
 *
 * Well-known keys: `endpoint` (string), `method` (HTTP method string),
 * `headers` (record), `retries` (number).
 */
export type WebhookPayload = Record<string, unknown>;

/**
 * Payload for a state change side effect.
 *
 * Well-known keys: `entityType`, `property`/`newStatus`, `value`.
 */
export type StateChangePayload = Record<string, unknown>;

/**
 * Payload for an event emission side effect.
 *
 * Well-known keys: `eventType`/`name`, `payload`/`data`.
 */
export type EmitEventPayload = Record<string, unknown>;

/**
 * Pluggable port through which the SideEffectExecutor reaches the outside
 * world (notifications, HTTP calls, state updates, event buses).
 *
 * The core package must stay free of DB/network coupling, so the built-in
 * handlers only forward the side-effect config here; real integrations are
 * injected by adapters (e.g. apps/server).
 */
export interface ActionSideEffectPort {
  /** Deliver a notification */
  notify(payload: NotificationPayload, ctx: SideEffectContext): Promise<void>;
  /** Call an external webhook */
  webhook(payload: WebhookPayload, ctx: SideEffectContext): Promise<void>;
  /** Apply a state change to ontology objects */
  stateChange(payload: StateChangePayload, ctx: SideEffectContext): Promise<void>;
  /** Emit a domain event */
  emitEvent(payload: EmitEventPayload, ctx: SideEffectContext): Promise<void>;
}

/**
 * Default no-op side-effect port.
 *
 * Keeps `new ActionEngine()` fully backward compatible: side effects resolve
 * successfully without doing anything until a real port is injected.
 */
export const noOpSideEffectPort: ActionSideEffectPort = {
  async notify(_payload, _ctx) {},
  async webhook(_payload, _ctx) {},
  async stateChange(_payload, _ctx) {},
  async emitEvent(_payload, _ctx) {},
};

/**
 * Executes side effects triggered by action execution
 *
 * Side effects run asynchronously and do not block the main execution flow.
 * Includes retry mechanism with exponential backoff.
 */
export class SideEffectExecutor {
  /** Maximum number of retries for failed side effects */
  private readonly maxRetries = 3;
  /** Base retry delay in milliseconds */
  private readonly retryDelay = 1000;
  /** Port that performs the actual side effects (defaults to a no-op) */
  private readonly port: ActionSideEffectPort;

  constructor(port: ActionSideEffectPort = noOpSideEffectPort) {
    this.port = port;
  }

  /**
   * Executes multiple side effects asynchronously
   *
   * All side effects run concurrently (fire-and-forget) and do not block.
   *
   * @param sideEffects - Array of side effects to execute
   * @param context - Execution context
   * @returns Promise that resolves when all side effects complete (or fail silently)
   */
  async execute(sideEffects: SideEffect[], context: SideEffectContext): Promise<SideEffectResult[]> {
    if (sideEffects.length === 0) {
      return [];
    }

    // Execute all side effects concurrently
    const promises = sideEffects.map((sideEffect) =>
      this.executeWithRetry(sideEffect, context).catch((error) => {
        console.error(`Side effect failed: ${sideEffect.type}`, error);
        return {
          type: sideEffect.type,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: 0,
        } as SideEffectResult;
      }),
    );

    return Promise.all(promises);
  }

  /**
   * Executes a single side effect with retry logic
   *
   * @param sideEffect - Side effect to execute
   * @param context - Execution context
   * @returns Promise resolving to side effect result
   */
  private async executeWithRetry(sideEffect: SideEffect, context: SideEffectContext): Promise<SideEffectResult> {
    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await this.executeSingle(sideEffect, context);
        return {
          type: sideEffect.type,
          success: true,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * 2 ** attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * Executes a single side effect based on its type
   *
   * @param sideEffect - Side effect to execute
   * @param context - Execution context
   * @returns Promise resolving when execution completes
   */
  private async executeSingle(sideEffect: SideEffect, context: SideEffectContext): Promise<void> {
    switch (sideEffect.type) {
      case "notification":
        await this.executeNotification(sideEffect, context);
        break;

      case "webhook":
        await this.executeWebhook(sideEffect, context);
        break;

      case "stateChange":
        await this.executeStateChange(sideEffect, context);
        break;

      case "emitEvent":
        await this.executeEmitEvent(sideEffect, context);
        break;

      default:
        throw new Error(`Unknown side effect type: ${sideEffect.type}`);
    }
  }

  /**
   * Executes a notification side effect
   *
   * @param sideEffect - Notification side effect
   * @param context - Execution context
   * @returns Promise resolving when notification is sent
   */
  private async executeNotification(sideEffect: SideEffect, context: SideEffectContext): Promise<void> {
    // Shallow-copy the config so adapters cannot mutate the ActionType definition
    await this.port.notify({ ...sideEffect.config }, context);
  }

  /**
   * Executes a webhook side effect
   *
   * @param sideEffect - Webhook side effect
   * @param context - Execution context
   * @returns Promise resolving when webhook is called
   */
  private async executeWebhook(sideEffect: SideEffect, context: SideEffectContext): Promise<void> {
    await this.port.webhook({ ...sideEffect.config }, context);
  }

  /**
   * Executes a state change side effect
   *
   * @param sideEffect - State change side effect
   * @param context - Execution context
   * @returns Promise resolving when state is updated
   */
  private async executeStateChange(sideEffect: SideEffect, context: SideEffectContext): Promise<void> {
    await this.port.stateChange({ ...sideEffect.config }, context);
  }

  /**
   * Executes an event emission side effect
   *
   * @param sideEffect - Event emission side effect
   * @param context - Execution context
   * @returns Promise resolving when event is emitted
   */
  private async executeEmitEvent(sideEffect: SideEffect, context: SideEffectContext): Promise<void> {
    await this.port.emitEvent({ ...sideEffect.config }, context);
  }

  /**
   * Delays execution for a specified number of milliseconds
   *
   * @param ms - Number of milliseconds to delay
   * @returns Promise resolving after delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/** Matches `autoApproveConditions` strings: `<property> <op> <literal>` (e.g. "additionalCost <= 0") */
const AUTO_APPROVE_CONDITION_PATTERN =
  /^\s*([A-Za-z_][\w.-]*)\s*(<=|>=|===|==|!=|<|>|=|includes|contains|in)\s*(.+?)\s*$/;

/**
 * Orchestrates full action execution flow: validate → approve → execute → side effects → audit
 *
 * This is the main entry point for executing actions defined in the ontology.
 */
export class ActionEngine {
  /** Validator for action parameters */
  private readonly validator: ActionValidator;
  /** Auditor for logging action executions */
  private readonly auditor: ActionAuditor;
  /** Executor for side effects */
  private readonly sideEffectExecutor: SideEffectExecutor;
  /** Key names whose values must never reach audit logs (lowercase, separator-stripped) */
  private readonly sensitiveKeyNames = ["password", "token", "secret", "apikey", "authorization", "credential"];
  /** Placeholder substituted for redacted values */
  private readonly redactedValue = "[REDACTED]";

  constructor(auditor?: ActionAuditor, sideEffectExecutor?: SideEffectExecutor, port?: ActionSideEffectPort) {
    this.validator = new ActionValidator();
    this.auditor = auditor ?? new ActionAuditor();
    // A custom executor takes precedence; the port only configures the default one
    this.sideEffectExecutor = sideEffectExecutor ?? new SideEffectExecutor(port);
  }

  /**
   * Executes an action with full validation, approval, execution, and audit flow
   *
   * Execution flow:
   * 1. Validate parameters (unless skipped)
   * 2. Check approval (unless skipped)
   * 3. Execute action
   * 4. Audit log result (unless skipped)
   * 5. Trigger side effects (fire-and-forget)
   *
   * @param actionType - ActionType definition
   * @param parameters - Parameters for the action
   * @param userId - User ID executing the action
   * @param options - Execution options
   * @returns Promise resolving to execution result
   */
  async execute(
    actionType: ActionType,
    parameters: Record<string, unknown>,
    userId: string,
    options?: ActionExecutionOptions,
  ): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    const actionId = `action_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const timestamp = new Date().toISOString();

    let status: "success" | "failure" | "approval_pending" = "success";
    let data: unknown;
    let error: string | undefined;
    let auditLogId: string | undefined;

    try {
      // Step 1: Validate parameters
      if (!options?.skipValidation) {
        const validationResult = this.validator.validate(actionType, parameters);
        if (!validationResult.valid) {
          throw new ValidationError(
            `Validation failed: ${validationResult.errors.map((e) => e.message).join(", ")}`,
            validationResult.errors,
          );
        }
      }

      // Step 2: Check approval
      if (!options?.skipApproval) {
        const approved = await this.checkApproval(actionType, parameters, userId);
        if (!approved) {
          status = "approval_pending";
          error = "Action requires approval";
        } else {
          // Step 3: Execute action
          data = this.performAction(actionType, parameters, timestamp);
        }
      } else {
        // Step 3: Execute action (approval skipped)
        data = this.performAction(actionType, parameters, timestamp);
      }
    } catch (err) {
      status = "failure";
      error = err instanceof Error ? err.message : String(err);
    }

    const duration = Date.now() - startTime;

    // Step 4: Audit log
    if (!options?.skipAudit) {
      const auditEntry: Omit<AuditLogEntry, "id"> = {
        actionId,
        actionTypeId: actionType["@id"],
        timestamp,
        userId,
        parameters: this.sanitizeParameters(parameters),
        result: status,
        error,
        duration,
      };
      auditLogId = this.auditor.recordLog(actionType.auditConfig, auditEntry);
    }

    // Step 5: Trigger side effects (fire-and-forget, does not block)
    if (status === "success" && actionType.sideEffects && actionType.sideEffects.length > 0) {
      const sideEffectContext: SideEffectContext = {
        actionId,
        actionTypeId: actionType["@id"],
        userId,
        result: data,
        timestamp,
      };
      // Trigger side effects asynchronously - don't await the promise
      void this.sideEffectExecutor.execute(actionType.sideEffects, sideEffectContext);
    }

    return {
      actionId,
      status,
      data,
      error,
      duration,
      auditLogId,
    };
  }

  /**
   * Checks if action requires approval and whether it should be auto-approved
   *
   * @param actionType - ActionType definition
   * @param parameters - Parameters for the action
   * @param userId - User ID executing the action
   * @returns Promise resolving to approval decision
   */
  private async checkApproval(
    actionType: ActionType,
    parameters: Record<string, unknown>,
    _userId: string,
  ): Promise<boolean> {
    const approvalPolicy = actionType.approvalPolicy;

    // Auto-approve if approval is not required
    if (!approvalPolicy.required) {
      return true;
    }

    // Each autoApproveCondition is a sufficient condition (OR semantics):
    // auto-approve as soon as one of them positively matches the parameters.
    const autoApproveConditions = approvalPolicy.autoApproveConditions;
    if (autoApproveConditions && autoApproveConditions.length > 0) {
      return autoApproveConditions.some((condition) => this.evaluateAutoApproveCondition(condition, parameters));
    }

    // No auto-approve conditions declared (or none matched): manual approval required
    return false;
  }

  /**
   * Sanitizes parameters for audit logging (redacts sensitive data)
   *
   * `ActionParameter` (types.ts) carries no sensitive/secret flag, so a
   * documented deny-list of key names is used instead: password, token,
   * secret, apiKey, authorization, credential. Matching lowercases the key
   * and strips `-`/`_` separators before substring comparison, so variants
   * like `clientSecret`, `ACCESS_TOKEN` and `api_key` are all caught.
   * Substring matching deliberately errs on the side of over-redaction
   * (e.g. `passwordHint` is redacted too).
   *
   * @param parameters - Parameters to sanitize
   * @returns Sanitized parameters (new object; the input is not mutated)
   */
  private sanitizeParameters(parameters: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parameters)) {
      sanitized[key] = this.isSensitiveKey(key) ? this.redactedValue : this.sanitizeValue(value);
    }
    return sanitized;
  }

  /** Whether a parameter key matches the sensitive deny-list (case/separator-insensitive substring) */
  private isSensitiveKey(key: string): boolean {
    const normalized = key.toLowerCase().replace(/[-_]/g, "");
    return this.sensitiveKeyNames.some((name) => normalized.includes(name));
  }

  /** Recursively sanitizes nested objects and arrays; leaves primitives as-is */
  private sanitizeValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }
    if (this.isPlainObject(value)) {
      return this.sanitizeParameters(value);
    }
    return value;
  }

  /** Narrows to plain objects (excludes arrays, Dates and null) */
  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);
  }

  /**
   * Produces the result data for a successful action execution.
   *
   * An ActionType declares *what* an action is (parameters, policies, side
   * effects); its domain behavior lives in adapters behind
   * ActionSideEffectPort. The produced result is therefore a normalized
   * execution record: omitted optional parameters fall back to their declared
   * defaultValue, and the merged inputs are packaged with identifiers and
   * timestamps for downstream consumers (side effects, audit, callers).
   */
  private performAction(
    actionType: ActionType,
    parameters: Record<string, unknown>,
    timestamp: string,
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...parameters };
    for (const paramDef of actionType.parameters) {
      if (merged[paramDef.name] === undefined && paramDef.defaultValue !== undefined) {
        merged[paramDef.name] = paramDef.defaultValue;
      }
    }
    return {
      actionTypeId: actionType["@id"],
      executedAt: timestamp,
      parameters: merged,
    };
  }

  /**
   * Evaluates a single `autoApproveConditions` string against the parameters.
   *
   * Conditions use the `<property> <op> <literal>` form (e.g.
   * `"additionalCost <= 0"`, `"reason includes 'weather'"`), matching the DSL
   * already used in the supply-chain ActionType examples. Unparseable or
   * unevaluable conditions never match, so a broken condition can only make
   * an action more conservative (manual approval), never less.
   */
  private evaluateAutoApproveCondition(condition: string, context: Record<string, unknown>): boolean {
    const match = AUTO_APPROVE_CONDITION_PATTERN.exec(condition);
    const property = match?.[1];
    const op = match?.[2];
    const rawLiteral = match?.[3];
    if (property === undefined || op === undefined || rawLiteral === undefined) {
      return false;
    }
    const actual = this.resolveConditionValue(context, property);
    const expected = this.parseConditionLiteral(rawLiteral);
    return this.compareConditionValues(actual, expected, op);
  }

  /**
   * Parses the right-hand literal of an auto-approve condition.
   *
   * Supports numbers, single/double-quoted strings, true/false/null and
   * comma-separated array literals (`['eu', 'us']`). Anything else is treated
   * as a bare string.
   */
  private parseConditionLiteral(raw: string): unknown {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      const inner = trimmed.slice(1, -1).trim();
      if (inner === "") {
        return [];
      }
      return inner.split(",").map((part) => this.parseConditionLiteral(part));
    }
    const quoted = /^(['"])(.*)\1$/.exec(trimmed);
    if (quoted?.[2] !== undefined) {
      return quoted[2];
    }
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }
    if (trimmed === "true") {
      return true;
    }
    if (trimmed === "false") {
      return false;
    }
    if (trimmed === "null") {
      return null;
    }
    return trimmed;
  }

  /**
   * Resolves a (possibly dot-separated) parameter path against the evaluation
   * context, mirroring the nested-path resolution used elsewhere in the core.
   */
  private resolveConditionValue(context: Record<string, unknown>, path: string): unknown {
    let current: unknown = context;
    for (const segment of path.split(".")) {
      if (typeof current !== "object" || current === null) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }
    return current;
  }

  /**
   * Compares a parameter value against a condition literal.
   *
   * Mirrors SafeExpressionEvaluator semantics: ordered comparisons only
   * apply to number/number or string/string pairs; equality requires both
   * sides to be present. Unknown operations never match (fail-safe against
   * accidental auto-approval).
   */
  private compareConditionValues(actual: unknown, expected: unknown, op: string): boolean {
    switch (op) {
      case "<":
      case "<=":
      case ">":
      case ">=": {
        if (typeof actual === "number" && typeof expected === "number") {
          if (op === "<") return actual < expected;
          if (op === "<=") return actual <= expected;
          if (op === ">") return actual > expected;
          return actual >= expected;
        }
        if (typeof actual === "string" && typeof expected === "string") {
          if (op === "<") return actual < expected;
          if (op === "<=") return actual <= expected;
          if (op === ">") return actual > expected;
          return actual >= expected;
        }
        return false;
      }
      case "==":
      case "===":
      case "=":
        return (
          actual !== undefined && actual !== null && expected !== undefined && expected !== null && actual === expected
        );
      case "!=":
        return (
          actual !== undefined && actual !== null && expected !== undefined && expected !== null && actual !== expected
        );
      case "in":
        return Array.isArray(expected) && expected.includes(actual);
      case "includes":
      case "contains":
        if (typeof actual === "string" && typeof expected === "string") {
          return actual.includes(expected);
        }
        return Array.isArray(actual) && actual.includes(expected);
      default:
        return false;
    }
  }

  /**
   * Gets the auditor instance (for testing purposes)
   *
   * @returns ActionAuditor instance
   */
  getAuditor(): ActionAuditor {
    return this.auditor;
  }

  /**
   * Gets the side effect executor instance (for testing purposes)
   *
   * @returns SideEffectExecutor instance
   */
  getSideEffectExecutor(): SideEffectExecutor {
    return this.sideEffectExecutor;
  }
}
