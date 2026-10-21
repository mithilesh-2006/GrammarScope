# GrammarScope — Implementation Plan

## 1. Purpose of This Document

This document defines the implementation architecture, modules, API contracts, algorithms, development phases, tests, and acceptance criteria for GrammarScope.

The implementation must produce a working application—not just a UI mockup. Build and test the parsing engine before investing heavily in visual styling.

## 2. Architecture

```text
┌───────────────────────────────────────────────┐
│                 Angular Frontend              │
│ Grammar Editor • Tree Viewer • Ambiguity UI   │
└───────────────────────┬───────────────────────┘
                        │ HTTP/JSON
┌───────────────────────▼───────────────────────┐
│                  FastAPI Backend              │
│ Routes • Validation • Services • Limits       │
└───────────────────────┬───────────────────────┘
                        │
┌───────────────────────▼───────────────────────┐
│               Grammar Processing Core          │
│ Grammar Model • Tokenizer • Earley Parser     │
│ Parse Forest • Tree Extraction • Analysis     │
│ FIRST/FOLLOW • CYK (later phase)               │
└───────────────────────┬───────────────────────┘
                        │
┌───────────────────────▼───────────────────────┐
│              Tests and Optional Storage       │
│ pytest • Test Grammars • Optional SQLite       │
└───────────────────────────────────────────────┘
```

### Design principles

- Keep parsing algorithms independent from FastAPI routes.
- Use typed data structures and consistent JSON schemas.
- Make parsing results deterministic where possible.
- Retain alternative derivations instead of discarding them.
- Enforce input and compute limits.
- Treat ambiguity as an evidence-based result.
- Never convert “not found within limits” into “unambiguous.”

## 3. Technology and Environment

### Backend

- Python 3.11 or a compatible version.
- FastAPI.
- Uvicorn.
- Pydantic.
- pytest.

Suggested `backend/requirements.txt`:

```text
fastapi
uvicorn[standard]
pydantic
pytest
httpx
```

Pin exact versions in the finished project after verifying them in the target environment.

### Frontend

- React 19 with Vite, TypeScript, and Tailwind CSS.
- D3.js (v7) for interactive SVG parse tree visualization with pan, zoom, node selection, and side-by-side comparison.
- Lucide React for consistent UI iconography.

*Decision Record:* Per user instruction and Node.js v24 environment compatibility, React was selected in place of legacy Angular 11.

## 4. Suggested Folder Structure

```text
grammarscope/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── grammar_routes.py
│   │   │   ├── parser_routes.py
│   │   │   └── ambiguity_routes.py
│   │   ├── core/
│   │   │   ├── grammar.py
│   │   │   ├── tokenizer.py
│   │   │   ├── validation.py
│   │   │   ├── first_follow.py
│   │   │   ├── earley_parser.py
│   │   │   ├── parse_forest.py
│   │   │   ├── parse_tree.py
│   │   │   ├── ambiguity.py
│   │   │   ├── cyk_parser.py
│   │   │   └── grammar_conversion.py
│   │   ├── schemas/
│   │   │   ├── grammar_schemas.py
│   │   │   ├── parser_schemas.py
│   │   │   └── ambiguity_schemas.py
│   │   ├── services/
│   │   │   ├── grammar_service.py
│   │   │   ├── parser_service.py
│   │   │   └── ambiguity_service.py
│   │   └── utils/
│   │       ├── limits.py
│   │       └── errors.py
│   ├── tests/
│   │   ├── test_grammar.py
│   │   ├── test_parser.py
│   │   ├── test_ambiguity.py
│   │   ├── test_first_follow.py
│   │   └── test_cyk.py
│   └── requirements.txt
├── frontend/
│   └── src/app/
│       ├── core/
│       ├── shared/
│       ├── pages/
│       │   ├── dashboard/
│       │   ├── grammar-editor/
│       │   ├── parse-tree/
│       │   ├── ambiguity-analyzer/
│       │   └── algorithm-playground/
│       ├── services/
│       └── models/
├── docs/
│   ├── architecture.md
│   ├── algorithms.md
│   ├── api.md
│   └── limitations.md
└── README.md
```

## 5. Grammar Format and Data Model

### 5.1 Accepted notation

Support a documented notation such as:

```text
E -> E + E | E * E | ( E ) | id
```

A production line can contain one or more alternatives. Repeated left-hand sides should be merged into the same nonterminal's production list.

Document epsilon notation explicitly, for example `ε` or `epsilon`. Internally represent epsilon as an empty right-hand-side sequence, not as a terminal token.

### 5.2 Tokenization

Do not blindly split every input character if the grammar contains multi-character terminals. Define two modes:

1. **Whitespace-token mode:** `id + id` is tokenized into `["id", "+", "id"]`.
2. **Explicit token mode:** the request supplies an array such as `["id", "+", "id"]`.

If a compact input such as `id+id` is supported, tokenize it against declared terminal symbols using a documented strategy and report cases where tokenization is ambiguous.

### 5.3 Internal model

Use data structures equivalent to:

```python
from dataclasses import dataclass
from typing import Tuple

@dataclass(frozen=True)
class Production:
    id: int
    lhs: str
    rhs: Tuple[str, ...]

@dataclass
class Grammar:
    start_symbol: str
    nonterminals: set[str]
    terminals: set[str]
    productions: list[Production]
```

Production IDs should be stable within one parsed grammar. Preserve them in parse-tree nodes for diagnostics and structural comparison.

## 6. Grammar Validation

Implement `validation.py` with structured diagnostics.

### Errors

- Malformed production syntax.
- Missing left-hand side.
- Undefined start symbol.
- Invalid or inconsistent symbol declarations.
- Invalid epsilon usage.
- Empty grammar.

### Warnings or information

- Unreachable nonterminals.
- Nonproductive nonterminals.
- Duplicate productions.
- Symbols that appear unused.
- Grammar constructs not supported by a selected analysis operation.

Do not silently rewrite user input. Return line and column information where practical.

## 7. Parsing Engine

### 7.1 Earley parser

Use an Earley parser for general CFG recognition. An Earley state can be represented as:

```text
(production_id, dot_position, origin_position)
```

For each input position, maintain a chart of states. Implement the three main operations:

- **Predictor:** add productions for the next expected nonterminal.
- **Scanner:** advance a state when the next terminal matches the input token.
- **Completer:** advance states that were waiting for a nonterminal completed at the current position.

Use agenda/queue processing and deduplicate equivalent states in each chart. This handles left recursion more safely than a naive recursive-descent parser.

### 7.2 Multiple parses

Recognition alone is insufficient for ambiguity analysis. Add a parse forest or an equivalent packed representation that retains distinct derivations.

Recommended concepts:
- A symbol node keyed by symbol and input span.
- Packed alternatives representing production and child combinations.
- Memoized forest construction.
- Cycle-aware extraction.
- A maximum number of extracted trees.
- Structural canonicalization to avoid counting duplicate representations.

Be careful with nullable cycles and cyclic forests. A parser may recognize a string even when naive enumeration of derivations does not terminate. Define how such cases are represented and return `inconclusive` if the implementation cannot safely establish a complete tree count.

### 7.3 Parse-tree structure

Return JSON nodes with fields such as:

```json
{
  "symbol": "E",
  "kind": "nonterminal",
  "production_id": 1,
  "production": "E -> E + E",
  "children": []
}
```

Terminal nodes should use `"kind": "terminal"`. Epsilon should be represented consistently—either as an explicit epsilon leaf for display or as an empty child list plus production metadata. Document the choice.

### 7.4 Tree identity

Two parse trees are distinct if their ordered grammar-symbol/production structures differ according to the application's defined tree identity rules. Preserve production identity where needed. Do not count the same tree twice because it was reached by different internal search paths.

## 8. Ambiguity Analysis

### 8.1 String-level analysis

Given grammar `G` and token sequence `w`:

1. Parse the grammar and validate the start symbol.
2. Run recognition for `w`.
3. If no parse exists, return `no_parse`.
4. Build or query the parse forest.
5. Extract distinct parse trees, stopping after two if the only question is whether ambiguity exists.
6. If two distinct trees are found, return `ambiguous`.
7. If exhaustive analysis establishes exactly one tree, return `unique_parse`.
8. If limits or unsupported cyclic cases prevent a conclusion, return `inconclusive`.

A result of `unique_parse` requires completed analysis sufficient to rule out a second distinct parse. Finding only one tree before hitting a limit is not enough.

### 8.2 Grammar-level analysis

General CFG ambiguity is undecidable. Implement a **bounded witness search**, not a universal decision procedure.

Suggested process:

1. Generate candidate strings derivable from the grammar in a systematic order.
2. Deduplicate candidate token sequences.
3. Parse each candidate while retaining alternative parses.
4. If two distinct parse trees are found for any candidate, return the candidate as an ambiguity witness.
5. Stop at configured candidate, length, or time limits.
6. If no witness is found before normal exhaustion of the configured search space, return `no_witness_within_limits`.
7. If execution is interrupted or a candidate could not be analyzed, return `inconclusive`.

The result must include the limits and search statistics. A bounded search cannot prove the grammar is unambiguous.

### 8.3 Result schema

Use a stable schema similar to:

```json
{
  "status": "ambiguous",
  "scope": "string",
  "input_tokens": ["id", "+", "id", "*", "id"],
  "distinct_parse_count_found": 2,
  "trees": [],
  "complete": true,
  "limits_reached": [],
  "message": "Two distinct parse trees were found for this input."
}
```

Possible statuses:
- `ambiguous`
- `unique_parse`
- `no_parse`
- `no_witness_within_limits`
- `inconclusive`
- `unsupported`

Do not use `unique_parse` as the status for a grammar-level bounded search.

## 9. REST API

Use Pydantic request and response models. Suggested endpoints:

### `GET /api/health`

Returns application health and version information.

### `POST /api/grammar/validate`

Request:
```json
{
  "grammar": "E -> E + E | id",
  "start_symbol": "E"
}
```

Return validity, detected symbols, diagnostics, and nullable/reachable information if available.

### `POST /api/parser/parse`

Accept a grammar, start symbol, input string or token array, and optional tree limit. Return membership, parse trees or forest metadata, completion status, and duration.

### `POST /api/ambiguity/string`

Analyze whether one supplied input string has multiple distinct parses. Return the status, trees, and completion/limit metadata.

### `POST /api/ambiguity/grammar`

Run bounded witness search. Accept limits such as:
- `max_tokens`
- `max_candidates`
- `timeout_seconds`

Return the result status, witness if found, trees, and search statistics.

### `POST /api/grammar/first-follow`

Return FIRST and FOLLOW sets for all nonterminals.

### `POST /api/parser/cyk`

Run CYK for supported CNF grammars or a documented conversion path. Return the recognition result and chart/table data.

### API implementation rules

- Use consistent error schemas.
- Configure CORS for the frontend development origin.
- Validate payload size and input length.
- Apply compute limits.
- Do not expose stack traces to clients.
- Do not execute user-supplied code.
- Keep endpoint handlers thin; delegate work to service and core modules.

## 10. Frontend Implementation

### Pages

1. **Dashboard:** quick-start examples and actual session metrics.
2. **Grammar Editor:** multiline grammar input, start-symbol selector, validation feedback.
3. **Parse Tree Viewer:** input entry, tree visualization, node details, tree selector.
4. **Ambiguity Analyzer:** string and grammar modes, search limits, status and evidence.
5. **Algorithm Playground:** FIRST/FOLLOW, CYK table, and later LL(1) analysis.
6. **Documentation:** grammar syntax, algorithms, result meanings, limitations.

### Visualization

Use Cytoscape.js or D3.js. Convert backend tree nodes into visualization nodes and parent-child edges. The displayed tree must come from backend results, never hardcoded examples.

Provide:
- Terminal/nonterminal distinction.
- Zoom and pan.
- Node selection and production details.
- Tree switching.
- Side-by-side or toggled comparison of two trees.
- Empty, loading, error, and limit-reached states.
- Keyboard-accessible controls where possible.

### Frontend services

Create typed Angular services for grammar validation, parsing, and ambiguity endpoints. Centralize API base URL configuration and error handling. Keep HTTP calls out of presentation components where practical.

## 11. FIRST and FOLLOW

Implement as a separate module after grammar parsing is stable.

- FIRST(X): terminals that can begin strings derived from X, including epsilon when applicable.
- FOLLOW(A): terminals that can immediately follow nonterminal A in a sentential form; include end marker `$` in FOLLOW(start symbol).

Use fixed-point iteration until sets stop changing. Test nullable sequences and recursive productions carefully.

## 12. CYK and Grammar Conversion

CYK requires a grammar in Chomsky Normal Form, subject to the chosen convention for epsilon and the start symbol.

Implementation order:
1. Implement and test CNF conversion.
2. Preserve a mapping from transformed productions to original productions where feasible.
3. Build the CYK dynamic-programming table.
4. Add backpointers for parse reconstruction.
5. Retain multiple backpointers if multiple parses are to be reconstructed.
6. Document that normalized parse trees may not match the original grammar's exact tree shape.

Do not add CYK before the base parser and ambiguity tests are reliable.

## 13. Resource Limits and Reliability

Add configurable limits for:
- Grammar text length.
- Number of productions.
- Input token count.
- Parse time.
- Maximum extracted trees.
- Maximum grammar-search candidates.
- Maximum candidate length.

If a limit is reached before a conclusion is established, return `inconclusive`. If two distinct trees have already been found, ambiguity is confirmed even if further enumeration is stopped.

Handle left recursion, nullable cycles, malformed input, and highly ambiguous grammars without uncontrolled recursion or memory growth.

## 14. Testing Plan

Use pytest for backend tests.

### Grammar tests
- Valid and invalid productions.
- Alternatives.
- Epsilon.
- Undefined symbols.
- Duplicate productions.
- Unreachable and nonproductive symbols.

### Recognition tests
- Accepted string.
- Rejected string.
- Empty string where supported.
- Multi-character terminals.
- Left-recursive grammar.
- Nested parentheses.

### Ambiguity tests

Ambiguous grammar:
```text
E -> E + E | E * E | id
```

Input:
```text
id + id * id
```

Expected: `ambiguous`, with two distinct trees.

Precedence grammar:
```text
E -> E + T | T
T -> T * F | F
F -> ( E ) | id
```

Input:
```text
id + id * id
```

Expected: one parse tree, with `unique_parse` only if the parser completes exhaustive ambiguity analysis for this input.

Also test:
- Left recursion that is not itself ambiguous.
- Epsilon productions.
- No-parse input.
- Duplicate-tree prevention.
- Tree-limit interruption.
- Grammar search with no witness within limits.
- Timeout and unsupported cases.
- Forests containing cycles or nullable recursion.

### API tests
- Valid request.
- Malformed request.
- Invalid grammar.
- Resource-limit response.
- Correct JSON schemas.

Run tests with:

```bash
cd backend
python -m pytest -q
```

## 15. Development Phases and Deliverables

### Phase 1 — Environment and skeleton
- Inspect repository and installed versions.
- Set up FastAPI and Angular.
- Add health endpoint and frontend connectivity.
- Document setup commands.

**Exit criteria:** frontend can call backend health endpoint.

### Phase 2 — Grammar model and validation
- Implement grammar notation parsing.
- Implement tokenization rules.
- Validate symbols and productions.
- Add unit tests.

**Exit criteria:** valid grammars are represented correctly and invalid grammars return clear diagnostics.

### Phase 3 — Parser and parse representation
- Implement Earley recognition.
- Build a parse forest or equivalent multi-parse representation.
- Extract parse trees and canonicalize tree identity.
- Test recursion and epsilon.

**Exit criteria:** parser accepts and rejects test strings correctly and can preserve multiple parses.

### Phase 4 — String ambiguity
- Implement the status model.
- Detect two distinct trees.
- Prove unique parse only after exhaustive analysis for the input.
- Add resource-limit handling.

**Exit criteria:** ambiguous, unique, no-parse, and inconclusive results are distinguished correctly.

### Phase 5 — Grammar witness search
- Generate candidate strings.
- Add candidate and time limits.
- Return a witness with two trees when found.
- Report no witness within limits without claiming unambiguity.

**Exit criteria:** every confirmed witness is backed by two valid, distinct trees.

### Phase 6 — UI and visualization
- Build grammar editor and analysis pages.
- Connect typed services.
- Render backend trees.
- Add tree comparison and node inspection.

**Exit criteria:** complete end-to-end flow works through the UI.

### Phase 7 — Learning features
- Add FIRST/FOLLOW.
- Add CYK and CNF conversion.
- Add examples and algorithm explanations.
- Add AST only for explicitly supported mappings.

**Exit criteria:** optional learning features pass their tests.

### Phase 8 — Hardening and documentation
- Test resource limits and malformed input.
- Improve accessibility and error handling.
- Write README and algorithm documentation.
- Verify setup on a clean environment.

**Exit criteria:** documented installation and test commands work.

## 16. Local Development Commands

### Backend

Create and activate a virtual environment, then install dependencies.

Windows PowerShell example:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API should be available at `http://127.0.0.1:8000`, with interactive documentation at `/docs`.

### Frontend

Use the compatible Node.js version and Angular CLI for the chosen Angular 11 release.

```bash
cd frontend
npm install
npx ng serve
```

The development server commonly runs at `http://localhost:4200`. Configure the frontend API URL and backend CORS origin consistently.

## 17. Definition of Done

A feature is complete only when:
- It is implemented, not just represented in the UI.
- It has tests for normal and edge cases.
- It handles invalid input.
- It respects compute limits.
- It reports limitations truthfully.
- Its frontend uses real backend output.
- Its documentation explains how to use and test it.

## 18. Final Engineering Checklist

- [x] Grammar parser and validator work.
- [x] Terminal tokenization is documented.
- [x] Earley recognition handles left recursion.
- [x] Parse forest preserves alternatives.
- [x] Distinct parse trees are counted correctly.
- [x] String ambiguity is evidence-based.
- [x] Unique parse requires exhaustive completion.
- [x] Grammar-level search is explicitly bounded.
- [x] No bounded search claims to prove unambiguity.
- [x] Tree visualizer uses actual backend data.
- [x] Resource limits and timeouts work.
- [x] FIRST/FOLLOW tests pass.
- [x] CYK works for supported CNF inputs.
- [x] API and frontend integration tests pass.
- [x] Setup, algorithms, and limitations are documented.
