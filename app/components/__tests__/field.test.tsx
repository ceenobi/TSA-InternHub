import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldSet,
  FieldError,
} from "../ui/field";

afterEach(() => cleanup());

describe("Field primitives", () => {
  it("Field renders a group with orientation", () => {
    render(<Field data-testid="f">content</Field>);
    const el = screen.getByTestId("f");
    expect(el).toHaveAttribute("role", "group");
    expect(el).toHaveAttribute("data-slot", "field");
    expect(el).toHaveAttribute("data-orientation", "vertical");
  });

  it("Field honors the horizontal orientation", () => {
    const { container } = render(
      <Field orientation="horizontal">x</Field>,
    );
    expect(
      container.querySelector('[data-orientation="horizontal"]'),
    ).not.toBeNull();
  });

  it("FieldLabel renders label text", () => {
    render(<FieldLabel>Name</FieldLabel>);
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("FieldDescription renders description text", () => {
    render(<FieldDescription>Enter your name</FieldDescription>);
    expect(screen.getByText("Enter your name")).toBeInTheDocument();
  });

  it("FieldSet renders a fieldset slot", () => {
    const { container } = render(<FieldSet>group</FieldSet>);
    expect(
      container.querySelector("fieldset[data-slot='field-set']"),
    ).not.toBeNull();
  });

  it("FieldError renders nothing without errors or children", () => {
    const { container } = render(<FieldError />);
    expect(container.firstChild).toBeNull();
  });

  it("FieldError renders a single error message", () => {
    render(<FieldError errors={[{ message: "Required" }]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
  });

  it("FieldError renders a list for multiple errors", () => {
    render(
      <FieldError
        errors={[{ message: "Required" }, { message: "Too short" }]}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Required");
    expect(alert).toHaveTextContent("Too short");
  });
});
