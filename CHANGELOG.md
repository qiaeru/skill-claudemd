# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-06-04

### Added

- Skill `optimizing-claude-md`: trims a project's CLAUDE.md to what is strictly necessary, following Anthropic's memory and best-practice guidance (keep test, under 200 lines, specific and verifiable phrasing). It scans the project's documentation and replaces derivable or duplicated content with on-demand references rather than rewriting it in CLAUDE.md, saving context tokens and preventing the file from contradicting the docs. Three reference files cover the include/exclude table, the four referencing mechanisms and their load-time costs, and before/after examples.
