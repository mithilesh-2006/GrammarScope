# GrammarScope — Project Description

## 1. Project Title

**GrammarScope: Interactive Syntax Tree Generator and Grammar Ambiguity Analyzer**

## 2. Abstract

GrammarScope is an educational web application designed to help students explore context-free grammars (CFGs), generate parse trees, and investigate ambiguity in formal languages and compiler design. Users can enter a grammar and an input string, validate the grammar, check whether the string can be generated, visualize its parse tree, and determine whether multiple distinct parse trees exist for that string.

The application also provides a bounded grammar-level ambiguity search. If it discovers a string with two distinct parse trees, it can provide that string as concrete evidence of ambiguity. If it does not find a witness within its configured limits, it must report that no witness was found within the search limits—not claim that the grammar is unambiguous. This distinction is important because general ambiguity detection for arbitrary context-free grammars is undecidable.

The project combines compiler theory, parsing algorithms, interactive visualization, and a full-stack web architecture in a single learning tool.

## 3. Problem Statement

Students often find it difficult to understand how context-free grammars derive strings, how parse trees represent derivations, and how ambiguity arises when one string can have multiple parse trees. Manual construction and comparison of parse trees can be tedious, particularly for recursive grammars and arithmetic expressions.

GrammarScope addresses this problem by providing a visual environment in which users can define grammars, test input strings, inspect parse trees, compare alternative parses, and learn the limitations of ambiguity analysis.

## 4. Objectives

- Allow users to enter and validate context-free grammars.
- Identify terminals, nonterminals, productions, and the start symbol.
- Determine whether an input string belongs to the grammar.
- Generate concrete parse trees for valid strings.
- Detect string-level ambiguity by finding two or more distinct parse trees.
- Compare alternative parse trees visually.
- Search for ambiguity witnesses within configurable grammar-analysis limits.
- Explain whether a result is confirmed, unique, absent, or inconclusive.
- Present parsing concepts through examples and step-by-step explanations.
- Provide a modular, testable foundation for additional compiler-design features.

## 5. Scope

### Core features

1. **Grammar editor**
   - Accept productions such as `E -> E + E | id`.
   - Support alternatives, blank lines, and documented epsilon notation.
   - Allow start-symbol selection.
   - Validate malformed productions and undefined symbols.

2. **String parser**
   - Accept an input string or explicit token sequence.
   - Determine whether the string can be derived from the grammar.
   - Return parsing errors in a readable format.

3. **Parse tree generator**
   - Generate concrete parse trees from actual parsing results.
   - Display nonterminals as internal nodes and terminals as leaves.
   - Preserve production information.
   - Handle supported epsilon productions and recursive rules.

4. **String ambiguity analyzer**
   - Search for distinct parse trees for one input string.
   - Confirm ambiguity when at least two distinct trees are found.
   - Establish a unique parse only when the analysis has completed sufficiently to rule out additional parses.
   - Report resource-limit interruptions as inconclusive.

5. **Grammar ambiguity explorer**
   - Search generated candidate strings for ambiguity witnesses.
   - Allow configurable search length, candidate count, and execution time.
   - Report a witness when found.
   - Never claim that a bounded search proves a grammar unambiguous.

6. **Interactive visualization**
   - Render parse trees.
   - Switch between alternative trees.
   - Inspect node symbols and applied productions.
   - Zoom and pan where supported.

### Planned extensions

- FIRST and FOLLOW set computation.
- Nullable, reachable, and productive nonterminal analysis.
- CYK parsing for supported Chomsky Normal Form grammars.
- LL(1) parsing-table analysis.
- Parsing-step visualization.
- Abstract Syntax Tree (AST) generation for grammars with defined transformation rules.
- Saving grammars and analysis history using SQLite.

## 6. Intended Users

- Computer Science and Information Technology students.
- Students studying compiler design and formal languages.
- Instructors demonstrating parsing and grammar ambiguity.
- Developers learning context-free grammars and parsing algorithms.

## 7. Proposed Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Angular 11, TypeScript, HTML, CSS | User interface and grammar editor |
| Visualization | Cytoscape.js or D3.js | Interactive tree rendering |
| Backend | Python and FastAPI | REST APIs and orchestration |
| Parsing engine | Custom, tested Python modules | Grammar processing and parsing |
| Tests | pytest | Automated correctness testing |
| Optional storage | SQLite | Saved grammars and history |

Angular 11 is an older release. Pin compatible dependencies and document the required Node.js version. If the existing environment already uses a supported newer framework, record that decision before changing the stack.

## 8. High-Level Workflow

1. The user enters a context-free grammar.
2. GrammarScope parses and validates the grammar.
3. The user selects the start symbol and supplies an input string.
4. The parser checks whether the string belongs to the grammar.
5. The parse engine constructs one or more parse trees.
6. The ambiguity analyzer compares distinct trees.
7. The frontend displays the result, tree visualization, and explanation.
8. For grammar-level analysis, the system searches candidate strings within explicit limits and reports the scope of the search.

## 9. Result Categories

| Result | Meaning |
|---|---|
| Ambiguity confirmed | At least two distinct parse trees were found for the same string |
| Unique parse confirmed | The relevant parse analysis completed and established exactly one parse tree |
| No parse | The input string cannot be derived from the grammar |
| No witness found within limits | The bounded grammar search found no ambiguous string in its explored search space |
| Inconclusive | A time, tree, candidate, or other resource limit prevented a conclusion |
| Unsupported | The requested operation includes grammar features not supported by the implementation |

The interface must distinguish string-level results from grammar-level results.

## 10. Technical Approach

The parsing engine should use a general context-free parsing method, such as Earley parsing, with a representation capable of retaining multiple derivations. A shared packed parse forest is a suitable approach for representing alternative parses compactly.

A recognizer that only answers whether a string is accepted is not sufficient for ambiguity detection. The engine must preserve and compare parse structures. Duplicate representations of the same tree must not be counted as separate trees.

Grammar-level analysis should use bounded witness search. General ambiguity detection for arbitrary context-free grammars is undecidable, so a finite search that finds no witness cannot prove unambiguity.

## 11. Expected Outcomes

- A working web application for entering and validating CFGs.
- A parser that checks input-string membership.
- A parse-tree visualizer driven by real parser output.
- A string-level ambiguity detector that can present two parse trees as evidence.
- A bounded grammar-level ambiguity explorer with honest result classifications.
- Automated tests for grammar validation, parsing, tree comparison, and ambiguity results.
- Documentation explaining architecture, algorithms, setup, and theoretical limitations.

## 12. Example Use Case

Grammar:

```text
E -> E + E | E * E | ( E ) | id
```

Input:

```text
id + id * id
```

This grammar permits both `id + (id * id)` and `(id + id) * id`. If the parser constructs two distinct valid parse trees for this input, GrammarScope reports that the input string is ambiguous under the supplied grammar and displays both trees.

## 13. Limitations

- General ambiguity detection for arbitrary CFGs cannot be decided by a universal algorithm.
- Grammar-level search is bounded by candidate length, candidate count, and execution time.
- Parse-tree enumeration may grow exponentially for highly ambiguous grammars.
- Tokenization rules must be explicit, especially for multi-character terminals such as `id` and `num`.
- AST generation requires a defined transformation and cannot be inferred correctly for every arbitrary CFG.
- CNF conversion can change the shape of parse trees even when language membership is preserved.

## 14. Success Criteria

The project is successful when users can define a supported grammar, validate it, test an input string, see actual parse trees, and receive a correct ambiguity classification. Every confirmed ambiguity result must include a concrete string and two distinct parse trees. Every incomplete search must be labelled accordingly, and no bounded grammar search may be presented as a proof of unambiguity.

## 15. Conclusion

GrammarScope turns abstract compiler-design concepts into an interactive learning experience. By combining grammar validation, parse-tree generation, evidence-based ambiguity detection, and visual comparison, it helps users understand how grammars generate strings and why multiple interpretations can occur.
