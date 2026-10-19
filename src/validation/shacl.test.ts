import { describe, expect, it } from "vitest";
import type { CompareExpr, LiteralExpr, PropertyExpr } from "../expression/types";
import type { AttributeDefinition, EntityType, InterfaceDefinition, OntologyDefinition } from "../types";
import type { SHACLShapes } from "./shacl-shapes";
import { exprToPropertyShape, SHACLShapeGenerator } from "./shacl-shapes";
import { SHACLValidator } from "./shacl-validator";

const testOntology: OntologyDefinition = {
  "@context": {
    ontograph: "https://ontograph.io/",
    test: "https://test.ontograph.io/",
    xsd: "http://www.w3.org/2001/XMLSchema#",
  },
  "@id": "test:TestOntology",
  "@type": "Ontology",
  version: "1.0.0",
  label: { en: "Test Ontology", zh: "测试本体" },
  description: { en: "Test ontology for SHACL validation" },
  entityTypes: [
    {
      "@id": "test:Person",
      "@type": "EntityType",
      label: { en: "Person", zh: "人员" },
      kind: "entity",
      attributes: [
        { ref: "test:name", required: true, identity: true },
        { ref: "test:age", required: true },
        { ref: "test:email", required: true },
        { ref: "test:score", required: false },
        { ref: "test:status", required: false },
      ],
      relations: [],
      constraints: [],
    } as EntityType,
    {
      "@id": "test:Product",
      "@type": "EntityType",
      label: { en: "Product", zh: "产品" },
      kind: "entity",
      attributes: [
        { ref: "test:sku", required: true, identity: true },
        { ref: "test:price", required: true },
        { ref: "test:quantity", required: false },
        { ref: "test:category", required: false },
        { ref: "test:isActive", required: false },
      ],
      relations: [],
      constraints: [],
    } as EntityType,
    {
      "@id": "test:Warehouse",
      "@type": "EntityType",
      label: { en: "Warehouse", zh: "仓库" },
      kind: "entity",
      attributes: [
        { ref: "test:code", required: true, identity: true },
        { ref: "test:capacity", required: false },
      ],
      relations: [],
      constraints: [],
    } as EntityType,
  ],
  relationTypes: [],
  attributes: [
    {
      "@id": "test:name",
      "@type": "Attribute",
      label: { en: "Name", zh: "名称" },
      datatype: "string",
      required: true,
      validation: [{ type: "pattern", value: "^[A-Za-z\\s]+$" }],
    } as AttributeDefinition,
    {
      "@id": "test:age",
      "@type": "Attribute",
      label: { en: "Age", zh: "年龄" },
      datatype: "integer",
      required: true,
    } as AttributeDefinition,
    {
      "@id": "test:email",
      "@type": "Attribute",
      label: { en: "Email", zh: "邮箱" },
      datatype: "string",
      required: true,
      validation: [{ type: "pattern", value: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" }],
    } as AttributeDefinition,
    {
      "@id": "test:score",
      "@type": "Attribute",
      label: { en: "Score", zh: "分数" },
      datatype: "float",
      required: false,
    } as AttributeDefinition,
    {
      "@id": "test:status",
      "@type": "Attribute",
      label: { en: "Status", zh: "状态" },
      datatype: "string",
      enum: ["active", "inactive", "pending"],
      required: false,
    } as AttributeDefinition,
    {
      "@id": "test:sku",
      "@type": "Attribute",
      label: { en: "SKU", zh: "SKU" },
      datatype: "string",
      required: true,
    } as AttributeDefinition,
    {
      "@id": "test:price",
      "@type": "Attribute",
      label: { en: "Price", zh: "价格" },
      datatype: "decimal",
      required: true,
    } as AttributeDefinition,
    {
      "@id": "test:quantity",
      "@type": "Attribute",
      label: { en: "Quantity", zh: "数量" },
      datatype: "integer",
      required: false,
    } as AttributeDefinition,
    {
      "@id": "test:category",
      "@type": "Attribute",
      label: { en: "Category", zh: "分类" },
      datatype: "string",
      enum: ["electronics", "clothing", "food"],
      required: false,
    } as AttributeDefinition,
    {
      "@id": "test:isActive",
      "@type": "Attribute",
      label: { en: "Is Active", zh: "是否激活" },
      datatype: "boolean",
      required: false,
    } as AttributeDefinition,
    {
      "@id": "test:code",
      "@type": "Attribute",
      label: { en: "Code", zh: "编码" },
      datatype: "string",
      required: true,
    } as AttributeDefinition,
    {
      "@id": "test:capacity",
      "@type": "Attribute",
      label: { en: "Capacity", zh: "容量" },
      datatype: "integer",
      required: false,
    } as AttributeDefinition,
  ],
  constraints: [],
  valueTypes: [
    {
      "@id": "test:Priority",
      "@type": "ValueType",
      label: { en: "Priority", zh: "优先级" },
      values: ["low", "medium", "high"],
    },
    {
      "@id": "test:Region",
      "@type": "ValueType",
      label: { en: "Region", zh: "地区" },
      values: ["north", "south", "east", "west"],
    },
  ],
  interfaces: [
    {
      "@id": "test:Identifiable",
      "@type": "Interface",
      label: { en: "Identifiable", zh: "可识别" },
      requiredAttributes: [
        { ref: "test:id", required: true },
        { ref: "test:createdAt", required: false },
      ],
    } as InterfaceDefinition,
  ],
};

describe("SHACLShapeGenerator", () => {
  const generator = new SHACLShapeGenerator();
  const shapes = generator.generate(testOntology);

  it("should generate shapes for all entity types", () => {
    expect(shapes.shapes).toHaveLength(4);

    const personShape = shapes.shapes.find((s) => s.targetClass === "test:Person");
    const productShape = shapes.shapes.find((s) => s.targetClass === "test:Product");
    const warehouseShape = shapes.shapes.find((s) => s.targetClass === "test:Warehouse");

    expect(personShape).toBeDefined();
    expect(productShape).toBeDefined();
    expect(warehouseShape).toBeDefined();

    expect(personShape?.["@id"]).toBe("test:PersonShape");
    expect(productShape?.["@id"]).toBe("test:ProductShape");
    expect(warehouseShape?.["@id"]).toBe("test:WarehouseShape");
  });

  it("should map required attributes to minCount: 1", () => {
    const personShape = shapes.shapes.find((s) => s.targetClass === "test:Person");
    expect(personShape).toBeDefined();

    const nameProp = personShape?.propertyShapes.find((p) => p.path === "test:name");
    const ageProp = personShape?.propertyShapes.find((p) => p.path === "test:age");
    const emailProp = personShape?.propertyShapes.find((p) => p.path === "test:email");
    const scoreProp = personShape?.propertyShapes.find((p) => p.path === "test:score");

    expect(nameProp?.minCount).toBe(1);
    expect(ageProp?.minCount).toBe(1);
    expect(emailProp?.minCount).toBe(1);
    expect(scoreProp?.minCount).toBeUndefined();
  });

  it("should map datatypes to XSD types", () => {
    const personShape = shapes.shapes.find((s) => s.targetClass === "test:Person");
    const productShape = shapes.shapes.find((s) => s.targetClass === "test:Product");

    const nameProp = personShape?.propertyShapes.find((p) => p.path === "test:name");
    expect(nameProp?.datatype).toBe("xsd:string");

    const ageProp = personShape?.propertyShapes.find((p) => p.path === "test:age");
    expect(ageProp?.datatype).toBe("xsd:integer");

    const scoreProp = personShape?.propertyShapes.find((p) => p.path === "test:score");
    expect(scoreProp?.datatype).toBe("xsd:float");

    const priceProp = productShape?.propertyShapes.find((p) => p.path === "test:price");
    expect(priceProp?.datatype).toBe("xsd:decimal");

    const isActiveProp = productShape?.propertyShapes.find((p) => p.path === "test:isActive");
    expect(isActiveProp?.datatype).toBe("xsd:boolean");
  });

  it("should map enum to 'in' constraint", () => {
    const personShape = shapes.shapes.find((s) => s.targetClass === "test:Person");
    const productShape = shapes.shapes.find((s) => s.targetClass === "test:Product");

    const statusProp = personShape?.propertyShapes.find((p) => p.path === "test:status");
    expect(statusProp?.in).toEqual(["active", "inactive", "pending"]);

    const categoryProp = productShape?.propertyShapes.find((p) => p.path === "test:category");
    expect(categoryProp?.in).toEqual(["electronics", "clothing", "food"]);
  });

  it("should map pattern validation to pattern constraint", () => {
    const personShape = shapes.shapes.find((s) => s.targetClass === "test:Person");

    const nameProp = personShape?.propertyShapes.find((p) => p.path === "test:name");
    expect(nameProp?.pattern).toBe("^[A-Za-z\\s]+$");

    const emailProp = personShape?.propertyShapes.find((p) => p.path === "test:email");
    expect(emailProp?.pattern).toBe("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
  });

  it("should map identity to minCount: 1", () => {
    const personShape = shapes.shapes.find((s) => s.targetClass === "test:Person");
    const productShape = shapes.shapes.find((s) => s.targetClass === "test:Product");

    const nameProp = personShape?.propertyShapes.find((p) => p.path === "test:name");
    expect(nameProp?.minCount).toBe(1);

    const skuProp = productShape?.propertyShapes.find((p) => p.path === "test:sku");
    expect(skuProp?.minCount).toBe(1);
  });

  it("should generate shapes for interfaces", () => {
    const interfaceShape = shapes.shapes.find((s) => s.targetClass === "test:Identifiable");
    expect(interfaceShape).toBeDefined();
    expect(interfaceShape?.["@id"]).toBe("test:IdentifiableShape");
    expect(interfaceShape?.propertyShapes).toHaveLength(2);

    const idProp = interfaceShape?.propertyShapes.find((p) => p.path === "test:id");
    expect(idProp?.minCount).toBe(1);
    expect(idProp?.severity).toBe("warning");

    const createdAtProp = interfaceShape?.propertyShapes.find((p) => p.path === "test:createdAt");
    expect(createdAtProp?.minCount).toBe(0);
    expect(createdAtProp?.severity).toBe("warning");
  });

  it("should handle ontology with no eventTypes/roleTypes gracefully", () => {
    const shapes = generator.generate(testOntology);

    expect(shapes.shapes).toHaveLength(4);

    const eventShape = shapes.shapes.find((s) => s.targetClass?.includes("Event"));
    const roleShape = shapes.shapes.find((s) => s.targetClass?.includes("Role"));
    expect(eventShape).toBeUndefined();
    expect(roleShape).toBeUndefined();
  });

  it("should include all property shapes for each entity type", () => {
    const personShape = shapes.shapes.find((s) => s.targetClass === "test:Person");
    expect(personShape?.propertyShapes).toHaveLength(5);

    const productShape = shapes.shapes.find((s) => s.targetClass === "test:Product");
    expect(productShape?.propertyShapes).toHaveLength(5);

    const warehouseShape = shapes.shapes.find((s) => s.targetClass === "test:Warehouse");
    expect(warehouseShape?.propertyShapes).toHaveLength(2);
  });
});

describe("exprToPropertyShape", () => {
  it("should convert compare gte to { minInclusive }", () => {
    const expr: CompareExpr = {
      type: "compare",
      op: "gte",
      left: { type: "property", path: "age" } as PropertyExpr,
      right: { type: "literal", value: 18 } as LiteralExpr,
    };

    const result = exprToPropertyShape(expr);
    expect(result).toEqual({ minInclusive: 18 });
  });

  it("should convert compare lte to { maxInclusive }", () => {
    const expr: CompareExpr = {
      type: "compare",
      op: "lte",
      left: { type: "property", path: "score" } as PropertyExpr,
      right: { type: "literal", value: 100 } as LiteralExpr,
    };

    const result = exprToPropertyShape(expr);
    expect(result).toEqual({ maxInclusive: 100 });
  });

  it("should convert compare gt to { minInclusive: value + 1 }", () => {
    const expr: CompareExpr = {
      type: "compare",
      op: "gt",
      left: { type: "property", path: "quantity" } as PropertyExpr,
      right: { type: "literal", value: 0 } as LiteralExpr,
    };

    const result = exprToPropertyShape(expr);
    expect(result).toEqual({ minInclusive: 1 });
  });

  it("should convert compare lt to { maxInclusive: value - 1 }", () => {
    const expr: CompareExpr = {
      type: "compare",
      op: "lt",
      left: { type: "property", path: "age" } as PropertyExpr,
      right: { type: "literal", value: 120 } as LiteralExpr,
    };

    const result = exprToPropertyShape(expr);
    expect(result).toEqual({ maxInclusive: 119 });
  });

  it("should return null for other compare operators", () => {
    const otherOps = ["eq", "neq", "contains", "startsWith", "endsWith", "matches", "in"] as const;

    for (const op of otherOps) {
      const expr: CompareExpr = {
        type: "compare",
        op,
        left: { type: "property", path: "field" } as PropertyExpr,
        right: { type: "literal", value: "test" } as LiteralExpr,
      };

      const result = exprToPropertyShape(expr);
      expect(result).toBeNull();
    }
  });

  it("should return null for non-compare expressions", () => {
    const literalExpr: LiteralExpr = { type: "literal", value: 42 };
    expect(exprToPropertyShape(literalExpr)).toBeNull();

    const propertyExpr: PropertyExpr = { type: "property", path: "field" };
    expect(exprToPropertyShape(propertyExpr)).toBeNull();
  });

  it("should return null when right operand is not a number literal", () => {
    const expr: CompareExpr = {
      type: "compare",
      op: "gte",
      left: { type: "property", path: "age" } as PropertyExpr,
      right: { type: "literal", value: "eighteen" } as LiteralExpr,
    };

    const result = exprToPropertyShape(expr);
    expect(result).toBeNull();
  });

  it("should handle negative numbers correctly", () => {
    const expr: CompareExpr = {
      type: "compare",
      op: "gt",
      left: { type: "property", path: "temperature" } as PropertyExpr,
      right: { type: "literal", value: -10 } as LiteralExpr,
    };

    const result = exprToPropertyShape(expr);
    expect(result).toEqual({ minInclusive: -9 });
  });

  it("should handle decimal numbers correctly", () => {
    const exprGte: CompareExpr = {
      type: "compare",
      op: "gte",
      left: { type: "property", path: "price" } as PropertyExpr,
      right: { type: "literal", value: 0.01 } as LiteralExpr,
    };

    const resultGte = exprToPropertyShape(exprGte);
    expect(resultGte).toEqual({ minInclusive: 0.01 });

    const exprLt: CompareExpr = {
      type: "compare",
      op: "lt",
      left: { type: "property", path: "discount" } as PropertyExpr,
      right: { type: "literal", value: 1.0 } as LiteralExpr,
    };

    const resultLt = exprToPropertyShape(exprLt);
    expect(resultLt).toEqual({ maxInclusive: 0 });
  });
});

describe("SHACLValidator", () => {
  const generator = new SHACLShapeGenerator();
  const shapes = generator.generate(testOntology);
  const validator = new SHACLValidator();

  it("should return conforms: true with empty results for valid data", () => {
    const validData = [
      {
        "@id": "test:person1",
        "@type": "test:Person",
        "test:name": "John Doe",
        "test:age": 30,
        "test:email": "john@example.com",
      },
    ];

    const report = validator.validate(shapes, validData);
    expect(report.conforms).toBe(true);
    expect(report.results).toHaveLength(0);
    expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("should report violation for missing required property", () => {
    const invalidData = [
      {
        "@id": "test:person1",
        "@type": "test:Person",
        "test:name": "John Doe",
        "test:email": "john@example.com",
      },
    ];

    const report = validator.validate(shapes, invalidData);
    expect(report.conforms).toBe(false);
    expect(report.results).toHaveLength(1);

    const violation = report.results[0];
    expect(violation).toBeDefined();
    if (violation) {
      expect(violation.focusNode).toBe("test:person1");
      expect(violation.path).toBe("test:age");
      expect(violation.constraint).toBe("minCount");
      expect(violation.severity).toBe("violation");
      expect(violation.message).toContain("Missing required property");
    }
  });

  it("should report violation for wrong datatype", () => {
    const invalidData = [
      {
        "@id": "test:person1",
        "@type": "test:Person",
        "test:name": "John Doe",
        "test:age": "thirty",
        "test:email": "john@example.com",
      },
    ];

    const report = validator.validate(shapes, invalidData);
    expect(report.conforms).toBe(false);
    expect(report.results).toHaveLength(1);

    const violation = report.results[0];
    expect(violation).toBeDefined();
    if (violation) {
      expect(violation.path).toBe("test:age");
      expect(violation.constraint).toBe("datatype");
      expect(violation.value).toBe("thirty");
    }
  });

  it("should report violation for value below minInclusive", () => {
    const shapesWithMin = {
      shapes: [
        {
          "@id": "test:ProductWithMinShape",
          targetClass: "test:ProductWithMin",
          propertyShapes: [{ path: "test:quantity", datatype: "xsd:integer", minInclusive: 0 }],
        },
      ],
    };

    const invalidData = [
      {
        "@id": "test:product1",
        "@type": "test:ProductWithMin",
        "test:quantity": -5,
      },
    ];

    const report = validator.validate(shapesWithMin, invalidData);
    expect(report.conforms).toBe(false);
    expect(report.results).toHaveLength(1);

    const violation = report.results[0];
    expect(violation).toBeDefined();
    if (violation) {
      expect(violation.path).toBe("test:quantity");
      expect(violation.constraint).toBe("minInclusive");
      expect(violation.value).toBe(-5);
    }
  });

  it("should report violation for value above maxInclusive", () => {
    const shapesWithMax = {
      shapes: [
        {
          "@id": "test:ProductWithMaxShape",
          targetClass: "test:ProductWithMax",
          propertyShapes: [
            {
              path: "test:discount",
              datatype: "xsd:decimal",
              maxInclusive: 1.0,
            },
          ],
        },
      ],
    };

    const invalidData = [
      {
        "@id": "test:product1",
        "@type": "test:ProductWithMax",
        "test:discount": 1.5,
      },
    ];

    const report = validator.validate(shapesWithMax, invalidData);
    expect(report.conforms).toBe(false);
    expect(report.results).toHaveLength(1);

    const violation = report.results[0];
    expect(violation).toBeDefined();
    if (violation) {
      expect(violation.path).toBe("test:discount");
      expect(violation.constraint).toBe("maxInclusive");
      expect(violation.value).toBe(1.5);
    }
  });

  it("should report violation for string not matching pattern", () => {
    const invalidData = [
      {
        "@id": "test:person1",
        "@type": "test:Person",
        "test:name": "John123",
        "test:age": 30,
        "test:email": "john@example.com",
      },
    ];

    const report = validator.validate(shapes, invalidData);
    expect(report.conforms).toBe(false);
    expect(report.results).toHaveLength(1);

    const violation = report.results[0];
    expect(violation).toBeDefined();
    if (violation) {
      expect(violation.path).toBe("test:name");
      expect(violation.constraint).toBe("pattern");
      expect(violation.value).toBe("John123");
    }
  });

  it("should report violation for value not in enum", () => {
    const invalidData = [
      {
        "@id": "test:person1",
        "@type": "test:Person",
        "test:name": "John Doe",
        "test:age": 30,
        "test:email": "john@example.com",
        "test:status": "unknown",
      },
    ];

    const report = validator.validate(shapes, invalidData);
    expect(report.conforms).toBe(false);
    expect(report.results).toHaveLength(1);

    const violation = report.results[0];
    expect(violation).toBeDefined();
    if (violation) {
      expect(violation.path).toBe("test:status");
      expect(violation.constraint).toBe("in");
      expect(violation.value).toBe("unknown");
    }
  });

  it("should skip data with no @type without crashing", () => {
    const dataWithoutType = [
      {
        "@id": "test:unknown1",
        "test:name": "Unknown",
        "test:age": 25,
      },
    ];

    const report = validator.validate(shapes, dataWithoutType);
    expect(report.conforms).toBe(true);
    expect(report.results).toHaveLength(0);
  });

  it("should skip data with unknown @type without crashing", () => {
    const dataWithUnknownType = [
      {
        "@id": "test:unknown1",
        "@type": "test:UnknownType",
        "test:name": "Unknown",
      },
    ];

    const report = validator.validate(shapes, dataWithUnknownType);
    expect(report.conforms).toBe(true);
    expect(report.results).toHaveLength(0);
  });

  it("should report multiple violations on same object", () => {
    const invalidData = [
      {
        "@id": "test:person1",
        "@type": "test:Person",
        "test:name": "John123",
        "test:email": "invalid-email",
        "test:status": "invalid",
      },
    ];

    const report = validator.validate(shapes, invalidData);
    expect(report.conforms).toBe(false);
    expect(report.results.length).toBeGreaterThanOrEqual(3);

    const minCountViolation = report.results.find((r) => r.constraint === "minCount");
    const patternViolations = report.results.filter((r) => r.constraint === "pattern");
    const enumViolation = report.results.find((r) => r.constraint === "in");

    expect(minCountViolation).toBeDefined();
    expect(patternViolations).toHaveLength(2);
    expect(enumViolation).toBeDefined();
  });

  it("should validate all objects in data array", () => {
    const data = [
      {
        "@id": "test:person1",
        "@type": "test:Person",
        "test:name": "John Doe",
        "test:age": 30,
        "test:email": "john@example.com",
      },
      {
        "@id": "test:product1",
        "@type": "test:Product",
        "test:sku": "SKU001",
        "test:price": 99.99,
      },
      {
        "@id": "test:person2",
        "@type": "test:Person",
        "test:name": "Jane",
        "test:email": "jane@example.com",
      },
    ];

    const report = validator.validate(shapes, data);
    expect(report.conforms).toBe(false);
    expect(report.results).toHaveLength(1);
    const firstResult = report.results[0];
    expect(firstResult).toBeDefined();
    if (firstResult) {
      expect(firstResult.focusNode).toBe("test:person2");
    }
  });

  it("should handle multiple objects with different types", () => {
    const data = [
      {
        "@id": "test:person1",
        "@type": "test:Person",
        "test:name": "John",
        "test:age": 30,
        "test:email": "john@test.com",
      },
      {
        "@id": "test:product1",
        "@type": "test:Product",
        "test:sku": "ABC123",
        "test:price": 29.99,
      },
      {
        "@id": "test:warehouse1",
        "@type": "test:Warehouse",
        "test:code": "WH001",
      },
    ];

    const report = validator.validate(shapes, data);
    expect(report.conforms).toBe(true);
    expect(report.results).toHaveLength(0);
  });

  it("should validate boolean datatype correctly", () => {
    const validData = [
      {
        "@id": "test:product1",
        "@type": "test:Product",
        "test:sku": "SKU001",
        "test:price": 99.99,
        "test:isActive": true,
      },
    ];

    const report = validator.validate(shapes, validData);
    expect(report.conforms).toBe(true);

    const invalidData = [
      {
        "@id": "test:product1",
        "@type": "test:Product",
        "test:sku": "SKU001",
        "test:price": 99.99,
        "test:isActive": "yes",
      },
    ];

    const invalidReport = validator.validate(shapes, invalidData);
    expect(invalidReport.conforms).toBe(false);
    const firstInvalidResult = invalidReport.results[0];
    expect(firstInvalidResult).toBeDefined();
    if (firstInvalidResult) {
      expect(firstInvalidResult.constraint).toBe("datatype");
    }
  });

  it("should validate datetime datatype correctly", () => {
    const shapesWithDate = {
      shapes: [
        {
          "@id": "test:EventShape",
          targetClass: "test:Event",
          propertyShapes: [
            { path: "test:startTime", datatype: "xsd:dateTime" },
            { path: "test:birthDate", datatype: "xsd:date" },
          ],
        },
      ],
    };

    const validData = [
      {
        "@id": "test:event1",
        "@type": "test:Event",
        "test:startTime": "2024-01-15T10:30:00Z",
        "test:birthDate": "1990-05-20",
      },
    ];

    const report = validator.validate(shapesWithDate, validData);
    expect(report.conforms).toBe(true);

    const invalidData = [
      {
        "@id": "test:event1",
        "@type": "test:Event",
        "test:startTime": "not-a-datetime",
        "test:birthDate": "not-a-date",
      },
    ];

    const invalidReport = validator.validate(shapesWithDate, invalidData);
    expect(invalidReport.conforms).toBe(false);
    expect(invalidReport.results).toHaveLength(2);
  });

  it("should handle null values in properties", () => {
    const dataWithNull = [
      {
        "@id": "test:person1",
        "@type": "test:Person",
        "test:name": "John",
        "test:age": null,
        "test:email": "john@example.com",
      },
    ];

    const report = validator.validate(shapes, dataWithNull);
    expect(report.conforms).toBe(false);
    const firstResult = (report.results ?? [])[0];
    expect(firstResult).toBeDefined();
    if (firstResult) {
      expect(firstResult.constraint).toBe("minCount");
    }
  });

  it("should handle empty data array", () => {
    const report = validator.validate(shapes, []);
    expect(report.conforms).toBe(true);
    expect(report.results).toHaveLength(0);
  });

  it("should validate float datatype correctly", () => {
    const validData = [
      {
        "@id": "test:person1",
        "@type": "test:Person",
        "test:name": "John",
        "test:age": 30,
        "test:email": "john@test.com",
        "test:score": 95.5,
      },
    ];

    const report = validator.validate(shapes, validData);
    expect(report.conforms).toBe(true);

    const invalidData = [
      {
        "@id": "test:person1",
        "@type": "test:Person",
        "test:name": "John",
        "test:age": 30,
        "test:email": "john@test.com",
        "test:score": "ninety-five",
      },
    ];

    const invalidReport = validator.validate(shapes, invalidData);
    expect(invalidReport.conforms).toBe(false);
    const firstResult = (invalidReport.results ?? [])[0];
    expect(firstResult).toBeDefined();
    if (firstResult) {
      expect(firstResult.constraint).toBe("datatype");
    }
  });

  it("should validate decimal datatype correctly", () => {
    const validData = [
      {
        "@id": "test:product1",
        "@type": "test:Product",
        "test:sku": "SKU001",
        "test:price": 99.99,
      },
    ];

    const report = validator.validate(shapes, validData);
    expect(report.conforms).toBe(true);
  });

  it("should handle optional properties that are undefined", () => {
    const dataWithOptionalMissing = [
      {
        "@id": "test:person1",
        "@type": "test:Person",
        "test:name": "John",
        "test:age": 30,
        "test:email": "john@test.com",
      },
    ];

    const report = validator.validate(shapes, dataWithOptionalMissing);
    expect(report.conforms).toBe(true);
  });
});

const constrainedOntology: OntologyDefinition = {
  "@context": {
    ontograph: "https://ontograph.io/",
    test: "https://test.ontograph.io/",
    xsd: "http://www.w3.org/2001/XMLSchema#",
  },
  "@id": "test:ConstrainedOntology",
  "@type": "Ontology",
  version: "1.0.0",
  label: { en: "Constrained Ontology", zh: "约束测试本体" },
  entityTypes: [
    {
      "@id": "test:Item",
      "@type": "EntityType",
      label: { en: "Item", zh: "物品" },
      kind: "entity",
      attributes: [
        { ref: "test:name", required: true },
        { ref: "test:weight", required: false },
        { ref: "test:discount", required: false },
      ],
      relations: [],
      constraints: [
        { ref: "test:WeightNonNegative" },
        { ref: "test:DiscountBelowOne" },
        { ref: "test:PriorityAtLeastOne" },
        { ref: "test:NameNotMappable" },
        { ref: "test:DanglingRef" },
      ],
    } as EntityType,
  ],
  relationTypes: [],
  attributes: [
    {
      "@id": "test:name",
      "@type": "Attribute",
      label: { en: "Name", zh: "名称" },
      datatype: "string",
      required: true,
    } as AttributeDefinition,
    {
      "@id": "test:weight",
      "@type": "Attribute",
      label: { en: "Weight", zh: "重量" },
      datatype: "float",
    } as AttributeDefinition,
    {
      "@id": "test:discount",
      "@type": "Attribute",
      label: { en: "Discount", zh: "折扣" },
      datatype: "float",
    } as AttributeDefinition,
  ],
  constraints: [
    {
      "@id": "test:WeightNonNegative",
      "@type": "Constraint",
      on: "test:weight",
      rule: "weight >= 0",
      expr: {
        type: "compare",
        op: "gte",
        left: { type: "property", path: "test:weight" },
        right: { type: "literal", value: 0 },
      },
      severity: "error",
    },
    {
      "@id": "test:DiscountBelowOne",
      "@type": "Constraint",
      on: "test:discount",
      rule: "discount < 1",
      expr: {
        type: "compare",
        op: "lt",
        left: { type: "property", path: "test:discount" },
        right: { type: "literal", value: 1 },
      },
      severity: "warning",
      message: { en: "Discount must be less than 1", zh: "折扣必须小于 1" },
    },
    {
      "@id": "test:PriorityAtLeastOne",
      "@type": "Constraint",
      on: "test:priority",
      rule: "priority >= 1",
      expr: {
        type: "compare",
        op: "gte",
        left: { type: "property", path: "test:priority" },
        right: { type: "literal", value: 1 },
      },
      severity: "info",
    },
    {
      "@id": "test:NameNotMappable",
      "@type": "Constraint",
      on: "test:name",
      rule: "name != 'forbidden'",
      expr: {
        type: "compare",
        op: "neq",
        left: { type: "property", path: "test:name" },
        right: { type: "literal", value: "forbidden" },
      },
    },
  ],
  valueTypes: [],
};

describe("SHACLShapeGenerator constraint wiring", () => {
  const generator = new SHACLShapeGenerator();
  const shapes = generator.generate(constrainedOntology);

  it("should merge structured Expr constraint bounds into the referenced property shape", () => {
    const itemShape = shapes.shapes.find((s) => s.targetClass === "test:Item");
    expect(itemShape).toBeDefined();

    const weightProp = itemShape?.propertyShapes.find((p) => p.path === "test:weight");
    expect(weightProp?.minInclusive).toBe(0);
    expect(weightProp?.datatype).toBe("xsd:float");
    expect(weightProp?.severity).toBe("violation");
  });

  it("should map Constraint severity warning and localized message", () => {
    const itemShape = shapes.shapes.find((s) => s.targetClass === "test:Item");
    const discountProp = itemShape?.propertyShapes.find((p) => p.path === "test:discount");

    expect(discountProp?.maxInclusive).toBe(0);
    expect(discountProp?.severity).toBe("warning");
    expect(discountProp?.message).toBe("Discount must be less than 1");
  });

  it("should create a property shape for constraints on unreferenced attributes", () => {
    const itemShape = shapes.shapes.find((s) => s.targetClass === "test:Item");
    const priorityProp = itemShape?.propertyShapes.find((p) => p.path === "test:priority");

    expect(priorityProp).toBeDefined();
    expect(priorityProp?.minInclusive).toBe(1);
    expect(priorityProp?.severity).toBe("info");
    expect(priorityProp?.datatype).toBeUndefined();
  });

  it("should skip constraints whose expr cannot be mapped to a property shape", () => {
    const itemShape = shapes.shapes.find((s) => s.targetClass === "test:Item");
    const nameProp = itemShape?.propertyShapes.find((p) => p.path === "test:name");

    expect(nameProp?.minCount).toBe(1);
    expect(nameProp?.minInclusive).toBeUndefined();
    expect(nameProp?.maxInclusive).toBeUndefined();
    expect(nameProp?.severity).toBeUndefined();
  });

  it("should skip dangling constraint refs without crashing", () => {
    expect(shapes.shapes.find((s) => s.targetClass === "test:Item")).toBeDefined();
  });

  it("should reject data violating generated constraint shapes end-to-end", () => {
    const validator = new SHACLValidator();
    const report = validator.validate(shapes, [
      {
        "@id": "test:item1",
        "@type": "test:Item",
        "test:name": "Widget",
        "test:weight": -5,
        "test:discount": 2,
      },
    ]);

    expect(report.conforms).toBe(false);
    const weightViolation = report.results.find((r) => r.constraint === "minInclusive");
    expect(weightViolation?.path).toBe("test:weight");
    const discountViolation = report.results.find((r) => r.constraint === "maxInclusive");
    expect(discountViolation?.path).toBe("test:discount");
  });
});

describe("SHACLValidator additional constraints", () => {
  const validator = new SHACLValidator();

  it("should collect all failed constraints for one property instead of only the first", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:StrictShape",
          targetClass: "test:Strict",
          propertyShapes: [{ path: "test:code", datatype: "xsd:integer", pattern: "^[0-9]+$" }],
        },
      ],
    };

    const report = validator.validate(shapes, [{ "@id": "test:s1", "@type": "test:Strict", "test:code": "abc" }]);

    expect(report.conforms).toBe(false);
    expect(report.results).toHaveLength(2);
    const constraints = report.results.map((r) => r.constraint);
    expect(constraints).toContain("datatype");
    expect(constraints).toContain("pattern");
  });

  it("should enforce class against embedded @type", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:OrderShape",
          targetClass: "test:Order",
          propertyShapes: [{ path: "test:address", class_: "test:Address" }],
        },
      ],
    };

    const valid = validator.validate(shapes, [
      {
        "@id": "test:o1",
        "@type": "test:Order",
        "test:address": { "@type": "test:Address", "test:city": "Shanghai" },
      },
    ]);
    expect(valid.conforms).toBe(true);

    const invalid = validator.validate(shapes, [
      { "@id": "test:o1", "@type": "test:Order", "test:address": { "@type": "test:GeoPoint" } },
    ]);
    expect(invalid.conforms).toBe(false);
    expect(invalid.results).toHaveLength(1);
    const violation = invalid.results[0];
    expect(violation).toBeDefined();
    if (violation) {
      expect(violation.constraint).toBe("class");
      expect(violation.focusNode).toBe("test:o1");
      expect(violation.path).toBe("test:address");
    }
  });

  it("should accept 'type' as fallback field for class", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:OrderShape",
          targetClass: "test:Order",
          propertyShapes: [{ path: "test:address", class_: "test:Address" }],
        },
      ],
    };

    const report = validator.validate(shapes, [
      { "@id": "test:o1", "@type": "test:Order", "test:address": { type: "test:Address" } },
    ]);
    expect(report.conforms).toBe(true);
  });

  it("should reject non-object values for class", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:OrderShape",
          targetClass: "test:Order",
          propertyShapes: [{ path: "test:address", class_: "test:Address" }],
        },
      ],
    };

    const report = validator.validate(shapes, [
      { "@id": "test:o1", "@type": "test:Order", "test:address": "test:Address" },
    ]);
    expect(report.conforms).toBe(false);
    expect(report.results[0]?.constraint).toBe("class");
  });

  it("should enforce nodeKind IRI", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:RefShape",
          targetClass: "test:Ref",
          propertyShapes: [{ path: "test:target", nodeKind: "IRI" }],
        },
      ],
    };

    const valid = validator.validate(shapes, [{ "@id": "test:r1", "@type": "test:Ref", "test:target": "test:other1" }]);
    expect(valid.conforms).toBe(true);

    const invalidNumber = validator.validate(shapes, [{ "@id": "test:r1", "@type": "test:Ref", "test:target": 42 }]);
    expect(invalidNumber.conforms).toBe(false);

    const invalidObject = validator.validate(shapes, [
      { "@id": "test:r1", "@type": "test:Ref", "test:target": { "test:key": "value" } },
    ]);
    expect(invalidObject.conforms).toBe(false);
    expect(invalidObject.results[0]?.constraint).toBe("nodeKind");
  });

  it("should enforce nodeKind Literal", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:NoteShape",
          targetClass: "test:Note",
          propertyShapes: [{ path: "test:label", nodeKind: "Literal" }],
        },
      ],
    };

    expect(
      validator.validate(shapes, [{ "@id": "test:n1", "@type": "test:Note", "test:label": "hello" }]).conforms,
    ).toBe(true);
    expect(validator.validate(shapes, [{ "@id": "test:n1", "@type": "test:Note", "test:label": 42 }]).conforms).toBe(
      true,
    );

    const invalidIri = validator.validate(shapes, [
      { "@id": "test:n1", "@type": "test:Note", "test:label": "test:thing" },
    ]);
    expect(invalidIri.conforms).toBe(false);
    expect(invalidIri.results[0]?.constraint).toBe("nodeKind");

    const invalidObject = validator.validate(shapes, [
      { "@id": "test:n1", "@type": "test:Note", "test:label": { "test:key": "value" } },
    ]);
    expect(invalidObject.conforms).toBe(false);
  });

  it("should enforce nodeKind BlankNode", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:NestedShape",
          targetClass: "test:Nested",
          propertyShapes: [{ path: "test:child", nodeKind: "BlankNode" }],
        },
      ],
    };

    const valid = validator.validate(shapes, [
      { "@id": "test:n1", "@type": "test:Nested", "test:child": { "test:key": "value" } },
    ]);
    expect(valid.conforms).toBe(true);

    const invalid = validator.validate(shapes, [{ "@id": "test:n1", "@type": "test:Nested", "test:child": "hello" }]);
    expect(invalid.conforms).toBe(false);
    expect(invalid.results[0]?.constraint).toBe("nodeKind");
  });

  it("should enforce combined nodeKind IRIOrLiteral", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:FlexShape",
          targetClass: "test:Flex",
          propertyShapes: [{ path: "test:value", nodeKind: "IRIOrLiteral" }],
        },
      ],
    };

    expect(
      validator.validate(shapes, [{ "@id": "test:f1", "@type": "test:Flex", "test:value": "hello" }]).conforms,
    ).toBe(true);
    expect(
      validator.validate(shapes, [{ "@id": "test:f1", "@type": "test:Flex", "test:value": "test:thing" }]).conforms,
    ).toBe(true);

    const invalid = validator.validate(shapes, [
      { "@id": "test:f1", "@type": "test:Flex", "test:value": { "test:key": "value" } },
    ]);
    expect(invalid.conforms).toBe(false);
    expect(invalid.results[0]?.constraint).toBe("nodeKind");
  });

  it("should enforce hasValue", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:HolderShape",
          targetClass: "test:Holder",
          propertyShapes: [{ path: "test:status", hasValue: "active" }],
        },
      ],
    };

    const valid = validator.validate(shapes, [{ "@id": "test:h1", "@type": "test:Holder", "test:status": "active" }]);
    expect(valid.conforms).toBe(true);

    const invalid = validator.validate(shapes, [
      { "@id": "test:h1", "@type": "test:Holder", "test:status": "inactive" },
    ]);
    expect(invalid.conforms).toBe(false);
    expect(invalid.results[0]?.constraint).toBe("hasValue");
  });

  it("should compare hasValue leniently for scalars like 'in'", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:HolderShape",
          targetClass: "test:Holder",
          propertyShapes: [{ path: "test:threshold", hasValue: 18 }],
        },
      ],
    };

    const valid = validator.validate(shapes, [{ "@id": "test:h1", "@type": "test:Holder", "test:threshold": "18" }]);
    expect(valid.conforms).toBe(true);

    const invalid = validator.validate(shapes, [{ "@id": "test:h1", "@type": "test:Holder", "test:threshold": true }]);
    expect(invalid.conforms).toBe(false);
    expect(invalid.results[0]?.constraint).toBe("hasValue");
  });

  it("should enforce minLength on strings", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:FieldShape",
          targetClass: "test:Field",
          propertyShapes: [{ path: "test:name", minLength: 3 }],
        },
      ],
    };

    const valid = validator.validate(shapes, [{ "@id": "test:f1", "@type": "test:Field", "test:name": "abc" }]);
    expect(valid.conforms).toBe(true);

    const invalid = validator.validate(shapes, [{ "@id": "test:f1", "@type": "test:Field", "test:name": "ab" }]);
    expect(invalid.conforms).toBe(false);
    const violation = invalid.results[0];
    expect(violation).toBeDefined();
    if (violation) {
      expect(violation.constraint).toBe("minLength");
      expect(violation.message).toContain("minLength");
    }

    // 非字符串值不参与长度校验（与 pattern 的守卫一致）
    const nonString = validator.validate(shapes, [{ "@id": "test:f1", "@type": "test:Field", "test:name": 42 }]);
    expect(nonString.conforms).toBe(true);
  });

  it("should enforce maxLength on strings", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:FieldShape",
          targetClass: "test:Field",
          propertyShapes: [{ path: "test:name", maxLength: 3 }],
        },
      ],
    };

    const valid = validator.validate(shapes, [{ "@id": "test:f1", "@type": "test:Field", "test:name": "abc" }]);
    expect(valid.conforms).toBe(true);

    const invalid = validator.validate(shapes, [{ "@id": "test:f1", "@type": "test:Field", "test:name": "abcd" }]);
    expect(invalid.conforms).toBe(false);
    expect(invalid.results[0]?.constraint).toBe("maxLength");
  });

  it("should enforce closed and flag unknown properties", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:ClosedShape",
          targetClass: "test:Closed",
          closed: true,
          propertyShapes: [{ path: "test:name", minCount: 1 }],
        },
      ],
    };

    const report = validator.validate(shapes, [
      { "@id": "test:c1", "@type": "test:Closed", "test:name": "Alpha", "test:extra": "oops" },
    ]);

    expect(report.conforms).toBe(false);
    expect(report.results).toHaveLength(1);
    const violation = report.results[0];
    expect(violation).toBeDefined();
    if (violation) {
      expect(violation.constraint).toBe("closed");
      expect(violation.path).toBe("test:extra");
      expect(violation.focusNode).toBe("test:c1");
      expect(violation.message).toContain("closed");
    }
  });

  it("should honor ignoredProperties on closed shapes", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:ClosedShape",
          targetClass: "test:Closed",
          closed: true,
          ignoredProperties: ["test:extra"],
          propertyShapes: [{ path: "test:name", minCount: 1 }],
        },
      ],
    };

    const report = validator.validate(shapes, [
      { "@id": "test:c1", "@type": "test:Closed", "test:name": "Alpha", "test:extra": "allowed" },
    ]);
    expect(report.conforms).toBe(true);
  });

  it("should not flag @id/@type on closed shapes", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:ClosedShape",
          targetClass: "test:Closed",
          closed: true,
          propertyShapes: [{ path: "test:name", minCount: 1 }],
        },
      ],
    };

    const report = validator.validate(shapes, [{ "@id": "test:c1", "@type": "test:Closed", "test:name": "Alpha" }]);
    expect(report.conforms).toBe(true);
  });

  it("should not enforce closed when undefined", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:OpenShape",
          targetClass: "test:Open",
          propertyShapes: [{ path: "test:name", minCount: 1 }],
        },
      ],
    };

    const report = validator.validate(shapes, [
      { "@id": "test:o1", "@type": "test:Open", "test:name": "Alpha", "test:extra": "fine" },
    ]);
    expect(report.conforms).toBe(true);
  });

  it("should enforce or — value conforming to any member passes", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:MultiShape",
          targetClass: "test:Multi",
          propertyShapes: [
            {
              path: "test:value",
              or: [
                { path: "test:value", datatype: "xsd:integer" },
                { path: "test:value", minLength: 3 },
              ],
            },
          ],
        },
      ],
    };

    expect(validator.validate(shapes, [{ "@id": "test:m1", "@type": "test:Multi", "test:value": 42 }]).conforms).toBe(
      true,
    );
    expect(
      validator.validate(shapes, [{ "@id": "test:m1", "@type": "test:Multi", "test:value": "hello" }]).conforms,
    ).toBe(true);

    const invalid = validator.validate(shapes, [{ "@id": "test:m1", "@type": "test:Multi", "test:value": "ab" }]);
    expect(invalid.conforms).toBe(false);
    expect(invalid.results[0]?.constraint).toBe("or");
  });

  it("should enforce and — all members must pass", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:Strict2Shape",
          targetClass: "test:Strict2",
          propertyShapes: [
            {
              path: "test:value",
              and: [
                { path: "test:value", datatype: "xsd:string" },
                { path: "test:value", minLength: 3 },
              ],
            },
          ],
        },
      ],
    };

    expect(
      validator.validate(shapes, [{ "@id": "test:s1", "@type": "test:Strict2", "test:value": "hello" }]).conforms,
    ).toBe(true);

    const tooShort = validator.validate(shapes, [{ "@id": "test:s1", "@type": "test:Strict2", "test:value": "ab" }]);
    expect(tooShort.conforms).toBe(false);
    expect(tooShort.results[0]?.constraint).toBe("and");

    const wrongType = validator.validate(shapes, [{ "@id": "test:s1", "@type": "test:Strict2", "test:value": 42 }]);
    expect(wrongType.conforms).toBe(false);
    expect(wrongType.results[0]?.constraint).toBe("and");
  });

  it("should enforce xone — exactly one member must pass", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:XorShape",
          targetClass: "test:Xor",
          propertyShapes: [
            {
              path: "test:value",
              xone: [
                { path: "test:value", datatype: "xsd:integer" },
                { path: "test:value", datatype: "xsd:string" },
              ],
            },
          ],
        },
      ],
    };

    expect(validator.validate(shapes, [{ "@id": "test:x1", "@type": "test:Xor", "test:value": 42 }]).conforms).toBe(
      true,
    );
    expect(validator.validate(shapes, [{ "@id": "test:x1", "@type": "test:Xor", "test:value": "abc" }]).conforms).toBe(
      true,
    );

    const zeroConforming = validator.validate(shapes, [{ "@id": "test:x1", "@type": "test:Xor", "test:value": true }]);
    expect(zeroConforming.conforms).toBe(false);
    expect(zeroConforming.results[0]?.constraint).toBe("xone");

    const twoConformingShapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:Xor2Shape",
          targetClass: "test:Xor2",
          propertyShapes: [
            {
              path: "test:value",
              xone: [
                { path: "test:value", minInclusive: 0 },
                { path: "test:value", datatype: "xsd:integer" },
              ],
            },
          ],
        },
      ],
    };
    const twoConforming = validator.validate(twoConformingShapes, [
      { "@id": "test:x1", "@type": "test:Xor2", "test:value": 7 },
    ]);
    expect(twoConforming.conforms).toBe(false);
    expect(twoConforming.results[0]?.constraint).toBe("xone");
  });

  it("should report shape list failures alongside other violations", () => {
    const shapes: SHACLShapes = {
      shapes: [
        {
          "@id": "test:ComboShape",
          targetClass: "test:Combo",
          propertyShapes: [
            { path: "test:value", pattern: "^A", or: [{ path: "test:value", datatype: "xsd:integer" }] },
          ],
        },
      ],
    };

    const report = validator.validate(shapes, [{ "@id": "test:c1", "@type": "test:Combo", "test:value": "b" }]);
    expect(report.conforms).toBe(false);
    expect(report.results).toHaveLength(2);
    const constraints = report.results.map((r) => r.constraint);
    expect(constraints).toContain("pattern");
    expect(constraints).toContain("or");
  });
});
