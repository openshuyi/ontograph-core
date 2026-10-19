import { describe, expect, it } from "vitest";
import { ActionAuditor } from "./action-auditor";
import { ActionEngine, type ActionSideEffectPort, type SideEffectContext, SideEffectExecutor } from "./action-engine";
import type { ActionType } from "./types";

// ═══════════════════════════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════════════════════════

function createActionType(overrides: Partial<ActionType> = {}): ActionType {
  return {
    "@id": "sc:TestAction",
    "@type": "ActionType",
    label: { en: "Test Action" },
    parameters: [],
    approvalPolicy: { required: false },
    auditConfig: { enabled: true, logLevel: "full" },
    ...overrides,
  };
}

interface PortCall {
  method: "notify" | "webhook" | "stateChange" | "emitEvent";
  payload: Record<string, unknown>;
  ctx: SideEffectContext;
}

function createSpyPort(calls: PortCall[]): ActionSideEffectPort {
  return {
    async notify(payload, ctx) {
      calls.push({ method: "notify", payload, ctx });
    },
    async webhook(payload, ctx) {
      calls.push({ method: "webhook", payload, ctx });
    },
    async stateChange(payload, ctx) {
      calls.push({ method: "stateChange", payload, ctx });
    },
    async emitEvent(payload, ctx) {
      calls.push({ method: "emitEvent", payload, ctx });
    },
  };
}

/** Side effects are dispatched fire-and-forget; flush the microtask/timer queue before asserting */
async function flushSideEffects(ms = 25): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════
// Side-effect dispatch
// ═══════════════════════════════════════════════════════════

describe("ActionEngine side-effect dispatch", () => {
  it("dispatches each configured side effect to the matching port method", async () => {
    const calls: PortCall[] = [];
    const actionType = createActionType({
      sideEffects: [
        { type: "notification", config: { recipients: ["scm:Operator"], channel: "email" } },
        { type: "webhook", config: { endpoint: "/api/erp/sync", method: "POST" } },
        { type: "stateChange", config: { entityType: "scm:TransportOrder", property: "status", value: "synced" } },
        { type: "emitEvent", config: { eventType: "sc:OrderSynced", payload: { source: "erp" } } },
      ],
    });
    const engine = new ActionEngine(undefined, undefined, createSpyPort(calls));

    const result = await engine.execute(actionType, { orderId: "po-1" }, "user-1");
    await flushSideEffects();

    expect(result.status).toBe("success");
    expect(calls.map((call) => call.method).sort()).toEqual(["emitEvent", "notify", "stateChange", "webhook"]);

    const notification = calls.find((call) => call.method === "notify");
    expect(notification?.payload).toEqual({ recipients: ["scm:Operator"], channel: "email" });
    expect(notification?.ctx.actionTypeId).toBe("sc:TestAction");
    expect(notification?.ctx.userId).toBe("user-1");
    expect(notification?.ctx.result).toEqual({
      actionTypeId: "sc:TestAction",
      executedAt: expect.any(String),
      parameters: { orderId: "po-1" },
    });
  });

  it("does not dispatch side effects when approval is pending", async () => {
    const calls: PortCall[] = [];
    const actionType = createActionType({
      parameters: [{ name: "amount", label: { en: "Amount" }, type: "float", required: true }],
      approvalPolicy: { required: true, autoApproveConditions: ["amount <= 100"] },
      sideEffects: [{ type: "notification", config: { channel: "email" } }],
    });
    const engine = new ActionEngine(undefined, undefined, createSpyPort(calls));

    const result = await engine.execute(actionType, { amount: 500 }, "user-1", { skipAudit: true });
    await flushSideEffects();

    expect(result.status).toBe("approval_pending");
    expect(calls).toHaveLength(0);
  });

  it("defaults to a no-op port when none is injected (backward compatible)", async () => {
    const actionType = createActionType({
      sideEffects: [{ type: "webhook", config: { endpoint: "/x" } }],
    });

    const result = await new ActionEngine().execute(actionType, {}, "user-1");
    await flushSideEffects();

    expect(result.status).toBe("success");
  });

  it("exposes the no-op port as the SideEffectExecutor default", () => {
    const executor = new SideEffectExecutor();
    const result = executor.execute([{ type: "emitEvent", config: { eventType: "sc:X" } }], {
      actionId: "action-1",
      actionTypeId: "sc:TestAction",
      userId: "user-1",
      result: undefined,
      timestamp: new Date().toISOString(),
    });

    return expect(result).resolves.toEqual([{ type: "emitEvent", success: true, duration: expect.any(Number) }]);
  });
});

// ═══════════════════════════════════════════════════════════
// Result data
// ═══════════════════════════════════════════════════════════

describe("ActionEngine result data", () => {
  it("returns a produced execution record with declared defaults applied instead of echoing parameters", async () => {
    const actionType = createActionType({
      parameters: [
        { name: "quantity", label: { en: "Quantity" }, type: "integer", required: true },
        { name: "syncMode", label: { en: "Sync Mode" }, type: "string", required: false, defaultValue: "incremental" },
      ],
    });
    const engine = new ActionEngine();

    const result = await engine.execute(actionType, { quantity: 10 }, "user-1", { skipAudit: true });

    expect(result.status).toBe("success");
    expect(result.data).toEqual({
      actionTypeId: "sc:TestAction",
      executedAt: expect.any(String),
      parameters: { quantity: 10, syncMode: "incremental" },
    });
  });
});

// ═══════════════════════════════════════════════════════════
// Approval policy
// ═══════════════════════════════════════════════════════════

describe("ActionEngine auto-approval conditions", () => {
  function approvalAction(autoApproveConditions?: string[]): ActionType {
    return createActionType({
      parameters: [
        { name: "additionalCost", label: { en: "Additional Cost" }, type: "float", required: true },
        { name: "reason", label: { en: "Reason" }, type: "string", required: true },
        { name: "region", label: { en: "Region" }, type: "string", required: false },
      ],
      approvalPolicy: { required: true, approvers: ["scm:Manager"], autoApproveConditions },
    });
  }

  const params = { additionalCost: 0, reason: "weather delay", region: "eu" };

  it("auto-approves without conditions when approval is not required", async () => {
    const engine = new ActionEngine();
    const result = await engine.execute(createActionType(), {}, "user-1", { skipAudit: true });
    expect(result.status).toBe("success");
    expect(result.error).toBeUndefined();
  });

  it("auto-approves when a numeric condition is met", async () => {
    const engine = new ActionEngine();
    const result = await engine.execute(approvalAction(["additionalCost <= 0"]), params, "user-1", { skipAudit: true });
    expect(result.status).toBe("success");
  });

  it("requires manual approval when numeric conditions are not met", async () => {
    const engine = new ActionEngine();
    const result = await engine.execute(
      approvalAction(["additionalCost <= 0"]),
      { ...params, additionalCost: 500 },
      "user-1",
      { skipAudit: true },
    );
    expect(result.status).toBe("approval_pending");
    expect(result.error).toBe("Action requires approval");
  });

  it("auto-approves when a string 'includes' condition is met", async () => {
    const engine = new ActionEngine();
    const result = await engine.execute(approvalAction(["reason includes 'weather'"]), params, "user-1", {
      skipAudit: true,
    });
    expect(result.status).toBe("success");
  });

  it("requires manual approval when the string does not include the pattern", async () => {
    const engine = new ActionEngine();
    const result = await engine.execute(
      approvalAction(["reason includes 'weather'"]),
      { ...params, reason: "cost optimization" },
      "user-1",
      { skipAudit: true },
    );
    expect(result.status).toBe("approval_pending");
  });

  it("auto-approves when an 'in' list condition is met", async () => {
    const engine = new ActionEngine();
    const result = await engine.execute(approvalAction(["region in ['eu', 'us']"]), params, "user-1", {
      skipAudit: true,
    });
    expect(result.status).toBe("success");
  });

  it("auto-approves when any one of several conditions matches (OR semantics)", async () => {
    const engine = new ActionEngine();
    const result = await engine.execute(
      approvalAction(["additionalCost <= 0", "reason includes 'weather'"]),
      { ...params, additionalCost: 500, reason: "weather delay" },
      "user-1",
      { skipAudit: true },
    );
    expect(result.status).toBe("success");
  });

  it("requires manual approval when an equality condition fails", async () => {
    const engine = new ActionEngine();
    const result = await engine.execute(approvalAction(["region == 'us'"]), params, "user-1", { skipAudit: true });
    expect(result.status).toBe("approval_pending");
  });

  it("never auto-approves on unparseable conditions (fail-safe)", async () => {
    const engine = new ActionEngine();
    const result = await engine.execute(approvalAction(["~not-a-condition~"]), params, "user-1", { skipAudit: true });
    expect(result.status).toBe("approval_pending");
  });

  it("requires manual approval when conditions reference missing parameters", async () => {
    const engine = new ActionEngine();
    const result = await engine.execute(
      approvalAction(["missingParam > 10"]),
      { additionalCost: 0, reason: "none" },
      "user-1",
      { skipAudit: true },
    );
    expect(result.status).toBe("approval_pending");
  });
});

// ═══════════════════════════════════════════════════════════
// Parameter sanitization
// ═══════════════════════════════════════════════════════════

describe("ActionEngine parameter sanitization", () => {
  it("redacts deny-listed parameter values in audit logs", async () => {
    const auditor = new ActionAuditor();
    const engine = new ActionEngine(auditor);
    const parameters = {
      username: "alice",
      password: "hunter2",
      apiKey: "sk-123",
      access_token: "tok-1",
      clientSecret: "s-1",
      Authorization: "Bearer xyz",
      credentials: "c-1",
      nested: { authorization: "Bearer abc", safe: "keep" },
      history: [{ credential: "c-2", note: "n" }],
    };

    const result = await engine.execute(createActionType(), parameters, "user-1");

    expect(result.auditLogId).toBeTruthy();
    const logs = auditor.queryLogs();
    expect(logs.total).toBe(1);
    expect(logs.entries[0]?.parameters).toEqual({
      username: "alice",
      password: "[REDACTED]",
      apiKey: "[REDACTED]",
      access_token: "[REDACTED]",
      clientSecret: "[REDACTED]",
      Authorization: "[REDACTED]",
      credentials: "[REDACTED]",
      nested: { authorization: "[REDACTED]", safe: "keep" },
      history: [{ credential: "[REDACTED]", note: "n" }],
    });
  });

  it("does not mutate the caller's parameters object", async () => {
    const engine = new ActionEngine();
    const parameters = { password: "hunter2", quantity: 5 };

    await engine.execute(createActionType(), parameters, "user-1", { skipAudit: true });

    expect(parameters).toEqual({ password: "hunter2", quantity: 5 });
  });

  it("keeps benign values untouched", async () => {
    const auditor = new ActionAuditor();
    const engine = new ActionEngine(auditor);
    const parameters = { quantity: 5, note: "regular work", tags: ["a", "b"] };

    await engine.execute(createActionType(), parameters, "user-1");

    expect(auditor.queryLogs().entries[0]?.parameters).toEqual(parameters);
  });
});
