# BAP Core Profile MVP

状态：MVP 草案规范  
协议标识：`bap`  
Core Profile：`core`  
当前协议版本：`0.1.0`

本文定义 BAP Host、Component 和 Companion 之间的最低互操作契约。协议与
传输无关。MVP 参考传输使用 HTTP 进行发现和资源访问，使用 WebSocket 建立
实时会话。只要保持相同的消息和生命周期语义，符合规范的实现也可以使用
其他传输方式。

## 1. 术语和角色

- **Host**：拥有壁纸表面并负责渲染嵌入式组件的运行时。MVP 中官方 Host
  面向 Wallpaper Engine Web 壁纸。
- **Component**：可以独立运行，也可以由 Host 挂载的功能包。组件拥有自身
  的 UI 和内部状态，并通过协议 API 与 Host 交互。
- **Companion**：可选的本地服务/应用，负责发现已安装的 Workshop 内容、
  校验包、保存配置，并提供控制和诊断服务。Companion 不负责壁纸渲染。

实现必须在 Manifest 中声明且只能声明一个主要角色。一个进程可以包含多个
角色实现，但每个会话都必须标识参与该会话的角色。

## 2. 版本和兼容性

每个 Manifest 和消息都必须包含 `protocol`，其中包括 `name`、`version` 和
`profile`。版本使用 SemVer 2.0.0 语法。`0.x` 版本表示协议尚未稳定；次
版本可以增加可选字段或能力，主版本变更可以改变必需行为。

当协议名称或 Profile 不受支持时，实现必须拒绝会话。除非字段被协商后的
Profile 标记为必需字段，否则实现必须忽略未知 JSON 对象成员。接收方必须
在诊断信息中保留未知能力名称，但不得隐式启用这些能力。

`implementationVersion` 用于标识实现，不参与协议兼容性判断。

## 3. Manifest

Manifest 是已签名或以其他方式受信任的包/应用描述符。MVP Schema 位于
`versions/0.1.0/schemas/manifest.schema.json`。必填字段包括：

- 稳定的 `id`（反向 DNS 或兼容 Workshop 的标识符）；
- `name`、`version` 和 `protocol`；
- 一个 `role`；
- `capabilities`（不支持可选能力时为空数组）；
- `entrypoints`。

Component 还必须声明 `modes`。同时支持 `standalone` 和 `embedded` 的
Component 必须列出两个值，并提供两个入口。

Manifest 是元数据，不是权限授予。Host 或 Companion 必须对活动会话协商
出的能力和权限进行实际强制执行。

## 4. Standalone 和 Embedded 模式

### 4.1 Standalone

Standalone 模式是可以独立启动的完整 Web Wallpaper 入口。它必须：

1. 在没有 Host 或 Companion 的情况下加载；
2. 在 Manifest 中暴露 Component 角色；
3. 完成与 Embedded Component 相同的 `hello`/`helloAck` 握手；
4. 在 Companion 不可用时仍然可用；
5. 支持 `initialize`、`start`、`pause`、`resume` 和 `stop` 生命周期转换。

官方 SDK 可以提供 Standalone Shell。Shell 是便利实现，不是第三方组件必须
采用的实现方式。

### 4.2 Embedded

Embedded 模式由 Host 加载，通常位于 iframe 中。Host 必须为组件提供 BAP
会话通道，不得要求组件访问 Host 全局对象。最低 iframe 集成使用带有显式
Origin 校验和会话令牌的 `window.postMessage`。

Embedded Component 必须：

1. 在完成 Host 握手前不得使用 Host API；
2. 报告其支持的能力；
3. 遵守 Host 的生命周期和权限决定；
4. 将格式错误或未授权的消息视为协议错误；
5. 保持故障隔离，使 Host 可以停止/重启该组件而不影响壁纸整体运行。

Host 可以同时挂载多个独立安装的 Component。每次挂载必须分别维护 iframe/窗口
关联和当前生命周期状态，只把响应路由给发起请求的挂载实例，并将单个组件的故障
与其他组件隔离。组件间直接通信不属于 MVP；将来的协作需要显式协商能力，不得
隐式访问其他组件。

### 4.3 Wallpaper Engine 内存嵌入交付

对于 MVP 的 Wallpaper Engine Web 壁纸集成，`embedded` 入口必须是自包含的
HTML 文档。嵌入组件运行和渲染所必需的脚本、样式、字体和媒体必须包含在该
文档中（例如使用内联代码或 data URL），不得依赖相对 URL 按 Host 壁纸
目录解析、导航到回环 HTTP iframe，或把文件复制进 Host 项目。`standalone`
入口仍可使用组件包内的独立文件。

Companion 可以读取独立安装的组件包，并在内存中将嵌入文档交给 Host。
Wallpaper Engine Host 使用 `iframe.srcdoc` 时必须允许运行脚本，但不得授予
`allow-same-origin`。Host 必须通过 iframe 窗口和活动会话识别消息，不能将
不透明的 Origin 字符串当作组件身份。本交付规则不改变 BAP 握手或生命周期
语义；运行期数据访问仍受协商后的能力和权限约束。

## 5. 握手和能力协商

发起方发送 `hello`，对端回复 `helloAck`。在发送生命周期
`initialize` 之前，握手必须完成。两个消息都是请求/响应消息，并使用消息
Schema。

`hello.payload` 包含角色、实现身份、支持的协议版本、能力和请求的权限。
`helloAck.payload` 包含选定的协议/Profile、授予的能力和权限，以及会话
标识符。对端不得使用确认消息中未出现的能力或权限。

推荐顺序：

```text
发起方 -> hello (请求)
对端   -> helloAck (响应)
发起方 -> initialize (请求)
对端   -> initialized (响应)
发起方 -> start (请求)
对端   -> started (响应)
```

对端可以在 `helloAck` 之后随时发送事件，但生命周期事件必须遵守下面的
状态机。

## 6. 生命周期

必需状态为 `created`、`connected`、`initialized`、`running`、`paused`、
`stopped` 和 `failed`。

```text
created -> connected -> initialized -> running <-> paused
                                      -> stopped
任意非终止状态 -> failed
stopped -> initialized   （仅用于显式重启）
```

`initialize`、`start`、`pause`、`resume` 和 `stop` 是请求名称。相应响应
成功后，状态转换才算完成。`pause`、`resume` 和 `stop` 必须幂等。不支持的
状态转换必须返回 `INVALID_STATE`，且不得改变状态。

`destroy` 是终止性的本地清理操作，可以由传输层决定是否暴露；如果作为
协议请求暴露，必须释放资源，并在响应后关闭会话。

## 7. 消息

所有协议消息都是由 `versions/0.1.0/schemas/message.schema.json` 校验的 JSON 对象。

### 7.1 请求和响应

请求具有 `kind: "request"`、唯一的 `id`、`method` 和 `payload`。响应具有
`kind: "response"`、对应的 `id`，以及 `ok: true` 时的结果或 `ok: false`
时的错误。除非传输已经失败，接收方必须为每个请求返回响应。

Core 请求方法包括 `hello`、`initialize`、`start`、`pause`、`resume` 和
`stop`。只有在协商出的能力中声明后，实现才可以暴露更多方法。

### 7.2 事件

事件具有 `kind: "event"`、唯一的 `id`、`event` 和 `payload`。Core 事件
名称包括 `state.changed`、`capability.changed`、`config.changed` 和
`diagnostic`。事件是通知，不需要响应。

每条消息都包含 `protocol`；当会话存在时还包含 `sessionId`，以及 RFC 3339
UTC 格式的 `timestamp`。在适用时，`correlationId` 用于将事件或响应关联
到请求。

## 8. 错误

错误使用 `versions/0.1.0/schemas/error.schema.json` 中的结构。`code` 是稳定的机器可读
值；`message` 是诊断文本，不得用于控制流程。`details` 是可选的非敏感
结构化数据。Core 错误码包括：

`INVALID_MESSAGE`、`UNSUPPORTED_VERSION`、`UNSUPPORTED_PROFILE`、
`UNAUTHORIZED`、`CAPABILITY_DENIED`、`INVALID_STATE`、`NOT_FOUND`、
`CONFLICT`、`TIMEOUT` 和 `INTERNAL_ERROR`。

错误应该包含 `retryable`。实现必须避免在错误详情中返回秘密、用户绝对
路径或个人数据。

## 9. 配置作用域

MVP 支持 `global` 和 `wallpaper` 配置作用域。协议字段为未来的 `series`
和 `instance` 作用域预留位置。MVP 使用方不得要求这些作用域才能运行。
如果未来同时存在多个作用域，预期优先级为
`global < series < wallpaper < instance`；冲突解决规则明确不属于 MVP。

## 10. HTTP/WebSocket 集成指引

参考部署使用仅限回环地址的 HTTP 和 WebSocket 端点。Companion 默认必须
只绑定 `127.0.0.1`，使用每会话令牌，并校验预期 Origin。组件的资源访问
为只读。

传输必须保持单个会话内的消息顺序，明确暴露断连，并允许对端重新连接和
重新执行握手。重连不得静默恢复权限或生命周期状态。

## 11. 一致性最低要求

Core Profile 实现满足以下条件时，视为符合本 MVP：

- 根据 Manifest Schema 校验自身 Manifest；
- 完成握手和能力协商；
- 实现必需的生命周期转换和错误；
- 校验请求/响应/事件/错误结构；
- 按声明支持 Standalone 或 Embedded 模式；
- 安全地忽略未知可选字段；
- 通过 `versions/0.1.0/fixtures/` 中与其角色相关的有效和无效 Fixtures。

一致性仓库将定义可执行测试。本文档仓库是契约及其示例 Fixtures 的规范性
来源。

## 规范性语言

本文中的“必须”对应英文规范中的 **MUST**，“不得”对应 **MUST NOT**，
“应该”对应 **SHOULD**，“可以”对应 **MAY**。如中英文措辞存在冲突，
以英文规范正文和机器可读 Schema 为准。
