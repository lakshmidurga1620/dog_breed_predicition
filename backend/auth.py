# auth.py
from fastapi import HTTPException, Header
from typing import Optional
import jwt
import requests
import os
from dotenv import load_dotenv
from functools import lru_cache
import base64
import json
import time

# Load environment variables
load_dotenv()

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_PUBLISHABLE_KEY = os.getenv("CLERK_PUBLISHABLE_KEY")


def get_clerk_frontend_api() -> str:
    """Extract Clerk frontend API domain from publishable key"""
    if not CLERK_PUBLISHABLE_KEY:
        raise ValueError("CLERK_PUBLISHABLE_KEY not configured")

    try:
        parts = CLERK_PUBLISHABLE_KEY.split('_')
        if len(parts) >= 3:
            encoded_part = '_'.join(parts[2:])
            decoded = base64.b64decode(encoded_part + '==').decode('utf-8')
            return decoded
    except Exception as e:
        print(f"Error decoding Clerk frontend API: {e}")

    # Fallback default (for your key format)
    return "capital-grouper-91.clerk.accounts.dev"


@lru_cache()
def get_clerk_jwks():
    """Fetch Clerk JWKS (cached). Retries if fails."""
    try:
        frontend_api = get_clerk_frontend_api().rstrip('$').strip()
        jwks_url = f"https://{frontend_api}/.well-known/jwks.json"

        print(f"Fetching JWKS from: {jwks_url}")
        response = requests.get(jwks_url, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"First JWKS fetch failed: {e}")
        time.sleep(1)  # retry after 1s

        try:
            response = requests.get(jwks_url, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e2:
            print(f"Second JWKS fetch failed: {e2}")
            return None


def verify_clerk_token(token: str) -> dict:
    """Verify and decode Clerk JWT token"""
    try:
        jwks = get_clerk_jwks()
        if not jwks:
            raise HTTPException(status_code=500, detail="Unable to fetch JWKS")

        # Extract key ID
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            raise HTTPException(status_code=401, detail="Token missing key ID")

        # Find matching key
        signing_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                signing_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
                break

        if not signing_key:
            raise HTTPException(status_code=401, detail="Invalid token key")

        # Decode token
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            options={"verify_exp": True, "verify_aud": False}
        )

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")

    except jwt.InvalidTokenError as e:
        print(f"JWT Decode Error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

    except Exception as e:
        print(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Get current user — raises 401 if unauthorized"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    payload = verify_clerk_token(token)

    return {
        "user_id": payload.get("sub"),
        "email": payload.get("email"),
        "name": payload.get("name") or payload.get("full_name"),
        "email_verified": payload.get("email_verified", False)
    }


async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """Get user if logged in; otherwise returns None"""
    if not authorization:
        return None

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return None

        payload = verify_clerk_token(token)
        return {
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name") or payload.get("full_name")
        }
    except Exception as e:
        print(f"Optional user auth failed: {e}")
        return None
