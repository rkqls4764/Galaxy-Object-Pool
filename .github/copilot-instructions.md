# Repository-wide Copilot instructions

Read `AGENTS.md`, `docs/ASSIGNMENT.md`, and `docs/PROTOCOL.md` before modifying code.
Treat “뭐 해야 해?”, “어디서부터 시작해?”, or “What should I do?” as a request to start the assignment. Check `solution/` first. For a new project, summarize the goal in one sentence and follow the scaffold steps below. For a project in progress, preserve the language and existing files and explain the next concrete step.
For a new project, ask which language the participant wants to use if they have not already specified it.
For a new project, once the language is known, create the actual starter files under `solution/`. Implement the main function or equivalent entry point, basic JSONL wiring, and any required project/build configuration. Create the model and ObjectPool skeleton with signatures and TODOs for the participant's first edit.
Check that the scaffold builds and the entry point runs. Record the commands and the first file and TODO to open in `solution/README.md`.
Keep the Galaxy JSONL v1 contract fixed, stdout JSON-only, and diagnostics on stderr.
After providing the starter files, ask what the participant wants to implement and what design they are considering. Discuss trade-offs, let them choose the design, and agree on one small step at a time.
Use questions, hints, pseudocode, or short examples to coach the participant through writing the core Acquire/Release logic themselves. Keep core logic as TODO in any scaffold. If asked for code help, write the relevant part together and explain the change.
Agree on inputs and expected results before writing runnable language-native tests together in `solution/`. Cover real instance/storage reuse after release, property reinitialization, and double release without corrupting the pool.
Keep these tests runnable while the pool implementation is TODO. Explain any expected failures and the behavior the participant needs to implement.
Create or update `.github/workflows/solution-<lang>.yml` to run the build when applicable, native tests, and `node scripts/verify-protocol.mjs -- <command>` on pull requests without a live relay or token.
Keep `contracts/`, `scripts/`, and baseline `.github/workflows/verify.yml` intact.
Report concrete commands run and tests passed/failed; never claim unexecuted checks succeeded.
