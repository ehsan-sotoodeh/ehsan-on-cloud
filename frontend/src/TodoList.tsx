import React, { useState, useEffect } from "react";
import { Button, Container, Form, ListGroup, Row, Col } from "react-bootstrap";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Task {
  _id: string;
  task: string;
}

const TODOList: React.FC = () => {
  const [task, setTask] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);

  // Fetch tasks from FastAPI + MongoDB
  useEffect(() => {
    fetch(`${API_URL}/tasks`)
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  const addTask = () => {
    if (task.trim()) {
      fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      })
        .then((res) => res.json())
        .then((newTask) => setTasks([...tasks, newTask]));

      setTask("");
    }
  };

  const removeTask = (_id: string) => {
    fetch(`${API_URL}/tasks/${_id}`, { method: "DELETE" })
      .then(() => fetch(`${API_URL}/tasks`))
      .then((res) => res.json())
      .then((data) => setTasks(data));
  };

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
              {t.task}
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
