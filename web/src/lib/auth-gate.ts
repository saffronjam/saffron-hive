/** Everything the routing gate decides on, gathered before any redirect. */
export interface GateState {
  pathname: string;
  hasInitialUser: boolean;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
}

/**
 * The route to redirect to, or null to stay put. Precedence: an install with no
 * user must create one, then every other route needs a session, then a forced
 * password change blocks the rest of the app, and finally the full-screen
 * onboarding routes bounce back to the dashboard once they no longer apply.
 */
export function nextRoute(state: GateState): string | null {
  if (!state.hasInitialUser) {
    return state.pathname === "/setup" ? null : "/setup";
  }
  if (!state.isAuthenticated) {
    return state.pathname === "/login" ? null : "/login";
  }
  if (state.mustChangePassword) {
    return state.pathname === "/change-password-required" ? null : "/change-password-required";
  }
  if (state.pathname === "/change-password-required") {
    return "/";
  }
  if (state.pathname === "/login" || state.pathname === "/setup") {
    return "/";
  }
  return null;
}
