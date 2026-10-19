# WE Backdrop Augmentation Protocol Specification

English | [简体中文](README.zh-CN.md)

Normative protocol specification, machine-readable schemas, and interoperability
fixtures for the WE Backdrop Augmentation Protocol (BAP).

The current repository contains the MVP Core Profile. Official SDKs are reference
implementations, not the only valid implementations.

## Layout

- `docs/core-profile.md` — normative MVP contract and protocol behavior.
- `schemas/` — JSON Schema 2020-12 definitions for wire and package data.
- `fixtures/` — valid and invalid examples used by conformance tooling.

The schemas are intended to validate documents and individual messages. They do
not replace the state-machine and sequencing rules in the normative document.
