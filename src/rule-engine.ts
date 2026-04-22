import { SafeExpressionEvaluator } from "./expression/evaluator";
import type {
	LogicRule,
	RuleConflictResolution,
	RuleExpression,
} from "./types";

/**
 * Context provided to rule evaluation
 */
export interface RuleEvaluationContext {
	/** Entity type being evaluated (e.g., "sc:Inventory") */
	entityType: string;
	/** Entity ID being evaluated */
	entityId: string;
	/** Action being performed (e.g., "update", "create", "delete") */
	action?: string;
	/** Attributes that changed (for on_change triggers) */
	changedAttributes?: string[];
	/** Additional data for evaluation */
	data?: Record<string, unknown>;
}

/**
 * Result of evaluating a single rule
 */
export interface RuleEvaluationResult {
	/** Rule ID that was evaluated */
	ruleId: string;
	/** Whether rule was triggered (condition met) */
	triggered: boolean;
	/** Whether condition expression evaluated to true */
	conditionMet: boolean;
	/** Result of action expression execution */
	actionResult?: unknown;
	/** Error if evaluation failed */
	error?: string;
	/** Duration of evaluation in milliseconds */
	duration: number;
}

/**
 * Result of evaluating all matching rules
 */
export interface RuleEvaluationSummary {
	/** All evaluation results */
	results: RuleEvaluationResult[];
	/** Merged result if conflict resolution is "merge" */
	mergedResult?: unknown;
	/** Total evaluation time in milliseconds */
	totalDuration: number;
	/** Number of rules triggered */
	triggeredCount: number;
}

/**
 * Entry in execution history
 */
export interface RuleExecutionHistoryEntry {
	/** Rule ID */
	ruleId: string;
	/** Context of evaluation */
	context: RuleEvaluationContext;
	/** Result of evaluation */
	result: RuleEvaluationResult;
	/** Timestamp of execution */
	timestamp: string;
}

/**
 * Custom error class for rule evaluation failures
 */
export class RuleEvaluationError extends Error {
	/** Rule ID that caused the error */
	public readonly ruleId: string;

	constructor(ruleId: string, message: string) {
		super(message);
		this.name = "RuleEvaluationError";
		this.ruleId = ruleId;
	}
}

/**
 * Custom error class for expression evaluation failures
 */
export class ExpressionEvaluationError extends Error {
	/** Expression that failed */
	public readonly expression: string;
	/** Language of expression */
	public readonly language: string;

	constructor(expression: string, language: string, message: string) {
		super(message);
		this.name = "ExpressionEvaluationError";
		this.expression = expression;
		this.language = language;
	}
}

/**
 * Evaluates expressions in different languages
 *
 * Supports TypeScript expressions via safe sandbox execution.
 * Other languages (SQL, Cypher, natural) are placeholders for future integration.
 */
export class ExpressionEvaluator {
	/** Safe expression evaluator instance for structured expressions */
	private readonly safeEval = new SafeExpressionEvaluator();

	/**
	 * Evaluates an expression against a context
	 *
	 * @param expression - Expression to evaluate
	 * @param context - Evaluation context
	 * @returns Evaluation result
	 * @throws ExpressionEvaluationError if evaluation fails
	 */
	evaluate(
		expression: RuleExpression,
		context: RuleEvaluationContext,
	): unknown {
		try {
			// 优先使用结构化表达式
			if (expression.expr) {
				return this.safeEval.evaluate(expression.expr, context.data ?? {});
			}

			// 向后兼容：字符串表达式（生产环境禁用）
			if (!expression.expr) {
				// 生产环境禁用字符串表达式求值
				if (process.env.NODE_ENV === "production") {
					throw new ExpressionEvaluationError(
						expression.body,
						expression.language,
						"String expressions are disabled in production. Use Expr AST instead.",
					);
				}
			}

			switch (expression.language) {
				case "typescript":
					return this.evaluateTypeScript(expression.body, context);

				case "sql":
					// TODO: Implement SQL expression evaluation with backend integration
					// For now, return placeholder
					return this.evaluatePlaceholder("sql", expression.body);

				case "cypher":
					// TODO: Implement Cypher expression evaluation with Neo4j integration
					// For now, return placeholder
					return this.evaluatePlaceholder("cypher", expression.body);

				case "natural":
					// TODO: Implement natural language expression evaluation with LLM integration
					// For now, return placeholder
					return this.evaluatePlaceholder("natural", expression.body);

				default:
					throw new ExpressionEvaluationError(
						expression.body,
						expression.language,
						`Unsupported expression language: ${expression.language}`,
					);
			}
		} catch (error) {
			if (error instanceof ExpressionEvaluationError) {
				throw error;
			}
			throw new ExpressionEvaluationError(
				expression.body,
				expression.language,
				error instanceof Error ? error.message : String(error),
			);
		}
	}

	/**
	 * @deprecated 使用结构化 Expr 替代。此方法存在安全风险。
	 *
	 * Evaluates a TypeScript expression in a safe sandbox
	 *
	 * Uses Function constructor with limited context exposure.
	 * In production, this should be replaced with a more secure sandbox.
	 *
	 * @param body - TypeScript expression body
	 * @param context - Evaluation context
	 * @returns Evaluation result
	 * @throws ExpressionEvaluationError if evaluation fails
	 */
	private evaluateTypeScript(
		body: string,
		context: RuleEvaluationContext,
	): unknown {
		try {
			// Create a function with the context as parameter
			// TODO: Implement more secure sandbox for production
			// Current implementation uses Function() which has security implications
			const fn = new Function("context", `return ${body};`);
			return fn(context);
		} catch (error) {
			throw new ExpressionEvaluationError(
				body,
				"typescript",
				error instanceof Error ? error.message : String(error),
			);
		}
	}

	/**
	 * Placeholder evaluator for unsupported expression languages
	 *
	 * @param language - Expression language
	 * @param body - Expression body
	 * @returns Placeholder result
	 */
	private evaluatePlaceholder(_language: string, _body: string): unknown {
		return null;
	}
}

/**
 * Engine for registering, managing, and evaluating LogicRule definitions
 *
 * Rule evaluation follows these principles:
 * - Rules are sorted by priority before evaluation (higher priority = evaluated first)
 * - Conflict resolution determines how multiple triggered rules are handled
 * - Trigger modes filter which rules are considered for evaluation
 * - Expression evaluation supports TypeScript (safe sandbox), with placeholders for other languages
 * - Execution history is tracked in-memory for debugging
 */
export class RuleEngine {
	/** Registered rules by ID */
	private readonly rules: Map<string, LogicRule> = new Map();
	/** Expression evaluator instance */
	private readonly evaluator: ExpressionEvaluator;
	/** In-memory execution history */
	private readonly history: RuleExecutionHistoryEntry[] = [];
	/** Maximum history size */
	private readonly maxHistorySize = 1000;

	constructor(evaluator?: ExpressionEvaluator) {
		this.evaluator = evaluator ?? new ExpressionEvaluator();
	}

	/**
	 * Registers a rule with the engine
	 *
	 * @param rule - LogicRule to register
	 * @throws Error if rule ID already exists
	 */
	register(rule: LogicRule): void {
		const ruleId = rule["@id"];
		if (this.rules.has(ruleId)) {
			throw new Error(`Rule with ID '${ruleId}' is already registered`);
		}
		this.rules.set(ruleId, rule);
	}

	/**
	 * Unregisters a rule from the engine
	 *
	 * @param ruleId - ID of rule to unregister
	 * @returns True if rule was found and removed, false otherwise
	 */
	unregister(ruleId: string): boolean {
		return this.rules.delete(ruleId);
	}

	/**
	 * Evaluates a specific rule against a context
	 *
	 * @param ruleId - ID of rule to evaluate
	 * @param context - Evaluation context
	 * @returns Rule evaluation result
	 * @throws RuleEvaluationError if rule not found or evaluation fails
	 */
	evaluateRule(
		ruleId: string,
		context: RuleEvaluationContext,
	): RuleEvaluationResult {
		const rule = this.rules.get(ruleId);
		if (!rule) {
			throw new RuleEvaluationError(
				ruleId,
				`Rule with ID '${ruleId}' not found`,
			);
		}

		return this.evaluateSingle(rule, context);
	}

	/**
	 * Evaluates all matching rules against a context
	 *
	 * Evaluation process:
	 * 1. Filter rules by trigger mode (on_change, on_query, scheduled, manual)
	 * 2. Sort filtered rules by priority (higher priority first)
	 * 3. Evaluate each rule
	 * 4. Apply conflict resolution strategy
	 *
	 * @param context - Evaluation context
	 * @returns Evaluation summary with results and merged result if applicable
	 */
	evaluate(context: RuleEvaluationContext): RuleEvaluationSummary {
		const startTime = Date.now();
		const results: RuleEvaluationResult[] = [];

		// Step 1: Filter rules by trigger mode and enabled status
		const matchingRules = this.filterMatchingRules(context);

		// Step 2: Sort rules by priority (higher priority = evaluated first)
		matchingRules.sort((a, b) => {
			const priorityA = a.trigger.priority ?? 0;
			const priorityB = b.trigger.priority ?? 0;
			return priorityB - priorityA; // Descending order
		});

		// Step 3: Evaluate each rule
		for (const rule of matchingRules) {
			try {
				const result = this.evaluateSingle(rule, context);
				results.push(result);
			} catch (error) {
				// Log error but continue evaluating other rules
				console.error(
					`[RuleEngine] Failed to evaluate rule ${rule["@id"]}:`,
					error,
				);
				results.push({
					ruleId: rule["@id"],
					triggered: false,
					conditionMet: false,
					error: error instanceof Error ? error.message : String(error),
					duration: 0,
				});
			}
		}

		// Step 4: Apply conflict resolution strategy
		const triggeredResults = results.filter((r) => r.triggered);
		let mergedResult: unknown | undefined;

		if (triggeredResults.length > 0) {
			const firstTriggered = triggeredResults[0];
			if (firstTriggered) {
				const firstRule = this.rules.get(firstTriggered.ruleId);
				if (firstRule?.conflictResolution) {
					mergedResult = this.applyConflictResolution(
						firstRule.conflictResolution,
						triggeredResults,
						context,
					);
				}
			}
		}

		const totalDuration = Date.now() - startTime;

		return {
			results,
			mergedResult,
			totalDuration,
			triggeredCount: triggeredResults.length,
		};
	}

	/**
	 * Gets execution history
	 *
	 * @param limit - Maximum number of entries to return (default: 100)
	 * @returns Execution history entries
	 */
	getHistory(limit = 100): RuleExecutionHistoryEntry[] {
		return this.history.slice(-limit);
	}

	/**
	 * Clears execution history
	 */
	clearHistory(): void {
		this.history.length = 0;
	}

	/**
	 * Gets all registered rules
	 *
	 * @returns Array of registered LogicRule
	 */
	getRules(): LogicRule[] {
		return Array.from(this.rules.values());
	}

	/**
	 * Evaluates a single rule
	 *
	 * @param rule - LogicRule to evaluate
	 * @param context - Evaluation context
	 * @returns Rule evaluation result
	 */
	private evaluateSingle(
		rule: LogicRule,
		context: RuleEvaluationContext,
	): RuleEvaluationResult {
		const startTime = Date.now();
		const ruleId = rule["@id"];
		let triggered = false;
		let conditionMet = false;
		let actionResult: unknown;
		let error: string | undefined;

		try {
			// Evaluate condition
			const conditionValue = this.evaluator.evaluate(rule.condition, context);
			conditionMet = Boolean(conditionValue);

			if (conditionMet) {
				// Condition met, evaluate action
				triggered = true;
				actionResult = this.evaluator.evaluate(rule.action, context);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		}

		const duration = Date.now() - startTime;
		const result: RuleEvaluationResult = {
			ruleId,
			triggered,
			conditionMet,
			actionResult,
			error,
			duration,
		};

		// Add to history
		this.addToHistory(ruleId, context, result);

		return result;
	}

	/**
	 * Filters rules based on trigger mode and context
	 *
	 * @param context - Evaluation context
	 * @returns Filtered and enabled rules
	 */
	private filterMatchingRules(context: RuleEvaluationContext): LogicRule[] {
		const matching: LogicRule[] = [];

		for (const rule of this.rules.values()) {
			// Skip disabled rules
			if (rule.enabled === false) {
				continue;
			}

			const trigger = rule.trigger;

			// Filter by trigger mode
			switch (trigger.mode) {
				case "on_change":
					// Match if this is a change event and attributes match
					if (
						context.action &&
						["create", "update", "delete"].includes(context.action)
					) {
						// Check target types if specified
						if (
							trigger.targetTypes &&
							trigger.targetTypes.length > 0 &&
							!trigger.targetTypes.includes(context.entityType)
						) {
							continue;
						}
						// Check watched attributes if specified
						if (
							trigger.watchedAttributes &&
							trigger.watchedAttributes.length > 0 &&
							context.changedAttributes
						) {
							const hasWatchedChange = trigger.watchedAttributes.some((attr) =>
								context.changedAttributes?.includes(attr),
							);
							if (!hasWatchedChange) {
								continue;
							}
						}
						matching.push(rule);
					}
					break;

				case "on_query":
					// Match if this is a query action
					if (context.action === "query") {
						if (
							trigger.targetTypes &&
							trigger.targetTypes.length > 0 &&
							!trigger.targetTypes.includes(context.entityType)
						) {
							continue;
						}
						matching.push(rule);
					}
					break;

				case "scheduled":
					// TODO: Implement cron-based scheduled trigger matching
					// For now, include scheduled rules in query context for testing
					matching.push(rule);
					break;

				case "manual":
					// Manual triggers are only evaluated when explicitly requested
					matching.push(rule);
					break;
			}
		}

		return matching;
	}

	/**
	 * Applies conflict resolution strategy to triggered results
	 *
	 * @param conflictResolution - Conflict resolution configuration
	 * @param triggeredResults - Results of triggered rules
	 * @param context - Evaluation context
	 * @returns Merged or selected result
	 */
	private applyConflictResolution(
		conflictResolution: RuleConflictResolution,
		triggeredResults: RuleEvaluationResult[],
		context: RuleEvaluationContext,
	): unknown {
		const strategy = conflictResolution.strategy;
		const firstResult = triggeredResults[0];
		if (!firstResult) return undefined;

		switch (strategy) {
			case "highest_priority":
				// Return result from highest priority rule (first in sorted list)
				return firstResult.actionResult;

			case "first_match":
				// Return result from first rule that fired (first in sorted list)
				return firstResult.actionResult;

			case "all":
				// Return all action results as array
				return triggeredResults.map((r) => r.actionResult);

			case "merge":
				// Merge results using merge expression
				if (conflictResolution.mergeExpression) {
					try {
						const mergeContext: RuleEvaluationContext & {
							results: RuleEvaluationResult[];
						} = {
							...context,
							results: triggeredResults,
						};
						return this.evaluator.evaluate(
							conflictResolution.mergeExpression,
							mergeContext,
						);
					} catch (error) {
						console.error("[RuleEngine] Failed to merge results:", error);
						// Fallback to highest priority
						return firstResult.actionResult;
					}
				}
				// No merge expression, fallback to highest priority
				return firstResult.actionResult;

			default:
				console.warn(
					`[RuleEngine] Unknown conflict resolution strategy: ${strategy}`,
				);
				return firstResult.actionResult;
		}
	}

	/**
	 * Adds entry to execution history
	 *
	 * @param ruleId - Rule ID
	 * @param context - Evaluation context
	 * @param result - Evaluation result
	 */
	private addToHistory(
		ruleId: string,
		context: RuleEvaluationContext,
		result: RuleEvaluationResult,
	): void {
		const entry: RuleExecutionHistoryEntry = {
			ruleId,
			context,
			result,
			timestamp: new Date().toISOString(),
		};

		this.history.push(entry);

		// Trim history if exceeding max size
		if (this.history.length > this.maxHistorySize) {
			this.history.shift();
		}
	}

	/**
	 * Gets expression evaluator instance (for testing purposes)
	 *
	 * @returns ExpressionEvaluator instance
	 */
	getEvaluator(): ExpressionEvaluator {
		return this.evaluator;
	}
}
