import os
import boto3
import requests
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from jose import jwt, JWTError, jwk
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

AWS_REGION = os.getenv("VITE_COGNITO_REGION", "us-east-1")
USER_POOL_ID = os.getenv("VITE_COGNITO_POOL_ID")
APP_CLIENT_ID = os.getenv("VITE_COGNITO_CLIENT_ID")
COGNITO_ISSUER = f"https://cognito-idp.{AWS_REGION}.amazonaws.com/{USER_POOL_ID}"
JWKS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"


app = FastAPI()

# Cognito client
client = boto3.client("cognito-idp", region_name=AWS_REGION)

security = HTTPBearer()


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthToken(BaseModel):
    access_token: str


# Cache public keys
cognito_keys = None


def get_cognito_public_keys():
    """Fetch Cognito public keys from JWKS endpoint and cache them."""
    global cognito_keys
    if cognito_keys is None:
        try:
            response = requests.get(JWKS_URL)
            response.raise_for_status()
            cognito_keys = response.json()["keys"]
        except requests.RequestException as e:
            raise HTTPException(
                status_code=500, detail=f"Error fetching JWKS keys: {str(e)}"
            )
    return cognito_keys


def verify_token(token: str):
    """Verify and decode JWT token using Cognito Public Key"""
    print("validating token")
    print(token)
    try:
        headers = jwt.get_unverified_header(token)
        kid = headers["kid"]

        # Fetch Cognito public keys
        public_keys = get_cognito_public_keys()

        # Find the matching key
        key = next((key for key in public_keys if key["kid"] == kid), None)
        if key is None:
            raise HTTPException(
                status_code=401, detail="Invalid token: No matching key found"
            )

        # Convert JWK to PEM format
        public_key = jwk.construct(key)
        print(public_key)
        decoded_token = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            issuer=COGNITO_ISSUER,
            audience=APP_CLIENT_ID,
        )
        return decoded_token

    except JWTError as e:
        print(e)
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


@app.post("/login")
def login(credentials: LoginRequest):
    """Authenticate user with Cognito and return access token"""
    try:
        response = client.initiate_auth(
            ClientId=APP_CLIENT_ID,
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": credentials.username,
                "PASSWORD": credentials.password,
            },
        )
        return {"access_token": response["AuthenticationResult"]["AccessToken"]}
    except client.exceptions.NotAuthorizedException:
        raise HTTPException(status_code=401, detail="Invalid username or password")


@app.get("/verify-token")
def verify_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify if a user is authenticated"""
    token = credentials.credentials
    return verify_token(token)
