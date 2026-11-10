# BAP Specification Bundle 0.2.0: Core Host Runtime Instance API

This document defines the required local Host SDK API for the 0.2.0 implementation profile; it is not an optional negotiated extension. Core 0.1.0 artifacts remain immutable.

## Purpose

A Host is authoritative for what it has actually mounted. Its live instance inventory MUST be queryable independently of Companion presets, persisted composition, or the source that requested the mounts. This API describes current runtime facts; it does not prescribe how an implementation obtains or stores its desired composition.

## Host API

Every 0.2.0-compatible Host SDK MUST expose:

- `componentCount`: the number of Component instances currently owned by the Host runtime.
- `getComponentInstances()`: a point-in-time snapshot of all currently mounted Component instances.
- `componentInventoryChanged`: a Host event emitted whenever the inventory or any reported instance field changes.

The inventory MUST include instances in every state from creation through failure or pause, until they are unmounted. A failed instance remains in the inventory while its frame/container is mounted; an unmounted instance MUST be removed. The count MUST equal the number of records returned by `getComponentInstances()` at the same observation point.

Each snapshot record MUST include `instanceId`, `componentId`, lifecycle `state`, effective `config`, `configRevision`, and the Host's current layout and presentation state when available. `sourceKey` MAY be included when the Host tracks it. Records MUST identify instances, not just component packages; repeated instances of one package MUST be separate records. The inventory MUST NOT be filtered by enabled/visible state: consumers need to distinguish mounted-but-hidden or paused instances from absent instances.

The returned array and nested records MUST be detached snapshots. Mutating a snapshot MUST NOT mutate Host state. Snapshot order MUST be stable for an unchanged runtime inventory; implementations SHOULD preserve mount order.

The `componentInventoryChanged` event MUST provide a fresh complete snapshot, not a partial patch. It MUST be emitted after mount, unmount, lifecycle-state transition, config update, layout update, or presentation update. Listeners MAY call `getComponentInstances()` to obtain the latest state. The event is local SDK API and MUST NOT be confused with a BAP wire-protocol event.

## Ownership and use

The Host remains the sole authority for live inventory. Companion presets are desired/persisted configuration and MUST NOT be represented as proof that an instance is mounted. A Companion that presents a live desktop view MUST consume a Host-reported runtime snapshot and clearly distinguish an unavailable/stale report from an empty inventory.

Runtime property edits MUST target an active `instanceId` and be applied by the owning Host to that instance. Such an edit MUST NOT implicitly rewrite a preset. Persistence into a preset, if offered, is a separate explicit operation and MUST identify the destination preset and occurrence.

The local API does not itself define the Host-to-Companion transport, authorization, freshness protocol, or remote mutation request. Those requirements MUST be specified separately before claiming end-to-end live management support.
