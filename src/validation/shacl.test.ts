import { describe, expect, it } from "vitest";
import type {
	CompareExpr,
	LiteralExpr,
	PropertyExpr,
} from "../expression/types";
import type {
	AttributeDefinition,
	EntityType,
	InterfaceDefinition,
	OntologyDefinition,
} from "../types";
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
			validation: [
				{ type: "pattern", value: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" },
			],
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

		const personShape = shapes.shapes.find(
			(s) => s.targetClass === "test:Person",
		);
		const productShape = shapes.shapes.find(
			(s) => s.targetClass === "test:Product",
		);
		const warehouseShape = shapes.shapes.find(
			(s) => s.targetClass === "test:Warehouse",
		);

		expect(personShape).toBeDefined();
		expect(productShape).toBeDefined();
		expect(warehouseShape).toBeDefined();

		expect(personShape?.["@id"]).toBe("test:PersonShape");
		expect(productShape?.["@id"]).toBe("test:ProductShape");
		expect(warehouseShape?.["@id"]).toBe("test:WarehouseShape");
	});

	it("should map required attributes to minCount: 1", () => {
		const personShape = shapes.shapes.find(
			(s) => s.targetClass === "test:Person",
		);
		expect(personShape).toBeDefined();

		const nameProp = personShape?.propertyShapes.find(
			(p) => p.path === "test:name",
		);
		const ageProp = personShape?.propertyShapes.find(
			(p) => p.path === "test:age",
		);
		const emailProp = personShape?.propertyShapes.find(
			(p) => p.path === "test:email",
		);
		const scoreProp = personShape?.propertyShapes.find(
			(p) => p.path === "test:score",
		);

		expect(nameProp?.minCount).toBe(1);
		expect(ageProp?.minCount).toBe(1);
		expect(emailProp?.minCount).toBe(1);
		expect(scoreProp?.minCount).toBeUndefined();
	});

	it("should map datatypes to XSD types", () => {
		const personShape = shapes.shapes.find(
			(s) => s.targetClass === "test:Person",
		);
		const productShape = shapes.shapes.find(
			(s) => s.targetClass === "test:Product",
		);

		const nameProp = personShape?.propertyShapes.find(
			(p) => p.path === "test:name",
		);
		expect(nameProp?.datatype).toBe("xsd:string");

		const ageProp = personShape?.propertyShapes.find(
			(p) => p.path === "test:age",
		);
		expect(ageProp?.datatype).toBe("xsd:integer");

		const scoreProp = personShape?.propertyShapes.find(
			(p) => p.path === "test:score",
		);
		expect(scoreProp?.datatype).toBe("xsd:float");

		const priceProp = productShape?.propertyShapes.find(
			(p) => p.path === "test:price",
		);
		expect(priceProp?.datatype).toBe("xsd:decimal");

		const isActiveProp = productShape?.propertyShapes.find(
			(p) => p.path === "test:isActive",
		);
		expect(isActiveProp?.datatype).toBe("xsd:boolean");
	});

	it("should map enum to 'in' constraint", () => {
		const personShape = shapes.shapes.find(
			(s) => s.targetClass === "test:Person",
		);
		const productShape = shapes.shapes.find(
			(s) => s.targetClass === "test:Product",
		);

		const statusProp = personShape?.propertyShapes.find(
			(p) => p.path === "test:status",
		);
		expect(statusProp?.in).toEqual(["active", "inactive", "pending"]);

		const categoryProp = productShape?.propertyShapes.find(
			(p) => p.path === "test:category",
		);
		expect(categoryProp?.in).toEqual(["electronics", "clothing", "food"]);
	});

	it("should map pattern validation to pattern constraint", () => {
		const personShape = shapes.shapes.find(
			(s) => s.targetClass === "test:Person",
		);

		const nameProp = personShape?.propertyShapes.find(
			(p) => p.path === "test:name",
		);
		expect(nameProp?.pattern).toBe("^[A-Za-z\\s]+$");

		const emailProp = personShape?.propertyShapes.find(
			(p) => p.path === "test:email",
		);
		expect(emailProp?.pattern).toBe("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
	});

	it("should map identity to minCount: 1", () => {
		const personShape = shapes.shapes.find(
			(s) => s.targetClass === "test:Person",
		);
		const productShape = shapes.shapes.find(
			(s) => s.targetClass === "test:Product",
		);

		const nameProp = personShape?.propertyShapes.find(
			(p) => p.path === "test:name",
		);
		expect(nameProp?.minCount).toBe(1);

		const skuProp = productShape?.propertyShapes.find(
			(p) => p.path === "test:sku",
		);
		expect(skuProp?.minCount).toBe(1);
	});

	it("should generate shapes for interfaces", () => {
		const interfaceShape = shapes.shapes.find(
			(s) => s.targetClass === "test:Identifiable",
		);
		expect(interfaceShape).toBeDefined();
		expect(interfaceShape?.["@id"]).toBe("test:IdentifiableShape");
		expect(interfaceShape?.propertyShapes).toHaveLength(2);

		const idProp = interfaceShape?.propertyShapes.find(
			(p) => p.path === "test:id",
		);
		expect(idProp?.minCount).toBe(1);
		expect(idProp?.severity).toBe("warning");

		const createdAtProp = interfaceShape?.propertyShapes.find(
			(p) => p.path === "test:createdAt",
		);
		expect(createdAtProp?.minCount).toBe(0);
		expect(createdAtProp?.severity).toBe("warning");
	});

	it("should handle ontology with no eventTypes/roleTypes gracefully", () => {
		const shapes = generator.generate(testOntology);

		expect(shapes.shapes).toHaveLength(4);

		const eventShape = shapes.shapes.find((s) =>
			s.targetClass?.includes("Event"),
		);
		const roleShape = shapes.shapes.find((s) =>
			s.targetClass?.includes("Role"),
		);
		expect(eventShape).toBeUndefined();
		expect(roleShape).toBeUndefined();
	});

	it("should include all property shapes for each entity type", () => {
		const personShape = shapes.shapes.find(
			(s) => s.targetClass === "test:Person",
		);
		expect(personShape?.propertyShapes).toHaveLength(5);

		const productShape = shapes.shapes.find(
			(s) => s.targetClass === "test:Product",
		);
		expect(productShape?.propertyShapes).toHaveLength(5);

		const warehouseShape = shapes.shapes.find(
			(s) => s.targetClass === "test:Warehouse",
		);
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
		const otherOps = [
			"eq",
			"neq",
			"contains",
			"startsWith",
			"endsWith",
			"matches",
			"in",
		] as const;

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
					propertyShapes: [
						{ path: "test:quantity", datatype: "xsd:integer", minInclusive: 0 },
					],
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

		const minCountViolation = report.results.find(
			(r) => r.constraint === "minCount",
		);
		const patternViolations = report.results.filter(
			(r) => r.constraint === "pattern",
		);
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
