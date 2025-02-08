from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


# Temporary in-memory task list
tasks = ["Buy Milk", "Do Laundry", "Clean House", "Learn FastAPI"]


class TaskModel(BaseModel):
    task: str


@app.get("/", response_model=List[str])
def root():
    return {"message": "Hello World"}


@app.get("/tasks", response_model=List[str])
def get_tasks():
    return tasks


@app.post("/tasks")
def add_task(task: TaskModel):
    tasks.append(task.task)
    return {"message": "Task added successfully"}


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    if 0 <= task_id < len(tasks):
        tasks.pop(task_id)
        return {"message": "Task removed successfully"}
    return {"error": "Invalid task ID"}
