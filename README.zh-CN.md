# WE Backdrop Augmentation Protocol 协议规范

[English](README.md) | 简体中文

WE Backdrop Augmentation Protocol（BAP）的规范性协议文档、机器可读
Schema，以及用于互操作性验证的 Fixtures。

仓库以带版本号的规范包集合形式发布。0.2.0 包集合保留不可变的 BAP Core
Profile 0.1.0，并增加可独立版本化的可选扩展。官方 SDK 是参考实现，并不是
唯一允许的实现方式。

面向 WE Web 壁纸的[Web/Workshop 分发检查](profiles/we-web-workshop/README.zh-CN.md)
覆盖打包和编辑器交接，不改变 Core 线协议。

包版本与线协议版本相互独立。根包索引为 `versions/0.2.0/index.json`；Core
0.1.0 索引仍位于 `versions/0.1.0/index.json`。使用方应根据所选索引解析 Schema
和 Fixtures，而不是复制协议定义。

## 目录

- `docs/core-profile.md` — 规范性 MVP 契约和协议行为（英文）。
- `docs/core-profile.zh-CN.md` — 上述正文的简体中文版本。
- `docs/consuming.md` — 包、URL 和版本消费说明。
- `versions/0.1.0/` — 不可覆盖的 Core Profile 发布内容。
- `versions/0.1.0/schemas/` — 用于线协议和包数据的 JSON Schema 2020-12 定义。
- `versions/0.1.0/fixtures/` — 一致性测试使用的有效和无效示例。
- `versions/0.2.0/` — Core 0.1.0 与可选扩展的规范包集合。
- `versions/0.2.0/schemas/` 和 `versions/0.2.0/fixtures/` — 扩展 Schema 与 Fixtures。

Schema 用于校验文档和单条消息，不能替代规范正文中的状态机和消息顺序
规则。

## 规范版本

- 协议标识：`bap`
- Core Profile：`core`
- 当前 MVP 协议版本：`0.1.0`

中文版本与英文规范正文同步维护。出现翻译歧义时，以英文规范正文和机器可读
Schema 为准；规范性变更应同时更新两个语言版本。
