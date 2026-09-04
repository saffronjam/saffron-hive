//go:build e2e

package graphql_test

import (
	"encoding/json"
	"net/http"
	"testing"
)

type guestSummary struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	ExpiresAt string `json:"expiresAt"`
	CreatedAt string `json:"createdAt"`
}

func TestGuestDashboardAccessLifecycle(t *testing.T) {
	data, err := graphqlMutation(
		`mutation($input: CreateGuestInput!) {
			createGuest(input: $input) { id name expiresAt createdAt }
		}`,
		map[string]any{"input": map[string]any{"name": "E2E Guest", "durationMinutes": 60}},
	)
	if err != nil {
		t.Fatalf("createGuest: %v", err)
	}
	var created struct {
		Guest guestSummary `json:"createGuest"`
	}
	if err := json.Unmarshal(data, &created); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteGuest(id: $id) }`, map[string]any{"id": created.Guest.ID})
	})

	login, status := rawPost(t, "",
		`mutation($name: String!) { guestLogin(name: $name) { token guest { id name } } }`,
		map[string]any{"name": " e2e GUEST "},
	)
	if status != http.StatusOK || len(login.Errors) > 0 {
		t.Fatalf("guestLogin status=%d errors=%v", status, login.Errors)
	}
	var loggedIn struct {
		GuestLogin struct {
			Token string       `json:"token"`
			Guest guestSummary `json:"guest"`
		} `json:"guestLogin"`
	}
	if err := json.Unmarshal(login.Data, &loggedIn); err != nil {
		t.Fatal(err)
	}
	if loggedIn.GuestLogin.Token == "" || loggedIn.GuestLogin.Guest.ID != created.Guest.ID {
		t.Fatalf("guest login = %+v", loggedIn.GuestLogin)
	}

	dashboard, _ := rawPost(t, loggedIn.GuestLogin.Token,
		`query { currentGuest { id name } devices { id } rooms { id } groups { id } scenes { id } dashboardLocalization { defaultContentLanguage } }`,
		nil,
	)
	if len(dashboard.Errors) > 0 {
		t.Fatalf("guest dashboard query: %v", dashboard.Errors)
	}
	adminData, _ := rawPost(t, loggedIn.GuestLogin.Token, `query { users { id } }`, nil)
	if len(adminData.Errors) == 0 {
		t.Fatal("guest could query users")
	}

	extended, err := graphqlMutation(
		`mutation($id: ID!) { extendGuest(id: $id, durationMinutes: 60) { id expiresAt } }`,
		map[string]any{"id": created.Guest.ID},
	)
	if err != nil || len(extended) == 0 {
		t.Fatalf("extendGuest: %v", err)
	}
	if _, err := graphqlMutation(`mutation($id: ID!) { deleteGuest(id: $id) }`, map[string]any{"id": created.Guest.ID}); err != nil {
		t.Fatalf("deleteGuest: %v", err)
	}
	afterRevoke, _ := rawPost(t, loggedIn.GuestLogin.Token, `query { devices { id } }`, nil)
	if len(afterRevoke.Errors) == 0 {
		t.Fatal("revoked guest could query the dashboard")
	}
}

func TestGuestDurationLimit(t *testing.T) {
	if err := graphqlMutationExpectError(
		`mutation($input: CreateGuestInput!) { createGuest(input: $input) { id } }`,
		map[string]any{"input": map[string]any{"name": "Too Long", "durationMinutes": 10081}},
	); err != nil {
		t.Fatalf("guest duration beyond seven days was accepted: %v", err)
	}
}
