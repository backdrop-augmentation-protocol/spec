# BAP 0.2.0 草案：桌面组件组合扩展

状态：实现草案，尚未冻结或发布。本草案增量扩展 BAP Core 0.1.0，不修改已发布的 `versions/0.1.0/` 快照。

## 1. 范围与原则

本草案定义组件实例、布局、声明式组件属性、呈现状态和 Companion 到 Host 的预设同步等可选扩展。用户选择的本地媒体不纳入 BAP 0.2.0，也不作为验收或发行门禁。

- Host 拥有组件实例、布局计算、渲染容器和最终呈现状态。
- Component 拥有自身内容、业务状态和声明式配置属性。
- Companion 拥有已保存预设及用户编辑的配置，并同步至已授权的活动 Host；不负责渲染组件。
- 未协商扩展时，Core 0.1.0 行为仍可用。
- 扩展可选且独立版本化；不得根据产品版本或无关能力推断扩展支持。

## 2. 扩展协商

Core 消息封套和协议版本保持不变。Host 可在 `hello.payload` 中附带可选的 `extensions` 数组；对端可在成功的 `helloAck.result` 中附带 `selectedExtensions`。Host 与 Companion 会话采用相同约定。这些字段放在可扩展的 payload/result 中，不新增 Core 封套字段。

Host 提供 `org.bap.composition` 时，必须在 `hello.payload` 中包含活动 `instanceId`。Component 将它视为实例级配置和呈现事件的不透明路由上下文。它不是经过认证的身份、权限授予或包来源证明。仅支持 Core 的对端可以忽略该字段。

每项 offer 含扩展 `id` 和一个或多个精确 SemVer 版本。成功选择必须是双方声明的相同 ID 与版本，不隐式执行 SemVer 范围选择。重复 ID 无效。接收方必须忽略未知扩展，不得启用未选择的扩展；没有选中可选扩展时继续 Core 操作。未协商扩展时收到扩展专属操作，应返回适当的 `CAPABILITY_DENIED` 或 `UNSUPPORTED_PROFILE`。

初始扩展 ID 草案：

| ID | 职责 |
| --- | --- |
| `org.bap.composition` | 组件实例、布局与预设快照 |
| `org.bap.component-config` | 声明式组件属性和实例配置 |
| `org.bap.presentation` | Host 控制的组件有效可见状态 |
| `org.bap.companion-control` | 已授权预设快照交付和确认 |

扩展 ID 与版本在 RFC 冻结前均为草案值。能力名称仍可用于功能发现，但不能取代扩展版本协商。

## 3. 实例身份与迁移

`componentId` 标识组件包；`sourceKey` 选择已安装来源；`instanceId` 标识预设及活动 Host 组合中的一次组件实例。一个预设不得有重复 `instanceId`，但可以有多个 `componentId` 和 `sourceKey` 相同的实例。

实例 ID 在该条目生命周期内保持稳定，包括预设重命名和应用重启。复制预设时，为复制的条目生成新 ID；删除后重新添加组件也生成新 ID。因为一个 Host 组合一次只应用一个预设，ID 只需在预设内唯一。每个活动实例有独立容器、协议会话、生命周期和故障状态。

组件作者可以在包根目录提供可选的 `bap-component.json` sidecar，声明 `maxInstances`。该文件必须符合 `component-metadata.schema.json`；`maxInstances` 必须是正整数。省略时表示作者未声明数量上限。限制按单个预设内的 `componentId` 计数，跨越所有安装来源，并包含已禁用条目；它不要求组件必须存在，且各预设分别计算。相同 `componentId` 的不同安装副本应声明相同上限；若声明不一致，Companion 必须采用最小的已声明上限。Companion 必须阻止会使实例数量超过上限的新增或保存操作，并说明达到上限的组件。若已存在的预设因后来发现上限而超限，必须仍可编辑清理；Companion 必须按预设顺序将超限实例标为不可用并从 Host 快照中阻止其运行。sidecar 缺失或无效不得阻止组件发现；无效 sidecar 必须产生诊断，并按未声明上限处理。该 sidecar 不修改 Core Manifest 或 Wallpaper Engine 项目元数据。

从 Core 0.1.0 预设迁移时，保留组件身份、来源、顺序和启用状态；每项只生成并持久化一次 ID，替换源数据前备份并原子写入。新扩展不可用时，迁移后的预设仍可使用兼容旧行为的默认布局。

## 4. 布局模型

Host 将布局应用到 Component iframe 外的稳定容器。Component 不必实现通用位置、尺寸、旋转、透明度和层叠。布局更新不得重建或重新导航健康的 iframe。

### 4.1 逻辑画布与手动布局

逻辑画布是扣除 Host 自定义 UI 内边距后的内容视口。坐标和尺寸相对画布归一化：`x=0,y=0` 为左上，`x=1,y=1` 为右下；缩放前宽高为画布宽高的比例。Schema 范围内允许画布外坐标，以支持用户有意部分裁切内容。

`anchor` 指定组件框上与归一化坐标 (`x`, `y`) 对齐的点，也定义变换原点。例如 `bottom-right` 表示组件右下角放在该坐标。屏幕坐标中的正旋转为顺时针。Host 围绕锚点应用等比缩放和旋转；透明度作用于外层容器。`zIndex` 只定义 BAP 组合层内部顺序，不承诺相对于 Wallpaper Engine 其他界面的层叠次序。

画布尺寸变化时，Host 必须保持归一化几何关系；绘制与鼠标命中测试必须采用相同变换。裁切由 Host 视口决定，越界不得导致壁纸失败。

### 4.2 自动网格布局

`layoutMode: "grid"` 时，预设提供归一化横纵间距、内边距及列数。自动实例按 `order` 排序，再以 `instanceId` 确定性打破平局；Host 在内边距画布中按行填充等大的单元格。单元格宽度根据可用画布、内边距、间距和列数计算；行高根据画布可用高度和所需行数计算。组件适配单元格，不改变内部布局。Host 必须将尺寸限制在可用画布中；空间不足时报告诊断，不承诺任意数量下都不重叠。

首版网格不包含碰撞避让、拖动吸附、参考线、组件尺寸/宽高比提示、独立显示器布局或任意布局插件。

### 4.3 模式行为

手动模式中所有实例必须使用手动布局记录。网格模式中未锁定实例必须使用自动布局记录；锁定实例保留最近一次解析出的手动几何，并排除在单元格分配之外。切换模式必须保留最近解析出的几何。Host 是渲染权威，不得自行修改已持久化的用户设置。

## 5. 组件属性与配置

对于 Wallpaper Engine Web Component，BAPC 必须从该已安装包的 `project.json` 中读取 `general.properties` 对象，作为可编辑属性定义来源。不要求额外提供 BAP 属性 sidecar。这只读取属性声明；BAPC 不得导入 Wallpaper Engine 独立/用户属性界面当前选择的值。BAPC 中编辑的属性值作为覆盖值存储在预设中的具体组件条目上，因此重复实例和不同预设互相独立。

作者可以在组件包根目录提供可选的 `bap-properties.json`，用于本地化属性名和组合框选项名。该 BAP sidecar 不得替代或修改 `project.json`，不得改变 Wallpaper Engine 属性 ID、默认值或属性值，也不是有效 WE 项目的必要条件。其结构必须符合 `component-localization.schema.json`。sidecar 缺失时 BAPC 必须忽略；sidecar 无效时不得阻止组件发现或属性编辑，并须给出诊断。对于请求的 BCP 47 语言标签，标签选择顺序为：忽略大小写的完整语言标签、匹配的主语言子标签、若 sidecar 恰好只有一种翻译则使用该翻译，否则回退到 `project.json` 的原始标签。组合框选项名遵循相同规则，并回退到原始选项名/值。sidecar 中未在 `project.json` 声明的属性或组合选项必须忽略并记录诊断。sidecar 只含显示标签，不包含配置值。

BAPC 0.2.0 必须支持 WE 的 `bool`、`color`、`slider`、`combo` 和 `textinput` 属性，并保留原始值类型，遵循声明的默认值、范围、步长、选项值、标签、排序及受支持的显示条件。由于 `file` 和 `directory` 表示用户选择的本地媒体且媒体功能不在 0.2.0 范围内，这两类属性不得作为可编辑控件显示；BAPC 不得持久化或传递这两类属性的值。未知或无效定义必须安全忽略并记录诊断，不得影响其他属性或组件运行。

显示条件只能通过不执行代码的解析器解释明确支持的表达式子集。实现不得执行项目元数据中的 JavaScript。遇到不支持的条件时，应禁用对应控件并记录诊断，不得猜测或求值。持久化覆盖值必须按 WE 属性定义校验；无效时回退到声明的默认值。

BAPC 快照携带活动 Host 所需的有效值。属性有效值为 `project.json` 声明的默认值叠加该预设组件条目上经校验的覆盖值；Wallpaper Engine 独立属性状态不参与解析。Component SDK 提供有效配置和变更通知，不负责持久化。配置变化原则上不得重启组件；如确有属性需要重启，须另行定义。

## 6. 有效可见状态

Core 生命周期与呈现状态分离；Component 可以处于 `running` 但不可见。Host 计算：

`effectiveVisible = enabled && userVisible && runtimeReady`

`enabled=false` 表示实例不属于活动组合，可停止/卸载。`userVisible=false` 隐藏现有实例但不销毁。恢复显示时复用健康实例，不重复 Core 握手。

Host 对最终可见性拥有权威。Component 可观察已协商的可见性事件并执行过渡，但不能覆盖 Host 可见性、在隐藏时接收输入，或违背 Host 策略自行显示。隐藏必须使实例从命中测试中移除。`runtimeReady` 仅在达到 Host 定义的就绪状态后为真。

## 7. Companion 快照同步

Companion 是已保存预设内容的权威来源。在此 Companion-Control Profile 中，Host 从已授权的 Companion API 获取完整有效组合快照；连接期间由 Host 轮询，HTTP 响应不得由缓存提供。快照包含 `presetId`、所选预设已持久化内容的单调递增 `revision`、`updatedAt`、布局模式/设置及完整有序实例列表。每个实例还包含目录推导的有效字段，例如显示名称、可用性 `status`、可用时的嵌入入口、解析后的配置和 `configRevision`。快照是完整替换，不是增量合并。由于响应包含用户配置值，Companion API 必须同时要求组件发现权限和配置读取权限。

预设 `revision` 在已保存预设内容变化时递增，不代表已安装目录变化。因此，目录推导的可用性、解析后的默认值或资源路径可以在 `presetId` 和 `revision` 不变时变化。Host 必须将不同的 `presetId` 视为新的修订序列；同一 `presetId` 下较低的 revision 已过期，必须忽略；较高 revision 是新快照；相同 revision 仍必须重新评估，因为派生字段可能变化。重复应用未变化的有效快照必须幂等。不得仅凭修订号相同就判定内容冲突。Host 必须在产生副作用前校验完整响应；无效响应不得改变最后一个有效组合，并应在后续轮询重试。有效响应会原子替换逻辑组合；单个组件的加载/运行失败应彼此隔离，不得回滚其他健康实例。重连后重新获取完整快照，不恢复旧会话的授权或运行状态。

Companion 在写入失败时必须保留最后一个有效的持久化预设。拖动/滑块更新可在内存中节流预览；持久化在提交/防抖时进行，不得逐帧写盘。快照 API 仍受现有授权会话保护，不得提供未授权的管理端点。轮询频率属于实现策略；名义轮询间隔不构成端到端延迟保证。

## 8. 扩展消息目录（草案）

选定扩展定义以下消息名，具体负载 Schema 和方向按扩展版本定：

| 名称 | 方向 | 用途 |
| --- | --- | --- |
| `presentation.visibility.changed` | Host → Component event | 通知有效可见性变化 |
| `component.config.changed` | Host → Component event | 下发有效配置快照/修订 |

所有事件必须绑定活动会话；面向实例的消息必须包含 `instanceId`。未知或已停止实例的消息必须拒绝或忽略，不得影响其他实例。负载定义如下：

- `presentation.visibility.changed`：`{ instanceId, visible }`，其中 `visible` 是 Host 计算后的有效可见状态。
- `component.config.changed`：`{ instanceId, revision, config }`，其中 `config` 是完整的有效配置对象，不是补丁。有效快照变化时修订号必须递增。

Component 必须忽略实例 ID 不匹配或修订过期的事件。Component SDK 在通知监听器前原子替换有效配置。以上是草案中扩展版本 0.1.0 的负载契约，冻结前必须由 fixtures 覆盖。

## 9. 草案产物及延期范围

本目录的 Schema 和 fixtures 是评审材料，不属于已发布的 Core 0.1.0 npm 包。0.1.0 index 和 Schema 保持不变。冻结前，一致性测试必须覆盖 Core-only 兼容和错误/不支持扩展场景。

用户选择媒体、本地文件访问、媒体授权/撤销、媒体资源 ID 和流媒体均不纳入 0.2.0，不得阻塞一致性或发行；这些能力需要单独安全设计及版本决策。
