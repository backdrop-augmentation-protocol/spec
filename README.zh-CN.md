# WE Backdrop Augmentation Protocol 协议规范

[English](README.md) | 简体中文

WE Backdrop Augmentation Protocol（BAP）的规范性协议文档、机器可读
Schema，以及用于互操作性验证的 Fixtures。

当前仓库包含 MVP Core Profile。官方 SDK 是参考实现，并不是唯一允许的
实现方式。

## 目录

- `docs/core-profile.md` — 规范性 MVP 契约和协议行为（英文）。
- `docs/core-profile.zh-CN.md` — 上述正文的简体中文版本。
- `schemas/` — 用于线协议和包数据的 JSON Schema 2020-12 定义。
- `fixtures/` — 一致性测试使用的有效和无效示例。

Schema 用于校验文档和单条消息，不能替代规范正文中的状态机和消息顺序
规则。

## 规范版本

- 协议标识：`bap`
- Core Profile：`core`
- 当前 MVP 协议版本：`0.1`

中文版本与英文规范正文同步维护。出现翻译歧义时，以英文规范正文和机器可读
Schema 为准；规范性变更应同时更新两个语言版本。
