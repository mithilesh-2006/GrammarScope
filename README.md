# GrammarScope

> **Interactive Syntax Tree Generator and Grammar Ambiguity Analyzer**

GrammarScope is an educational full-stack web application designed to help students and instructors explore context-free grammars (CFGs), generate concrete parse trees, and investigate ambiguity with mathematical honesty.

Powered by a custom Python context-free parsing engine (Earley algorithm) with a cycle-aware Shared Packed Parse Forest (SPPF) and an interactive React frontend with D3.js visualization.

---

## Key Features

1. **CFG Editor & Live Diagnostics**
   - Supports productions of the form `E -> E + E | id` and `::=`.
   - Supports explicit epsilon notation: `ε`, `epsilon`, or empty RHS.
   - Computes nonterminals, terminals, start symbol, nullable symbols, reachable symbols, and productive symbols.
   - Returns structured syntax errors and warnings (with line/column references).

2. **General Context-Free Parsing (Earley Engine)**
   - General Earley parsing handles arbitrary CFGs, including direct/indirect left recursion and epsilon productions.
   - Retains alternative derivations via a Shared Packed Parse Forest rather than a boolean recognizer.
   - Extracts distinct canonical parse trees while preventing duplicate representations.

3. **Evidence-Based Ambiguity Detection**
   - **String-level analysis:** Extracts distinct parse trees for an input string. If two distinct trees are found, ambiguity is confirmed with concrete visual evidence.
   - **Grammar-level bounded search:** Explores candidate terminal strings systematically using leftmost derivation BFS. Discovers ambiguity witnesses (e.g., `id + id * id` having two parse trees) within configurable candidate, length, and time bounds.
   - **Honest reporting of undecidability:** If no witness is found within limits, it reports `no_witness_within_limits`—never claiming that a finite search proves an arbitrary CFG is unambiguous.

4. **Interactive Parse Tree Visualization**
   - Interactive D3.js SVG tree rendering with pan, zoom, reset, and fit-to-view controls.
   - Node styling distinguishing nonterminals, terminals, and epsilon leaves.
   - Clickable node inspector displaying symbol, production rule, and token span.
   - Side-by-side comparison mode to inspect alternative derivations simultaneously.

5. **Algorithm Playground**
   - **FIRST & FOLLOW sets:** Iterative fixed-point computation for top-down parser design.
   - **CYK Parser:** Converts CFGs to Chomsky Normal Form (CNF) and renders the full dynamic programming 2D triangular table.

---

## Architecture

- **Backend**: Python 3.11, FastAPI, Pydantic, Uvicorn, pytest.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, D3.js v7, Lucide React.

```text
compiler_design_mini_project/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (grammar, parser, ambiguity)
│   │   ├── core/         # Earley parser, SPPF, ambiguity analyzer, FIRST/FOLLOW, CYK
│   │   ├── schemas/      # Pydantic request & response models
│   │   ├── services/     # Orchestration service layer
│   │   └── utils/        # Limits & error hierarchies
│   ├── tests/            # 26 automated unit & API test cases
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # InteractiveTreeViewer (D3), Navbar, StatusBadge
│   │   ├── pages/        # Dashboard, Editor, Parse Tree, Ambiguity, Playground, Docs
│   │   ├── services/     # Typed API client
│   │   └── types/        # TypeScript interfaces
│   └── package.json
├── GrammarScope_Project_Description.md
├── GrammarScope_Implementation.md
└── README.md
```

---

## How to Run

### 1. Backend (FastAPI)

```powershell
# Open terminal in backend folder:
cd backend

# Run with virtual environment:
.\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

- API Base: `http://127.0.0.1:8000`
- Swagger Interactive Documentation: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

### 2. Frontend (React + Vite)

```bash
# In a second terminal in frontend folder:
cd frontend

# Start Vite dev server:
npm run dev
```

- Web UI will be available at: `http://localhost:5173` (or the port shown by Vite).

### 3. Run Automated Tests

```powershell
cd backend
.\.venv\Scripts\python -m pytest -v
```

All 26 automated tests verify:
- Grammar parsing, alternative merging, and epsilon handling
- Tokenization modes (auto, whitespace, compact maximal-munch)
- Left-recursion, nested parentheses, and epsilon Earley recognition
- Ambiguity confirmation with 2 distinct parse trees (`id + id * id`)
- Unambiguous precedence grammar analysis (`unique_parse`)
- Bounded witness search and `no_witness_within_limits` reporting
- FIRST & FOLLOW sets calculation
- CNF conversion and CYK triangular table generation
- FastAPI endpoint schemas and error responses
