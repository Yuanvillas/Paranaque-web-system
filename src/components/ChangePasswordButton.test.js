import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import Swal from "sweetalert2";
import ChangePasswordButton from "./ChangePasswordButton";

jest.mock("axios", () => ({ put: jest.fn() }));
jest.mock("sweetalert2", () => ({ fire: jest.fn() }));

describe("ChangePasswordButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("requires matching new passwords before submitting", async () => {
    render(<ChangePasswordButton email="admin@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Change Password" }));
    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "CurrentPass1!" }
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "NewPass1!" }
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "DifferentPass1!" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("New passwords do not match.");
    expect(axios.put).not.toHaveBeenCalled();
  });

  test("submits valid password changes for the signed-in account", async () => {
    axios.put.mockResolvedValue({
      data: { message: "Password updated successfully!" }
    });
    Swal.fire.mockResolvedValue({});
    render(<ChangePasswordButton email="librarian@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Change Password" }));
    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "CurrentPass1!" }
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "NewPass2!" }
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "NewPass2!" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "https://paranaque-web-system.onrender.com/api/auth/change-password",
        {
          email: "librarian@example.com",
          currentPassword: "CurrentPass1!",
          newPassword: "NewPass2!"
        }
      );
    });
    expect(Swal.fire).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
