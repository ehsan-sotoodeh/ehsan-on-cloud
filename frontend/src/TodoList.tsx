import React, { useState, useEffect } from "react";
import { Button, Container, Form, ListGroup, Row, Col } from "react-bootstrap";
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth"; // Correct imports
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Task {
  _id: string;
  task: string;
  completed: boolean;
}

const TODOList: React.FC = () => {
  const [task, setTask] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tasks from FastAPI + MongoDB
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const user = await getCurrentUser(); // Ensure user is authenticated
        if (!user) throw new Error("User not authenticated");

        const session = await fetchAuthSession(); // Fetch authentication session
        const token = session.tokens?.idToken ?? ""; // Get ID token

        const response = await axios.get(`${API_URL}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTasks(response.data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const addTask = () => {
    if (task.trim()) {
      fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, completed: false }),
      })
        .then((res) => res.json())
        .then((newTask) => setTasks([...tasks, newTask]));

      setTask("");
    }
  };

  const updateTask = (task: Task, completed: boolean) => {
    // set the completed status of the task
    task.completed = completed;
    console.log(task);
    fetch(`${API_URL}/tasks/${task._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: task.task,
        completed: task.completed,
      }),
    })
      .then(() => fetch(`${API_URL}/tasks`))
      .then((res) => res.json())
      .then((data) => setTasks(data));
  };

  const removeTask = (_id: string) => {
    fetch(`${API_URL}/tasks/${_id}`, { method: "DELETE" })
      .then(() => fetch(`${API_URL}/tasks`))
      .then((res) => res.json())
      .then((data) => setTasks(data));
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
