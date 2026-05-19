from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_user_profile(user_id: str):
    if not user_id:
        return None
    try:
        response = (
            supabase.table("user_profiles")
            .select("*")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        return response.data
    except Exception:
        return None


def upsert_user_profile(profile: dict):
    return supabase.table("user_profiles").upsert(profile, on_conflict="id").execute()
