package graph

import (
	"context"
	"testing"
)

func TestUpdateSettingValidatesStandardRoomTranslation(t *testing.T) {
	for _, value := range []string{"true", "false"} {
		t.Run(value, func(t *testing.T) {
			st := newMockStore()
			resolver := &mutationResolver{&Resolver{Store: st}}

			setting, err := resolver.UpdateSetting(context.Background(), "i18n.translate_standard_room_names", value)
			if err != nil {
				t.Fatalf("UpdateSetting: %v", err)
			}
			if setting.Value != value || st.settings[setting.Key] != value {
				t.Fatalf("stored setting = %#v, want %q", setting, value)
			}
		})
	}

	st := newMockStore()
	resolver := &mutationResolver{&Resolver{Store: st}}
	if _, err := resolver.UpdateSetting(context.Background(), "i18n.translate_standard_room_names", "yes"); err == nil {
		t.Fatal("UpdateSetting accepted a non-boolean value")
	}
	if len(st.settings) != 0 {
		t.Fatalf("invalid setting was persisted: %#v", st.settings)
	}
}
