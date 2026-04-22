import type { Expr } from "../expression/types";
import type {
	AttributeDefinition,
	EntityType,
	InterfaceDefinition,
	OntologyDefinition,
} from "../types";

/** SHACL 形状定义 */
export interface SHACLShapes {
	shapes: SHACLNodeShape[];
}

export interface SHACLNodeShape {
	"@id": string;
	targetClass: string;
	propertyShapes: SHACLPropertyShape[];
	closed?: boolean;
}

export interface SHACLPropertyShape {
	path: string;
	datatype?: string;
	minCount?: number;
	maxCount?: number;
	minInclusive?: number;
	maxInclusive?: number;
	pattern?: string;
	in?: string[];
	class_?: string;
	severity?: "violation" | "warning" | "info";
	message?: string;
}

/** 将结构化比较表达式转换为 SHACL 属性约束 */
export function exprToPropertyShape(
	expr: Expr,
): Partial<SHACLPropertyShape> | null {
	if (expr.type === "compare") {
		switch (expr.op) {
			case "gte":
				return expr.right.type === "literal" &&
					typeof expr.right.value === "number"
					? { minInclusive: expr.right.value }
					: null;
			case "lte":
				return expr.right.type === "literal" &&
					typeof expr.right.value === "number"
					? { maxInclusive: expr.right.value }
					: null;
			case "gt":
				return expr.right.type === "literal" &&
					typeof expr.right.value === "number"
					? { minInclusive: expr.right.value + 1 }
					: null;
			case "lt":
				return expr.right.type === "literal" &&
					typeof expr.right.value === "number"
					? { maxInclusive: expr.right.value - 1 }
					: null;
			default:
				return null;
		}
	}
	return null;
}

/** SHACL 形状生成器 */
export class SHACLShapeGenerator {
	generate(ontology: OntologyDefinition): SHACLShapes {
		const shapes: SHACLNodeShape[] = [];
		const attrMap = new Map(ontology.attributes.map((a) => [a["@id"], a]));

		for (const et of this.getAllEntityTypes(ontology)) {
			shapes.push(this.entityTypeToShape(et, attrMap));
		}

		if (ontology.interfaces) {
			for (const iface of ontology.interfaces) {
				shapes.push(this.interfaceToShape(iface));
			}
		}

		return { shapes };
	}

	private getAllEntityTypes(ontology: OntologyDefinition): EntityType[] {
		return [
			...(ontology.entityTypes ?? []),
			...(ontology.eventTypes ?? []),
			...(ontology.roleTypes ?? []),
		];
	}

	private entityTypeToShape(
		entityType: EntityType,
		attrMap: Map<string, AttributeDefinition>,
	): SHACLNodeShape {
		const propertyShapes: SHACLPropertyShape[] = [];

		for (const attrRef of entityType.attributes) {
			const attr = attrMap.get(attrRef.ref);
			const shape: SHACLPropertyShape = { path: attrRef.ref };

			if (attr) {
				shape.datatype = this.dataTypeToXSD(attr.datatype);
				if (attrRef.required || attr.required) shape.minCount = 1;
				const patternRule = attr.validation?.find((v) => v.type === "pattern");
				if (patternRule?.value && typeof patternRule.value === "string") {
					shape.pattern = patternRule.value;
				}
				if (attr.enum) shape.in = attr.enum.map(String);
			}

			if (attrRef.identity) shape.minCount = 1;
			propertyShapes.push(shape);
		}

		for (const _constraint of entityType.constraints ?? []) {
			// 约束引用暂不内联处理
		}

		return {
			"@id": `${entityType["@id"]}Shape`,
			targetClass: entityType["@id"],
			propertyShapes,
		};
	}

	private interfaceToShape(iface: InterfaceDefinition): SHACLNodeShape {
		const propertyShapes: SHACLPropertyShape[] = iface.requiredAttributes.map(
			(req) => ({
				path: req.ref,
				minCount: req.required ? 1 : 0,
				severity: "warning" as const,
			}),
		);

		return {
			"@id": `${iface["@id"]}Shape`,
			targetClass: iface["@id"],
			propertyShapes,
		};
	}

	private dataTypeToXSD(dt: string): string | undefined {
		const map: Record<string, string> = {
			string: "xsd:string",
			integer: "xsd:integer",
			float: "xsd:float",
			decimal: "xsd:decimal",
			boolean: "xsd:boolean",
			datetime: "xsd:dateTime",
			date: "xsd:date",
			duration: "xsd:duration",
		};
		return map[dt];
	}
}
