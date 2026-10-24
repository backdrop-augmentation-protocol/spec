# Wallpaper Engine Web/Workshop 分发检查

这是 BAP 的打包 Profile，不是线协议 Profile，也不是完整的 Wallpaper Engine 元数据
Schema。适用于作为 Wallpaper Engine **Web** 壁纸分发的 Host 或 Component。Core
Profile 仍与平台、传输无关。静态检查通过不代表创意工坊审核、内容合规、版权许可或运行
时行为一定通过。

## 最低包要求

- 包根目录必须包含可解析为对象的 `project.json`，其 `file` 指向包内 HTML 入口，
  `type` 必须为 `web`。
- `title` 必须是非空字符串。面向创意工坊的 BAP 包中，`preview` 必须指向包内
  存在的图片文件。这是 BAP 的分发检查，不表示所有 WE 元数据变体都要求相同字段。
- `file` 和 `preview` 必须是包内相对文件路径。BAP Component 的 `manifest.json`
  必须符合 Core Manifest Schema、声明 Component 角色，并提供 Standalone 和
  Embedded 入口。每个声明的入口都必须指向包内文件。WE 的 `file` 必须与组件的
  Standalone 入口一致。
- Standalone 入口必须在没有 Host 或 Companion 时运行。Embedded 入口必须遵守
  Core §4.3 的自包含 HTML 规则。离线启动必需的文件必须随壁纸打包；网络资源只能
  作为可选增强。
- Host 壁纸不得打包独立安装的组件来代替发现机制。可以分别安装多个组件，并按照
  Core §4.2 同时挂载。

本目录的 Schema 仅检查 `project.json` 字段形状。一致性测试套件检查文件存在性、
路径范围、入口匹配和打包 HTML 的资源引用。静态分析无法证明任意 JavaScript/CSS
离线可用，也无法完全证明 Embedded 文档自包含；仍需运行时验证。

编辑器创建的本地项目与编辑器规范化后的订阅项目，元数据可能不同。本 Profile 不要求
精确的字段集合、预览图扩展名、分类、可见性、内容分级、`general.properties` 结构，
也不要求 `workshopid` 必须存在或不存在。不能将某个示例项目更严格的候选模板规则
用于拒绝所有 WE 包。更新已有作品时应保留编辑器管理的元数据。

Wallpaper Engine 壁纸的发布和更新必须通过官方编辑器进行。编辑器负责发布表单和
预览图流程；静态包校验不能取代该流程。

参考：[创建 Web 壁纸](https://docs.wallpaperengine.io/en/web/first/gettingstarted.html)、
[编辑已下载壁纸](https://help.wallpaperengine.io/en/functionality/editingwallpapers.html)。
