import { beginAuthSession, clearAuthData, isAuthenticated } from "./authHelper";

describe("tab-scoped authentication", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test("requires an active tab session in addition to stored user data", () => {
    localStorage.setItem("userEmail", "reader@example.com");
    localStorage.setItem("user", JSON.stringify({ email: "reader@example.com" }));

    expect(isAuthenticated()).toBe(false);

    beginAuthSession("reader@example.com");
    expect(isAuthenticated()).toBe(true);

    localStorage.setItem("userEmail", "another-reader@example.com");
    expect(isAuthenticated()).toBe(false);

    clearAuthData();
    expect(isAuthenticated()).toBe(false);
  });
});
