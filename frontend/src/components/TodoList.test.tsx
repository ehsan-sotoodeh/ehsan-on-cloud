import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import TODOList from "./TodoList";
import { get, post, put, deleteRequest } from "../services/apiService";
import { vi } from "vitest";

// Mock API calls
vi.mock("../services/apiService", async () => {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    deleteRequest: vi.fn(),
  };
});
const mockTasks = [
  { _id: "1", task: "Test Task 1", completed: false },
  { _id: "2", task: "Test Task 2", completed: true },
];

describe("TODOList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders loading state initially", async () => {
    (get as vi.Mock).mockResolvedValueOnce(mockTasks);

    render(<TODOList />);

    expect(screen.getByText(/Loading tasks.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Test Task 1")).toBeInTheDocument();
      expect(screen.getByText("Test Task 2")).toBeInTheDocument();
    });
  });

  test("adds a new task", async () => {
    (get as vi.Mock).mockResolvedValueOnce(mockTasks);
    (post as vi.Mock).mockResolvedValueOnce({
      _id: "3",
      task: "New Task",
      completed: false,
    });

    render(<TODOList />);

    await waitFor(() => {
      expect(screen.getByText("Test Task 1")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Enter a task/i);
    fireEvent.change(input, { target: { value: "New Task" } });

    const addButton = screen.getByText(/Add/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("New Task")).toBeInTheDocument();
    });
  });

  test("marks a task as completed", async () => {
    (get as vi.Mock).mockResolvedValueOnce(mockTasks);
    (put as vi.Mock).mockResolvedValueOnce({
      _id: "1",
      task: "Test Task 1",
      completed: true,
    });

    render(<TODOList />);

    await waitFor(() => {
      expect(screen.getByText("Test Task 1")).toBeInTheDocument();
    });

    const checkbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(put).toHaveBeenCalledWith("http://localhost:8000/tasks/1", {
        task: "Test Task 1",
        completed: true,
      });
    });
  });

  test("removes a task", async () => {
    (get as vi.Mock).mockResolvedValueOnce(mockTasks);
    (deleteRequest as vi.Mock).mockResolvedValueOnce({});

    render(<TODOList />);

    await waitFor(() => {
      expect(screen.getByText("Test Task 1")).toBeInTheDocument();
    });

    const removeButton = screen.getAllByText("Remove")[0];
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(deleteRequest).toHaveBeenCalledWith(
        "http://localhost:8000/tasks/1"
      );
      expect(screen.queryByText("Test Task 1")).not.toBeInTheDocument();
    });
  });
});
