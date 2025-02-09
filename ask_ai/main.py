from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from openai import OpenAI
import os
import requests
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

# FastAPI instance
app = FastAPI()

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to specific frontend URL for security
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods, including OPTIONS
    allow_headers=["*"],  # Allow all headers, including Authorization
)


# OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
AUTH_SERVICE_URL = (
    os.getenv("AUTH_SERVICE_URL", "http://auth_service:8001") + "/verify-token"
)


if not OPENAI_API_KEY:
    raise ValueError("⚠️ OPENAI_API_KEY is missing! Please set it in .env")

# Set OpenAI API key
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
)


# Request Model
class QueryModel(BaseModel):
    prompt: str
    model: str = "gpt-4"  # Default to GPT-4


security = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials):
    """Verify token by calling auth_service"""
    token = credentials.credentials
    response = requests.get(
        AUTH_SERVICE_URL, headers={"Authorization": f"Bearer {token}"}
    )
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")
    return response.json()


@app.post("/ask")
async def ask_ai(
    query: QueryModel, credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Query OpenAI API and return a response only if the user is authenticated."""
    try:
        completion = client.chat.completions.create(
            model=query.model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": query.prompt},
            ],
        )

        return {
            "response": completion.choices[0].message.content.strip(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
