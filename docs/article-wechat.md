# @ontograph/core 公众号文章

---

## 候选标题

| 序号 | 标题 | 风格 |
|------|------|------|
| A | Palantir 同款能力开源了！这个 TypeScript 本体框架，让知识图谱开发效率提升 10 倍 | 爆款引流 |
| B | 告别 XML 和 Turtle！用 TypeScript 定义本体，一份代码生成 6 种标准格式 | 技术直击 |
| C | 350+ 预定义供应链概念，一个依赖走天下：这个开源本体框架太炸了 | 数据冲击 |
| D | 企业知识图谱太难搞？10 行代码生成 OWL + SHACL + Neo4j DDL | 场景痛点 |
| E | 对标 Palantir Ontology，MIT 开源：@ontograph/core 到底有多香 | 对标引流 |

> **推荐标题 B** — 技术号定位，直击痛点，不夸张但有吸引力。

---

## 正文

> 【封面图建议】深色科技风背景，左侧代码编辑器（定义本体的 TypeScript 代码），右侧自动生成的 Mermaid 知识图谱可视化，中间用箭头连接，形成"代码 → 图表"的视觉冲击。

---

### 一、一个让架构师头疼的问题

你有没有遇到过这种场景？

公司要做供应链数字化平台，需要把"仓库、产品、订单、承运商、物流路线"这些业务概念建模成结构化的数据模型，还要能跟上下游系统对接。

听起来不复杂对吧？

但当你的业务专家说"我们要支持 OWL 标准导出，客户要对接他们的知识图谱系统"的时候，事情就开始变得诡异了。

你得去学 RDF、OWL 2、Turtle 语法、SPARQL 查询……一套 W3C 标准学下来，头发少了三成。打开 Protégé 编辑器，满屏的 XML 和三元组，产品经理看一眼就想走人。

更离谱的是，好不容易写完 OWL 本体，你发现：

- 前端要用 **JSON Schema** 校验表单输入
- 后端要用 **Neo4j** 存图数据库
- 运维要看 **Mermaid** 可视化
- 数据质量团队要用 **SHACL** 做校验

于是你又要手动写四套不同格式的 Schema。每个格式的字段定义还得手动保持同步。改一个属性，六个地方跟着改。

**这不是效率问题，这是灾难。**

今天要介绍的这个开源项目，就是来解决这件事的。

它叫 **@ontograph/core**，一个 TypeScript 原生的本体论框架。用纯 TypeScript 代码定义你的业务模型，然后一键生成 6 种标准格式：

> OWL 2 · SHACL · JSON Schema · Mermaid · Graphviz DOT · Neo4j Cypher DDL

对，你没看错。**一份代码，六份输出。**

而且，整个运行时只有一个外部依赖：**zod**。

---

### 二、10 秒钟，感受一下 Wow Moment

不废话，先看代码：

```typescript
import {
  defineEntity,
  defineRelation,
  MermaidExporter,
  OWLExporter,
  SHACLExporter,
  JsonSchemaExporter,
  Neo4jSchemaGenerator,
} from "@ontograph/core";

// 用 Builder API 定义一个"仓库"实体
const warehouse = defineEntity("sc:Warehouse", {
  label: { en: "Warehouse", zh: "仓库" },
  kind: "entity",
})
  .attr("sc:capacity", { required: true })   // 容量，必填
  .attr("sc:location", { required: true })   // 位置，必填
  .rel("sc:stores", { min: 0, max: null })   // 存储关系：0~无限个产品
  .constraint("sc:PositiveCapacity")         // 约束：容量必须为正
  .build();

// 定义一个"产品"实体
const product = defineEntity("sc:Product", {
  label: { en: "Product", zh: "产品" },
  kind: "entity",
})
  .attr("sc:sku", { identity: true, required: true })
  .attr("sc:weight", { required: false })
  .build();

// 定义关系：产品"存储在"仓库
const storedIn = defineRelation(
  "sc:storedIn",
  { label: { en: "stored in" } },
  "sc:Product",
  "sc:Warehouse",
);
```

这段代码做了什么？用流畅的链式调用定义了一个完整的供应链子模型：两个实体 + 一个关系，带约束、带多语言标签、带必填校验。

然后，见证奇迹的时刻：

```typescript
new MermaidExporter(ontology).export();           // 📊 Mermaid classDiagram
new OWLExporter(ontology).export();               // 🦉 OWL 2 Turtle（W3C 标准）
new SHACLExporter(ontology).export();             // ✅ SHACL Shapes（W3C 校验）
new JsonSchemaExporter(ontology).exportString();  // 📋 JSON Schema 2020-12
new DotExporter(ontology).export();               // 🔵 Graphviz DOT
new Neo4jSchemaGenerator().generateConstraintCypher(entities); // 🗄️ Neo4j DDL
```

六行代码，六种格式，全部从同一份 TypeScript 定义生成。

改一个属性，六份输出自动同步。再也不会出现"OWL 里改了字段、JSON Schema 忘了改"的低级错误。

这就是 @ontograph/core 的核心理念：

> **用代码定义你的世界，让工具处理格式。**

---

### 三、核心特性拆解

光有 Builder API 和多格式导出还不够。作为一个面向企业级场景的本体框架，@ontograph/core 准备了一整套武器库。

#### 特性 1：类型安全的本体建模

传统的 OWL 建模工具（比如 Protégé）给你的体验是：写 XML，运行时才发现拼错了属性名。

@ontograph/core 完全不同。它用 TypeScript 的 Builder API 做建模，所有实体、关系、属性、约束都有完整的类型推导。

```typescript
const warehouse = defineEntity("sc:Warehouse", {
  label: { en: "Warehouse" },
  kind: "entity",
})
  .attr("sc:capacity", { identity: false, required: true })
  .attr("sc:location", { required: true })
  .rel("sc:stores", { min: 0, max: null })
  .constraint("sc:PositiveCapacity")
  .implements("scm:TraceableItem")   // 实现接口
  .ui({ color: "#2E7D32", icon: "warehouse" })  // UI 配置
  .build();
```

这意味着什么？你的 IDE 会帮你自动补全属性名。拼错了一个字段，编译器直接报错，不用等到运行时才发现问题。

Builder API 支持：

| 方法 | 作用 |
|------|------|
| `.attr()` | 添加属性（支持必填、唯一标识、默认值、正则校验） |
| `.rel()` | 添加关系（支持基数约束 min/max） |
| `.constraint()` | 添加业务约束 |
| `.implements()` | 实现接口 |
| `.extends()` | 继承父实体 |
| `.ui()` | 配置可视化样式（颜色、图标） |

链式调用读起来就像自然语言。而且每个定义都支持多语言标签（`label: { en: "Warehouse", zh: "仓库" }`），对于有国际化需求的企业场景，这是刚需。

#### 特性 2：Expr AST 安全求值，零 eval

很多业务规则引擎在执行表达式的时候，底层用的是 `eval()` 或者 `new Function()`。这在企业环境中是不可接受的安全隐患。

@ontograph/core 自己实现了一套 **Expr AST（抽象语法树）求值器**。所有表达式都是结构化的 JSON 对象，通过纯函数递归求值，完全不碰 eval。

```typescript
import { SafeExpressionEvaluator } from "@ontograph/core";

const evaluator = new SafeExpressionEvaluator();

const expr = {
  type: "compare",
  op: "gt",
  left: { type: "property", path: "quantity" },
  right: { type: "literal", value: 100 },
};

const result = evaluator.evaluate(expr, { quantity: 150 });
// → true
```

安全机制有多硬核？

- **递归深度限制**：最大 50 层，防止恶意嵌套攻击
- **原型污染黑名单**：拦截 `__proto__`、`constructor`、`prototype` 等危险属性
- **空值安全**：所有属性路径访问都做了 null/undefined 安全处理
- **LRU 缓存**：热点表达式自动缓存，性能无忧

换句话说，就算有人精心构造了一个恶意表达式塞进你的系统，它也翻不出什么浪花。

#### 特性 3：6 种格式，一键导出

这个前面已经演示过了，但值得再说一遍，因为它真的太方便了。

| 导出格式 | 标准 | 用途 |
|----------|------|------|
| **OWL 2 Turtle** | W3C | 导入 Apache Jena、Virtuoso 等三元组存储 |
| **SHACL Shapes** | W3C | 验证数据实例是否符合本体约束 |
| **JSON Schema 2020-12** | IETF | 前端 React/Vue 表单校验 |
| **Mermaid classDiagram** | 社区 | 贴进 GitHub README 自动渲染 |
| **Graphviz DOT** | 社区 | 学术论文、技术文档插图 |
| **Neo4j Cypher DDL** | Neo4j | 直接在 Neo4j 里跑约束语句 |

六种格式，覆盖了语义网标准、前端校验、图数据库、技术文档可视化四大场景。

#### 特性 4：RBAC 访问控制，deny-first

企业系统怎么能没有权限控制？@ontograph/core 内置了完整的 **RBAC（基于角色的访问控制）** 引擎，采用 **deny-first** 策略。

什么意思？如果一条规则显式 deny 了某个操作，那其他所有 allow 规则都不会生效。**deny 永远优先。**

```typescript
import { AccessController } from "@ontograph/core";

const ac = new AccessController({ defaultPolicy: "deny" });

ac.registerRoles([{
  "@id": "role:warehouse-manager",
  label: { en: "Warehouse Manager" },
  rules: [
    { resource: "objectType", resourceRef: "*",
      permissions: ["view", "create", "edit"], effect: "allow" },
    { resource: "objectType", resourceRef: "sc:Warehouse",
      permissions: ["delete"], effect: "deny" },
  ],
}]);

// ✅ 仓库经理可以编辑仓库
ac.check("user:1", ["role:warehouse-manager"], "edit", "objectType", "sc:Warehouse");
// → { allowed: true }

// ❌ 但不能删除仓库
ac.check("user:1", ["role:warehouse-manager"], "delete", "objectType", "sc:Warehouse");
// → { allowed: false, reason: "Explicitly denied by rule" }
```

这是安全领域的最佳实践——**最小权限原则**。先把所有操作设为 deny，然后按需开放 allow。

而且它还支持**行级安全（row-level security）**，可以根据上下文条件过滤用户可见的数据行。不是简单的"能不能访问这个资源"，而是"能访问这个资源的哪些数据"。

#### 特性 5：规则引擎 + 动作引擎

除了静态的本体定义，@ontograph/core 还支持动态的业务规则和执行动作。

**规则引擎**采用 Expr 优先求值策略，支持触发式自动推理：

```typescript
import { RuleEngine } from "@ontograph/core";

const engine = new RuleEngine();

// 当库存低于阈值时，自动触发补货告警
engine.register({
  condition: {
    type: "compare",
    op: "lt",
    left: { type: "property", path: "inventory.quantity" },
    right: { type: "literal", value: 10 },
  },
  action: { type: "alert", message: "库存不足，请补货！" },
});
```

**动作引擎**支持审批策略、审计追踪和副作用执行：

```typescript
import { ActionEngine } from "@ontograph/core";

const actionEngine = new ActionEngine();

// 执行删除操作，自动记录审计日志
actionEngine.execute({
  type: "delete",
  target: "sc:Warehouse/WH1",
  requiresApproval: true,
});
```

规则 + 动作的组合，让本体从"静态的知识模型"升级为"动态的业务引擎"。

#### 特性 6：350+ 供应链参考本体

这一条可能是 @ontograph/core 最让人惊喜的部分。

它内置了一个完整的**供应链参考本体**，包含：

| 类型 | 数量 |
|------|------|
| 实体类型 | 69 个（仓库、产品、订单、承运商、车辆、路线……） |
| 事件类型 | 43 个（入库、出库、发货、签收、退货……） |
| 角色类型 | 6 个 |
| 关系定义 | 92 个 |
| 属性定义 | 156 个 |
| 值类型（枚举） | 18 个 |
| 约束规则 | 19 个 |
| 视图定义 | 9 个 |

加起来超过 **350 个预定义概念**，覆盖了 TMS（运输管理）、WMS（仓库管理）、OMS（订单管理）、BMS（计费管理）四大供应链子系统。

这意味着什么？如果你在做供应链相关的项目，不用从零开始建模。直接 import 进来，在此基础上扩展就行。

```typescript
import { supplyChainOntology } from "@ontograph/core";

// 直接拿到 350+ 预定义的供应链本体
console.log(supplyChainOntology.entityTypes.length);    // 69
console.log(supplyChainOntology.relationTypes.length);  // 92+
```

站在巨人的肩膀上，省下至少两周的建模工作。

#### 特性 7：版本管理 + 结构 Diff + 血缘追踪

企业级本体不是一成不变的。@ontograph/core 提供了一整套本体生命周期管理工具：

- **VersionManager**：本体版本化管理，记录每次变更
- **DiffEngine**：结构性差异比较，清晰展示两个版本之间的增删改
- **LineageTracker**：数据血缘追踪，从数据源到实体的完整溯源链路

```typescript
import { VersionManager, DiffEngine, LineageTracker } from "@ontograph/core";

// 版本管理
const vm = new VersionManager();
vm.save(ontology, "v1.0", "Initial supply chain ontology");
vm.save(ontologyV2, "v1.1", "Added carrier and route entities");

// 结构 Diff
const diff = new DiffEngine().diff(v1, v2);
console.log(diff.added);   // 新增的实体/关系/属性
console.log(diff.removed); // 删除的内容
console.log(diff.modified); // 修改的内容

// 血缘追踪
const tracker = new LineageTracker();
tracker.trace("sc:Product/P1001");
// → 返回从数据源到该实体的完整血缘链路
```

---

### 四、架构设计：六层架构，各司其职

@ontograph/core 的内部架构分成了六层，每一层职责清晰，互不耦合。

```
@ontograph/core
│
├── 📐 建模层（Modeling Layer）
│   ├── types.ts          核心类型定义
│   ├── builder/          Fluent Builder API
│   └── validator.ts      本体校验
│
├── ⚡ 执行层（Execution Layer）
│   ├── expression/       Expr AST + 安全求值器（LRU 缓存）
│   ├── rule-engine.ts    规则引擎（Expr 优先）
│   └── action-engine.ts  动作引擎（审批 + 审计）
│
├── 🔍 查询层（Query Layer）
│   ├── query/            FilterOp → ObjectSet → Cypher
│   └── datasource/       数据源映射 + SyncEngine
│
├── 🛡️ 安全层（Security Layer）
│   └── security/         RBAC AccessController（deny-first）
│
├── ✅ 标准层（Standards Layer）
│   ├── validation/       W3C SHACL 生成 + 校验
│   └── exporters/        OWL 2 · SHACL · Mermaid · DOT · ER · JSON Schema
│
└── 🔧 工具层（Tooling）
    ├── codegen/          TypeScript 类型生成
    ├── versioning.ts     版本管理
    ├── diff.ts           结构性 Diff
    └── lineage.ts        血缘追踪
```

六层架构的好处是什么？

**每一层都可以独立测试、独立替换。** 你不用 SHACL 校验？没关系，不影响其他功能。你不用 Neo4j？查询层可以换成别的后端。模块化设计，按需使用。

---

### 五、跟 Palantir Ontology 和 OWL API 的对比

聊了这么多特性，来点横向对比，看看 @ontograph/core 在生态里的位置。

| 特性 | @ontograph/core | Palantir Ontology | OWL API (Java) |
|------|:-:|:-:|:-:|
| 语言 | TypeScript | TypeScript（闭源） | Java |
| 开源 | ✅ MIT | ❌ | ✅ |
| 类型安全 | ✅ 编译期 | ✅ | ❌ 运行时 |
| 安全求值 | ✅ Expr AST | ✅ | N/A |
| SHACL | ✅ | ❌ | ✅ |
| OWL 导出 | ✅ | ❌ | ✅ |
| JSON Schema 导出 | ✅ | ❌ | ❌ |
| Mermaid 可视化 | ✅ | ❌ | ❌ |
| Builder API | ✅ | ✅ | ❌ |
| RBAC | ✅ | ✅ | ❌ |
| Neo4j 集成 | ✅ | ❌ | ❌ |
| 规则引擎 | ✅ | ✅ | ❌ |
| 动作引擎 | ✅ | ✅ | ❌ |
| 运行时依赖 | zod | 数十个 | 重量级 |

**Palantir Ontology** 是 Palantir Foundry 平台的核心组件，功能强大但完全闭源。你要用它，得先签 Palantir 的企业合同。而且 Palantir 不支持 SHACL 和 OWL 导出，也没有 Mermaid 可视化，不跟 Neo4j 集成。

**OWL API** 是 Java 生态的标准库，功能全面但对 TypeScript/JavaScript 开发者不友好。没有 Builder API，类型安全在运行时才检查，没有内置 RBAC，没有可视化导出，依赖链也很重。

@ontograph/core 的定位很清晰：

> **给开源世界的 Palantir Ontology。**

Palantir 有的核心能力，@ontograph/core 开源给你了；OWL API 的笨重，@ontograph/core 用 TypeScript 原生体验解决了。

---

### 六、适用场景

@ontograph/core 能用在哪些地方？

**场景 1：知识图谱开发**

如果你在做企业知识图谱，需要定义实体和关系的本体模型，还要能导出 OWL 和 RDF 格式跟其他系统对接，@ontograph/core 是天然的选择。一份 TypeScript 定义，同时生成语义网标准和图数据库 DDL。

**场景 2：企业数据治理**

企业级数据中台需要统一的数据模型定义。用 @ontograph/core 定义核心实体和关系，生成 JSON Schema 给前端做校验，生成 SHACL 给数据质量平台做校验，生成 Mermaid 给数据资产目录做可视化。**一套定义，多处复用。**

**场景 3：供应链管理**

这是 @ontograph/core 的"主场"。350+ 预定义供应链概念，覆盖 TMS/WMS/OMS/BMS。如果你在做 ERP、WMS、TMS 相关的系统，可以直接用这些预定义概念，或者在此基础上扩展。

**场景 4：合规校验与规则引擎**

Expr AST 安全求值 + SHACL 校验 + RBAC 访问控制，三者组合起来，可以搭建一套完整的合规校验系统。业务规则用结构化表达式定义，权限用 RBAC 控制，数据质量用 SHACL 校验。

**场景 5：API Schema 生成**

微服务架构下，每个服务都需要 API Schema。用 @ontograph/core 统一定义领域模型，生成 JSON Schema，配合 OpenAPI/Swagger 使用，保证 API 定义和本体模型的一致性。

---

### 七、上手只需要一行命令

看到这里，如果你觉得"这个东西有点意思"，上手非常简单：

```bash
npm install @ontograph/core
# 或者
bun add @ontograph/core
```

整个包只有一个运行时依赖：zod。安装快，不臃肿。

```bash
# 开发命令
bun run typecheck   # 类型检查
bun run build       # 构建
bun run test        # 运行测试
bun run lint:fix    # 自动修复代码
```

GitHub 仓库：https://github.com/openshuyi/ontograph-core

npm 包：https://www.npmjs.com/package/@ontograph/core

欢迎 star、fork、提 issue。**MIT 协议，随便用。**

---

### 八、写在最后

知识图谱和本体建模，长期以来都是"学术界味太重，工业界用不动"的领域。W3C 标准虽然完善，但学习曲线陡峭，工具链笨重，导致很多团队望而却步。

@ontograph/core 想做的，是把本体建模的门槛打下来。

用你最熟悉的 TypeScript，用你最习惯的 Builder API，用你每天都在用的 IDE 自动补全，把复杂的本体建模变成写业务代码一样自然。

然后，一键生成你需要的所有标准格式。

> OWL 给语义网用，SHACL 给校验用，JSON Schema 给前端用，Mermaid 给文档用，Neo4j DDL 给图数据库用。

**一份代码，六份输出。** 这不是效率工具，这是思维方式的改变。

如果这篇文章让你对本体建模有了新的想法，去 GitHub 给 @ontograph/core 点个 star 吧。开源项目需要你的支持才能走得更远。

---

**项目信息**

| 项目 | 内容 |
|------|------|
| GitHub | https://github.com/openshuyi/ontograph-core |
| npm | @ontograph/core |
| 协议 | MIT |
| 版本 | 0.0.1（2026-04-17 首发） |
| 运行时依赖 | zod（唯一） |
| 预置本体 | 350+ 供应链概念 |

> 🔧 准备好了？打开终端，`npm install @ontograph/core`，开始用代码定义你的世界。
