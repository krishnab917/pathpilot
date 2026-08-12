from typing import Protocol, TypeVar
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)
class StructuredAIClient(Protocol):
    async def generate(self, *, system: str, user: str, response_model: type[T]) -> T: ...

class AIProviderNotConfigured(RuntimeError):
    pass

class UnconfiguredAIClient:
    async def generate(self, *, system: str, user: str, response_model: type[T]) -> T:
        raise AIProviderNotConfigured("An AI provider must be configured before this service can generate guidance.")
