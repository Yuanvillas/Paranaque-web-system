import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import PasswordInput from "./PasswordInput";

describe("PasswordInput clipboard behavior", () => {
  test("prevents copying, cutting, and pasting when enabled", () => {
    render(<PasswordInput name="confirmPassword" preventClipboard />);
    const input = screen.getByPlaceholderText("Enter password");

    expect(fireEvent.copy(input)).toBe(false);
    expect(fireEvent.cut(input)).toBe(false);
    expect(fireEvent.paste(input)).toBe(false);
  });

  test("allows clipboard actions by default", () => {
    render(<PasswordInput name="password" />);
    const input = screen.getByPlaceholderText("Enter password");

    expect(fireEvent.copy(input)).toBe(true);
    expect(fireEvent.cut(input)).toBe(true);
    expect(fireEvent.paste(input)).toBe(true);
  });
});
