# BAP Core Profile MVP

Status: draft MVP specification  
Protocol identifier: `bap`  
Core profile: `core`  
Current protocol version: `0.1.0`

This document defines the minimum interoperable contract for a BAP Host,
Component, and Companion. The protocol is transport-neutral. The MVP reference
transport uses HTTP for discovery/resource access and WebSocket for a live
session. A conforming implementation may use another transport when it preserves
the same message and lifecycle semantics.

## 1. Terminology and roles

- **Host**: the runtime that owns a wallpaper surface and renders embedded
  components. In the MVP, the official Host targets Wallpaper Engine Web
  wallpapers.
- **Component**: a packaged feature that can run by itself or be mounted by a
  Host. A component owns its UI and internal state and uses protocol APIs for
  host interaction.
- **Companion**: an optional local service/application that discovers installed
  Workshop content, validates packages, stores configuration, and exposes
  control/diagnostic services. It never owns wallpaper rendering.

Implementations MUST declare exactly one primary role in their manifest. A
process may contain multiple role implementations, but each session identifies
the role participating in that session.

## 2. Versioning and compatibility

Every manifest and message MUST contain `protocol` with `name`, `version`, and
`profile`. Versions use SemVer 2.0.0 syntax. `0.x` versions are pre-stable and
minor versions may add optional fields or capabilities; a major version change
may change required behavior.

An implementation MUST reject a session when the protocol name or profile is not
supported. It MUST ignore unknown JSON object members unless a field is marked
required by the negotiated profile. Receivers MUST preserve forward-compatible
unknown capability names in diagnostics but MUST NOT enable them implicitly.

The `implementationVersion` identifies the implementation and is not used for
protocol compatibility.

## 3. Manifest

The manifest is a signed or otherwise trusted package/application descriptor.
The MVP schema is `versions/0.1.0/schemas/manifest.schema.json`. Required fields are:

- stable `id` (reverse-DNS or Workshop-compatible identifier);
- `name`, `version`, and `protocol`;
- one `role`;
- `capabilities` (an array, empty when no optional capability is supported);
- `entrypoints`.

Components MUST additionally declare `modes`. A component supporting both
`standalone` and `embedded` MUST list both values and provide both entrypoints.

The manifest is metadata, not a permission grant. A Host or Companion MUST
enforce the capabilities and permissions negotiated for the active session.

## 4. Standalone and Embedded modes

### 4.1 Standalone

Standalone mode is a complete, independently launchable Web Wallpaper entry.
It MUST:

1. load without a Host or Companion;
2. expose the Component role in its manifest;
3. initialize a local session with the same lifecycle semantics as an embedded
   component; no wire handshake is required without a Host;
4. remain usable when Companion is unavailable;
5. support `initialize`, `start`, `pause`, `resume`, and `stop` lifecycle
   transitions.

The official SDK MAY provide a Standalone Shell. The shell is a convenience
implementation and is not required for third-party components.

### 4.2 Embedded

Embedded mode is loaded by a Host, normally inside an iframe. The Host MUST
provide the component with a BAP session channel and MUST NOT require the
component to access host globals. The minimum iframe integration uses
`window.postMessage` with an explicitly checked origin and a session token.

An embedded Component MUST:

1. wait for the Host handshake before using Host APIs;
2. report its supported capabilities;
3. obey Host lifecycle and permission decisions;
4. treat malformed or unauthorized messages as protocol errors;
5. keep its failure isolated so the Host can stop/restart it without taking down
   the wallpaper.

A Host MAY mount multiple independently installed Components at once. It MUST
maintain a separate iframe/window association and active lifecycle state for
each mount, route replies only to the initiating mount, and isolate one
Component's failure from the others. Direct Component-to-Component messaging
is not part of the MVP; any future cooperation requires an explicitly
negotiated capability rather than implicit access to another Component.

### 4.3 Wallpaper Engine inline delivery

For the MVP Wallpaper Engine Web Wallpaper integration, the `embedded`
entrypoint MUST be a self-contained HTML document. Scripts, styles, fonts, and
media required to render and run the embedded component MUST be included in
that document (for example, as inline code or data URLs). They MUST NOT depend
on relative URLs resolving against the Host wallpaper's directory, navigation
to a loopback HTTP iframe, or files copied into the Host's project. The
`standalone` entrypoint MAY continue to use files in its own component package.

The Companion MAY read the independently installed component package and
deliver the embedded document to the Host in memory. A Wallpaper Engine Host
using `iframe.srcdoc` MUST enable scripts without granting `allow-same-origin`.
It MUST distinguish messages by the iframe window and active session rather
than treating the opaque origin string as a component identity. This delivery
rule does not change the BAP handshake or lifecycle semantics; runtime data
access remains subject to negotiated capabilities and permissions.

## 5. Handshake and capability negotiation

For an embedded Component, the Host initiates the session by sending a
`hello` request. The Component answers with a successful response (called
`helloAck`). The Host MUST complete this handshake before sending lifecycle
`initialize`. A Component MUST NOT initiate a second Core handshake or
lifecycle sequence for the same session. In standalone mode, where no Host
exists, the Component creates a local session and drives its own lifecycle.
For a Host-to-Companion session, the Host likewise initiates `hello`; the
Companion responds with the same envelope and fields, except its acknowledgement
uses `role: "companion"`. The Companion does not participate in an embedded
Component's lifecycle.

`hello.payload` contains the Host `role`, `identity` (`id`, `name`, `version`),
`protocolVersions` (SemVer strings), `capabilities`, and
`requestedPermissions`. The `helloAck` response has `ok: true`, a
`correlationId` matching the request `id`, a top-level `sessionId`, and
`result` containing `selectedProtocol`, `role: "component"`, `capabilities`,
and `permissions`. The Component selects a supported protocol, creates a
unique session identifier for this mount, and grants only capabilities and
permissions allowed by both sides. A peer MUST NOT use an unacknowledged
capability or permission. An incompatible protocol MUST return an error
response, not a successful acknowledgement.

Recommended sequence:

```text
Host      -> hello (request)
Component -> helloAck (response)
Host      -> initialize (request)
Component -> initialized (response)
Host      -> start (request)
Component -> started (response)
```

The peer MAY send events at any time after `helloAck`, but lifecycle events MUST
respect the state machine below.

## 6. Lifecycle

The required states are `created`, `connected`, `initialized`, `running`,
`paused`, `stopped`, and `failed`.

```text
created -> connected -> initialized -> running <-> paused
                                      -> stopped
Any non-terminal state -> failed
stopped -> initialized   (only for an explicit restart)
```

`initialize`, `start`, `pause`, `resume`, and `stop` are request names. The
corresponding response MUST be successful before the state transition is
considered complete. `pause`, `resume`, and `stop` MUST be idempotent. An
unsupported transition MUST return `INVALID_STATE` and MUST NOT mutate state.

`destroy` is a terminal local cleanup operation and MAY be transport-specific;
when exposed as a protocol request it MUST release resources and close the
session after its response.

## 7. Messages

All protocol messages are JSON objects validated by
`versions/0.1.0/schemas/message.schema.json`.

### 7.1 Requests and responses

Requests have `kind: "request"`, a unique `id`, `method`, and `payload`.
Responses have `kind: "response"`, the corresponding `id`, and either
`ok: true` with a result or `ok: false` with an error. A receiver MUST return a
response for every request unless the transport has already failed.

Core request methods are `hello`, `initialize`, `start`, `pause`, `resume`, and
`stop`. Implementations MAY expose more methods only when declared by a
negotiated capability.

### 7.2 Events

Events have `kind: "event"`, a unique `id`, `event`, and `payload`. Core event
names include `state.changed`, `capability.changed`, `config.changed`, and
`diagnostic`. Events are notifications and MUST NOT require a response.

Every message includes `protocol`, `sessionId` when a session exists, and a
`timestamp` in RFC 3339 UTC format. `correlationId` links an event or response
to a request when applicable.

## 8. Errors

Errors use the structure in `versions/0.1.0/schemas/error.schema.json`. `code` is stable and
machine-readable; `message` is diagnostic text and MUST NOT be used for control
flow. `details` is optional, non-sensitive structured data. Core codes are:

`INVALID_MESSAGE`, `UNSUPPORTED_VERSION`, `UNSUPPORTED_PROFILE`,
`UNAUTHORIZED`, `CAPABILITY_DENIED`, `INVALID_STATE`, `NOT_FOUND`,
`CONFLICT`, `TIMEOUT`, and `INTERNAL_ERROR`.

Errors SHOULD include `retryable`. Implementations MUST avoid returning secrets,
absolute user paths, or personal data in error details.

## 9. Configuration scopes

The MVP supports `global` and `wallpaper` configuration scopes. The protocol
fields reserve `series` and `instance` scopes for future use. MVP consumers MUST
not require those scopes to operate. If multiple scopes are later present,
precedence is expected to be `global < series < wallpaper < instance`; conflict
resolution is intentionally outside the MVP.

## 10. HTTP/WebSocket integration guidance

The reference deployment uses loopback-only HTTP and WebSocket endpoints. A
Companion MUST bind only to `127.0.0.1` by default, use a per-session token, and
validate the expected origin. Resource access is read-only for components.

The transport MUST preserve message ordering per session, surface disconnects,
and allow a peer to reconnect and perform a fresh handshake. Reconnection MUST
not silently restore permissions or lifecycle state.

## 11. Conformance minimum

A Core Profile implementation conforms to this MVP when it:

- validates its manifest against the manifest schema;
- completes the handshake and capability negotiation;
- implements the required lifecycle transitions and errors;
- validates request/response/event/error shapes;
- supports Standalone or Embedded mode as declared;
- ignores unknown optional fields safely;
- passes the valid and invalid fixtures in `versions/0.1.0/fixtures/` relevant to its role.

The conformance repository will define executable tests. This repository is the
normative source for the contract and its example fixtures.
