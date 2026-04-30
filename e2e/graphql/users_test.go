//go:build e2e

package graphql_test

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
)

// rawPost sends a GraphQL request with a caller-supplied bearer token. Most
// test calls go through graphqlPost, which reuses the shared seed token; the
// users flow needs to authenticate as different users in the same process so
// this helper gives the tests direct control over the Authorization header.
func rawPost(t *testing.T, token string, query string, variables map[string]any) (graphqlResponse, int) {
	t.Helper()
	body, _ := json.Marshal(graphqlRequest{Query: query, Variables: variables})
	req, err := http.NewRequest(http.MethodPost, graphqlURL, bytes.NewReader(body))
	if err != nil {
		t.Fatalf("new request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("post: %v", err)
	}
	defer func() { _ = resp.Body.Close() }()
	raw, _ := io.ReadAll(resp.Body)
	var gr graphqlResponse
	_ = json.Unmarshal(raw, &gr)
	return gr, resp.StatusCode
}

type userSummary struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Name     string `json:"name"`
}

func createUserForTest(t *testing.T, username, name, password string) userSummary {
	t.Helper()
	data, err := graphqlMutation(
		`mutation($input: CreateUserInput!) { createUser(input: $input) { id username name } }`,
		map[string]any{"input": map[string]any{"username": username, "name": name, "password": password}},
	)
	if err != nil {
		t.Fatalf("createUser: %v", err)
	}
	var resp struct {
		CreateUser userSummary `json:"createUser"`
	}
	if err := json.Unmarshal(data, &resp); err != nil {
		t.Fatalf("unmarshal createUser: %v", err)
	}
	return resp.CreateUser
}

func loginForTest(t *testing.T, username, password string) string {
	t.Helper()
	data, err := graphqlMutation(
		`mutation($input: LoginInput!) { login(input: $input) { token } }`,
		map[string]any{"input": map[string]any{"username": username, "password": password}},
	)
	if err != nil {
		t.Fatalf("login: %v", err)
	}
	var resp struct {
		Login struct {
			Token string `json:"token"`
		} `json:"login"`
	}
	if err := json.Unmarshal(data, &resp); err != nil {
		t.Fatalf("unmarshal login: %v", err)
	}
	return resp.Login.Token
}

func deleteUserForTest(t *testing.T, id string) {
	t.Helper()
	if _, err := graphqlMutation(`mutation($id: ID!) { deleteUser(id: $id) }`, map[string]any{"id": id}); err != nil {
		t.Fatalf("deleteUser: %v", err)
	}
}

// clearForcedChangeForTest completes the forced first-login password change for
// the user holding the given token, setting their password to newPassword and
// clearing the must_change_password flag. Use after createUserForTest +
// loginForTest in tests that exercise behaviour beyond the forced-change flow.
func clearForcedChangeForTest(t *testing.T, token, newPassword string) {
	t.Helper()
	gr, _ := rawPost(t, token,
		`mutation($p: String!) { completeFirstPasswordChange(newPassword: $p) }`,
		map[string]any{"p": newPassword},
	)
	if len(gr.Errors) > 0 {
		t.Fatalf("clearForcedChange: %v", gr.Errors)
	}
}

func TestCreateUserRequiresAuth(t *testing.T) {
	err := graphqlMutationExpectError(
		`mutation($input: CreateUserInput!) { createUser(input: $input) { id } }`,
		map[string]any{"input": map[string]any{"username": "noauth", "name": "No Auth", "password": "secret123"}},
	)
	// The HTTP middleware rejects unauth'd callers before the resolver, so
	// transport-level error is also acceptable; check either path.
	if err == nil {
		// Fallback: request may have returned 401 (transport) rather than a
		// GraphQL error envelope. Repeat with raw and confirm non-200.
		gr, status := rawPost(t, "", `mutation($input: CreateUserInput!) { createUser(input: $input) { id } }`,
			map[string]any{"input": map[string]any{"username": "noauth2", "name": "No Auth", "password": "secret123"}})
		if status == http.StatusOK && len(gr.Errors) == 0 {
			t.Fatal("createUser succeeded without auth")
		}
	}
}

func TestChangePasswordFlow(t *testing.T) {
	u := createUserForTest(t, "cpw", "Change Password User", "original123")
	t.Cleanup(func() { deleteUserForTest(t, u.ID) })

	tok := loginForTest(t, "cpw", "original123")
	// Admin-created users start with must_change_password set; complete that
	// flow first so the regular changePassword mutation is reachable.
	clearForcedChangeForTest(t, tok, "original123")

	// Wrong old password fails.
	gr, _ := rawPost(t, tok,
		`mutation($input: ChangePasswordInput!) { changePassword(input: $input) }`,
		map[string]any{"input": map[string]any{"oldPassword": "WRONG", "newPassword": "newpassword123"}},
	)
	if len(gr.Errors) == 0 {
		t.Fatal("expected error on wrong old password")
	}

	// Correct flow succeeds.
	gr, _ = rawPost(t, tok,
		`mutation($input: ChangePasswordInput!) { changePassword(input: $input) }`,
		map[string]any{"input": map[string]any{"oldPassword": "original123", "newPassword": "newpassword123"}},
	)
	if len(gr.Errors) > 0 {
		t.Fatalf("changePassword: %v", gr.Errors)
	}

	// Old password no longer logs in; new one does.
	if err := graphqlMutationExpectError(
		`mutation($input: LoginInput!) { login(input: $input) { token } }`,
		map[string]any{"input": map[string]any{"username": "cpw", "password": "original123"}},
	); err != nil {
		t.Fatalf("old password should have been rejected: %v", err)
	}
	_ = loginForTest(t, "cpw", "newpassword123")
}

func TestResetUserPasswordByAdmin(t *testing.T) {
	u := createUserForTest(t, "resetme", "Reset Target", "oldpw12345")
	t.Cleanup(func() { deleteUserForTest(t, u.ID) })

	data, err := graphqlMutation(
		`mutation($id: ID!, $p: String!) { resetUserPassword(id: $id, newPassword: $p) }`,
		map[string]any{"id": u.ID, "p": "brandnew999"},
	)
	if err != nil {
		t.Fatalf("resetUserPassword: %v", err)
	}
	var resp struct {
		Reset bool `json:"resetUserPassword"`
	}
	if err := json.Unmarshal(data, &resp); err != nil || !resp.Reset {
		t.Fatalf("resetUserPassword did not return true: data=%s err=%v", string(data), err)
	}

	// New password works.
	_ = loginForTest(t, "resetme", "brandnew999")
}

func TestDeleteUserRejectsSelf(t *testing.T) {
	// The shared seed user's ID is what `me` returns under the seed token.
	if err := graphqlMutationExpectError(
		`mutation($id: ID!) { deleteUser(id: $id) }`,
		map[string]any{"id": seedUserIDFromToken(t)},
	); err != nil {
		t.Fatalf("deleteUser(self) should have been rejected: %v", err)
	}
}

func TestDeletedUserTokenLosesAccess(t *testing.T) {
	u := createUserForTest(t, "willbedeleted", "Soon Gone", "initialpw1")
	tok := loginForTest(t, "willbedeleted", "initialpw1")

	// As the seed admin, delete the new user.
	deleteUserForTest(t, u.ID)

	// The deleted user's token must lose access. Under the directive-based
	// auth model the middleware no longer 401s on its own — a token whose
	// user has vanished is treated as no token at all (pass-through with no
	// user on the context). The @auth directive then rejects any protected
	// field with HTTP 200 + GraphQL UNAUTHENTICATED. Hitting Query.users
	// (carries @auth) with the deleted user's token must produce that error.
	req, _ := http.NewRequest(http.MethodPost, graphqlURL, bytes.NewReader([]byte(`{"query":"query { users { id } }"}`)))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+tok)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("request: %v", err)
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200 (auth enforced at directive layer)", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read body: %v", err)
	}
	var gqlResp graphqlResponse
	if err := json.Unmarshal(body, &gqlResp); err != nil {
		t.Fatalf("unmarshal: %v body=%s", err, string(body))
	}
	if len(gqlResp.Errors) == 0 {
		t.Fatalf("expected UNAUTHENTICATED error, got data=%s", string(gqlResp.Data))
	}
	if !strings.Contains(gqlResp.Errors[0].Message, "authentication required") {
		t.Errorf("error message = %q, want contains \"authentication required\"", gqlResp.Errors[0].Message)
	}
}

func TestDeletedUserCannotLogin(t *testing.T) {
	u := createUserForTest(t, "gonesoon", "Gone Soon", "pw123456")
	_ = loginForTest(t, "gonesoon", "pw123456")
	deleteUserForTest(t, u.ID)
	if err := graphqlMutationExpectError(
		`mutation($input: LoginInput!) { login(input: $input) { token } }`,
		map[string]any{"input": map[string]any{"username": "gonesoon", "password": "pw123456"}},
	); err != nil {
		t.Fatalf("login should fail for deleted user: %v", err)
	}
}

func TestCreatedByPreservedAsNullAfterDelete(t *testing.T) {
	creator := createUserForTest(t, "creator1", "The Creator", "creatorpw1")
	creatorTok := loginForTest(t, "creator1", "creatorpw1")
	clearForcedChangeForTest(t, creatorTok, "creatorpw1")

	// Creator creates a scene; createdBy should reference creator.
	data, _ := rawPost(t, creatorTok,
		`mutation($input: CreateSceneInput!) { createScene(input: $input) { id createdBy { id } } }`,
		map[string]any{"input": map[string]any{"name": "Scene by creator1", "actions": []any{}}},
	)
	if len(data.Errors) > 0 {
		t.Fatalf("createScene: %v", data.Errors)
	}
	var sceneResp struct {
		CreateScene struct {
			ID        string       `json:"id"`
			CreatedBy *userSummary `json:"createdBy"`
		} `json:"createScene"`
	}
	if err := json.Unmarshal(data.Data, &sceneResp); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if sceneResp.CreateScene.CreatedBy == nil || sceneResp.CreateScene.CreatedBy.ID != creator.ID {
		t.Fatalf("createdBy mismatch: %+v", sceneResp.CreateScene.CreatedBy)
	}

	// Admin deletes the creator.
	deleteUserForTest(t, creator.ID)

	// Scene still exists, createdBy is now null.
	data2, _ := rawPost(t, authToken,
		`query($id: ID!) { scene(id: $id) { id createdBy { id } } }`,
		map[string]any{"id": sceneResp.CreateScene.ID},
	)
	if len(data2.Errors) > 0 {
		t.Fatalf("scene query: %v", data2.Errors)
	}
	var sceneQ struct {
		Scene struct {
			ID        string       `json:"id"`
			CreatedBy *userSummary `json:"createdBy"`
		} `json:"scene"`
	}
	if err := json.Unmarshal(data2.Data, &sceneQ); err != nil {
		t.Fatalf("unmarshal scene: %v", err)
	}
	if sceneQ.Scene.ID != sceneResp.CreateScene.ID {
		t.Fatalf("scene disappeared after deleting creator")
	}
	if sceneQ.Scene.CreatedBy != nil {
		t.Fatalf("createdBy should be null, got %+v", sceneQ.Scene.CreatedBy)
	}

	// Cleanup the orphan scene.
	_, _ = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": sceneResp.CreateScene.ID})
}

func meMustChangePasswordForToken(t *testing.T, token string) bool {
	t.Helper()
	gr, _ := rawPost(t, token, `{ me { mustChangePassword } }`, nil)
	if len(gr.Errors) > 0 {
		t.Fatalf("me query failed: %v", gr.Errors)
	}
	var resp struct {
		Me struct {
			MustChangePassword *bool `json:"mustChangePassword"`
		} `json:"me"`
	}
	if err := json.Unmarshal(gr.Data, &resp); err != nil {
		t.Fatalf("unmarshal me: %v", err)
	}
	return resp.Me.MustChangePassword != nil && *resp.Me.MustChangePassword
}

func TestCreateUserSetsMustChangePassword(t *testing.T) {
	u := createUserForTest(t, "mcpw1", "Must Change User", "initialpw1")
	t.Cleanup(func() { deleteUserForTest(t, u.ID) })

	tok := loginForTest(t, "mcpw1", "initialpw1")
	if !meMustChangePasswordForToken(t, tok) {
		t.Fatal("admin-created user should have mustChangePassword=true on first login")
	}
}

func TestForcedChangeUserBlockedFromOtherOps(t *testing.T) {
	u := createUserForTest(t, "mcpw2", "Blocked User", "initialpw1")
	t.Cleanup(func() { deleteUserForTest(t, u.ID) })

	tok := loginForTest(t, "mcpw2", "initialpw1")

	// Any @auth-protected operation other than `completeFirstPasswordChange`
	// must be rejected with PASSWORD_CHANGE_REQUIRED. Pick a query that always
	// runs through the directive: users.
	gr, status := rawPost(t, tok, `{ users { id } }`, nil)
	if status != http.StatusOK {
		t.Fatalf("status = %d, want 200 (directive rejects at GraphQL layer)", status)
	}
	if len(gr.Errors) == 0 {
		t.Fatal("forced-change user reached users query without password change")
	}
	if !strings.Contains(gr.Errors[0].Message, "password change required") {
		t.Errorf("error message = %q, want contains \"password change required\"", gr.Errors[0].Message)
	}

	// And that a write is also blocked.
	gr, _ = rawPost(t, tok,
		`mutation($input: CreateSceneInput!) { createScene(input: $input) { id } }`,
		map[string]any{"input": map[string]any{"name": "should not exist", "actions": []any{}}},
	)
	if len(gr.Errors) == 0 {
		t.Fatal("forced-change user reached createScene without password change")
	}
	if !strings.Contains(gr.Errors[0].Message, "password change required") {
		t.Errorf("createScene error message = %q, want contains \"password change required\"", gr.Errors[0].Message)
	}
}

func TestCompleteFirstPasswordChangeClearsFlag(t *testing.T) {
	u := createUserForTest(t, "mcpw3", "Clearing User", "initialpw1")
	t.Cleanup(func() { deleteUserForTest(t, u.ID) })

	tok := loginForTest(t, "mcpw3", "initialpw1")

	gr, _ := rawPost(t, tok,
		`mutation($p: String!) { completeFirstPasswordChange(newPassword: $p) }`,
		map[string]any{"p": "newpassword999"},
	)
	if len(gr.Errors) > 0 {
		t.Fatalf("completeFirstPasswordChange: %v", gr.Errors)
	}

	if meMustChangePasswordForToken(t, tok) {
		t.Fatal("mustChangePassword should be cleared after completeFirstPasswordChange")
	}

	// Previously blocked operation now succeeds.
	gr, _ = rawPost(t, tok, `{ users { id } }`, nil)
	if len(gr.Errors) > 0 {
		t.Fatalf("users query should succeed after change: %v", gr.Errors)
	}

	// Old password no longer logs in; new one does.
	if err := graphqlMutationExpectError(
		`mutation($input: LoginInput!) { login(input: $input) { token } }`,
		map[string]any{"input": map[string]any{"username": "mcpw3", "password": "initialpw1"}},
	); err != nil {
		t.Fatalf("old password should have been rejected: %v", err)
	}
	_ = loginForTest(t, "mcpw3", "newpassword999")
}

func TestResetUserPasswordReArmsMustChange(t *testing.T) {
	u := createUserForTest(t, "mcpw4", "ReArm User", "initialpw1")
	t.Cleanup(func() { deleteUserForTest(t, u.ID) })

	// Clear the flag by completing the forced-change flow.
	tok := loginForTest(t, "mcpw4", "initialpw1")
	gr, _ := rawPost(t, tok,
		`mutation($p: String!) { completeFirstPasswordChange(newPassword: $p) }`,
		map[string]any{"p": "newpassword999"},
	)
	if len(gr.Errors) > 0 {
		t.Fatalf("completeFirstPasswordChange: %v", gr.Errors)
	}
	if meMustChangePasswordForToken(t, tok) {
		t.Fatal("flag not cleared by completeFirstPasswordChange")
	}

	// Admin resets the user's password — flag must come back.
	if _, err := graphqlMutation(
		`mutation($id: ID!, $p: String!) { resetUserPassword(id: $id, newPassword: $p) }`,
		map[string]any{"id": u.ID, "p": "adminreset123"},
	); err != nil {
		t.Fatalf("resetUserPassword: %v", err)
	}

	tok2 := loginForTest(t, "mcpw4", "adminreset123")
	if !meMustChangePasswordForToken(t, tok2) {
		t.Fatal("admin reset should re-arm mustChangePassword")
	}
}

// seedUserIDFromToken decodes the shared `authToken` JWT to obtain the seed
// user's ID. The token is signed with a test-only secret so we avoid the
// import cycle of pulling in auth.Service here and just read the `sub` claim
// out of the unverified payload.
func seedUserIDFromToken(t *testing.T) string {
	t.Helper()
	data, err := graphqlQuery(`{ me { id } }`, nil)
	if err != nil {
		t.Fatalf("me: %v", err)
	}
	var resp struct {
		Me struct {
			ID string `json:"id"`
		} `json:"me"`
	}
	if err := json.Unmarshal(data, &resp); err != nil {
		t.Fatalf("unmarshal me: %v", err)
	}
	return resp.Me.ID
}
