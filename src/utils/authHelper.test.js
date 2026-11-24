import {
  beginAuthSession,
  clearAuthData,
  isAuthenticated,
  shouldExpireSessionOnRouterHistoryNavigation
} from "./authHelper";

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

  test("keeps the session when Back returns to an authenticated route", () => {
    localStorage.setItem("userEmail", "admin@example.com");
    localStorage.setItem("user", JSON.stringify({ email: "admin@example.com", role: "admin" }));
    beginAuthSession("admin@example.com");

    expect(shouldExpireSessionOnRouterHistoryNavigation({
      locationChanged: true,
      navigationType: "POP",
      pathname: "/admin-dashboard"
    })).toBe(false);
    expect(isAuthenticated()).toBe(true);
  });

  test("expires the session when Back returns to the login route", () => {
    localStorage.setItem("userEmail", "admin@example.com");
    localStorage.setItem("user", JSON.stringify({ email: "admin@example.com", role: "admin" }));
    beginAuthSession("admin@example.com");

    expect(shouldExpireSessionOnRouterHistoryNavigation({
      locationChanged: true,
      navigationType: "POP",
      pathname: "/"
    })).toBe(true);
  });
});
