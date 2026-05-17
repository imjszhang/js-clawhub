# 上游 PR 分支隔离与插件架构解耦实战

> Day 50 · 2026-03-21

今天面对上游贡献与本地定制线的冲突，我彻底放弃了直接 Merge 的惰性操作，转而实施「独立分支隔离 + Cherry-pick 回合并」的精准策略；同时在插件核心层，强制将 `types.ts` 的契约声明与 `registry.ts` 的装配逻辑物理拆分，以构建更安全的运行时边界。

## 上游 PR 贡献必须采用「独立分支隔离 + Cherry-pick 回合并」策略以规避定制线冲突

在向 `openclaw/openclaw` 官方仓库提交 ACP 插件 API 的 PR（#51187）时，我严格遵循了基于 `source/main` 创建独立分支 `feat/plugin-types-registry` 的原则，坚决避免使用我 fork 中的长期开发分支 `js-clawhub` 直接发起请求，以确保上游维护者评审基线的纯净。

然而，真正的挑战出现在将改动合回本地 `js-clawhub` 分支时。起初我尝试直接 `git merge`，结果在 `src/extensionAPI.ts` 等与本次 ACP 改动无关的文件上爆发了大量的 `add/add` 冲突——这是因为我的 fork 长期线已经积累了大量不同于上游 main 的定制差异。

我立即中止了合并操作（`git merge --abort`），果断改用 `git cherry-pick` 仅提取那个包含插件改动的特定提交。这一决策成功将三处核心文件（`types.ts`, `registry.ts`, `test/helpers/extensions/plugin-api.ts`）的改动精准落地，完全规避了无关差异带来的合并成本。这也验证了在「PR 基线已是 upstream main 而 fork 另有大量定制」的场景下，独立分支配合 Cherry-pick 是维持代码库信噪比的最佳实践。

## 插件注册表架构必须严格分离「类型契约声明」与「运行时装配逻辑」并实施细粒度权限控制

在代码结构层面，今天我将插件系统的核心彻底拆解为 `src/plugins/types.ts` 和 `src/plugins/registry.ts` 两个模块，明确了「定规矩」与「执行规矩」的边界。`types.ts` 专注于声明 `OpenClawPluginApi` 接口、`PluginRegistrationMode` 枚举（full/setup-only/setup-runtime）以及 `ProviderPlugin` 的能力面，确保 loader 和 hooks 模块只需依赖类型定义而无须卷入运行时逻辑。

`registry.ts` 则承担了所有带有副作用的装配工作。我在此实现了严格的路由冲突检测机制：当新注册的 HTTP 路由与现有路由重叠且 auth 类型不一致，或试图抢占其他插件已占用的路径时，注册会被直接拒绝并写入 `diagnostics`。特别是在安全防御上，针对 `allowPromptInjection === false` 的配置，我在 `before_agent_start` Hook 上包裹了一层约束逻辑，强制调用 `stripPromptMutationFieldsFromLegacyHookResult` 剥离危险字段，仅保留模型覆盖等非改写结果。

此外，针对快照加载场景，我引入了 `suppressGlobalCommands` 标志。当该标志为 true 时，命令注册仅在校验后记入本地 registry，绝不污染正在运行的全局命令表。这种细粒度的权限控制和职责剥离，有效防止了全局副作用的误触，为插件化扩展构建了可信的运行时环境。

## 今天的收获

- **分支策略升级**：向上游提 PR 必须基于 `source/main` 建独立分支，合回本地定制线时严禁直接 Merge，应改用 `git cherry-pick` 提取特定提交以消除无关冲突。
- **架构职责分离**：将插件系统的「类型契约」（types.ts）与「注册装配」（registry.ts）物理拆分，可显著清晰化模块依赖边界，便于单元测试与静态分析。
- **运行时安全防线**：通过 `PluginRegistrationMode` 控制副作用范围，并利用 `stripPromptMutationFields` 在禁止提示注入时强制清洗 Hook 返回结果，是防止安全漏洞的关键。
- **路由冲突检测**：在注册表层面实施严格的路径重叠与 Auth 一致性校验，并禁止插件间互相抢占路由，是维持网关稳定性的必要手段。
- **快照隔离机制**：利用 `suppressGlobalCommands` 标志在快照加载场景下隔离全局命令表，避免了非激活状态下的配置污染。

- [G72: 上游 PR 贡献必须采用「独立分支隔离 + Cherry-pick 回合并」策略以规避定制线冲突](./groups/G72.md)
- [G73: 插件注册表架构必须严格分离「类型契约声明」与「运行时装配逻辑」并实施细粒度权限控制](./groups/G73.md)
