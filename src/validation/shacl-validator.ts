import type {
	SHACLNodeShape,
	SHACLPropertyShape,
	SHACLShapes,
} from "./shacl-shapes";

/** SHACL 验证报告 */
export interface SHACLValidationReport {
	conforms: boolean;
	results: SHACLValidationResult[];
	timestamp: string;
}

export interface SHACLValidationResult {
	focusNode: string;
	path: string;
	constraint: string;
	severity: "violation" | "warning" | "info";
	message: string;
	value?: unknown;
}

/** SHACL 验证器 — 纯 TypeScript 实现 */
export class SHACLValidator {
	validate(
		shapes: SHACLShapes,
		data: Array<Record<string, unknown>>,
	): SHACLValidationReport {
		const results: SHACLValidationResult[] = [];

		for (const node of data) {
			const typeId = node["@type"] as string | undefined;
			if (!typeId) continue;

			const shape = this.findShapeForType(typeId, shapes);
			if (!shape) continue;

			results.push(...this.validateNode(node, shape));
		}

		return {
			conforms: results.length === 0,
			results,
			timestamp: new Date().toISOString(),
		};
	}

	private validateNode(
		node: Record<string, unknown>,
		shape: SHACLNodeShape,
	): SHACLValidationResult[] {
		const results: SHACLValidationResult[] = [];
		const nodeId = (node["@id"] as string) ?? "unknown";

		for (const ps of shape.propertyShapes) {
			const result = this.validateProperty(node, ps);
			if (result) {
				results.push({ ...result, focusNode: nodeId });
			}
		}

		return results;
	}

	private validateProperty(
		node: Record<string, unknown>,
		ps: SHACLPropertyShape,
	): SHACLValidationResult | null {
		const value = node[ps.path];
		const severity = ps.severity ?? "violation";

		if (ps.minCount !== undefined && ps.minCount > 0) {
			if (value === undefined || value === null) {
				return {
					focusNode: "",
					path: ps.path,
					constraint: "minCount",
					severity,
					message: `Missing required property '${ps.path}'`,
				};
			}
		}

		if (ps.datatype && value !== undefined && value !== null) {
			if (!this.checkDatatype(value, ps.datatype)) {
				return {
					focusNode: "",
					path: ps.path,
					constraint: "datatype",
					severity,
					message: `Property '${ps.path}' has wrong datatype`,
					value,
				};
			}
		}

		if (
			ps.minInclusive !== undefined &&
			typeof value === "number" &&
			value < ps.minInclusive
		) {
			return {
				focusNode: "",
				path: ps.path,
				constraint: "minInclusive",
				severity,
				message: `Value ${value} is less than minimum ${ps.minInclusive}`,
				value,
			};
		}

		if (
			ps.maxInclusive !== undefined &&
			typeof value === "number" &&
			value > ps.maxInclusive
		) {
			return {
				focusNode: "",
				path: ps.path,
				constraint: "maxInclusive",
				severity,
				message: `Value ${value} exceeds maximum ${ps.maxInclusive}`,
				value,
			};
		}

		if (ps.pattern && typeof value === "string") {
			if (!new RegExp(ps.pattern).test(value)) {
				return {
					focusNode: "",
					path: ps.path,
					constraint: "pattern",
					severity,
					message: `Value does not match pattern '${ps.pattern}'`,
					value,
				};
			}
		}

		if (ps.in && value !== undefined && value !== null) {
			if (!ps.in.includes(String(value))) {
				return {
					focusNode: "",
					path: ps.path,
					constraint: "in",
					severity,
					message: "Value not in allowed values",
					value,
				};
			}
		}

		return null;
	}

	private findShapeForType(
		typeId: string,
		shapes: SHACLShapes,
	): SHACLNodeShape | undefined {
		return shapes.shapes.find((s) => s.targetClass === typeId);
	}

	private checkDatatype(value: unknown, xsdType: string): boolean {
		switch (xsdType) {
			case "xsd:string":
				return typeof value === "string";
			case "xsd:integer":
				return typeof value === "number" && Number.isInteger(value);
			case "xsd:float":
			case "xsd:decimal":
				return typeof value === "number";
			case "xsd:boolean":
				return typeof value === "boolean";
			case "xsd:dateTime":
			case "xsd:date": {
				if (typeof value !== "string") return false;
				return !Number.isNaN(Date.parse(value));
			}
			default:
				return true;
		}
	}
}
