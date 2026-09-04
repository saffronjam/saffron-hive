package graph

import (
	"context"
	"os"
	"reflect"
	"sort"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/store"
	"github.com/vektah/gqlparser/v2"
	"github.com/vektah/gqlparser/v2/ast"
	"github.com/vektah/gqlparser/v2/gqlerror"
)

func TestGuestCreateLoginExtendAndDelete(t *testing.T) {
	st := newMockStore()
	bus := eventbus.NewChannelBus()
	changes := bus.Subscribe(eventbus.EventGuestChanged)
	defer bus.Unsubscribe(changes)
	svc := auth.NewService([]byte("secret"), time.Hour)
	r := &Resolver{Store: st, EventBus: bus, Auth: svc, LoginLimiter: auth.NewLoginLimiter(auth.LoginLimiterConfig{})}
	mutations := &mutationResolver{r}

	created, err := mutations.CreateGuest(context.Background(), model.CreateGuestInput{
		Name: "  Linnea  ", DurationMinutes: 240,
	})
	if err != nil {
		t.Fatalf("CreateGuest: %v", err)
	}
	if created.Name != "Linnea" || time.Until(created.ExpiresAt) < 239*time.Minute {
		t.Fatalf("created guest = %+v", created)
	}
	assertGuestEvent(t, changes, eventbus.GuestCreated, created.ID)

	login, err := mutations.GuestLogin(context.Background(), " LINNEA ")
	if err != nil {
		t.Fatalf("GuestLogin: %v", err)
	}
	claims, err := svc.Parse(login.Token)
	if err != nil || !claims.Guest || claims.PrincipalID != created.ID {
		t.Fatalf("guest claims = %+v, %v", claims, err)
	}

	extended, err := mutations.ExtendGuest(context.Background(), created.ID, 60)
	if err != nil {
		t.Fatalf("ExtendGuest: %v", err)
	}
	if extended.ExpiresAt.Sub(created.ExpiresAt) != time.Hour {
		t.Fatalf("extension = %v, want 1h", extended.ExpiresAt.Sub(created.ExpiresAt))
	}
	assertGuestEvent(t, changes, eventbus.GuestExtended, created.ID)

	deleted, err := mutations.DeleteGuest(context.Background(), created.ID)
	if err != nil || !deleted {
		t.Fatalf("DeleteGuest = %v, %v", deleted, err)
	}
	assertGuestEvent(t, changes, eventbus.GuestRevoked, created.ID)
	if _, err := mutations.GuestLogin(context.Background(), "linnea"); err == nil {
		t.Fatal("deleted guest could log in")
	}
}

func TestGuestLimitsAndDuplicateName(t *testing.T) {
	st := newMockStore()
	r := &mutationResolver{&Resolver{Store: st, Auth: auth.NewService([]byte("secret"), time.Hour)}}
	if _, err := r.CreateGuest(context.Background(), model.CreateGuestInput{Name: "", DurationMinutes: 60}); err == nil {
		t.Fatal("empty guest name accepted")
	}
	if _, err := r.CreateGuest(context.Background(), model.CreateGuestInput{Name: "Sam", DurationMinutes: 10081}); err == nil {
		t.Fatal("duration beyond seven days accepted")
	}
	guest, err := r.CreateGuest(context.Background(), model.CreateGuestInput{Name: "Sam", DurationMinutes: 60})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := r.CreateGuest(context.Background(), model.CreateGuestInput{Name: " SAM ", DurationMinutes: 60}); err == nil {
		t.Fatal("duplicate normalized name accepted")
	}
	st.guests[guest.ID] = store.Guest{
		ID: guest.ID, Name: guest.Name, NormalizedName: "sam",
		CreatedAt: time.Now().Add(-6*24*time.Hour - 23*time.Hour),
		ExpiresAt: time.Now().Add(time.Hour),
	}
	if _, err := r.ExtendGuest(context.Background(), guest.ID, 61); err == nil {
		t.Fatal("extension beyond the hard lifetime accepted")
	}
}

func TestAuthDirectiveGuestBoundary(t *testing.T) {
	ctx := auth.WithPrincipal(context.Background(), auth.Principal{ID: "guest-1", Guest: true})
	called := false
	next := func(context.Context) (any, error) {
		called = true
		return true, nil
	}
	if _, err := AuthDirective(ctx, nil, next, true); err != nil || !called {
		t.Fatalf("dashboard field rejected: called=%v err=%v", called, err)
	}
	called = false
	_, err := AuthDirective(ctx, nil, next, false)
	if err == nil || called {
		t.Fatalf("admin field allowed: called=%v err=%v", called, err)
	}
	graphErr, ok := err.(*gqlerror.Error)
	if !ok || graphErr.Extensions["code"] != "FORBIDDEN" {
		t.Fatalf("directive error = %#v", err)
	}
}

func TestGuestSchemaAllowlist(t *testing.T) {
	data, err := os.ReadFile("../../api/schema.graphql")
	if err != nil {
		t.Fatal(err)
	}
	schema, err := gqlparser.LoadSchema(&ast.Source{Name: "schema.graphql", Input: string(data)})
	if err != nil {
		t.Fatal(err)
	}
	var got []string
	for _, typeName := range []string{"Query", "Mutation", "Subscription"} {
		for _, field := range schema.Types[typeName].Fields {
			directive := field.Directives.ForName("auth")
			if directive == nil {
				continue
			}
			argument := directive.Arguments.ForName("allowGuest")
			if argument != nil && argument.Value.Raw == "true" {
				got = append(got, typeName+"."+field.Name)
			}
		}
	}
	want := []string{
		"Mutation.applyScene", "Mutation.deactivateScene", "Mutation.setTargetState",
		"Query.currentGuest", "Query.dashboardLocalization", "Query.devices", "Query.groups", "Query.rooms", "Query.scenes",
		"Subscription.deviceAdded", "Subscription.deviceAvailabilityChanged", "Subscription.deviceConfigurationChanged",
		"Subscription.deviceRemoved", "Subscription.deviceStateChanged", "Subscription.deviceUpdated",
		"Subscription.groupsChanged", "Subscription.guestChanged", "Subscription.sceneActiveChanged",
	}
	sort.Strings(got)
	sort.Strings(want)
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("guest GraphQL allowlist = %v, want %v", got, want)
	}
}

func TestCurrentGuestOnlyReturnsCallingGuest(t *testing.T) {
	st := newMockStore()
	now := time.Now()
	st.guests["guest-1"] = store.Guest{
		ID: "guest-1", Name: "Linnea", NormalizedName: "linnea",
		CreatedAt: now, ExpiresAt: now.Add(time.Hour),
	}
	r := &queryResolver{&Resolver{Store: st}}
	ctx := auth.WithPrincipal(context.Background(), auth.Principal{ID: "guest-1", Guest: true})
	guest, err := r.CurrentGuest(ctx)
	if err != nil || guest == nil || guest.ID != "guest-1" {
		t.Fatalf("CurrentGuest = %+v, %v", guest, err)
	}
	userCtx := auth.WithPrincipal(context.Background(), auth.Principal{ID: "user-1"})
	guest, err = r.CurrentGuest(userCtx)
	if err != nil || guest != nil {
		t.Fatalf("CurrentGuest for user = %+v, %v", guest, err)
	}
}

func assertGuestEvent(t *testing.T, ch <-chan eventbus.Event, kind eventbus.GuestChangeKind, id string) {
	t.Helper()
	select {
	case event := <-ch:
		change, ok := event.Payload.(eventbus.GuestChangedEvent)
		if event.Type != eventbus.EventGuestChanged || !ok || change.Kind != kind || change.GuestID != id {
			t.Fatalf("guest event = %+v", event)
		}
	case <-time.After(time.Second):
		t.Fatalf("timed out waiting for %s event", kind)
	}
}
