import { describe, expect, it } from "vitest";
import { defineAttribute, defineEntity, defineRelation } from "./define";

describe("defineEntity", () => {
	it("creates EntityType with correct @id and @type", () => {
		const entity = defineEntity("sc:Warehouse", {
			kind: "entity",
			label: { en: "Warehouse", zh: "仓库" },
		}).build();

		expect(entity["@id"]).toBe("sc:Warehouse");
		expect(entity["@type"]).toBe("EntityType");
		expect(entity.kind).toBe("entity");
		expect(entity.label).toEqual({ en: "Warehouse", zh: "仓库" });
	});

	it("supports kind: event", () => {
		const event = defineEntity("sc:ShipmentEvent", {
			kind: "event",
			label: { en: "Shipment Event" },
		}).build();

		expect(event.kind).toBe("event");
	});

	it("supports kind: role", () => {
		const role = defineEntity("sc:Manager", {
			kind: "role",
			label: { en: "Manager" },
		}).build();

		expect(role.kind).toBe("role");
	});

	it("supports kind: value", () => {
		const value = defineEntity("sc:Status", {
			kind: "value",
			label: { en: "Status" },
		}).build();

		expect(value.kind).toBe("value");
	});

	it("supports description", () => {
		const entity = defineEntity("sc:Product", {
			kind: "entity",
			label: { en: "Product" },
			description: { en: "A physical product" },
		}).build();

		expect(entity.description).toEqual({ en: "A physical product" });
	});

	it("starts with empty attributes, relations, and constraints", () => {
		const entity = defineEntity("sc:Empty", {
			kind: "entity",
			label: { en: "Empty" },
		}).build();

		expect(entity.attributes).toEqual([]);
		expect(entity.relations).toEqual([]);
		expect(entity.constraints).toEqual([]);
	});
});

describe("EntityTypeBuilder.chain", () => {
	it("adds attribute via .attr()", () => {
		const entity = defineEntity("sc:Product", {
			kind: "entity",
			label: { en: "Product" },
		})
			.attr("sc:sku", { identity: true, required: true })
			.build();

		expect(entity.attributes).toHaveLength(1);
		expect(entity.attributes[0]).toEqual({
			ref: "sc:sku",
			identity: true,
			required: true,
		});
	});

	it("adds multiple attributes", () => {
		const entity = defineEntity("sc:Product", {
			kind: "entity",
			label: { en: "Product" },
		})
			.attr("sc:sku", { identity: true })
			.attr("sc:name", { required: true })
			.attr("sc:price", { required: false })
			.build();

		expect(entity.attributes).toHaveLength(3);
		expect(entity.attributes.map((a) => a.ref)).toEqual([
			"sc:sku",
			"sc:name",
			"sc:price",
		]);
	});

	it("adds relation via .rel()", () => {
		const entity = defineEntity("sc:Warehouse", {
			kind: "entity",
			label: { en: "Warehouse" },
		})
			.rel("sc:stores", { min: 0, max: null })
			.build();

		expect(entity.relations).toHaveLength(1);
		expect(entity.relations[0]).toEqual({
			ref: "sc:stores",
			min: 0,
			max: null,
		});
	});

	it("adds relation with no extra options", () => {
		const entity = defineEntity("sc:Warehouse", {
			kind: "entity",
			label: { en: "Warehouse" },
		})
			.rel("sc:contains")
			.build();

		expect(entity.relations).toHaveLength(1);
		expect(entity.relations[0]).toEqual({ ref: "sc:contains" });
	});

	it("adds constraint via .constraint()", () => {
		const entity = defineEntity("sc:Product", {
			kind: "entity",
			label: { en: "Product" },
		})
			.constraint("sc:PositivePrice")
			.constraint("sc:ValidSKU")
			.build();

		expect(entity.constraints).toHaveLength(2);
		expect(entity.constraints).toEqual([
			{ ref: "sc:PositivePrice" },
			{ ref: "sc:ValidSKU" },
		]);
	});

	it("adds interface via .implements()", () => {
		const entity = defineEntity("sc:Product", {
			kind: "entity",
			label: { en: "Product" },
		})
			.implements("scm:TraceableItem")
			.build();

		expect(entity.implements).toEqual(["scm:TraceableItem"]);
	});

	it("adds extends via .extends()", () => {
		const entity = defineEntity("sc:PhysicalGood", {
			kind: "entity",
			label: { en: "Physical Good" },
		})
			.extends("sc:Product")
			.build();

		expect(entity.extends).toEqual(["sc:Product"]);
	});

	it("adds UI config via .ui()", () => {
		const entity = defineEntity("sc:Product", {
			kind: "entity",
			label: { en: "Product" },
		})
			.ui({ color: "#2E7D32", icon: "package", group: "Goods" })
			.build();

		expect(entity.ui).toEqual({
			color: "#2E7D32",
			icon: "package",
			group: "Goods",
		});
	});

	it("supports full chained builder", () => {
		const entity = defineEntity("sc:Product", {
			kind: "entity",
			label: { en: "Product" },
			description: { en: "A sellable product" },
			extends: ["sc:Item"],
		})
			.attr("sc:sku", { identity: true, required: true })
			.attr("sc:name", { required: true })
			.rel("sc:inWarehouse", { min: 0, max: 1 })
			.constraint("sc:PositivePrice")
			.implements("scm:TraceableItem")
			.ui({ color: "#2E7D32", icon: "package" })
			.build();

		expect(entity["@id"]).toBe("sc:Product");
		expect(entity.kind).toBe("entity");
		expect(entity.attributes).toHaveLength(2);
		expect(entity.relations).toHaveLength(1);
		expect(entity.constraints).toHaveLength(1);
		expect(entity.implements).toEqual(["scm:TraceableItem"]);
		expect(entity.extends).toEqual(["sc:Item"]);
		expect(entity.ui).toEqual({ color: "#2E7D32", icon: "package" });
	});
});

describe("defineRelation", () => {
	it("creates RelationType with correct fields", () => {
		const rel = defineRelation("sc:storedIn", {
			label: { en: "Stored In" },
			domain: "sc:Product",
			range: "sc:Warehouse",
		});

		expect(rel["@id"]).toBe("sc:storedIn");
		expect(rel["@type"]).toBe("RelationType");
		expect(rel.domain).toBe("sc:Product");
		expect(rel.range).toBe("sc:Warehouse");
		expect(rel.label).toEqual({ en: "Stored In" });
	});

	it("supports all optional fields", () => {
		const rel = defineRelation("sc:suppliedBy", {
			label: { en: "Supplied By" },
			description: { en: "Links a product to its supplier" },
			domain: "sc:Product",
			range: "sc:Supplier",
			min: 1,
			max: null,
			inverse: "sc:supplies",
		});

		expect(rel.description).toEqual({ en: "Links a product to its supplier" });
		expect(rel.min).toBe(1);
		expect(rel.max).toBe(null);
		expect(rel.inverse).toBe("sc:supplies");
	});
});

describe("defineAttribute", () => {
	it("creates AttributeDefinition with correct fields", () => {
		const attr = defineAttribute("sc:sku", {
			label: { en: "SKU" },
			datatype: "string",
		});

		expect(attr["@id"]).toBe("sc:sku");
		expect(attr["@type"]).toBe("Attribute");
		expect(attr.datatype).toBe("string");
		expect(attr.label).toEqual({ en: "SKU" });
	});

	it("supports all optional fields", () => {
		const attr = defineAttribute("sc:status", {
			label: { en: "Status" },
			description: { en: "Current status" },
			datatype: "string",
			datatypeRef: "sc:StatusEnum",
			required: true,
			identity: false,
			readonly: false,
			defaultValue: "pending",
			enum: ["pending", "active", "completed"],
		});

		expect(attr.description).toEqual({ en: "Current status" });
		expect(attr.datatypeRef).toBe("sc:StatusEnum");
		expect(attr.required).toBe(true);
		// identity/readonly are only set when truthy (defineAttribute skips falsy values)
		expect(attr.identity).toBeUndefined();
		expect(attr.readonly).toBeUndefined();
		expect(attr.defaultValue).toBe("pending");
		expect(attr.enum).toEqual(["pending", "active", "completed"]);
	});

	it("creates pattern validation", () => {
		const attr = defineAttribute("sc:email", {
			label: { en: "Email" },
			datatype: "string",
			pattern: "^[^@]+@[^@]+\\.[^@]+$",
		});

		expect(attr.validation).toEqual([
			{ type: "pattern", value: "^[^@]+@[^@]+\\.[^@]+$" },
		]);
	});
});
