# WE Backdrop Augmentation Protocol Specification

English | [简体中文](README.zh-CN.md)

Normative protocol specification, machine-readable schemas, and interoperability
fixtures for the WE Backdrop Augmentation Protocol (BAP).

The current repository contains the MVP Core Profile. Official SDKs are reference
implementations, not the only valid implementations.

For WE Web wallpapers, the additional [Web/Workshop distribution checks](profiles/we-web-workshop/README.md)
cover the package and editor handoff without changing the Core wire protocol.

The package is named `@backdrop-augmentation-protocol/spec` at version
`0.1.0`. The versioned Core index is `versions/0.1.0/index.json`.
Consumers should resolve schemas and fixtures from that index or from the
package exports rather than copying protocol definitions.

## Layout

- `docs/core-profile.md` — normative MVP contract and protocol behavior.
- `docs/consuming.md` — package, URL, and version consumption guidance.
- `versions/0.1.0/` — immutable Core Profile release contents.
- `versions/0.1.0/schemas/` — JSON Schema 2020-12 definitions for wire and package data.
- `versions/0.1.0/fixtures/` — valid and invalid examples used by conformance tooling.

The schemas are intended to validate documents and individual messages. They do
not replace the state-machine and sequencing rules in the normative document.
