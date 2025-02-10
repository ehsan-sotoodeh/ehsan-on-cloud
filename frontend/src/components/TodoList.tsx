import React, { useState, useEffect } from "react";
import { Button, Container, Form, ListGroup, Row, Col } from "react-bootstrap";
import { get, post, put, deleteRequest } from "../services/apiService";

const TASK_SERVICE_URL =
  import.meta.env.VITE_TASK_SERVICE_URL || "http://localhost:8000";

interface Task {
  _id: string;
  task: string;
  completed: boolean;
}

const TODOList: React.FC = () => {
  const [task, setTask] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await get(`${TASK_SERVICE_URL}/tasks`);
        if (!data.error) setTasks(data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Add a new task
  const addTask = async () => {
    if (task.trim()) {
      try {
        const newTask = await post(`${TASK_SERVICE_URL}/tasks`, {
          task,
          completed: false,
        });
        if (!newTask.error) setTasks([...tasks, newTask]);
        setTask("");
      } catch (error) {
        console.error("Error adding task:", error);
      }
    }
  };

  // Update task completion status
  const updateTask = async (task: Task, completed: boolean) => {
    try {
      const updatedTask = await put(`${TASK_SERVICE_URL}/tasks/${task._id}`, {
        task: task.task,
        completed,
      });
      if (!updatedTask.error) {
        setTasks(
          tasks.map((t) => (t._id === task._id ? { ...t, completed } : t))
        );
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Remove a task
  const removeTask = async (_id: string) => {
    try {
      const response = await deleteRequest(`${TASK_SERVICE_URL}/tasks/${_id}`);
      if (!response.error) setTasks(tasks.filter((t) => t._id !== _id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  if (loading) return <p>Loading tasks...</p>;

  return (
    <Container className="mt-5 container">
      <h2 className="text-center mb-4">To-Do List</h2>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          addTask();
        }}
      >
        <Row>
          <Col xs={9}>
            <Form.Control
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Enter a task"
            />
          </Col>
          <Col xs={3}>
            <Button variant="primary" className="w-100" onClick={addTask}>
              Add
            </Button>
          </Col>
        </Row>
      </Form>

      <ListGroup className="mt-3">
        {tasks.length > 0 ? (
          tasks.map((t) => (
            <ListGroup.Item
              key={t._id}
              className="d-flex justify-content-between align-items-center"
            >
              <div className="d-flex w-100">
                <Form.Check
                  type="checkbox"
                  checked={t.completed ?? false}
                  onChange={(e) => updateTask(t, e.target.checked)}
                />
                <div
                  className={`ms-4 ${t.completed ? "text-decoration-line-through" : ""}`}
                >
                  {t.task}
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => removeTask(t._id)}
              >
                Remove
              </Button>
            </ListGroup.Item>
          ))
        ) : (
          <p className="text-center text-muted mt-3">No tasks added.</p>
        )}
      </ListGroup>
    </Container>
  );
};

export default TODOList;
