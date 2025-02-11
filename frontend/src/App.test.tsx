import { render } from "@testing-library/react";
import { test, expect } from "vitest";
import App from "./App";

test("renders the app component", () => {
  const { container } = render(<App />);
  expect(container).toBeDefined();
});
