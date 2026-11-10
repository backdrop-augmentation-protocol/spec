# BAP 规范包 0.2.0：Core Host 运行时实例 API

本文件定义 0.2.0 实现配置必需的本地 Host SDK API，而不是可选协商扩展。Core 0.1.0 产物保持不变。

## 目的

Host 是其实际挂载内容的权威来源。Host 的运行时实例清单必须能够独立于 Companion 预设、持久化组合或发起挂载的来源进行查询。此 API 描述当前运行事实，不规定实现如何获取或保存期望组合。

## Host API

每个兼容 0.2.0 的 Host SDK 必须提供：

- `componentCount`：当前由 Host runtime 持有的 Component 实例数量。
- `getComponentInstances()`：当前全部已挂载 Component 实例的时点快照。
- `componentInventoryChanged`：当清单或任一实例的已报告字段发生变化时触发的 Host 事件。

清单必须包含从创建到失败或暂停的所有状态，直到实例卸载。若实例帧/容器仍然挂载，失败实例仍留在清单中；卸载后必须移除。相同观察时点下，数量必须等于 `getComponentInstances()` 返回的记录数。

每条快照记录必须包含 `instanceId`、`componentId`、生命周期 `state`、有效 `config`、`configRevision`，以及可用时 Host 当前的布局和呈现状态。Host 跟踪了 `sourceKey` 时可以包含它。记录必须标识具体实例，而不只是组件包；同一包的多个实例必须分别列出。清单不得根据 enabled/visible 状态过滤，以便调用方区分已挂载但隐藏或暂停的实例与不存在的实例。

返回数组及其嵌套记录必须是与 Host 状态隔离的快照。修改快照不得改变 Host 状态。运行时清单未变化时，快照顺序必须稳定；实现应尽可能保持挂载顺序。

`componentInventoryChanged` 事件必须提供新的完整快照，而不是局部补丁。挂载、卸载、生命周期状态转换、配置更新、布局更新或呈现状态更新后都必须触发。监听方可以调用 `getComponentInstances()` 获取最新状态。该事件属于本地 SDK API，不得与 BAP 网络协议事件混淆。

## 所有权与使用

Host 始终是实时清单的唯一权威来源。Companion 预设表示期望/持久化配置，不得被当作实例已挂载的证明。展示实时桌面的 Companion 必须消费 Host 上报的运行时快照，并明确区分“上报不可用或已过期”与“清单为空”。

运行时属性编辑必须以活动 `instanceId` 为目标，并由所属 Host 应用到该实例。此类编辑不得隐式改写预设。若提供保存到预设的功能，必须作为独立显式操作，并明确指定目标预设和实例条目。

本地 API 本身不定义 Host 到 Companion 的传输、授权、新鲜度协议或远程修改请求。在宣称支持端到端实时管理前，必须另行规范这些要求。
