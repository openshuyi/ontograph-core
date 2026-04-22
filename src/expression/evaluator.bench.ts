import { describe, bench } from "vitest";
import { SafeExpressionEvaluator } from "./evaluator";
import type {
	CompareExpr,
	LogicalExpr,
	ArithmeticExpr,
	ConditionalExpr,
	ArrayExpr,
} from "./types";

describe("SafeExpressionEvaluator vs native operations", () => {
	const evaluator = new SafeExpressionEvaluator();

	describe("Simple comparison", () => {
		const context = { x: 15 };

		// AST expression: x > 10
		const astExpr: CompareExpr = {
			type: "compare",
			op: "gt",
			left: { type: "property", path: "x" },
			right: { type: "literal", value: 10 },
		};

		bench("AST evaluator: x > 10", () => {
			evaluator.evaluate(astExpr, context);
		});

		bench("Native: x > 10", () => {
			const x = 15;
			x > 10;
		});
	});

	describe("Logical AND", () => {
		const context = { a: 5, b: 10, c: 15 };

		// AST expression: a > 0 && b > 5 && c > 10
		const astExpr: LogicalExpr = {
			type: "logical",
			op: "and",
			operands: [
				{
					type: "compare",
					op: "gt",
					left: { type: "property", path: "a" },
					right: { type: "literal", value: 0 },
				},
				{
					type: "compare",
					op: "gt",
					left: { type: "property", path: "b" },
					right: { type: "literal", value: 5 },
				},
				{
					type: "compare",
					op: "gt",
					left: { type: "property", path: "c" },
					right: { type: "literal", value: 10 },
				},
			],
		};

		bench("AST evaluator: a > 0 && b > 5 && c > 10", () => {
			evaluator.evaluate(astExpr, context);
		});

		bench("Native: a > 0 && b > 5 && c > 10", () => {
			const a = 5;
			const b = 10;
			const c = 15;
			a > 0 && b > 5 && c > 10;
		});
	});

	describe("Arithmetic", () => {
		const context = { a: 100, b: 50 };

		// AST expression: a + b
		const astExpr: ArithmeticExpr = {
			type: "arithmetic",
			op: "add",
			left: { type: "property", path: "a" },
			right: { type: "property", path: "b" },
		};

		bench("AST evaluator: a + b", () => {
			evaluator.evaluate(astExpr, context);
		});

		bench("Native: a + b", () => {
			const a = 100;
			const b = 50;
			a + b;
		});
	});

	describe("Deeply nested", () => {
		const context = { x: 5, y: 10, z: 15 };

		// AST expression: ((x > 1 && y > 5) || (z < 20 && x < 10)) && (y < 15 || z > 10)
		// 5-level nested structure
		const astExpr: LogicalExpr = {
			type: "logical",
			op: "and",
			operands: [
				{
					type: "logical",
					op: "or",
					operands: [
						{
							type: "logical",
							op: "and",
							operands: [
								{
									type: "compare",
									op: "gt",
									left: { type: "property", path: "x" },
									right: { type: "literal", value: 1 },
								},
								{
									type: "compare",
									op: "gt",
									left: { type: "property", path: "y" },
									right: { type: "literal", value: 5 },
								},
							],
						},
						{
							type: "logical",
							op: "and",
							operands: [
								{
									type: "compare",
									op: "lt",
									left: { type: "property", path: "z" },
									right: { type: "literal", value: 20 },
								},
								{
									type: "compare",
									op: "lt",
									left: { type: "property", path: "x" },
									right: { type: "literal", value: 10 },
								},
							],
						},
					],
				},
				{
					type: "logical",
					op: "or",
					operands: [
						{
							type: "compare",
							op: "lt",
							left: { type: "property", path: "y" },
							right: { type: "literal", value: 15 },
						},
						{
							type: "compare",
							op: "gt",
							left: { type: "property", path: "z" },
							right: { type: "literal", value: 10 },
						},
					],
				},
			],
		};

		bench("AST evaluator: 5-level nested logical expression", () => {
			evaluator.evaluate(astExpr, context);
		});

		bench("Native: 5-level nested logical expression", () => {
			const x = 5;
			const y = 10;
			const z = 15;
			((x > 1 && y > 5) || (z < 20 && x < 10)) && (y < 15 || z > 10);
		});
	});

	describe("Conditional (ternary)", () => {
		const context = { x: 10, y: 5 };

		// AST expression: x > 5 ? x + y : x - y
		const astExpr: ConditionalExpr = {
			type: "conditional",
			condition: {
				type: "compare",
				op: "gt",
				left: { type: "property", path: "x" },
				right: { type: "literal", value: 5 },
			},
			thenExpr: {
				type: "arithmetic",
				op: "add",
				left: { type: "property", path: "x" },
				right: { type: "property", path: "y" },
			},
			elseExpr: {
				type: "arithmetic",
				op: "subtract",
				left: { type: "property", path: "x" },
				right: { type: "property", path: "y" },
			},
		};

		bench("AST evaluator: x > 5 ? x + y : x - y", () => {
			evaluator.evaluate(astExpr, context);
		});

		bench("Native: x > 5 ? x + y : x - y", () => {
			const x = 10;
			const y = 5;
			x > 5 ? x + y : x - y;
		});
	});

	describe("Array operations", () => {
		const context = {
			items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
		};

		// AST expression: items.filter($item > 5)
		const astFilterExpr: ArrayExpr = {
			type: "array",
			op: "filter",
			source: { type: "property", path: "items" },
			itemExpr: {
				type: "compare",
				op: "gt",
				left: { type: "property", path: "$item" },
				right: { type: "literal", value: 5 },
			},
		};

		bench("AST evaluator: items.filter($item > 5)", () => {
			evaluator.evaluate(astFilterExpr, context);
		});

		bench("Native: items.filter(item => item > 5)", () => {
			const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
			items.filter((item) => item > 5);
		});

		// AST expression: items.map($item * 2)
		const astMapExpr: ArrayExpr = {
			type: "array",
			op: "map",
			source: { type: "property", path: "items" },
			itemExpr: {
				type: "arithmetic",
				op: "multiply",
				left: { type: "property", path: "$item" },
				right: { type: "literal", value: 2 },
			},
		};

		bench("AST evaluator: items.map($item * 2)", () => {
			evaluator.evaluate(astMapExpr, context);
		});

		bench("Native: items.map(item => item * 2)", () => {
			const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
			items.map((item) => item * 2);
		});

		// AST expression: items.some($item > 8)
		const astSomeExpr: ArrayExpr = {
			type: "array",
			op: "some",
			source: { type: "property", path: "items" },
			itemExpr: {
				type: "compare",
				op: "gt",
				left: { type: "property", path: "$item" },
				right: { type: "literal", value: 8 },
			},
		};

		bench("AST evaluator: items.some($item > 8)", () => {
			evaluator.evaluate(astSomeExpr, context);
		});

		bench("Native: items.some(item => item > 8)", () => {
			const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
			items.some((item) => item > 8);
		});
	});
});
