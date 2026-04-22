/**
 * 安全表达式求值器 — 纯函数递归实现，无 eval
 *
 * 基于 Expr AST 结构化表达式进行求值，支持：
 * - 字面量、属性路径、比较、逻辑、函数调用、条件、算术、数组操作
 * - 递归深度限制（防恶意嵌套）
 * - null/undefined 安全（遇到无法求值的表达式返回 undefined）
 */
import type { Expr } from "./types";

/** 安全表达式求值器 — 纯函数递归，无 eval */
export class SafeExpressionEvaluator {
	/** 最大递归深度限制 */
	private static readonly MAX_DEPTH = 50;

	/** 原型污染黑名单 */
	private static readonly UNSAFE_KEYS = new Set([
		"__proto__",
		"constructor",
		"prototype",
	]);

	/**
	 * 求值表达式
	 * @param expr - 结构化表达式 AST
	 * @param context - 上下文变量（如 { quantity: 100, safetyStock: 50 }）
	 * @returns 求值结果，无法求值时返回 undefined
	 */
	evaluate(expr: Expr, context: Record<string, unknown>): unknown {
		return this.evalExpr(expr, context, 0);
	}

	/**
	 * 内部递归求值入口
	 * @param expr - 当前表达式节点
	 * @param context - 上下文变量
	 * @param depth - 当前递归深度
	 * @returns 求值结果
	 */
	private evalExpr(
		expr: Expr,
		context: Record<string, unknown>,
		depth: number,
	): unknown {
		if (depth >= SafeExpressionEvaluator.MAX_DEPTH) {
			return undefined;
		}

		switch (expr.type) {
			case "literal":
				return expr.value;
			case "property":
				return this.resolveProperty(expr.path, context);
			case "compare":
				return this.evalCompare(expr, context, depth);
			case "logical":
				return this.evalLogical(expr, context, depth);
			case "call":
				return this.evalCall(expr, context, depth);
			case "conditional":
				return this.evalConditional(expr, context, depth);
			case "arithmetic":
				return this.evalArithmetic(expr, context, depth);
			case "array":
				return this.evalArray(expr, context, depth);
			default:
				return undefined;
		}
	}

	// ─── 属性路径解析 ───────────────────────────────────────────────

	/**
	 * 从上下文中按点号分隔路径取值
	 * 支持 "address.city" 等嵌套路径，路径不存在返回 undefined
	 */
	private resolveProperty(
		path: string,
		context: Record<string, unknown>,
	): unknown {
		const segments = path.split(".");
		let current: unknown = context;
		for (const segment of segments) {
			if (SafeExpressionEvaluator.UNSAFE_KEYS.has(segment)) return undefined;
			if (current === null || current === undefined) {
				return undefined;
			}
			if (typeof current === "object") {
				current = (current as Record<string, unknown>)[segment];
			} else {
				return undefined;
			}
		}
		return current;
	}

	// ─── 比较表达式 ─────────────────────────────────────────────────

	/** 求值比较表达式 */
	private evalCompare(
		expr: Extract<Expr, { type: "compare" }>,
		context: Record<string, unknown>,
		depth: number,
	): unknown {
		const left = this.evalExpr(expr.left, context, depth + 1);
		const right = this.evalExpr(expr.right, context, depth + 1);

		switch (expr.op) {
			case "eq":
				return this.compareEquality(left, right);
			case "neq":
				return !this.compareEquality(left, right);
			case "gt":
				return this.compareOrdered(left, right, (a, b) => a > b);
			case "gte":
				return this.compareOrdered(left, right, (a, b) => a >= b);
			case "lt":
				return this.compareOrdered(left, right, (a, b) => a < b);
			case "lte":
				return this.compareOrdered(left, right, (a, b) => a <= b);
			case "contains":
				return this.compareStringMethod(left, right, (s, p) => s.includes(p));
			case "startsWith":
				return this.compareStringMethod(left, right, (s, p) => s.startsWith(p));
			case "endsWith":
				return this.compareStringMethod(left, right, (s, p) => s.endsWith(p));
			case "matches":
				return this.compareMatches(left, right);
			case "in":
				return this.compareIn(left, right);
			default:
				return undefined;
		}
	}

	/** 等值比较 — null/undefined 参与时返回 false */
	private compareEquality(left: unknown, right: unknown): boolean {
		if (
			left === null ||
			left === undefined ||
			right === null ||
			right === undefined
		) {
			return false;
		}
		return left === right;
	}

	/** 有序比较（gt/gte/lt/lte）— 非数值/非字符串时返回 false */
	private compareOrdered(
		left: unknown,
		right: unknown,
		fn: (a: number | string, b: number | string) => boolean,
	): boolean {
		if (
			left === null ||
			left === undefined ||
			right === null ||
			right === undefined
		) {
			return false;
		}
		if (typeof left === "number" && typeof right === "number") {
			return fn(left, right);
		}
		if (typeof left === "string" && typeof right === "string") {
			return fn(left, right);
		}
		return false;
	}

	/** 字符串方法比较（contains/startsWith/endsWith）— 非字符串返回 false */
	private compareStringMethod(
		left: unknown,
		right: unknown,
		fn: (str: string, pattern: string) => boolean,
	): boolean {
		if (typeof left !== "string" || typeof right !== "string") {
			return false;
		}
		return fn(left, right);
	}

	/** 正则匹配 — right 必须是字符串正则表达式（限制长度防 ReDoS） */
	private compareMatches(left: unknown, right: unknown): boolean {
		if (typeof left !== "string" || typeof right !== "string") return false;
		if (right.length > 200) return false;
		try {
			const regex = new RegExp(right);
			return regex.test(left.slice(0, 10000));
		} catch {
			return false;
		}
	}

	/** in 操作 — right 必须是数组，检查 left 是否在数组中 */
	private compareIn(left: unknown, right: unknown): boolean {
		if (!Array.isArray(right)) {
			return false;
		}
		return right.includes(left);
	}

	// ─── 逻辑表达式 ─────────────────────────────────────────────────

	/** 求值逻辑表达式 */
	private evalLogical(
		expr: Extract<Expr, { type: "logical" }>,
		context: Record<string, unknown>,
		depth: number,
	): unknown {
		switch (expr.op) {
			case "and":
				return expr.operands.every((op) =>
					this.isTruthy(this.evalExpr(op, context, depth + 1)),
				);
			case "or":
				return expr.operands.some((op) =>
					this.isTruthy(this.evalExpr(op, context, depth + 1)),
				);
			case "not": {
				const operand = expr.operands[0];
				if (operand === undefined) {
					return undefined;
				}
				return !this.isTruthy(this.evalExpr(operand, context, depth + 1));
			}
			default:
				return undefined;
		}
	}

	/** 判断值是否为真值 */
	private isTruthy(value: unknown): boolean {
		return (
			value !== null &&
			value !== undefined &&
			value !== false &&
			value !== 0 &&
			value !== ""
		);
	}

	// ─── 函数调用表达式 ─────────────────────────────────────────────

	/** 求值函数调用 */
	private evalCall(
		expr: Extract<Expr, { type: "call" }>,
		context: Record<string, unknown>,
		depth: number,
	): unknown {
		switch (expr.fn) {
			case "now":
				return new Date().toISOString();
			case "today":
				return new Date().toISOString().split("T")[0];
			case "count":
				return this.fnCount(expr.args, context, depth);
			case "sum":
				return this.fnAggregate(expr.args, context, depth, (arr) =>
					arr.reduce((acc, n) => acc + n, 0),
				);
			case "avg": {
				return this.fnAggregate(expr.args, context, depth, (arr) => {
					if (arr.length === 0) {
						return 0;
					}
					return arr.reduce((acc, n) => acc + n, 0) / arr.length;
				});
			}
			case "max":
				return this.fnAggregate(expr.args, context, depth, (arr) => {
					if (arr.length === 0) {
						return undefined;
					}
					return arr.reduce((a, b) => (a > b ? a : b));
				});
			case "min":
				return this.fnAggregate(expr.args, context, depth, (arr) => {
					if (arr.length === 0) {
						return undefined;
					}
					return arr.reduce((a, b) => (a < b ? a : b));
				});
			case "abs": {
				const val = this.evalSingleArg(expr.args, context, depth);
				return typeof val === "number" ? Math.abs(val) : undefined;
			}
			case "round": {
				const val = this.evalSingleArg(expr.args, context, depth);
				return typeof val === "number" ? Math.round(val) : undefined;
			}
			case "len": {
				const val = this.evalSingleArg(expr.args, context, depth);
				if (typeof val === "string") {
					return val.length;
				}
				if (Array.isArray(val)) {
					return val.length;
				}
				return undefined;
			}
			case "toUpperCase": {
				const val = this.evalSingleArg(expr.args, context, depth);
				return typeof val === "string" ? val.toUpperCase() : undefined;
			}
			case "toLowerCase": {
				const val = this.evalSingleArg(expr.args, context, depth);
				return typeof val === "string" ? val.toLowerCase() : undefined;
			}
			case "trim": {
				const val = this.evalSingleArg(expr.args, context, depth);
				return typeof val === "string" ? val.trim() : undefined;
			}
			default:
				return undefined;
		}
	}

	/** 求值单参数函数的第一个参数 */
	private evalSingleArg(
		args: Expr[],
		context: Record<string, unknown>,
		depth: number,
	): unknown {
		const firstArg = args[0];
		if (firstArg === undefined) {
			return undefined;
		}
		return this.evalExpr(firstArg, context, depth + 1);
	}

	/** count 函数 — 数组返回 length，否则 0 */
	private fnCount(
		args: Expr[],
		context: Record<string, unknown>,
		depth: number,
	): number {
		const val = this.evalSingleArg(args, context, depth);
		if (Array.isArray(val)) {
			return val.length;
		}
		return 0;
	}

	/** 数组聚合函数（sum/avg/max/min）辅助 */
	private fnAggregate(
		args: Expr[],
		context: Record<string, unknown>,
		depth: number,
		fn: (numbers: number[]) => unknown,
	): unknown {
		const val = this.evalSingleArg(args, context, depth);
		if (!Array.isArray(val)) {
			return undefined;
		}
		const numbers = val.filter(
			(item): item is number => typeof item === "number",
		);
		if (numbers.length === 0) {
			return undefined;
		}
		return fn(numbers);
	}

	// ─── 条件表达式 ─────────────────────────────────────────────────

	/** 求值条件表达式（三元） */
	private evalConditional(
		expr: Extract<Expr, { type: "conditional" }>,
		context: Record<string, unknown>,
		depth: number,
	): unknown {
		const condition = this.evalExpr(expr.condition, context, depth + 1);
		if (this.isTruthy(condition)) {
			return this.evalExpr(expr.thenExpr, context, depth + 1);
		}
		return this.evalExpr(expr.elseExpr, context, depth + 1);
	}

	// ─── 算术表达式 ─────────────────────────────────────────────────

	/** 求值算术表达式 — 非数值操作数返回 NaN */
	private evalArithmetic(
		expr: Extract<Expr, { type: "arithmetic" }>,
		context: Record<string, unknown>,
		depth: number,
	): unknown {
		const left = this.evalExpr(expr.left, context, depth + 1);
		const right = this.evalExpr(expr.right, context, depth + 1);

		if (typeof left !== "number" || typeof right !== "number") {
			return Number.NaN;
		}

		switch (expr.op) {
			case "add":
				return left + right;
			case "subtract":
				return left - right;
			case "multiply":
				return left * right;
			case "divide":
				return right === 0 ? Number.NaN : left / right;
			case "modulo":
				return right === 0 ? Number.NaN : left % right;
			default:
				return Number.NaN;
		}
	}

	// ─── 数组表达式 ─────────────────────────────────────────────────

	/** 求值数组操作表达式 — 非数组 source 返回 undefined */
	private evalArray(
		expr: Extract<Expr, { type: "array" }>,
		context: Record<string, unknown>,
		depth: number,
	): unknown {
		const source = this.evalExpr(expr.source, context, depth + 1);
		if (!Array.isArray(source)) {
			return undefined;
		}

		switch (expr.op) {
			case "map":
				return source.map((item) =>
					this.evalExpr(expr.itemExpr, this.withItem(context, item), depth + 1),
				);
			case "filter":
				return source.filter((item) =>
					this.isTruthy(
						this.evalExpr(
							expr.itemExpr,
							this.withItem(context, item),
							depth + 1,
						),
					),
				);
			case "some":
				return source.some((item) =>
					this.isTruthy(
						this.evalExpr(
							expr.itemExpr,
							this.withItem(context, item),
							depth + 1,
						),
					),
				);
			case "every":
				return source.every((item) =>
					this.isTruthy(
						this.evalExpr(
							expr.itemExpr,
							this.withItem(context, item),
							depth + 1,
						),
					),
				);
			case "includes": {
				const target = this.evalExpr(expr.itemExpr, context, depth + 1);
				return source.includes(target);
			}
			default:
				return undefined;
		}
	}

	/**
	 * 将当前数组元素注入上下文
	 * 使用 $item 作为默认变量名，同时保持对原始上下文的引用
	 */
	private withItem(
		context: Record<string, unknown>,
		item: unknown,
	): Record<string, unknown> {
		return { ...context, $item: item, item: item };
	}
}
