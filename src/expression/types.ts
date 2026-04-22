/** 结构化表达式 — 替代 eval() 的安全表达式 AST */
export type Expr =
	| LiteralExpr
	| PropertyExpr
	| CompareExpr
	| LogicalExpr
	| CallExpr
	| ConditionalExpr
	| ArithmeticExpr
	| ArrayExpr;

/** 字面量表达式 */
export interface LiteralExpr {
	/** 表达式类型标识 */
	type: "literal";
	/** 字面量值 */
	value: string | number | boolean | null;
}

/** 属性路径表达式 */
export interface PropertyExpr {
	/** 表达式类型标识 */
	type: "property";
	/** 属性路径，支持点号分隔（如 "address.city"） */
	path: string;
}

/** 比较表达式 */
export interface CompareExpr {
	/** 表达式类型标识 */
	type: "compare";
	/** 比较操作符 */
	op:
		| "eq"
		| "neq"
		| "gt"
		| "gte"
		| "lt"
		| "lte"
		| "contains"
		| "startsWith"
		| "endsWith"
		| "matches"
		| "in";
	/** 左操作数 */
	left: Expr;
	/** 右操作数 */
	right: Expr;
}

/** 逻辑表达式 */
export interface LogicalExpr {
	/** 表达式类型标识 */
	type: "logical";
	/** 逻辑操作符 */
	op: "and" | "or" | "not";
	/** 操作数列表 */
	operands: Expr[];
}

/** 函数调用表达式 */
export interface CallExpr {
	/** 表达式类型标识 */
	type: "call";
	/** 内置函数名 */
	fn:
		| "now"
		| "today"
		| "count"
		| "sum"
		| "avg"
		| "max"
		| "min"
		| "abs"
		| "round"
		| "len"
		| "toUpperCase"
		| "toLowerCase"
		| "trim";
	/** 函数参数 */
	args: Expr[];
}

/** 条件表达式（三元表达式） */
export interface ConditionalExpr {
	/** 表达式类型标识 */
	type: "conditional";
	/** 条件表达式 */
	condition: Expr;
	/** 条件为真时的表达式 */
	thenExpr: Expr;
	/** 条件为假时的表达式 */
	elseExpr: Expr;
}

/** 算术表达式 */
export interface ArithmeticExpr {
	/** 表达式类型标识 */
	type: "arithmetic";
	/** 算术操作符 */
	op: "add" | "subtract" | "multiply" | "divide" | "modulo";
	/** 左操作数 */
	left: Expr;
	/** 右操作数 */
	right: Expr;
}

/** 数组操作表达式 */
export interface ArrayExpr {
	/** 表达式类型标识 */
	type: "array";
	/** 数组操作类型 */
	op: "map" | "filter" | "some" | "every" | "includes";
	/** 数组源表达式 */
	source: Expr;
	/** 对每个元素的表达式（$item 引用当前元素） */
	itemExpr: Expr;
}
