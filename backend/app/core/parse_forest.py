from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Set, Dict, Any
import itertools
from app.core.grammar import Production
from app.core.parse_tree import ParseTreeNode

class ForestCycleError(Exception):
    """Raised when an unbounded cycle is detected in parse forest extraction."""
    pass

@dataclass
class ForestNode:
    """Base class for nodes in the parse forest."""
    span: Tuple[int, int]

@dataclass
class TerminalNode(ForestNode):
    symbol: str

    def __hash__(self):
        return hash(("T", self.symbol, self.span))

    def __eq__(self, other):
        return isinstance(other, TerminalNode) and self.symbol == other.symbol and self.span == other.span

@dataclass
class EpsilonNode(ForestNode):
    symbol: str = "ε"

    def __hash__(self):
        return hash(("EPS", self.span))

    def __eq__(self, other):
        return isinstance(other, EpsilonNode) and self.span == other.span

@dataclass
class Derivation:
    production: Production
    children: Tuple[ForestNode, ...]

    def __hash__(self):
        return hash((self.production.id, tuple(id(c) for c in self.children)))

    def __eq__(self, other):
        return (
            isinstance(other, Derivation) and
            self.production.id == other.production.id and
            len(self.children) == len(other.children) and
            all(c1 is c2 for c1, c2 in zip(self.children, other.children))
        )

@dataclass
class NonterminalNode(ForestNode):
    symbol: str
    derivations: List[Derivation] = field(default_factory=list)

    def __hash__(self):
        return hash(("NT", self.symbol, self.span))

    def __eq__(self, other):
        return isinstance(other, NonterminalNode) and self.symbol == other.symbol and self.span == other.span

    def add_derivation(self, production: Production, children: List[ForestNode]):
        children_tuple = tuple(children)
        for d in self.derivations:
            if d.production.id == production.id and len(d.children) == len(children_tuple):
                if all(c1 is c2 or c1 == c2 for c1, c2 in zip(d.children, children_tuple)):
                    return
        self.derivations.append(Derivation(production=production, children=children_tuple))

class ParseForest:
    def __init__(self, root: Optional[NonterminalNode] = None):
        self.root = root
        self.has_cycle: bool = False

    def extract_trees(self, max_trees: int = 10) -> Tuple[List[ParseTreeNode], bool]:
        """
        Extracts up to max_trees distinct parse trees from the forest.
        Returns:
          (trees, complete)
          complete is True if all possible trees were extracted without hitting max_trees or cycle limits.
        """
        if not self.root:
            return ([], True)

        seen_signatures: Set[Tuple[Any, ...]] = set()
        trees: List[ParseTreeNode] = []
        limit_reached = False
        cycle_detected = False

        def _extract(
            node: ForestNode,
            ancestors: Set[Tuple[str, int, int]]
        ) -> List[ParseTreeNode]:
            nonlocal limit_reached, cycle_detected

            if isinstance(node, TerminalNode):
                return [ParseTreeNode(
                    symbol=node.symbol,
                    kind="terminal",
                    span=node.span
                )]

            if isinstance(node, EpsilonNode):
                return [ParseTreeNode(
                    symbol="ε",
                    kind="epsilon",
                    span=node.span
                )]

            if isinstance(node, NonterminalNode):
                anc_key = (node.symbol, node.span[0], node.span[1])
                if anc_key in ancestors:
                    cycle_detected = True
                    return []

                new_ancestors = ancestors | {anc_key}
                node_trees: List[ParseTreeNode] = []

                for deriv in node.derivations:
                    if len(trees) >= max_trees:
                        limit_reached = True
                        break

                    if not deriv.children:
                        # Epsilon production: A -> ε
                        tree = ParseTreeNode(
                            symbol=node.symbol,
                            kind="nonterminal",
                            production_id=deriv.production.id,
                            production_str=str(deriv.production),
                            children=[ParseTreeNode(symbol="ε", kind="epsilon", span=node.span)],
                            span=node.span
                        )
                        node_trees.append(tree)
                        continue

                    # Extract trees for each child
                    child_tree_options: List[List[ParseTreeNode]] = []
                    for child in deriv.children:
                        c_trees = _extract(child, new_ancestors)
                        if not c_trees:
                            # Cannot derive via this child due to cycle or empty
                            break
                        child_tree_options.append(c_trees)

                    if len(child_tree_options) != len(deriv.children):
                        continue

                    # Cartesian product of children's trees
                    for combo in itertools.product(*child_tree_options):
                        tree = ParseTreeNode(
                            symbol=node.symbol,
                            kind="nonterminal",
                            production_id=deriv.production.id,
                            production_str=str(deriv.production),
                            children=list(combo),
                            span=node.span
                        )
                        node_trees.append(tree)
                        if len(node_trees) >= max_trees * 2:
                            break

                return node_trees

            return []

        all_extracted = _extract(self.root, set())
        for t in all_extracted:
            sig = t.canonical_signature()
            if sig not in seen_signatures:
                seen_signatures.add(sig)
                trees.append(t)
                if len(trees) >= max_trees:
                    limit_reached = True
                    break

        if cycle_detected:
            self.has_cycle = True

        complete = not limit_reached and not cycle_detected
        return (trees, complete)
