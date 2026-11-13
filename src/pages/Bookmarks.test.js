import React from "react";
import { render, screen } from "@testing-library/react";
import Bookmarks from "./Bookmarks";

const originalFetch = global.fetch;

beforeEach(() => {
  localStorage.setItem("userEmail", "reader@example.com");
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  localStorage.clear();
  jest.clearAllMocks();
});

test("shows a recoverable error when the bookmarks response has no list", async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ message: "Unexpected response" })
  });

  render(<Bookmarks />);

  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load your bookmarks.");
  expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
});

test("skips bookmarks whose book was deleted", async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      bookmarks: [
        { _id: "orphaned-bookmark", book_id: null },
        {
          _id: "valid-bookmark",
          book_id: {
            _id: "book-1",
            title: "A Saved Book",
            author: "A. Writer",
            category: "Fiction",
            year: 2020
          }
        }
      ]
    })
  });

  render(<Bookmarks />);

  expect(await screen.findByRole("heading", { name: "A Saved Book" })).toBeInTheDocument();
  expect(screen.queryByText("No Bookmarks Yet")).not.toBeInTheDocument();
});
