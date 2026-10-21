from typing import List, Set, Union
from app.utils.errors import TokenizationError

def tokenize_input(
    raw_input: Union[str, List[str]],
    terminals: Set[str],
    mode: str = "auto"
) -> List[str]:
    """
    Tokenizes input according to specified mode and grammar terminals.
    
    Modes:
      - 'explicit': raw_input is already an array of token strings.
      - 'whitespace': splits input on whitespace.
      - 'compact': uses greedy maximal-munch matching against known terminals.
      - 'auto': if whitespace is present, uses whitespace mode; otherwise tries compact matching.
    """
    if isinstance(raw_input, list):
        return [str(tok).strip() for tok in raw_input if str(tok).strip()]

    raw_text = raw_input.strip()
    if not raw_text:
        return []

    if mode == "whitespace":
        return raw_text.split()

    if mode == "explicit":
        # In explicit mode with string, tokenize by space
        return raw_text.split()

    if mode == "compact":
        return _tokenize_compact(raw_text, terminals)

    # mode == 'auto'
    # If there are spaces, tokenize on whitespace
    if any(ch.isspace() for ch in raw_text):
        return raw_text.split()

    # If no spaces, check if all characters are single-character terminals or match terminals
    # If all tokens in raw_text can be matched compactly, do that
    if terminals:
        return _tokenize_compact(raw_text, terminals)

    # Fallback to whitespace split
    return raw_text.split()

def _tokenize_compact(text: str, terminals: Set[str]) -> List[str]:
    """
    Greedy maximal-munch tokenization against a set of terminal symbols.
    """
    # Sort terminals by length descending for maximal munch
    sorted_terminals = sorted(terminals, key=len, reverse=True)
    tokens: List[str] = []
    idx = 0
    n = len(text)

    while idx < n:
        # Skip any whitespace if present
        if text[idx].isspace():
            idx += 1
            continue

        matched = False
        for term in sorted_terminals:
            if text.startswith(term, idx):
                tokens.append(term)
                idx += len(term)
                matched = True
                break

        if not matched:
            raise TokenizationError(
                f"Unexpected character or sequence '{text[idx:]}' cannot be matched to any terminal: {sorted(terminals)}",
                position=idx
            )

    return tokens
