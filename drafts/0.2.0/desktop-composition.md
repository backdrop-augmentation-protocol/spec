# BAP 0.2.0 Draft: Desktop Composition Extensions

Status: implementation draft; not frozen and not published. This draft is additive to BAP Core 0.1.0 and does not alter the released `versions/0.1.0/` snapshot.

## 1. Scope and principles

This draft specifies optional extensions for component instances, layout, declarative component properties, presentation state, and Companion-to-Host preset synchronization. User-selected local media is explicitly out of scope for BAP 0.2.0 and is not an acceptance or release gate.

- The Host owns component instances, layout computation, rendering containers, and effective presentation state.
- A Component owns its content, business state, and declared configuration properties.
- The Companion owns persisted presets and user-edited configuration, and synchronizes them to authorized active Hosts. It does not render components.
- Core 0.1.0 behavior remains usable when none of these extensions is negotiated.
- Extensions are optional and independently versioned. An implementation MUST NOT infer extension support from a product version or unrelated capability.

## 2. Extension negotiation

The Core message envelope and Core protocol version remain unchanged. A Host MAY include an optional `extensions` array in `hello.payload`; a peer MAY include `selectedExtensions` in a successful `helloAck.result`. The same convention applies to Host-to-Companion sessions. These fields are in extensible payload/result objects, not new Core envelope fields.

When offering `org.bap.composition`, the Host MUST include the active `instanceId` in `hello.payload`. The Component treats it as opaque routing context for instance-targeted configuration and presentation events. It is not an authenticated identity, permission grant, or proof of package origin. A Core-only peer MAY ignore it.

Each offer contains an extension `id` and one or more exact SemVer versions. A successful selection MUST be the exact intersection of an offered ID/version and a supported ID/version. No implicit SemVer range selection is performed. Duplicate IDs are invalid. A receiver MUST ignore unknown extension IDs, MUST NOT enable an extension that was not selected, and MUST continue Core operation if no optional extension is selected. An extension-specific operation sent without a selected extension MUST receive `CAPABILITY_DENIED` or `UNSUPPORTED_PROFILE`, as appropriate.

Initial extension IDs proposed by this draft:

| ID | Responsibility |
| --- | --- |
| `org.bap.composition` | Component instances, layout, and preset snapshots |
| `org.bap.component-config` | Declarative component properties and instance configuration |
| `org.bap.presentation` | Host scene and effective visibility state |
| `org.bap.companion-control` | Authorized preset snapshot retrieval |

These identifiers and versions are draft values until the RFC is frozen. Capability names remain useful for feature discovery, but do not replace extension negotiation.

## 3. Instance identity and migration

`componentId` identifies a component package; `sourceKey` selects an installed source; `instanceId` identifies one occurrence in a preset and active Host composition. A preset MUST NOT contain duplicate `instanceId` values. It MAY contain multiple instances with the same `componentId` and `sourceKey`.

An `instanceId` is stable for the lifetime of that occurrence, including preset rename and application restart. Copying a preset creates new IDs for copied occurrences. Removing and later re-adding a component creates a new ID. IDs need only be unique within a preset because one preset is active per Host composition. Each active instance has independent container, protocol session, lifecycle, and failure state.

Migration from a Core 0.1.0 preset MUST preserve component identity, source selection, ordering, and enabled state. It MUST assign and persist IDs exactly once, back up the source data before replacement, and use an atomic write. A migrated preset remains usable when the new extension is unavailable; the Host may use a legacy-compatible default arrangement.

## 4. Layout model

The Host applies layout to a stable outer container around the Component iframe. The Component does not need to implement generic position, size, rotation, opacity, or stacking behavior. Layout updates MUST NOT recreate or navigate a healthy iframe.

### 4.1 Logical canvas and manual layout

The logical canvas is the Host content viewport after Host-defined UI insets. Coordinates and dimensions are normalized to the canvas: `x=0,y=0` is top-left and `x=1,y=1` is bottom-right. `width` and `height` are fractions of canvas dimensions before scale. Schema-bounded out-of-canvas coordinates are allowed for intentional partial clipping.

`anchor` identifies the point on the Component box placed at (`x`, `y`) and also defines the transform origin. For example, `bottom-right` places the box's bottom-right point at that coordinate. Positive rotation is clockwise in screen coordinates. The Host applies uniform scale and rotation around the anchor; opacity applies to the outer container. `zIndex` defines stacking within the BAP composition layer, not relative to unrelated Wallpaper Engine surfaces.

The Host MUST preserve normalized geometry when the logical canvas changes size. Rendering and pointer hit testing MUST use the same transformed box. Clipping is determined by the Host viewport; out-of-bounds values MUST NOT fail the wallpaper.

### 4.2 Automatic grid layout

For `layoutMode: "grid"`, the preset supplies normalized horizontal/vertical gaps and padding plus a column count. Automatic instances are sorted by `order`, then `instanceId` as deterministic tie-breaker. The Host fills equal-sized cells row-first in the padded canvas. Cell width is derived from available canvas width, padding, gap, and column count; row height is derived from available canvas height and the required row count. Components are fitted to cells without changing their internal layout. The Host MUST clamp dimensions to its usable canvas and report insufficient space rather than promise zero overlap for arbitrary quantities.

The initial grid excludes collision avoidance, drag snapping, guides, component-specific size/aspect hints, independent monitor profiles, and arbitrary layout plugins.

### 4.3 Mode behavior

In manual mode every instance MUST use a manual layout record. In grid mode every unlocked instance MUST use an automatic record; locked instances retain their last resolved manual geometry and are excluded from cell allocation. Switching modes MUST preserve the last resolved geometry. The Host is the rendering authority and MUST NOT modify persisted user settings on its own.

## 5. Component properties and configuration

For Wallpaper Engine web Components, BAPC MUST derive editable property definitions from that installed package's `project.json` `general.properties` object. A separate BAP property sidecar is not required. This reads declarations only; BAPC MUST NOT import the current value selected in Wallpaper Engine's standalone/user-property UI. Values edited in BAPC are stored as overrides on the specific preset occurrence, so repeated instances and different presets remain independent.

Authors MAY provide an optional `bap-properties.json` file in the component package root to localize property and combo-option labels. This BAP sidecar MUST NOT replace or modify `project.json`, alter Wallpaper Engine property IDs, defaults, or values, or be required for a valid Wallpaper Engine project. Its structure MUST validate against `component-localization.schema.json`. BAPC MUST ignore the sidecar if it is absent; an invalid sidecar MUST NOT prevent component discovery or property editing and MUST produce a diagnostic. For a requested BCP 47 locale, label selection is: case-insensitive exact locale, then the matching primary language subtag, then the sole available sidecar translation if exactly one exists, and otherwise the original label from `project.json`. Combo-option labels follow the same rule and fall back to the original option label/value. A sidecar entry for an unknown property or combo value MUST be ignored and diagnosed. The sidecar contains labels only, never configuration values.

BAPC 0.2.0 MUST support WE `bool`, `color`, `slider`, `combo`, and `textinput` properties, preserving raw value types and respecting declared defaults, bounds, steps, option values, labels, ordering, and supported display conditions. `file` and `directory` properties MUST NOT be exposed as editable controls in 0.2.0 because they represent user-selected local media, which is out of scope. BAPC MUST NOT persist or transfer values for these types. Unknown or invalid definitions MUST be safely ignored and reported as diagnostics; they MUST NOT prevent other properties or components from working.

Display conditions MUST be interpreted only by a non-evaluating parser for the explicitly supported expression subset. Implementations MUST NOT execute JavaScript from project metadata. An unsupported condition MUST cause that property's control to be disabled with a diagnostic, not guessed or evaluated. Persisted overrides MUST be validated against the WE property definition and fall back to the declared default when invalid.

The BAPC snapshot carries effective values needed by the active Host. A property's effective value is its `project.json` declared default overlaid by that preset occurrence's validated override; Wallpaper Engine's standalone property state is never part of resolution. The Component SDK exposes effective configuration and change notifications; it does not own persistence. Configuration changes MUST NOT require restarting a Component unless a specific property is later defined to require restart.

## 6. Presentation and scene state

Core lifecycle and presentation are separate. A Component MAY be `running` while not visible. The Host computes:

`effectiveVisible = enabled && userVisible && sceneAllowed && runtimeReady`

`enabled=false` means the instance is not part of the active composition and may be stopped/unmounted. `userVisible=false` or `sceneAllowed=false` hides the existing instance without destroying it. Restoring visibility MUST reuse a healthy instance and MUST NOT repeat the Core handshake. A Host MAY defer the first mount until the scene permits startup.

The Host is authoritative for scene state and effective visibility. A Component may observe negotiated presentation events and perform transitions, but cannot override Host visibility, receive input while hidden, or show itself against Host policy. Hiding MUST remove the instance from hit testing. `runtimeReady` becomes true only after the Host-defined ready state.

Scene identifiers are Host-defined opaque strings. Events carry scene ID, revision, and optional reason, without assuming product-specific semantics. Revisions are scoped to one Host runtime and increase only when the scene ID changes. When a scene is set before a Component finishes its handshake, the Host MUST deliver the latest scene after negotiation; later changes are delivered to each active instance that selected `org.bap.presentation`. Core-only Components continue to work without scene events. The event payload MUST validate against `presentation-scene-changed.schema.json`.

## 7. Companion snapshot synchronization

The Companion is authoritative for saved preset content. For this Companion-Control profile, the Host retrieves a complete effective-composition snapshot from the authorized Companion API; it polls while connected and the response MUST NOT be served from an HTTP cache. A snapshot contains `presetId`, the selected preset's monotonically increasing persisted `revision`, `updatedAt`, layout mode/settings, and the full ordered instance list. Each instance also carries effective catalog-derived fields such as display name, availability `status`, embedded entry path when available, resolved configuration, and `configRevision`. The snapshot is a full replacement, not an incremental merge. The Companion API MUST require both component-discovery and configuration-read authorization because the response contains user configuration values.

The preset `revision` increases when saved preset content changes and does not represent changes to the installed catalog. Catalog-derived availability, resolved defaults, or resource paths MAY therefore change while `presetId` and `revision` remain unchanged. The Host MUST accept a different `presetId` as a new revision stream; for the same `presetId`, a lower revision is stale and MUST be ignored, a higher revision is new, and an equal revision MUST be re-evaluated because derived fields may have changed. Reapplying an unchanged effective snapshot MUST be idempotent. Revision equality alone MUST NOT be treated as a content-conflict signal. The Host MUST validate the complete response before causing side effects; an invalid response MUST leave the last valid composition active and be retried on a later poll. A valid response atomically replaces the logical composition; individual component load/runtime failures remain isolated and MUST NOT roll back unrelated healthy instances. After reconnect, the Host fetches a fresh full snapshot and does not restore authorization or runtime state from the old session.

The Companion MUST preserve the last valid persisted preset if a write fails. Drag/slider updates MAY be previewed in memory at a throttled rate; durable writes occur on commit/debounce, not every rendered frame. The snapshot API remains behind the existing authorized session boundary and MUST NOT provide an unauthenticated management endpoint. Poll cadence is implementation policy; a nominal polling interval is not an end-to-end latency guarantee.

## 8. Draft extension message catalog

The selected extensions define these message names; payload schemas and direction are version-specific:

| Name | Direction | Purpose |
| --- | --- | --- |
| `presentation.scene.changed` | Host → Component event | Notify negotiated scene state |
| `presentation.visibility.changed` | Host → Component event | Notify effective visibility transition |
| `component.config.changed` | Host → Component event | Deliver effective configuration snapshot/revision |

Every event MUST be bound to the active session. Instance-targeted messages MUST include `instanceId`. Messages for unknown or stopped instances MUST be rejected or ignored without affecting other instances. The payloads defined here are:

- `presentation.scene.changed`: `{ instanceId, sceneId, revision, reason? }`. `sceneId` is an opaque non-empty string; `revision` is a non-negative integer that increases when the Host scene changes.
- `presentation.visibility.changed`: `{ instanceId, visible }`, where `visible` is the Host-computed effective visibility.
- `component.config.changed`: `{ instanceId, revision, config }`, where `config` is the complete effective configuration object, not a patch. Revisions are non-negative and increase when the effective snapshot changes.

Components MUST ignore events for a different instance ID and stale revisions. The Component SDK replaces its effective configuration atomically before notifying listeners. These payload contracts are draft 0.1.0 extension definitions and MUST be covered by fixtures before freeze.

## 9. Draft artifacts and deferred scope

Schemas and fixtures in this directory are review artifacts, not part of the published Core 0.1.0 npm package. The 0.1.0 index and schemas remain unchanged. Before freeze, conformance tests MUST exercise Core-only compatibility and malformed/unsupported extension cases.

User-selected media, local file access, media authorization/revocation, media resource IDs, and streaming are outside 0.2.0. They MUST NOT block 0.2.0 conformance or release; they require a separate security design and version decision.
