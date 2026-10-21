from dataclasses import dataclass, field
from typing import List, Optional, Tuple, Dict, Any

@dataclass
class ParseTreeNode:
    symbol: str
    kind: str  # "nonterminal", "terminal", "epsilon"
    production_id: Optional[int] = None
    production_str: Optional[str] = None
    children: List['ParseTreeNode'] = field(default_factory=list)
    span: Optional[Tuple[int, int]] = None

    def canonical_signature(self) -> Tuple[Any, ...]:
        """
        Returns a recursive tuple signature that uniquely identifies the tree structure.
        Two trees are structurally identical iff their canonical signatures match.
        """
        if self.kind == "terminal":
            return ("T", self.symbol)
        elif self.kind == "epsilon":
            return ("EPS",)
        else:
            return (
                "NT",
                self.symbol,
                self.production_id,
                tuple(c.canonical_signature() for c in self.children)
            )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "symbol": self.symbol,
            "kind": self.kind,
            "production_id": self.production_id,
            "production": self.production_str,
            "span": list(self.span) if self.span else None,
            "children": [c.to_dict() for c in self.children]
        }

    def to_bracketed_string(self) -> str:
        if self.kind == "terminal":
            return self.symbol
        if self.kind == "epsilon":
            return "ε"
        sub = " ".join(c.to_bracketed_string() for c in self.children)
        return f"[{self.symbol} {sub}]"
