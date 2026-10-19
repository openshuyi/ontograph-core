import type { Expr } from "../expression/types";
import type { AttributeDefinition, Constraint, EntityType, InterfaceDefinition, OntologyDefinition } from "../types";

/** SHACL 形状定义 */
export interface SHACLShapes {
  shapes: SHACLNodeShape[];
}

export interface SHACLNodeShape {
  "@id": string;
  targetClass: string;
  propertyShapes: SHACLPropertyShape[];
  closed?: boolean;
  /** closed=true 时额外豁免的属性路径（@id/@type 始终豁免） */
  ignoredProperties?: string[];
}

/** nodeKind 约束值 — 内存模型：IRI 形式字符串 / 标量字面量 / 内嵌对象 */
export type SHACLNodeKind = "IRI" | "Literal" | "BlankNode" | "IRIOrLiteral" | "BlankNodeOrIRI" | "BlankNodeOrLiteral";

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
  /** 值的节点种类 */
  nodeKind?: SHACLNodeKind;
  /** 值必须等于的标量值 */
  hasValue?: string | number | boolean;
  /** 字符串最小长度 */
  minLength?: number;
  /** 字符串最大长度 */
  maxLength?: number;
  /** 值至少符合其中一个成员形状（成员为约束载体，path 与父形状一致） */
  or?: SHACLPropertyShape[];
  /** 值必须符合全部成员形状（成员为约束载体，path 与父形状一致） */
  and?: SHACLPropertyShape[];
  /** 值必须恰好符合一个成员形状（成员为约束载体，path 与父形状一致） */
  xone?: SHACLPropertyShape[];
  severity?: "violation" | "warning" | "info";
  message?: string;
}

/** 将结构化比较表达式转换为 SHACL 属性约束 */
export function exprToPropertyShape(expr: Expr): Partial<SHACLPropertyShape> | null {
  if (expr.type === "compare") {
    switch (expr.op) {
      case "gte":
        return expr.right.type === "literal" && typeof expr.right.value === "number"
          ? { minInclusive: expr.right.value }
          : null;
      case "lte":
        return expr.right.type === "literal" && typeof expr.right.value === "number"
          ? { maxInclusive: expr.right.value }
          : null;
      case "gt":
        return expr.right.type === "literal" && typeof expr.right.value === "number"
          ? { minInclusive: expr.right.value + 1 }
          : null;
      case "lt":
        return expr.right.type === "literal" && typeof expr.right.value === "number"
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
    const constraintMap = new Map(ontology.constraints.map((c) => [c["@id"], c]));

    for (const et of this.getAllEntityTypes(ontology)) {
      shapes.push(this.entityTypeToShape(et, attrMap, constraintMap));
    }

    if (ontology.interfaces) {
      for (const iface of ontology.interfaces) {
        shapes.push(this.interfaceToShape(iface));
      }
    }

    return { shapes };
  }

  private getAllEntityTypes(ontology: OntologyDefinition): EntityType[] {
    return [...(ontology.entityTypes ?? []), ...(ontology.eventTypes ?? []), ...(ontology.roleTypes ?? [])];
  }

  private entityTypeToShape(
    entityType: EntityType,
    attrMap: Map<string, AttributeDefinition>,
    constraintMap: Map<string, Constraint>,
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

    // 约束引用 → 以 constraint.on 为目标属性，合并结构化 Expr 派生的 SHACL 约束
    for (const constraintRef of entityType.constraints ?? []) {
      const constraint = constraintMap.get(constraintRef.ref);
      if (!constraint?.expr) continue;

      const derived = exprToPropertyShape(constraint.expr);
      if (!derived) continue;

      let target = propertyShapes.find((p) => p.path === constraint.on);
      if (!target) {
        target = { path: constraint.on };
        propertyShapes.push(target);
      }

      Object.assign(target, derived);
      target.severity =
        constraint.severity === "warning" ? "warning" : constraint.severity === "info" ? "info" : "violation";
      const message = constraint.message?.en ?? constraint.message?.zh;
      if (message) target.message = message;
    }

    return {
      "@id": `${entityType["@id"]}Shape`,
      targetClass: entityType["@id"],
      propertyShapes,
    };
  }

  private interfaceToShape(iface: InterfaceDefinition): SHACLNodeShape {
    const propertyShapes: SHACLPropertyShape[] = iface.requiredAttributes.map((req) => ({
      path: req.ref,
      minCount: req.required ? 1 : 0,
      severity: "warning" as const,
    }));

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
