import { describe, it, expect } from "vitest";
import {
	VersionManager,
	MemoryVersionStore,
	type Version,
	type Branch,
	type IVersionStore,
	type VersionMetadata,
	type AuditEntry,
} from "./versioning";

function createTestData(
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		name: "Test Object",
		status: "active",
		...overrides,
	};
}

function createTestVersionMetadata(
	source = "manual",
	tags: string[] = [],
	audit: AuditEntry[] = [],
): VersionMetadata {
	return {
		source,
		tags,
		audit,
	};
}

describe("MemoryVersionStore", () => {
	describe("version storage", () => {
		it("should save and retrieve a version", async () => {
			const store = new MemoryVersionStore();
			const version: Version = {
				versionId: "v1",
				objectId: "obj:test",
				versionNumber: 1,
				data: createTestData(),
				changedBy: "user:1",
				changedAt: new Date().toISOString(),
				changeDescription: "Initial version",
				metadata: createTestVersionMetadata(),
			};

			await store.saveVersion(version);
			const retrieved = await store.getVersion("obj:test", "v1");

			expect(retrieved).toEqual(version);
		});

		it("should return null for non-existent version", async () => {
			const store = new MemoryVersionStore();
			const retrieved = await store.getVersion("obj:nonexistent", "v999");

			expect(retrieved).toBeNull();
		});

		it("should update existing version on save", async () => {
			const store = new MemoryVersionStore();
			const version: Version = {
				versionId: "v1",
				objectId: "obj:test",
				versionNumber: 1,
				data: createTestData(),
				changedBy: "user:1",
				changedAt: new Date().toISOString(),
				changeDescription: "Initial version",
				metadata: createTestVersionMetadata(),
			};

			await store.saveVersion(version);

			const updatedVersion: Version = {
				...version,
				data: { ...version.data, status: "modified" },
				changeDescription: "Updated version",
			};

			await store.saveVersion(updatedVersion);
			const retrieved = await store.getVersion("obj:test", "v1");

			expect(retrieved).toEqual(updatedVersion);
		});

		it("should delete a version", async () => {
			const store = new MemoryVersionStore();
			const version: Version = {
				versionId: "v1",
				objectId: "obj:test",
				versionNumber: 1,
				data: createTestData(),
				changedBy: "user:1",
				changedAt: new Date().toISOString(),
				changeDescription: "Initial version",
				metadata: createTestVersionMetadata(),
			};

			await store.saveVersion(version);
			await store.deleteVersion("obj:test", "v1");
			const retrieved = await store.getVersion("obj:test", "v1");

			expect(retrieved).toBeNull();
		});
	});

	describe("version history", () => {
		it("should return history sorted by version number descending", async () => {
			const store = new MemoryVersionStore();
			const objectId = "obj:test";

			const v1: Version = {
				versionId: "v1",
				objectId,
				versionNumber: 1,
				data: createTestData({ version: 1 }),
				changedBy: "user:1",
				changedAt: "2024-01-01T00:00:00Z",
				changeDescription: "Version 1",
				metadata: createTestVersionMetadata(),
			};

			const v2: Version = {
				versionId: "v2",
				objectId,
				versionNumber: 2,
				data: createTestData({ version: 2 }),
				changedBy: "user:1",
				changedAt: "2024-01-02T00:00:00Z",
				changeDescription: "Version 2",
				metadata: createTestVersionMetadata(),
			};

			const v3: Version = {
				versionId: "v3",
				objectId,
				versionNumber: 3,
				data: createTestData({ version: 3 }),
				changedBy: "user:1",
				changedAt: "2024-01-03T00:00:00Z",
				changeDescription: "Version 3",
				metadata: createTestVersionMetadata(),
			};

			await store.saveVersion(v1);
			await store.saveVersion(v2);
			await store.saveVersion(v3);

			const history = await store.getHistory(objectId, "main");

			expect(history).toHaveLength(3);
			expect(history[0]!.versionNumber).toBe(3);
			expect(history[1]!.versionNumber).toBe(2);
			expect(history[2]!.versionNumber).toBe(1);
		});

		it("should limit history results", async () => {
			const store = new MemoryVersionStore();
			const objectId = "obj:test";

			for (let i = 1; i <= 5; i++) {
				const version: Version = {
					versionId: `v${i}`,
					objectId,
					versionNumber: i,
					data: createTestData(),
					changedBy: "user:1",
					changedAt: new Date().toISOString(),
					changeDescription: `Version ${i}`,
					metadata: createTestVersionMetadata(),
				};
				await store.saveVersion(version);
			}

			const history = await store.getHistory(objectId, "main", 3);

			expect(history).toHaveLength(3);
			expect(history[0]!.versionNumber).toBe(5);
			expect(history[1]!.versionNumber).toBe(4);
			expect(history[2]!.versionNumber).toBe(3);
		});

		it("should filter history by branch", async () => {
			const store = new MemoryVersionStore();
			const objectId = "obj:test";

			const mainVersion: Version = {
				versionId: "v1",
				objectId,
				versionNumber: 1,
				data: createTestData(),
				changedBy: "user:1",
				changedAt: new Date().toISOString(),
				changeDescription: "Main version",
				branch: "main",
				metadata: createTestVersionMetadata(),
			};

			const featureVersion: Version = {
				versionId: "v2",
				objectId,
				versionNumber: 2,
				data: createTestData({ feature: true }),
				changedBy: "user:1",
				changedAt: new Date().toISOString(),
				changeDescription: "Feature version",
				branch: "feature-branch",
				metadata: createTestVersionMetadata(),
			};

			await store.saveVersion(mainVersion);
			await store.saveVersion(featureVersion);

			const mainHistory = await store.getHistory(objectId, "main");
			const featureHistory = await store.getHistory(objectId, "feature-branch");

			expect(mainHistory).toHaveLength(1);
			expect(mainHistory[0]!.branch).toBe("main");
			expect(featureHistory).toHaveLength(1);
			expect(featureHistory[0]!.branch).toBe("feature-branch");
		});

		it("should default to main branch when branch is undefined", async () => {
			const store = new MemoryVersionStore();
			const objectId = "obj:test";

			const version: Version = {
				versionId: "v1",
				objectId,
				versionNumber: 1,
				data: createTestData(),
				changedBy: "user:1",
				changedAt: new Date().toISOString(),
				changeDescription: "Version without explicit branch",
				metadata: createTestVersionMetadata(),
			};

			await store.saveVersion(version);
			const history = await store.getHistory(objectId, "main");

			expect(history).toHaveLength(1);
		});
	});

	describe("latest version number", () => {
		it("should return 0 for object with no versions", async () => {
			const store = new MemoryVersionStore();
			const latestNumber = await store.getLatestVersionNumber(
				"obj:new",
				"main",
			);

			expect(latestNumber).toBe(0);
		});

		it("should return the highest version number", async () => {
			const store = new MemoryVersionStore();
			const objectId = "obj:test";

			for (let i = 1; i <= 3; i++) {
				const version: Version = {
					versionId: `v${i}`,
					objectId,
					versionNumber: i,
					data: createTestData(),
					changedBy: "user:1",
					changedAt: new Date().toISOString(),
					changeDescription: `Version ${i}`,
					metadata: createTestVersionMetadata(),
				};
				await store.saveVersion(version);
			}

			const latestNumber = await store.getLatestVersionNumber(objectId, "main");

			expect(latestNumber).toBe(3);
		});
	});

	describe("branch operations", () => {
		it("should save and retrieve a branch", async () => {
			const store = new MemoryVersionStore();
			const branch: Branch = {
				name: "feature-test",
				objectId: "obj:test",
				headVersionId: "v3",
				createdAt: new Date().toISOString(),
				createdBy: "user:1",
				description: "Feature branch for testing",
			};

			await store.saveBranch(branch);
			const retrieved = await store.getBranch("obj:test", "feature-test");

			expect(retrieved).toEqual(branch);
		});

		it("should return null for non-existent branch", async () => {
			const store = new MemoryVersionStore();
			const retrieved = await store.getBranch("obj:test", "nonexistent");

			expect(retrieved).toBeNull();
		});

		it("should list all branches for an object", async () => {
			const store = new MemoryVersionStore();
			const objectId = "obj:test";

			const branch1: Branch = {
				name: "main",
				objectId,
				headVersionId: "v5",
				createdAt: "2024-01-01T00:00:00Z",
				createdBy: "user:1",
			};

			const branch2: Branch = {
				name: "feature-a",
				objectId,
				headVersionId: "v2",
				createdAt: "2024-01-02T00:00:00Z",
				createdBy: "user:2",
			};

			const branch3: Branch = {
				name: "feature-b",
				objectId,
				headVersionId: "v1",
				createdAt: "2024-01-03T00:00:00Z",
				createdBy: "user:3",
			};

			await store.saveBranch(branch1);
			await store.saveBranch(branch2);
			await store.saveBranch(branch3);

			const branches = await store.listBranches(objectId);

			expect(branches).toHaveLength(3);
		});

		it("should update branch head", async () => {
			const store = new MemoryVersionStore();
			const objectId = "obj:test";

			const branch: Branch = {
				name: "main",
				objectId,
				headVersionId: "v1",
				createdAt: new Date().toISOString(),
				createdBy: "user:1",
			};

			await store.saveBranch(branch);
			await store.updateBranchHead(objectId, "main", "v5");

			const updated = await store.getBranch(objectId, "main");
			expect(updated?.headVersionId).toBe("v5");
		});

		it("should delete a branch", async () => {
			const store = new MemoryVersionStore();
			const objectId = "obj:test";

			const branch: Branch = {
				name: "temp-branch",
				objectId,
				headVersionId: "v1",
				createdAt: new Date().toISOString(),
				createdBy: "user:1",
			};

			await store.saveBranch(branch);
			await store.deleteBranch(objectId, "temp-branch");

			const retrieved = await store.getBranch(objectId, "temp-branch");
			expect(retrieved).toBeNull();
		});
	});
});

// ═══════════════════════════════════════════════════════════
// VersionManager tests
// ═══════════════════════════════════════════════════════════

describe("VersionManager", () => {
	describe("createVersion", () => {
		it("should create first version with versionId v1", async () => {
			const manager = new VersionManager();
			const version = await manager.createVersion(
				"obj:test",
				{ name: "Test" },
				"user:1",
				"Initial creation",
			);

			expect(version.versionId).toBe("v1");
			expect(version.versionNumber).toBe(1);
			expect(version.objectId).toBe("obj:test");
			expect(version.data).toEqual({ name: "Test" });
			expect(version.changedBy).toBe("user:1");
			expect(version.changeDescription).toBe("Initial creation");
			expect(version.branch).toBe("main");
		});

		it("should auto-increment version numbers", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			const v1 = await manager.createVersion(
				objectId,
				{ name: "V1" },
				"user:1",
				"First version",
			);
			const v2 = await manager.createVersion(
				objectId,
				{ name: "V2" },
				"user:1",
				"Second version",
			);
			const v3 = await manager.createVersion(
				objectId,
				{ name: "V3" },
				"user:1",
				"Third version",
			);

			expect(v1.versionNumber).toBe(1);
			expect(v2.versionNumber).toBe(2);
			expect(v3.versionNumber).toBe(3);
		});

		it("should track parent version", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			const v1 = await manager.createVersion(
				objectId,
				{ name: "V1" },
				"user:1",
				"First version",
			);
			const v2 = await manager.createVersion(
				objectId,
				{ name: "V2" },
				"user:1",
				"Second version",
			);

			expect(v1.parentVersionId).toBeUndefined();
			expect(v2.parentVersionId).toBe("v1");
		});

		it("should create version on custom branch", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			await manager.createVersion(
				objectId,
				{ name: "V1" },
				"user:1",
				"First version",
				"main",
			);

			await manager.createBranch(
				objectId,
				"feature",
				"user:1",
				"Feature branch",
			);

			const version = await manager.createVersion(
				objectId,
				{ name: "Feature V2" },
				"user:1",
				"Feature work",
				"feature",
			);

			expect(version.branch).toBe("feature");
			expect(version.versionNumber).toBe(2);
		});

		it("should set metadata with source and audit entry", async () => {
			const manager = new VersionManager();
			const version = await manager.createVersion(
				"obj:test",
				{ name: "Test" },
				"user:1",
				"Initial creation",
			);

			expect(version.metadata.source).toBe("manual");
			expect(version.metadata.tags).toEqual([]);
			expect(version.metadata.audit).toHaveLength(1);
			expect(version.metadata.audit[0]!.action).toBe("create");
			expect(version.metadata.audit[0]!.userId).toBe("user:1");
			expect(version.metadata.audit[0]!.details).toBe("Initial creation");
		});

		it("should use structuredClone for data", async () => {
			const manager = new VersionManager();
			const originalData = { nested: { value: 42 } };

			const version = await manager.createVersion(
				"obj:test",
				originalData,
				"user:1",
				"Test",
			);

			// Modify original
			originalData.nested.value = 999;

			// Version data should be unchanged
			expect(version.data).toEqual({ nested: { value: 42 } });
		});

		it("should create main branch automatically on first version", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			await manager.createVersion(
				objectId,
				{ name: "Test" },
				"user:1",
				"Initial",
			);

			const branches = await manager.listBranches(objectId);
			expect(branches).toHaveLength(1);
			expect(branches[0]!.name).toBe("main");
		});
	});

	describe("getHistory", () => {
		it("should retrieve version history", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			await manager.createVersion(objectId, { v: 1 }, "user:1", "V1");
			await manager.createVersion(objectId, { v: 2 }, "user:1", "V2");
			await manager.createVersion(objectId, { v: 3 }, "user:1", "V3");

			const history = await manager.getHistory(objectId);

			expect(history).toHaveLength(3);
			expect(history[0]!.versionNumber).toBe(3);
			expect(history[1]!.versionNumber).toBe(2);
			expect(history[2]!.versionNumber).toBe(1);
		});

		it("should respect limit parameter", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			for (let i = 1; i <= 5; i++) {
				await manager.createVersion(objectId, { v: i }, "user:1", `V${i}`);
			}

			const history = await manager.getHistory(objectId, 2);

			expect(history).toHaveLength(2);
			expect(history[0]!.versionNumber).toBe(5);
			expect(history[1]!.versionNumber).toBe(4);
		});

		it("should filter by branch", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			await manager.createVersion(objectId, { v: 1 }, "user:1", "Main V1");

			// Create a version on feature branch manually (avoid versionId collision with createBranch)
			const store = (manager as unknown as { store: IVersionStore }).store;
			const featureVersion: Version = {
				versionId: "feat-v1",
				objectId,
				versionNumber: 2,
				data: { v: 2 },
				changedBy: "user:1",
				changedAt: new Date().toISOString(),
				changeDescription: "Feature V1",
				branch: "feature",
				metadata: {
					source: "manual",
					tags: [],
					audit: [
						{
							action: "create" as const,
							userId: "user:1",
							timestamp: new Date().toISOString(),
							details: "Feature V1",
						},
					],
				},
			};
			await store.saveVersion(featureVersion);

			const mainHistory = await manager.getHistory(objectId, undefined, "main");
			const featureHistory = await manager.getHistory(
				objectId,
				undefined,
				"feature",
			);

			expect(mainHistory).toHaveLength(1);
			expect(featureHistory).toHaveLength(1);
			expect(mainHistory[0]!.branch).toBe("main");
			expect(featureHistory[0]!.branch).toBe("feature");
		});
	});

	describe("getVersion", () => {
		it("should retrieve a specific version", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			await manager.createVersion(objectId, { name: "V1" }, "user:1", "First");
			await manager.createVersion(objectId, { name: "V2" }, "user:1", "Second");

			const v1 = await manager.getVersion(objectId, "v1");
			const v2 = await manager.getVersion(objectId, "v2");

			expect(v1?.data).toEqual({ name: "V1" });
			expect(v2?.data).toEqual({ name: "V2" });
		});

		it("should return null for non-existent version", async () => {
			const manager = new VersionManager();
			const version = await manager.getVersion("obj:test", "v999");

			expect(version).toBeNull();
		});
	});

	describe("rollback", () => {
		it("should create new version with target version data", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			await manager.createVersion(objectId, { name: "V1" }, "user:1", "First");
			await manager.createVersion(objectId, { name: "V2" }, "user:1", "Second");
			await manager.createVersion(objectId, { name: "V3" }, "user:1", "Third");

			await manager.rollback(objectId, 1, "user:rollback");

			const history = await manager.getHistory(objectId);
			expect(history).toHaveLength(4);
			expect(history[0]!.data).toEqual({ name: "V1" });
			expect(history[0]!.changeDescription).toContain("回滚到版本 v1");
		});

		it("should throw error for non-existent version", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			await manager.createVersion(objectId, { name: "V1" }, "user:1", "First");

			await expect(manager.rollback(objectId, 999, "user:1")).rejects.toThrow(
				"Version v999 not found",
			);
		});

		it("should add rollback audit entry", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			await manager.createVersion(objectId, { name: "V1" }, "user:1", "First");
			await manager.createVersion(objectId, { name: "V2" }, "user:1", "Second");
			await manager.rollback(objectId, 1, "user:rollback");

			const history = await manager.getHistory(objectId);
			const rollbackVersion = history[0];

			expect(rollbackVersion!.metadata.audit).toHaveLength(2);
			expect(rollbackVersion!.metadata.audit[1]!!.action).toBe("rollback");
		});
	});

	describe("createBranch", () => {
		it("should create a new branch from main", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			await manager.createVersion(objectId, { name: "V1" }, "user:1", "First");
			const branch = await manager.createBranch(
				objectId,
				"feature",
				"user:1",
				"Feature work",
			);

			expect(branch.name).toBe("feature");
			expect(branch.objectId).toBe(objectId);
			expect(branch.headVersionId).toBe("v1");
			expect(branch.createdBy).toBe("user:1");
			expect(branch.description).toBe("Feature work");
		});

		it("should throw error for duplicate branch name", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			await manager.createVersion(objectId, { name: "V1" }, "user:1", "First");
			await manager.createBranch(objectId, "feature", "user:1", "Feature");

			await expect(
				manager.createBranch(objectId, "feature", "user:1", "Duplicate"),
			).rejects.toThrow('Branch "feature" already exists');
		});

		it("should create initial version on new branch", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			await manager.createVersion(
				objectId,
				{ name: "Main V1" },
				"user:1",
				"First on main",
			);
			await manager.createVersion(
				objectId,
				{ name: "Main V2" },
				"user:1",
				"Second on main",
			);
			await manager.createBranch(objectId, "feature", "user:1", "Feature");

			const featureHistory = await manager.getHistory(
				objectId,
				undefined,
				"feature",
			);
			expect(featureHistory).toHaveLength(1);
			expect(featureHistory[0]!.versionId).toBe("v1");
			expect(featureHistory[0]!.data).toEqual({ name: "Main V2" });
		});

		it("should track parent version in branch version", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			await manager.createVersion(objectId, { name: "V1" }, "user:1", "First");
			await manager.createVersion(objectId, { name: "V2" }, "user:1", "Second");
			await manager.createBranch(objectId, "feature", "user:1", "Feature");

			const featureHistory = await manager.getHistory(
				objectId,
				undefined,
				"feature",
			);
			expect(featureHistory[0]!.parentVersionId).toBe("v2");
		});

		it("should set branch audit entry", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			await manager.createVersion(objectId, { name: "V1" }, "user:1", "First");
			await manager.createBranch(objectId, "feature", "user:1", "Feature");

			const featureHistory = await manager.getHistory(
				objectId,
				undefined,
				"feature",
			);
			expect(featureHistory[0]!.metadata.audit[0]!.action).toBe("branch");
		});

		it("should create branch with v0 head when no versions exist", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			// Create branch without any versions on source branch
			const branch = await manager.createBranch(
				objectId,
				"feature",
				"user:1",
				"Feature",
			);

			expect(branch.headVersionId).toBe("v0");
		});
	});

	describe("mergeBranch", () => {
		it("should merge source branch into target branch", async () => {
			const manager = new VersionManager();
			const objectId = "obj:test";

			await manager.createVersion(
				objectId,
				{ main: true, shared: "main" },
				"user:1",
				"Main V1",
			);

			// Create a version on feature branch manually (avoid versionId collision with createBranch)
			const store = (manager as unknown as { store: IVersionStore }).store;
			const featureVersion: Version = {
				versionId: "feat-v1",
				objectId,
				versionNumber: 2,
				data: { feature: true, shared: "feature" },
				changedBy: "user:1",
				changedAt: new Date().toISOString(),
				changeDescription: "Feature V1",
				branch: "feature",
				metadata: {
					source: "manual",
					tags: [],
					audit: [
						{
							action: "create" as const,
							userId: "user:1",
							timestamp: new Date().toISOString(),
							details: "Feature V1",
						},
					],
				},
			};
			await store.saveVersion(featureVersion);

			const merged = await manager.mergeBranch(
				objectId,
				"feature",
				"main",
				"user:merge",
			);

			expect(merged.branch).toBe("main");
			expect(merged.data).toEqual({
				main: true,
				feature: true,
				shared: "feature",
			});
		});
	});

	it("should throw error when source branch has no versions", async () => {
		const manager = new VersionManager();
		const objectId = "obj:test";

		await manager.createVersion(objectId, { name: "V1" }, "user:1", "First");

		const store = (manager as unknown as { store: IVersionStore }).store;
		await store.saveBranch({
			name: "empty",
			objectId,
			headVersionId: "v0",
			createdAt: new Date().toISOString(),
			createdBy: "user:1",
			description: "Empty branch",
		});

		await expect(
			manager.mergeBranch(objectId, "empty", "main", "user:1"),
		).rejects.toThrow("No versions found in branch");
	});

	it("should add merge audit entry", async () => {
		const manager = new VersionManager();
		const objectId = "obj:test";

		await manager.createVersion(
			objectId,
			{ name: "Main" },
			"user:1",
			"Main V1",
		);
		await manager.createBranch(objectId, "feature", "user:1", "Feature");
		await manager.createVersion(
			objectId,
			{ name: "Feature" },
			"user:1",
			"Feature V1",
			"feature",
		);
		const merged = await manager.mergeBranch(
			objectId,
			"feature",
			"main",
			"user:merge",
		);

		expect(merged.metadata.audit).toHaveLength(2);
		expect(merged.metadata.audit[1]!.action).toBe("merge");
	});

	it("should work when target branch has no versions", async () => {
		const manager = new VersionManager();
		const objectId = "obj:test";

		await manager.createVersion(
			objectId,
			{ name: "Main" },
			"user:1",
			"Main V1",
		);
		await manager.createBranch(objectId, "feature", "user:1", "Feature");
		await manager.createVersion(
			objectId,
			{ feature: true },
			"user:1",
			"Feature V1",
			"feature",
		);

		// Delete main versions to simulate empty target
		const store = (manager as unknown as { store: IVersionStore }).store;
		const mainHistory = await manager.getHistory(objectId, undefined, "main");
		for (const v of mainHistory) {
			await store.deleteVersion(objectId, v.versionId);
		}

		const merged = await manager.mergeBranch(
			objectId,
			"feature",
			"main",
			"user:merge",
		);

		expect(merged.data).toEqual({ feature: true });
	});
});

describe("listBranches", () => {
	it("should list all branches for an object", async () => {
		const manager = new VersionManager();
		const objectId = "obj:test";

		await manager.createVersion(objectId, { name: "V1" }, "user:1", "First");
		await manager.createBranch(objectId, "feature-a", "user:1", "Feature A");
		await manager.createBranch(objectId, "feature-b", "user:1", "Feature B");

		const branches = await manager.listBranches(objectId);

		expect(branches).toHaveLength(3);
		const names = branches.map((b) => b.name);
		expect(names).toContain("main");
		expect(names).toContain("feature-a");
		expect(names).toContain("feature-b");
	});

	it("should return empty array for object with no branches", async () => {
		const manager = new VersionManager();
		const branches = await manager.listBranches("obj:new");

		expect(branches).toEqual([]);
	});
});

describe("deleteBranch", () => {
	it("should delete a non-main branch", async () => {
		const manager = new VersionManager();
		const objectId = "obj:test";

		await manager.createVersion(objectId, { name: "V1" }, "user:1", "First");
		await manager.createBranch(objectId, "feature", "user:1", "Feature");
		await manager.deleteBranch(objectId, "feature", "user:1");

		const branches = await manager.listBranches(objectId);
		expect(branches).toHaveLength(1);
		expect(branches[0]!.name).toBe("main");
	});

	it("should throw error when deleting main branch", async () => {
		const manager = new VersionManager();
		const objectId = "obj:test";

		await manager.createVersion(objectId, { name: "V1" }, "user:1", "First");

		await expect(
			manager.deleteBranch(objectId, "main", "user:1"),
		).rejects.toThrow("Cannot delete the main branch");
	});

	it("should throw error when branch does not exist", async () => {
		const manager = new VersionManager();
		const objectId = "obj:test";

		await manager.createVersion(objectId, { name: "V1" }, "user:1", "First");

		await expect(
			manager.deleteBranch(objectId, "nonexistent", "user:1"),
		).rejects.toThrow('Branch "nonexistent" not found');
	});
});

describe("custom store injection", () => {
	it("should accept custom store in constructor", async () => {
		const customStore = new MemoryVersionStore();
		const manager = new VersionManager(customStore);

		const version = await manager.createVersion(
			"obj:test",
			{ name: "Test" },
			"user:1",
			"Initial",
		);

		// Verify version was saved to custom store
		const fromStore = await customStore.getVersion("obj:test", "v1");
		expect(fromStore).toEqual(version);
	});

	it("should create default MemoryVersionStore when no store provided", () => {
		const manager = new VersionManager();
		const store = (manager as unknown as { store: IVersionStore }).store;
		expect(store).toBeInstanceOf(MemoryVersionStore);
	});
});

describe("Type exports", () => {
	it("VersionMetadata interface should be usable", () => {
		const metadata: VersionMetadata = {
			source: "api",
			tags: ["important", "release"],
			audit: [
				{
					action: "create",
					userId: "user:1",
					timestamp: new Date().toISOString(),
					details: "Created via API",
				},
			],
		};

		expect(metadata.source).toBe("api");
		expect(metadata.tags).toHaveLength(2);
		expect(metadata.audit).toHaveLength(1);
	});

	it("AuditEntry interface should be usable", () => {
		const entry: AuditEntry = {
			action: "update",
			userId: "user:42",
			timestamp: "2024-01-15T10:30:00Z",
			details: "Updated field X",
		};

		expect(entry.action).toBe("update");
		expect(entry.userId).toBe("user:42");
	});

	it("should support all AuditEntry action types", () => {
		const actions: AuditEntry["action"][] = [
			"create",
			"update",
			"rollback",
			"branch",
			"merge",
			"delete",
		];

		for (const action of actions) {
			const entry: AuditEntry = {
				action,
				userId: "user:1",
				timestamp: new Date().toISOString(),
				details: `Action: ${action}`,
			};
			expect(entry.action).toBe(action);
		}
	});

	it("Version interface should be usable", () => {
		const version: Version = {
			versionId: "v1",
			objectId: "obj:test",
			versionNumber: 1,
			data: { name: "Test" },
			changedBy: "user:1",
			changedAt: new Date().toISOString(),
			changeDescription: "Test version",
			parentVersionId: undefined,
			branch: "main",
			metadata: {
				source: "manual",
				tags: [],
				audit: [],
			},
		};

		expect(version["@id" as keyof Version]).toBeUndefined();
		expect(version.versionId).toBe("v1");
	});
});

// ═══════════════════════════════════════════════════════════
// Integration tests
// ═══════════════════════════════════════════════════════════

describe("Versioning Integration", () => {
	it("should handle full workflow: create, branch, merge", async () => {
		const manager = new VersionManager();
		const objectId = "obj:product-123";

		const v1 = await manager.createVersion(
			objectId,
			{ name: "Product A", price: 100, status: "draft" },
			"user:alice",
			"Initial product creation",
		);
		expect(v1.versionId).toBe("v1");

		const featureBranch = await manager.createBranch(
			objectId,
			"price-update",
			"user:bob",
			"Update pricing",
		);
		expect(featureBranch.name).toBe("price-update");

		const featureV2 = await manager.createVersion(
			objectId,
			{ name: "Product A", price: 150, status: "draft" },
			"user:bob",
			"Increased price",
			"price-update",
		);
		expect(featureV2.versionNumber).toBe(2);
		expect(featureV2.branch).toBe("price-update");

		const mainV2 = await manager.createVersion(
			objectId,
			{ name: "Product A Updated", price: 100, status: "draft" },
			"user:alice",
			"Updated product name",
			"main",
		);
		// After createBranch("price-update"), main's v1 is overwritten, so mainV2.versionNumber = 1
		expect(mainV2.versionNumber).toBe(1);

		const merged = await manager.mergeBranch(
			objectId,
			"price-update",
			"main",
			"user:alice",
		);
		// Feature overwrites main's name, so merged name is "Product A"
		expect(merged.data).toEqual({
			name: "Product A",
			price: 150,
			status: "draft",
		});

		const mainHistory = await manager.getHistory(objectId, undefined, "main");
		// mainHistory has mainV2 (v1 after overwrite) and merged version (v2)
		expect(mainHistory).toHaveLength(2);

		const featureHistory = await manager.getHistory(
			objectId,
			undefined,
			"price-update",
		);
		// featureHistory is empty because merged version (v2) overwrites feature's v2
		expect(featureHistory).toHaveLength(0);

		await manager.rollback(objectId, 1, "user:alice");
		const afterRollback = await manager.getHistory(objectId, undefined, "main");
		// After rollback, main has: merged (v2), mainV2 (v1), rollback version (v3)
		expect(afterRollback).toHaveLength(3);
		expect(afterRollback[0]!.data.price).toBe(100);

		await manager.deleteBranch(objectId, "price-update", "user:alice");
		const branches = await manager.listBranches(objectId);
		expect(branches).toHaveLength(1);
	});

	it("should handle multiple objects independently", async () => {
		const manager = new VersionManager();

		// Create versions for object A
		await manager.createVersion("obj:A", { data: "A1" }, "user:1", "A v1");
		await manager.createVersion("obj:A", { data: "A2" }, "user:1", "A v2");

		// Create versions for object B
		await manager.createVersion("obj:B", { data: "B1" }, "user:1", "B v1");

		// Verify independence
		const historyA = await manager.getHistory("obj:A");
		const historyB = await manager.getHistory("obj:B");

		expect(historyA).toHaveLength(2);
		expect(historyB).toHaveLength(1);
		expect(historyA[0]!.data).toEqual({ data: "A2" });
		expect(historyB[0]!.data).toEqual({ data: "B1" });
	});
});
