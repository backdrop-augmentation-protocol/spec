# WE Backdrop Augmentation Protocol Specification

English | [简体中文](README.zh-CN.md)

Normative protocol specification, machine-readable schemas, and interoperability
fixtures for the WE Backdrop Augmentation Protocol (BAP).

The repository publishes versioned specification bundles. Bundle 0.2.0 retains
the immutable BAP Core Profile 0.1.0 and adds independently versioned optional
extensions. Official SDKs are reference implementations, not the only valid
implementations.

For WE Web wallpapers, the additional [Web/Workshop distribution checks](profiles/we-web-workshop/README.md)
cover the package and editor handoff without changing the Core wire protocol.

The package release version is distinct from the wire protocol version. The
root package index is `versions/0.2.0/index.json`; the Core 0.1.0 index remains
at `versions/0.1.0/index.json`. Consumers should resolve schemas and fixtures
from the selected index rather than copying protocol definitions.

## Layout

- `docs/core-profile.md` — normative MVP contract and protocol behavior.
- `docs/consuming.md` — package, URL, and version consumption guidance.
- `versions/0.1.0/` — immutable Core Profile release contents.
- `versions/0.1.0/schemas/` — JSON Schema 2020-12 definitions for wire and package data.
- `versions/0.1.0/fixtures/` — valid and invalid examples used by conformance tooling.
- `versions/0.2.0/` — specification bundle for Core 0.1.0 and optional extensions.
- `versions/0.2.0/schemas/` and `versions/0.2.0/fixtures/` — extension schemas and fixtures.

The schemas are intended to validate documents and individual messages. They do
not replace the state-machine and sequencing rules in the normative document.
