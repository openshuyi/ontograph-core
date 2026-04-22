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

	/**
	 * Executes multiple side effects asynchronously
	 *
	 * All side effects run concurrently (fire-and-forget) and do not block.
	 *
	 * @param sideEffects - Array of side effects to execute
	 * @param context - Execution context
	 * @returns Promise that resolves when all side effects complete (or fail silently)
	 */
	async execute(
		sideEffects: SideEffect[],
		context: SideEffectContext,
	): Promise<SideEffectResult[]> {
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
	private async executeWithRetry(
		sideEffect: SideEffect,
		context: SideEffectContext,
	): Promise<SideEffectResult> {
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
	private async executeSingle(
		sideEffect: SideEffect,
		context: SideEffectContext,
	): Promise<void> {
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
	private async executeNotification(
		_sideEffect: SideEffect,
		_context: SideEffectContext,
	): Promise<void> {
		// TODO: Implement actual notification sending logic
	}

	/**
	 * Executes a webhook side effect
	 *
	 * @param sideEffect - Webhook side effect
	 * @param context - Execution context
	 * @returns Promise resolving when webhook is called
	 */
	private async executeWebhook(
		_sideEffect: SideEffect,
		_context: SideEffectContext,
	): Promise<void> {}

	/**
	 * Executes a state change side effect
	 *
	 * @param sideEffect - State change side effect
	 * @param context - Execution context
	 * @returns Promise resolving when state is updated
	 */
	private async executeStateChange(
		_sideEffect: SideEffect,
		_context: SideEffectContext,
	): Promise<void> {}

	/**
	 * Executes an event emission side effect
	 *
	 * @param sideEffect - Event emission side effect
	 * @param context - Execution context
	 * @returns Promise resolving when event is emitted
	 */
	private async executeEmitEvent(
		_sideEffect: SideEffect,
		_context: SideEffectContext,
	): Promise<void> {}

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

	constructor(
		auditor?: ActionAuditor,
		sideEffectExecutor?: SideEffectExecutor,
	) {
		this.validator = new ActionValidator();
		this.auditor = auditor ?? new ActionAuditor();
		this.sideEffectExecutor = sideEffectExecutor ?? new SideEffectExecutor();
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
				const validationResult = this.validator.validate(
					actionType,
					parameters,
				);
				if (!validationResult.valid) {
					throw new ValidationError(
						`Validation failed: ${validationResult.errors.map((e) => e.message).join(", ")}`,
						validationResult.errors,
					);
				}
			}

			// Step 2: Check approval
			if (!options?.skipApproval) {
				const approved = await this.checkApproval(
					actionType,
					parameters,
					userId,
				);
				if (!approved) {
					status = "approval_pending";
					error = "Action requires approval";
				} else {
					// Step 3: Execute action
					// TODO: Implement actual action execution logic
					// For now, just return the parameters as data
					data = parameters;
				}
			} else {
				// Step 3: Execute action (approval skipped)
				// TODO: Implement actual action execution logic
				// For now, just return the parameters as data
				data = parameters;
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
		if (
			status === "success" &&
			actionType.sideEffects &&
			actionType.sideEffects.length > 0
		) {
			const sideEffectContext: SideEffectContext = {
				actionId,
				actionTypeId: actionType["@id"],
				userId,
				result: data,
				timestamp,
			};
			// Trigger side effects asynchronously - don't await the promise
			void this.sideEffectExecutor.execute(
				actionType.sideEffects,
				sideEffectContext,
			);
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
		_parameters: Record<string, unknown>,
		_userId: string,
	): Promise<boolean> {
		const approvalPolicy = actionType.approvalPolicy;

		// Auto-approve if approval is not required
		if (!approvalPolicy.required) {
			return true;
		}

		// TODO: Implement auto-approval conditions checking
		// Check if any of the autoApproveConditions match the current context
		// For now, return false (approval required)
		if (
			approvalPolicy.autoApproveConditions &&
			approvalPolicy.autoApproveConditions.length > 0
		) {
			// TODO: Evaluate autoApproveConditions
			// For now, require approval
			return false;
		}

		// TODO: Implement actual approval workflow
		// For now, return false (approval required)
		return false;
	}

	/**
	 * Sanitizes parameters for audit logging (removes sensitive data)
	 *
	 * @param parameters - Parameters to sanitize
	 * @returns Sanitized parameters
	 */
	private sanitizeParameters(
		parameters: Record<string, unknown>,
	): Record<string, unknown> {
		// TODO: Implement sensitive data filtering (e.g., passwords, tokens)
		// For now, return parameters as-is
		return parameters;
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
