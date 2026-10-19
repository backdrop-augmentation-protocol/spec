# Consuming the BAP Core Profile

The `spec` repository is the normative source for the BAP contract. Consumers
must depend on a published protocol version and must not copy schemas into an
implementation repository.

## Package consumption

The npm package is:

```text
@backdrop-augmentation-protocol/spec@0.1.0
```

The package exports the release index as its root export and exposes versioned
schema and fixture paths:

```js
import release from "@backdrop-augmentation-protocol/spec" with { type: "json" };
import manifestSchema from "@backdrop-augmentation-protocol/spec/schemas/manifest.schema.json" with { type: "json" };
```

The package root is a release index, not an implementation library. It lists
the protocol identity, profile, schema paths, and fixture paths.

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
```

Schema `$id` values and relative `$ref` values are part of the release
contract. Schema loaders must resolve references from the directory containing
the selected schema and must enable JSON Schema Draft 2020-12. The
`timestamp` field uses the standard `date-time` format; validators should load
their implementation's standard format package when format validation is
enabled.

## Version selection

Use the protocol version in the release index and in every manifest/message.
Implementations should pin an exact `0.1.0` release for the MVP. A later
version receives a new `versions/<protocol-version>/` directory and a new
package release; existing versioned contents are not overwritten.

The Core Profile document defines behavior that JSON Schema cannot express,
including lifecycle sequencing, capability negotiation, and error semantics.
Conformance requires both schema validation and the normative behavioral rules.
