import os
import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
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
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client.todo_db  # Database name
collection = db.todos  # Collection name


# Temporary in-memory task list


class TaskModel(BaseModel):
    task: str


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


@app.get("/tasks", response_model=List[str])
async def get_tasks():
    tasks = await collection.find().to_list(100)
    return [task["task"] for task in tasks]


@app.post("/tasks")
async def add_task(task: TaskModel):
    new_task = {"task": task.task}
    await collection.insert_one(new_task)
    return {"message": "Task added successfully"}


@app.delete("/tasks/{task_id}")
async def delete_task(task_id: int):
    """Delete a task from MongoDB."""
    result = await collection.delete_one({"_id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task removed successfully"}
