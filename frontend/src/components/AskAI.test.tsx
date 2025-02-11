import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import AskAI from "../components/AskAI";
import { post } from "../services/apiService";

vi.mock("../services/apiService", async () => {
  return {
    post: vi.fn(),
  };
});

const mockResponse = {
  response: "The universe is approximately 13.8 billion years old.",
};

describe("AskAI Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("submits the question and displays the response", async () => {
    (post as vi.Mock).mockResolvedValueOnce(mockResponse);

    render(<AskAI />);

    const input = screen.getByPlaceholderText(/Enter a task/i);
    const button = screen.getByText("Add");

    // Wrap in `act()`
    await act(async () => {
      fireEvent.change(input, {
        target: { value: "How old is the universe?" },
      });
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith("http://localhost:8002/ask", {
        prompt: "How old is the universe?",
        model: "gpt-4",
      });
      expect(
        screen.getByText(
          "The universe is approximately 13.8 billion years old."
        )
      ).toBeInTheDocument();
    });
  });

  test("handles API errors gracefully", async () => {
    (post as vi.Mock).mockRejectedValueOnce(new Error("Network error"));

    render(<AskAI />);

    const input = screen.getByPlaceholderText(/Enter a task/i);
    const button = screen.getByText("Add");

    // Wrap in `act()`
    await act(async () => {
      fireEvent.change(input, { target: { value: "Why is the sky blue?" } });
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(post).toHaveBeenCalled();
      expect(screen.getByText("Error fetching response")).toBeInTheDocument();
    });
  });
});
