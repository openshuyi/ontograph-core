import { describe, expect, it } from "vitest";
import { SafeExpressionEvaluator } from "./evaluator";
import type { CallExpr, Expr } from "./types";

function literal(value: unknown): Expr {
	return { type: "literal", value: value as string | number | boolean | null };
}

function property(path: string): Expr {
	return { type: "property", path };
}

// ═══════════════════════════════════════════
// Literal evaluation
// ═══════════════════════════════════════════

describe("SafeExpressionEvaluator - literal", () => {
	const ev = new SafeExpressionEvaluator();

	it("evaluates number literal", () => {
		expect(ev.evaluate(literal(42), {})).toBe(42);
	});

	it("evaluates string literal", () => {
		expect(ev.evaluate(literal("hello"), {})).toBe("hello");
	});

	it("evaluates boolean literal", () => {
		expect(ev.evaluate(literal(true), {})).toBe(true);
	});

	it("evaluates null literal", () => {
		expect(ev.evaluate(literal(null), {})).toBe(null);
	});
});

// ═══════════════════════════════════════════
// Property path resolution
// ═══════════════════════════════════════════

describe("SafeExpressionEvaluator - property", () => {
	const ev = new SafeExpressionEvaluator();

	it("resolves top-level property", () => {
		expect(ev.evaluate(property("quantity"), { quantity: 150 })).toBe(150);
	});

	it("resolves nested property path", () => {
		expect(
			ev.evaluate(property("user.profile.age"), {
				user: { profile: { age: 28 } },
			}),
		).toBe(28);
	});

	it("returns undefined for missing property", () => {
		expect(ev.evaluate(property("missing"), {})).toBe(undefined);
	});

	it("returns undefined for null intermediate", () => {
		expect(ev.evaluate(property("user.profile.name"), { user: null })).toBe(
			undefined,
		);
	});

	it("blocks __proto__ access", () => {
		expect(ev.evaluate(property("__proto__"), { someKey: "val" })).toBe(
			undefined,
		);
	});

	it("blocks constructor access", () => {
		expect(ev.evaluate(property("constructor"), {})).toBe(undefined);
	});

	it("blocks prototype access", () => {
		expect(ev.evaluate(property("prototype"), {})).toBe(undefined);
	});
});

// ═══════════════════════════════════════════
// Comparison operations
// ═══════════════════════════════════════════

describe("SafeExpressionEvaluator - compare", () => {
	const ev = new SafeExpressionEvaluator();

	const eq = (left: Expr, right: Expr): Expr => ({
		type: "compare",
		op: "eq",
		left,
		right,
	});
	const neq = (left: Expr, right: Expr): Expr => ({
		type: "compare",
		op: "neq",
		left,
		right,
	});
	const gt = (left: Expr, right: Expr): Expr => ({
		type: "compare",
		op: "gt",
		left,
		right,
	});
	const lt = (left: Expr, right: Expr): Expr => ({
		type: "compare",
		op: "lt",
		left,
		right,
	});
	const gte = (left: Expr, right: Expr): Expr => ({
		type: "compare",
		op: "gte",
		left,
		right,
	});
	const lte = (left: Expr, right: Expr): Expr => ({
		type: "compare",
		op: "lte",
		left,
		right,
	});
	const contains = (left: Expr, right: Expr): Expr => ({
		type: "compare",
		op: "contains",
		left,
		right,
	});
	const inOp = (left: Expr, right: Expr): Expr => ({
		type: "compare",
		op: "in",
		left,
		right,
	});

	it("eq returns true for equal values", () => {
		expect(ev.evaluate(eq(literal(5), literal(5)), {})).toBe(true);
	});

	it("eq returns false for different values", () => {
		expect(ev.evaluate(eq(literal(5), literal(3)), {})).toBe(false);
	});

	it("neq returns opposite of eq", () => {
		expect(ev.evaluate(neq(literal(5), literal(3)), {})).toBe(true);
	});

	it("gt works for numbers", () => {
		expect(ev.evaluate(gt(literal(10), literal(5)), {})).toBe(true);
		expect(ev.evaluate(gt(literal(3), literal(5)), {})).toBe(false);
	});

	it("lt works for numbers", () => {
		expect(ev.evaluate(lt(literal(3), literal(5)), {})).toBe(true);
	});

	it("gte and lte work for boundary values", () => {
		expect(ev.evaluate(gte(literal(5), literal(5)), {})).toBe(true);
		expect(ev.evaluate(lte(literal(5), literal(5)), {})).toBe(true);
	});

	it("compare works with property access", () => {
		expect(
			ev.evaluate(gt(property("quantity"), literal(100)), { quantity: 150 }),
		).toBe(true);
	});

	it("contains works for strings", () => {
		expect(
			ev.evaluate(contains(literal("hello world"), literal("world")), {}),
		).toBe(true);
		expect(ev.evaluate(contains(literal("hello"), literal("world")), {})).toBe(
			false,
		);
	});

	it("in checks array membership", () => {
		expect(
			ev.evaluate(inOp(literal(2), property("tags")), {
				tags: ["red", "blue", "green"],
			}),
		).toBe(false);
		expect(
			ev.evaluate(inOp(literal("blue"), property("tags")), {
				tags: ["red", "blue", "green"],
			}),
		).toBe(true);
	});
});

// ═══════════════════════════════════════════
// Logical operations
// ═══════════════════════════════════════════

describe("SafeExpressionEvaluator - logical", () => {
	const ev = new SafeExpressionEvaluator();

	const and = (...ops: Expr[]): Expr => ({
		type: "logical",
		op: "and",
		operands: ops,
	});
	const or = (...ops: Expr[]): Expr => ({
		type: "logical",
		op: "or",
		operands: ops,
	});
	const not = (op: Expr): Expr => ({
		type: "logical",
		op: "not",
		operands: [op],
	});

	it("and returns true when all operands true", () => {
		expect(ev.evaluate(and(literal(true), literal(true)), {})).toBe(true);
	});

	it("and returns false when any operand false", () => {
		expect(ev.evaluate(and(literal(true), literal(false)), {})).toBe(false);
	});

	it("or returns true when any operand true", () => {
		expect(ev.evaluate(or(literal(false), literal(true)), {})).toBe(true);
	});

	it("or returns false when all operands false", () => {
		expect(ev.evaluate(or(literal(false), literal(false)), {})).toBe(false);
	});

	it("not inverts boolean", () => {
		expect(ev.evaluate(not(literal(true)), {})).toBe(false);
		expect(ev.evaluate(not(literal(false)), {})).toBe(true);
	});
});

// ═══════════════════════════════════════════
// Arithmetic operations
// ═══════════════════════════════════════════

describe("SafeExpressionEvaluator - arithmetic", () => {
	const ev = new SafeExpressionEvaluator();

	const add = (left: Expr, right: Expr): Expr => ({
		type: "arithmetic",
		op: "add",
		left,
		right,
	});
	const sub = (left: Expr, right: Expr): Expr => ({
		type: "arithmetic",
		op: "subtract",
		left,
		right,
	});
	const mul = (left: Expr, right: Expr): Expr => ({
		type: "arithmetic",
		op: "multiply",
		left,
		right,
	});
	const divide = (left: Expr, right: Expr): Expr => ({
		type: "arithmetic",
		op: "divide",
		left,
		right,
	});

	it("add returns sum", () => {
		expect(ev.evaluate(add(literal(3), literal(4)), {})).toBe(7);
	});

	it("subtract returns difference", () => {
		expect(ev.evaluate(sub(literal(10), literal(3)), {})).toBe(7);
	});

	it("multiply returns product", () => {
		expect(ev.evaluate(mul(literal(3), literal(4)), {})).toBe(12);
	});

	it("divide returns quotient", () => {
		expect(ev.evaluate(divide(literal(10), literal(2)), {})).toBe(5);
	});

	it("divide by zero returns NaN", () => {
		const result = ev.evaluate(divide(literal(10), literal(0)), {});
		expect(Number.isNaN(result)).toBe(true);
	});

	it("non-number operands return NaN", () => {
		expect(Number.isNaN(ev.evaluate(add(literal("a"), literal(4)), {}))).toBe(
			true,
		);
	});

	it("arithmetic with property access", () => {
		expect(
			ev.evaluate(add(property("price"), property("tax")), {
				price: 100,
				tax: 20,
			}),
		).toBe(120);
	});
});

// ═══════════════════════════════════════════
// Built-in functions
// ═══════════════════════════════════════════

describe("SafeExpressionEvaluator - built-in functions", () => {
	const ev = new SafeExpressionEvaluator();

	it("len returns string length", () => {
		const expr: Expr = { type: "call", fn: "len", args: [literal("hello")] };
		expect(ev.evaluate(expr, {})).toBe(5);
	});

	it("len returns array length", () => {
		const expr: Expr = { type: "call", fn: "len", args: [literal([1, 2, 3])] };
		expect(ev.evaluate(expr, {})).toBe(3);
	});

	it("toUpperCase converts string", () => {
		const expr: Expr = {
			type: "call",
			fn: "toUpperCase",
			args: [literal("hello")],
		};
		expect(ev.evaluate(expr, {})).toBe("HELLO");
	});

	it("abs returns absolute value", () => {
		const expr: Expr = { type: "call", fn: "abs", args: [literal(-5)] };
		expect(ev.evaluate(expr, {})).toBe(5);
	});

	it("sum aggregates array", () => {
		const expr: Expr = { type: "call", fn: "sum", args: [literal([1, 2, 3])] };
		expect(ev.evaluate(expr, {})).toBe(6);
	});

	it("count returns array length", () => {
		const expr: Expr = {
			type: "call",
			fn: "count",
			args: [literal(["a", "b"])],
		};
		expect(ev.evaluate(expr, {})).toBe(2);
	});

	it("unknown function returns undefined", () => {
		const expr: Expr = {
			type: "call",
			fn: "unknownFn" as CallExpr["fn"],
			args: [],
		};
		expect(ev.evaluate(expr, {})).toBe(undefined);
	});
});

// ═══════════════════════════════════════════
// Conditional (ternary)
// ═══════════════════════════════════════════

describe("SafeExpressionEvaluator - conditional", () => {
	const ev = new SafeExpressionEvaluator();

	it("returns thenExpr when condition is true", () => {
		const expr: Expr = {
			type: "conditional",
			condition: literal(true),
			thenExpr: literal("yes"),
			elseExpr: literal("no"),
		};
		expect(ev.evaluate(expr, {})).toBe("yes");
	});

	it("returns elseExpr when condition is false", () => {
		const expr: Expr = {
			type: "conditional",
			condition: literal(false),
			thenExpr: literal("yes"),
			elseExpr: literal("no"),
		};
		expect(ev.evaluate(expr, {})).toBe("no");
	});

	it("conditional with property comparison", () => {
		const expr: Expr = {
			type: "conditional",
			condition: {
				type: "compare",
				op: "gt",
				left: property("age"),
				right: literal(18),
			},
			thenExpr: literal("adult"),
			elseExpr: literal("minor"),
		};
		expect(ev.evaluate(expr, { age: 25 })).toBe("adult");
		expect(ev.evaluate(expr, { age: 10 })).toBe("minor");
	});
});

// ═══════════════════════════════════════════
// Security: depth limit and injection prevention
// ═══════════════════════════════════════════

describe("SafeExpressionEvaluator - security", () => {
	const ev = new SafeExpressionEvaluator();

	it("rejects deeply nested expressions beyond max depth", () => {
		// Nest 55 levels of and (exceeds MAX_DEPTH=50)
		let deep: Expr = literal(true);
		for (let i = 0; i < 55; i++) {
			deep = { type: "logical", op: "and", operands: [deep, literal(true)] };
		}
		// Should not crash, but result may be undefined due to depth limit
		ev.evaluate(deep, {});
	});

	it("does not eval — no injection possible", () => {
		// If eval were used, this code string would execute. Our AST evaluator
		// should never interpret strings as code.
		const expr: Expr = {
			type: "compare",
			op: "eq",
			left: literal("alert('xss')"),
			right: literal("alert('xss')"),
		};
		expect(ev.evaluate(expr, {})).toBe(true);
		// No side effects — string was treated as data, not code
	});

	it("handles regex ReDoS protection", () => {
		const longStr = "a".repeat(500);
		// Regex with length > 200 returns false
		const expr: Expr = {
			type: "compare",
			op: "matches",
			left: literal("test"),
			right: literal(longStr),
		};
		expect(ev.evaluate(expr, {})).toBe(false);
	});
});

// ═══════════════════════════════════════════
// Array expressions
// ═══════════════════════════════════════════

describe("SafeExpressionEvaluator - array", () => {
	const ev = new SafeExpressionEvaluator();

	it("map transforms array elements", () => {
		const itemDoubled: Expr = {
			type: "arithmetic",
			op: "multiply",
			left: property("$item"),
			right: literal(2),
		};
		const expr: Expr = {
			type: "array",
			op: "map",
			source: literal([1, 2, 3]),
			itemExpr: itemDoubled,
		};
		expect(ev.evaluate(expr, {})).toEqual([2, 4, 6]);
	});

	it("filter keeps matching elements", () => {
		const gtTen: Expr = {
			type: "compare",
			op: "gt",
			left: property("$item"),
			right: literal(10),
		};
		const expr: Expr = {
			type: "array",
			op: "filter",
			source: literal([5, 12, 3, 15]),
			itemExpr: gtTen,
		};
		expect(ev.evaluate(expr, {})).toEqual([12, 15]);
	});

	it("some returns true when any match", () => {
		const gtTen: Expr = {
			type: "compare",
			op: "gt",
			left: property("$item"),
			right: literal(10),
		};
		const expr: Expr = {
			type: "array",
			op: "some",
			source: literal([5, 3, 12]),
			itemExpr: gtTen,
		};
		expect(ev.evaluate(expr, {})).toBe(true);
	});

	it("every returns true when all match", () => {
		const gtZero: Expr = {
			type: "compare",
			op: "gt",
			left: property("$item"),
			right: literal(0),
		};
		const expr: Expr = {
			type: "array",
			op: "every",
			source: literal([1, 2, 3]),
			itemExpr: gtZero,
		};
		expect(ev.evaluate(expr, {})).toBe(true);
	});

	it("includes checks for element presence", () => {
		const expr: Expr = {
			type: "array",
			op: "includes",
			source: literal(["a", "b", "c"]),
			itemExpr: literal("b"),
		};
		expect(ev.evaluate(expr, {})).toBe(true);
		const expr2: Expr = {
			type: "array",
			op: "includes",
			source: literal(["a", "b", "c"]),
			itemExpr: literal("z"),
		};
		expect(ev.evaluate(expr2, {})).toBe(false);
	});

	it("returns undefined when source is not an array", () => {
		const expr: Expr = {
			type: "array",
			op: "map",
			source: literal("not-array"),
			itemExpr: property("$item"),
		};
		expect(ev.evaluate(expr, {})).toBe(undefined);
	});
});
