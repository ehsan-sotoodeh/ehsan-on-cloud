import os
import asyncio
import requests
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from bson import ObjectId
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
import motor.motor_asyncio
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()


app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongodb:27017/todo_db")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client.todo_db  # Database name
collection = db.todos  # Collection name


# Auth service URL
AUTH_SERVICE_URL = "http://auth_service:8001/verify-token"

security = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials):
    """Verify token by calling auth_service"""
    print("validating token")
    token = credentials.credentials
    response = requests.get(
        AUTH_SERVICE_URL, headers={"Authorization": f"Bearer {token}"}
    )
    if response.status_code != 200:
        print("invalid token")
        raise HTTPException(status_code=401, detail="Invalid token")
    return response.json()


# Temporary in-memory task list


class TaskModel(BaseModel):
    task: str
    completed: bool = False


class TaskResponseModel(TaskModel):
    id: str = Field(..., alias="_id")  # Ensure _id is included in response
    task: str
    completed: bool = False

    class Config:
        allow_population_by_field_name = True  # Allow aliasing of _id
        arbitrary_types_allowed = True  # Allow any type (e.g., ObjectId)
        json_encoders = {ObjectId: str}  # Convert ObjectId to string


# Convert MongoDB document to Python dictionary
def task_serializer(task):
    return {
        "_id": str(task["_id"]),
        "task": task["task"],
        "completed": task.get("completed", False),  # Default `completed` if missing
    }  # Convert ObjectId to string


@app.on_event("startup")
async def startup_db_client():
    """Wait for MongoDB to be ready before running FastAPI"""
    retries = 5
    while retries:
        try:
            # Ping MongoDB
            await client.admin.command("ping")
            print("✅ Connected to MongoDB")
            break
        except Exception as e:
            print(f"❌ MongoDB not available yet... Retrying ({retries})")
            retries -= 1
            await asyncio.sleep(3)


@app.get("/", response_model=List[str])
def root():
    return {"message": "Hello World"}


@app.get("/tasks", response_model=List[TaskResponseModel])
async def get_tasks(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Fetch all tasks from MongoDB, ensuring `_id` is converted to string."""
    verify_token(credentials)  # Ensure token is valid
    tasks = await collection.find().to_list(100)
    return list(map(task_serializer, tasks))


@app.post("/tasks", response_model=TaskResponseModel)
async def add_task(task: TaskModel):
    new_task = {"task": task.task}
    result = await collection.insert_one(new_task)
    return {"_id": str(result.inserted_id), "task": task.task}


@app.put("/tasks/{task_id}")
async def update_task(task_id: str, task: TaskModel):
    """Update a task in MongoDB."""
    result = await collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"task": task.task, "completed": task.completed}},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task updated successfully"}


@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """Delete a task from MongoDB."""
    result = await collection.delete_one({"_id": ObjectId(task_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task removed successfully"}
