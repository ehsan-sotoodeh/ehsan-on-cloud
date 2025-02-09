import React, { useState, useEffect } from "react";
import { Button, Container, Form, Row, Col, Card } from "react-bootstrap";
import apiService from "./services/apiService";
const ASK_AI_SERVICE_URL =
  import.meta.env.VITE_ASK_AI_SERVICE_URL || "http://localhost:8000";

const AskAI: React.FC = () => {
  const [question, setQuestion] = useState<string>("How old is universe?");
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {}, []);

  const askQuestion = async () => {
    setLoading(true);
    if (question.trim()) {
      try {
        const response = await apiService.post(`${ASK_AI_SERVICE_URL}/ask`, {
          prompt: question,
          model: "gpt-4",
        });
        if (!response.error) {
          setResponse(response?.response || "Error fetching response");
        }
        setQuestion("");
        setLoading(false);
      } catch (error) {
        console.error("Error adding task:", error);
      }
    }
  };

  return (
    <Container className="mt-5 container">
      <h2 className="text-center mb-4">Ask AI</h2>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          askQuestion();
        }}
      >
        <Row>
          <Col xs={9}>
            <Form.Control
              type="textarea"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter a task"
            />
          </Col>
          <Col xs={3}>
            <Button
              variant="primary"
              className="w-100"
              onClick={askQuestion}
              disabled={loading}
            >
              Add
            </Button>
          </Col>
        </Row>
      </Form>

      <Card className="mt-4">
        <Card.Body>
          <Card.Title>Response</Card.Title>
          <Card.Text>{response}</Card.Text>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AskAI;
