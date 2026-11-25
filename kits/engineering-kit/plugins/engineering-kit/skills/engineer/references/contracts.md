# Contracts between surfaces

Use this when several implementations should mean the same thing: a website and a command line, an MCP server and a page, a generator and its checker, two renderers of one text, an API and its client. The contract is the observable promise: what is allowed, what comes back, what fails and how.

## Find every implementation

Start from the canonical source and list its consumers with `scripts/structure.mjs`. Then find the implementations that import nothing from it: `--symbol <name>` lists other files defining the same name, and the shared-text list shows long passages repeated elsewhere. A second renderer that copies some sentences and rewrites others is the usual shape of drift. `scripts/history.mjs` with both paths shows whether people change them together.

## Compare behavior on real inputs

Choose representative real inputs, including boundary and missing cases, and capture every implementation's output under the same conditions. Sort the differences into three groups:

- presentation that may differ, such as layout or wording that carries the same rule;
- behavior that must not differ: permissions, scope, what may be changed, validation, error handling, when to stop;
- differences nobody decided.

A text diff shows that two instructions differ; how an agent or a person acts on them is a separate question. Where the action matters, test the action on a safe fixture. A prompt that says "read-only" enforces nothing; the host's permissions do.

Ask the user which behavior is intended before changing a policy. Then make one source canonical, keep adapters only for real presentation differences, and add a test that runs every surface on the same inputs and checks the parts that must agree. Test what is served or generated, as well as the function that builds it.

## Watch a real run

When the source cannot settle the question, observe one real operation: a safe input, a known revision and environment, a correlation id or a time window. Prefer existing logs, traces, tests and browser network records, and add narrow temporary instrumentation only where the gap matters and the user allows it. Never capture credentials or private payloads. Spans can be sampled or dropped, so a missing span does not show that nothing ran, and timestamp order is not cause. Report runtime observations separately from static and historical evidence.

Sources: McKeeman, "Differential Testing for Software" (Digital Technical Journal, 1998); OpenTelemetry trace data model specification.
