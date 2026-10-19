import type { SHACLNodeKind, SHACLNodeShape, SHACLPropertyShape, SHACLShapes } from "./shacl-shapes";

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

/** nodeKind 约束允许的实际值分类 */
const NODE_KIND_ALLOWED: Record<SHACLNodeKind, ReadonlyArray<"IRI" | "Literal" | "BlankNode">> = {
  IRI: ["IRI"],
  Literal: ["Literal"],
  BlankNode: ["BlankNode"],
  IRIOrLiteral: ["IRI", "Literal"],
  BlankNodeOrIRI: ["BlankNode", "IRI"],
  BlankNodeOrLiteral: ["BlankNode", "Literal"],
};

/**
 * SHACL 验证器 — 纯 TypeScript 实现
 *
 * 语义说明（内存对象模型的务实子集，非完整 W3C SHACL/RDF 图验证）：
 * - 属性值按单值处理，数组不解包（数组按 BlankNode 分类）
 * - IRI 判定：形如 "scheme:rest" 的字符串（如 "test:foo"、"https://..."）；其余字符串为 Literal
 * - class 约束：值必须是内嵌对象，且其 "@type"（或 "type"）字段等于引用类型
 * - 每个属性收集全部失败约束，而非首个失败即返回
 */
export class SHACLValidator {
  validate(shapes: SHACLShapes, data: Array<Record<string, unknown>>): SHACLValidationReport {
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

  private validateNode(node: Record<string, unknown>, shape: SHACLNodeShape): SHACLValidationResult[] {
    const results: SHACLValidationResult[] = [];
    const nodeId = (node["@id"] as string) ?? "unknown";

    for (const ps of shape.propertyShapes) {
      for (const result of this.validateProperty(node, ps)) {
        results.push({ ...result, focusNode: nodeId });
      }
    }

    if (shape.closed) {
      results.push(...this.validateClosed(node, shape, nodeId));
    }

    return results;
  }

  /** closed 形状：propertyShapes 与 ignoredProperties 之外的属性均违规（@id/@type 为结构性字段豁免） */
  private validateClosed(
    node: Record<string, unknown>,
    shape: SHACLNodeShape,
    nodeId: string,
  ): SHACLValidationResult[] {
    const allowed = new Set<string>(["@id", "@type", ...(shape.ignoredProperties ?? [])]);
    for (const ps of shape.propertyShapes) {
      allowed.add(ps.path);
    }

    const results: SHACLValidationResult[] = [];
    for (const key of Object.keys(node)) {
      if (allowed.has(key)) continue;
      results.push({
        focusNode: nodeId,
        path: key,
        constraint: "closed",
        severity: "violation",
        message: `Property '${key}' is not allowed on closed shape '${shape["@id"]}'`,
        value: node[key],
      });
    }
    return results;
  }

  /** 校验单个属性 — 收集全部失败约束，不短路 */
  private validateProperty(node: Record<string, unknown>, ps: SHACLPropertyShape): SHACLValidationResult[] {
    const value = node[ps.path];
    const severity = ps.severity ?? "violation";
    const results: SHACLValidationResult[] = [];

    if (ps.minCount !== undefined && ps.minCount > 0) {
      if (value === undefined || value === null) {
        results.push({
          focusNode: "",
          path: ps.path,
          constraint: "minCount",
          severity,
          message: `Missing required property '${ps.path}'`,
        });
        return results; // 值缺失时其余值级约束不适用
      }
    }

    if (value === undefined || value === null) {
      return results;
    }

    return this.collectValueViolations(value, ps);
  }

  /** 对单值求值全部值级约束（含嵌套 or/and/xone 成员），返回所有失败项 */
  private collectValueViolations(value: unknown, ps: SHACLPropertyShape): SHACLValidationResult[] {
    const severity = ps.severity ?? "violation";
    const results: SHACLValidationResult[] = [];

    const addViolation = (constraint: string, message: string): void => {
      results.push({ focusNode: "", path: ps.path, constraint, severity, message, value });
    };

    if (ps.datatype && !this.checkDatatype(value, ps.datatype)) {
      addViolation("datatype", `Property '${ps.path}' has wrong datatype`);
    }

    if (ps.minInclusive !== undefined && typeof value === "number" && value < ps.minInclusive) {
      addViolation("minInclusive", `Value ${value} is less than minimum ${ps.minInclusive}`);
    }

    if (ps.maxInclusive !== undefined && typeof value === "number" && value > ps.maxInclusive) {
      addViolation("maxInclusive", `Value ${value} exceeds maximum ${ps.maxInclusive}`);
    }

    if (ps.pattern && typeof value === "string") {
      if (!new RegExp(ps.pattern).test(value)) {
        addViolation("pattern", `Value does not match pattern '${ps.pattern}'`);
      }
    }

    if (ps.in && !ps.in.includes(String(value))) {
      addViolation("in", "Value not in allowed values");
    }

    if (ps.class_ && !this.checkClass(value, ps.class_)) {
      addViolation("class", `Value is not of class '${ps.class_}'`);
    }

    if (ps.nodeKind && !this.checkNodeKind(value, ps.nodeKind)) {
      addViolation("nodeKind", `Value is not of node kind '${ps.nodeKind}'`);
    }

    if (ps.hasValue !== undefined && !this.checkHasValue(value, ps.hasValue)) {
      addViolation("hasValue", `Value does not equal required value '${String(ps.hasValue)}'`);
    }

    if (ps.minLength !== undefined && typeof value === "string" && value.length < ps.minLength) {
      addViolation("minLength", `Value length ${value.length} is less than minLength ${ps.minLength}`);
    }

    if (ps.maxLength !== undefined && typeof value === "string" && value.length > ps.maxLength) {
      addViolation("maxLength", `Value length ${value.length} exceeds maxLength ${ps.maxLength}`);
    }

    if (ps.or) {
      const conforming = ps.or.filter((member) => this.collectValueViolations(value, member).length === 0);
      if (conforming.length === 0) {
        addViolation("or", "Value does not match any shape in 'or' list");
      }
    }

    if (ps.and) {
      const failing = ps.and.filter((member) => this.collectValueViolations(value, member).length > 0);
      if (failing.length > 0) {
        addViolation("and", "Value does not match all shapes in 'and' list");
      }
    }

    if (ps.xone) {
      const conforming = ps.xone.filter((member) => this.collectValueViolations(value, member).length === 0);
      if (conforming.length !== 1) {
        addViolation("xone", "Value must match exactly one shape in 'xone' list");
      }
    }

    return results;
  }

  private findShapeForType(typeId: string, shapes: SHACLShapes): SHACLNodeShape | undefined {
    return shapes.shapes.find((s) => s.targetClass === typeId);
  }

  /** class 约束：值须为内嵌对象且 "@type"（或 "type"）字段匹配 */
  private checkClass(value: unknown, classId: string): boolean {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    const record = value as Record<string, unknown>;
    const typeField = record["@type"] ?? record.type;
    return typeField === classId;
  }

  /** 值分类：对象（含数组）→ BlankNode；IRI 形式字符串 → IRI；其余标量 → Literal */
  private classifyValue(value: unknown): "IRI" | "Literal" | "BlankNode" {
    if (typeof value === "object" && value !== null) return "BlankNode";
    if (typeof value === "string") return this.isIriLike(value) ? "IRI" : "Literal";
    return "Literal";
  }

  /** IRI 形式：字母开头 scheme + 冒号 + 无空白余部（如 "test:foo"、"https://x.io/a"） */
  private isIriLike(value: string): boolean {
    return /^[A-Za-z][A-Za-z0-9+.-]*:[^\s]*$/.test(value);
  }

  private checkNodeKind(value: unknown, kind: SHACLNodeKind): boolean {
    return NODE_KIND_ALLOWED[kind].includes(this.classifyValue(value));
  }

  /** hasValue：严格相等，或与 `in` 一致地对标量做字符串宽松比较 */
  private checkHasValue(value: unknown, expected: string | number | boolean): boolean {
    if (value === expected) return true;
    if (typeof value === "object" || value === null) return false;
    return String(value) === String(expected);
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
