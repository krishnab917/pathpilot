from supabase import AsyncClient
from app.repositories.protocols import StudentRepository

class SupabaseStudentRepository(StudentRepository):
    """Supabase adapter. Domain services depend on the StudentRepository port, not this SDK."""
    def __init__(self, client: AsyncClient) -> None: self._client = client
    async def profile_context(self, user_id: str) -> dict:
        result = await self._client.table("student_profiles").select("*").eq("user_id", user_id).single().execute()
        return result.data or {}
