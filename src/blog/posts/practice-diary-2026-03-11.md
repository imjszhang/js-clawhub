# 从手动触发到无人值守：知识棱镜全链路自动化与可靠性架构升级

> Day 40 · 2026-03-11

今天的核心任务是攻克知识棱镜（js-knowledge-prism）从“可记录”迈向“可教学”的最后一公里：将原本依赖人工干预的 Structure 刷新与 Output 生成环节，重构为完全无人值守的自动化闭环，并针对 v1.3.0 版本暴露出的崩溃无恢复、单点故障等可靠性短板进行纵深防御加固。

## 双 Cron 分段驱动与 mtime 双层检测架构

面对 journal → synthesis → structure → output 的三段式链路，我最初纠结于是为后两段分别设立独立的 Cron 任务，还是将其整合。经过推演，独立方案虽然逻辑清晰，但会引入复杂的时序同步问题——Structure 刷新的唯一目的本就是为 Output 生成做准备，强行拆分只会增加配置负担且容易出错。

最终我决定采用“整合方案”，将原有的单 Cron 架构升级为“双 Cron 分段驱动”：
1.  **prism-auto-process**（每 60 分钟）：负责前段链路，将 journal 转化为 atoms、groups 并合成 synthesis.md，若有变化则向 `output-inbox.jsonl` 追加信号。
2.  **prism-auto-output**（每 120 分钟）：负责后段链路，整合了 Structure 刷新与 Output 生成。

为了实现精准的触发而非盲目全量运行，我设计了 **mtime 双层检测策略**：
*   **Phase 1**：对比 `synthesis.md` 及 `groups/` 目录的修改时间（mtime）与注册表中的 `lastStructureRefreshAt`。若有变化，自动执行 `fill_perspective`（SCQA + Key Lines）和 `expand_kl`。
*   **Phase 2**：对比 `structure/<perspective>/` 目录的 mtime 与 `lastOutputAt`。若有变化，调用 `runOutput` 生成最终文章。

这一架构让用户只需完成注册、绑定配置及设置两个定时任务，即可实现从笔记写入到成品文章生成的全自动流转。

## 差异化刷新策略：解决日记型视角的破坏性更新

在实现自动化过程中，我发现原有的 `refreshStructure: boolean` 二元开关存在严重隐患。对于 P01（方法论）或 P24（架构）这类论点型视角，全量重生成 SCQA 和 Key Lines 是安全的；但对于 P23（实践日记）这种拥有 19 个按时间序列排列的 Key Lines 的视角，全量重生成会直接摧毁已有的日期结构。

为此，我废弃了简单的布尔开关，引入了 **`klStrategy` 策略化机制**，支持三种模式：
*   **`synthesis`**（默认）：适用于论点型视角，全量重生成 SCQA、KL 表格及展开内容。
*   **`date-driven`**：专为日记型视角设计。系统会扫描 `journal/` 目录获取新日期，比对已注册 KL，仅针对有对应 atoms 和 groups 的新日期追加 KL 行并执行展开，完全不动原有的 SCQA 和历史 KL。
*   **`manual`**：适用于 P25 等手工策划型视角，完全跳过自动刷新。

通过提取 `refreshByStrategy()` 公共函数，我消除了 batch 路径与 mtime fallback 路径中约 90 行的重复代码，确保了不同视角在自动化链路中的安全性。

## Inbox/Batch 轮转与逐步 Checkpoint 的可靠性防线

v1.3.0 版本的 `output_all` 存在三大致命短板：进程中断后工作全部丢失、单个 Key Line 失败导致整个流程中断、以及 Process 与 Output 之间缺乏精确通信。为了解决这些问题，我借鉴了 `js-knowledge-collector` 的生产消费分离模式，构建了高可用的异步流水线。

新的 **Inbox/Batch 轮转机制** 工作流程如下：
1.  **生产端**：`process_all` 在检测到变化时，仅向 `output-inbox.jsonl` 追加包含 `baseDir`、原因和时间戳的轻量信号。
2.  **消费端**：`output_all` 启动时，优先检查是否有未完成的残留 batch 文件以实现**断点续传**；若无，则将 inbox 原子重命名为新的 `output-batch-<ts>.json` 进行处理。
3.  **逐步 Checkpoint**：在处理 batch 时，每完成一个 Key Line 的输出即刻更新 checkpoint。即使进程意外崩溃，重启后也能跳过已完成项，避免重复劳动。
4.  **失败隔离与重试**：单个 KL 的失败被记录为 `retry` 状态并存入 registry，不会阻断同批次其他 KL 的处理。系统会在后续 Cron 周期自动重试（上限 3 次），超过限制则标记为 `permanently_failed` 等待人工介入。

此外，我还修复了一个隐蔽的 Cron 表达式溢出问题：当间隔大于 60 分钟时（如 120 分钟），直接使用 `*/120` 是非法的。我提取了 `minutesToCronExpr` 工具函数，自动将其转换为合法的小时粒度表达式（如 `0 */2 * * *`）。

## 今天的收获

- **架构分层分离原则**：将紧密耦合的下游任务（Structure 刷新与 Output 生成）整合为单一 Cron 任务，利用天然的上下游依赖关系消除时序同步难题，比拆分为多个独立任务更稳健。
- **策略化替代二元开关**：在自动化系统中，用枚举策略（如 `date-driven` vs `synthesis`）替代简单的布尔开关，能有效适配不同业务场景（如时间序列 vs 论点结构）的差异化需求，避免破坏性更新。
- **生产消费分离模式**：引入 `inbox`（只追加）到 `batch`（原子重命名消费）的轮转机制，是解决上游产出与下游加工异步解耦、实现崩溃恢复的标准范式。
- **逐步 Checkpoint 的价值**：在长链路自动化中，“每步写入”比“全部完成再写入”的可靠性高出一个数量级，其代价仅仅是少量的额外 I/O，却是断点续传的基础。
- **Cron 表达式的边界处理**：编写定时任务配置工具时，必须处理分钟字段的上限（59），将大间隔自动转换为小时粒度表达式，防止生成非法 Cron 配置。

- [G59: 知识棱镜全链路自动化需采用"双 Cron 分段驱动 + mtime 双层检测"架构以消除手动干预并保障时序一致性](./groups/G59.md)
- [G60: Output Cron 可靠性优化需采用"inbox/batch 轮转 + 逐步 Checkpoint + 失败隔离”架构以消除单点故障](./groups/G60.md)
