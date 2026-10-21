class GrammarScopeError(Exception):
    """Base exception for GrammarScope errors."""
    pass

class GrammarSyntaxError(GrammarScopeError):
    def __init__(self, message: str, line: int = 1, column: int = 1):
        super().__init__(f"Line {line}, Col {column}: {message}")
        self.message = message
        self.line = line
        self.column = column

class TokenizationError(GrammarScopeError):
    def __init__(self, message: str, position: int = 0):
        super().__init__(f"Position {position}: {message}")
        self.message = message
        self.position = position

class ResourceLimitExceededError(GrammarScopeError):
    def __init__(self, limit_name: str, limit_val: object):
        super().__init__(f"Resource limit exceeded for {limit_name}: {limit_val}")
        self.limit_name = limit_name
        self.limit_val = limit_val
