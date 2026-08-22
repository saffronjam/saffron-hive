package device

// ProviderGroupsSnapshot is a complete provider-owned group registry.
type ProviderGroupsSnapshot struct {
	Provider string
	Groups   []ProviderGroup
}

// ProviderGroup is one provider-owned group and its authoritative membership.
type ProviderGroup struct {
	ProviderGroupID string
	Name            string
	Members         []ProviderGroupMember
}

// ProviderGroupMember identifies one device endpoint in a provider group.
type ProviderGroupMember struct {
	DeviceID DeviceID
	Endpoint int
}
