// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders the default variant", () => {
    render(<Button>Salvar</Button>);

    const button = screen.getByRole("button", { name: "Salvar" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary");
  });
});
