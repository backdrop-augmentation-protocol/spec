# Consuming the BAP Core Profile

The `spec` repository is the normative source for the BAP contract. Consumers
must depend on a published protocol version and must not copy schemas into an
implementation repository.

## Package consumption

The npm package release bundle is:

```text
@backdrop-augmentation-protocol/spec@0.2.0
```

The package root exports the 0.2.0 bundle index. That index identifies the
unchanged Core protocol version (0.1.0) separately from the npm package version
(0.2.0), and lists optional extension versions and artifacts. The package also
retains the versioned Core 0.1.0 schemas and fixtures:

```js
import release from "@backdrop-augmentation-protocol/spec" with { type: "json" };
import coreIndex from "@backdrop-augmentation-protocol/spec/core" with { type: "json" };
import manifestSchema from "@backdrop-augmentation-protocol/spec/schemas/manifest.schema.json" with { type: "json" };
```

The package root is a release bundle index, not an implementation library. The
`./core` export selects the immutable Core 0.1.0 index; legacy `./schemas/*`
and `./fixtures/*` exports continue to point to Core 0.1.0. Resolve extension
paths from the 0.2.0 bundle index.

## Repository or URL consumption

When a package registry is unavailable, consumers may pin the Git commit or
the versioned release directory. The stable paths are:

```text
versions/0.1.0/index.json
versions/0.1.0/schemas/common.schema.json
versions/0.1.0/schemas/manifest.schema.json
versions/0.1.0/schemas/message.schema.json
versions/0.1.0/schemas/error.schema.json
versions/0.1.0/fixtures/
versions/0.2.0/index.json
versions/0.2.0/schemas/
versions/0.2.0/fixtures/
```

Schema `$id` values and relative `$ref` values are part of the release
contract. Schema loaders must resolve references from the directory containing
the selected schema and must enable JSON Schema Draft 2020-12. The
`timestamp` field uses the standard `date-time` format; validators should load
their implementation's standard format package when format validation is
enabled.

## Version selection

Use the Core protocol version from the selected index in every Core manifest
and message. Optional extension versions are negotiated independently. A new
package bundle may therefore have a different version from the Core protocol;
each published bundle and protocol directory is immutable and receives a new
versioned path rather than overwriting an earlier release.

The Core Profile document defines behavior that JSON Schema cannot express,
including lifecycle sequencing, capability negotiation, and error semantics.
Conformance requires both schema validation and the normative behavioral rules.
