# Wallpaper Engine Web/Workshop distribution checks

This is a BAP packaging profile, not a wire-protocol profile or a complete
Wallpaper Engine metadata schema. It applies to a Host or Component distributed
as a Wallpaper Engine **Web** wallpaper. Local development and debugging may
use only the Core Profile; this distribution profile is REQUIRED before first
Workshop publication and for every subsequent Workshop item update and
maintenance release. The Core Profile remains transport- and platform-neutral.
Passing these static checks does not predict Workshop review,
content moderation, copyright clearance, or successful runtime behavior.

## Minimum package

- The package root MUST contain a parseable `project.json` object and an HTML
  entrypoint named by its `file` member. `type` MUST identify the Web type;
  both generated `web` and observed editor-normalized `Web` are accepted.
- `title` MUST be a nonempty string. For a Workshop-ready BAP package, `preview`
  MUST name an image file present in the package. These are BAP distribution
  checks, not a claim that every WE metadata variant has the same required keys.
- `file` and `preview` MUST be relative file paths inside the package. A BAP
  component's `manifest.json` MUST validate against the Core Manifest Schema,
  declare the Component role, and provide Standalone and Embedded entrypoints.
  Every declared entrypoint MUST resolve to a packaged file. The WE `file`
  entrypoint MUST be the component's Standalone entrypoint.
- The Standalone entrypoint MUST run without a Host or Companion. The Embedded
  entrypoint MUST meet Core §4.3's self-contained HTML rule. All files needed
  for offline startup MUST be included with the wallpaper; network resources
  may only be optional enhancements.
- Host wallpapers MUST NOT bundle independently installed components as a
  substitute for discovery. Multiple components may be installed separately
  and mounted concurrently as specified by Core §4.2.
- A BAP Host and Component MUST NOT be required to share a distribution source.
  Either may be a local WE project or a subscribed Workshop item. A local
  development Component need not have a Workshop ID; when copies share a BAP ID,
  a Companion may select an explicit source for that component instance.

The schema in this directory checks only `project.json` field shapes. The
conformance suite checks file existence, containment, entrypoint matching, and
packaged HTML resource references. Static analysis cannot prove that arbitrary
JavaScript or CSS works offline or that an Embedded document is fully
self-contained; runtime checks are still needed.

Editor-created local projects and editor-normalized subscribed items can have
different metadata. This profile does **not** require an exact key set, preview
extension, tag/category, visibility, content rating, `general.properties`
layout, or the presence/absence of `workshopid`. Do not use the stricter
candidate-template rules of a particular example project to reject all valid
WE packages. Preserve editor-managed metadata when updating an existing item.

Publish and update Wallpaper Engine wallpapers through the official Wallpaper
Engine editor. The editor handles its own publishing form and preview workflow;
do not treat static package validation as a replacement for that workflow.

Sources: [Creating a Web Wallpaper](https://docs.wallpaperengine.io/en/web/first/gettingstarted.html),
[Editing Downloaded Wallpapers](https://help.wallpaperengine.io/en/functionality/editingwallpapers.html).
