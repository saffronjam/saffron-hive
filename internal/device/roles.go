package device

import "fmt"

// IsLightControlDevice reports whether a device participates in lighting
// targets, including plugs explicitly assigned the light role.
func IsLightControlDevice(d Device) bool {
	return d.Type == Light ||
		d.Type == Plug && d.Roles.ControlledLoad != nil && *d.Roles.ControlledLoad == ControlledLoadRoleLight
}

// ControlledLoadRoleApplies reports whether a device is a controllable plug.
func ControlledLoadRoleApplies(d Device) bool {
	if d.Type != Plug {
		return false
	}
	for _, capability := range d.Capabilities {
		if capability.Name == CapOnOff && capability.CanSet() {
			return true
		}
	}
	return false
}

// ContactRoleApplies reports whether a device publishes contact state.
func ContactRoleApplies(d Device) bool {
	for _, capability := range d.Capabilities {
		if capability.Name == CapContact && capability.ReportsValue() {
			return true
		}
	}
	return false
}

// DefaultDeviceRoles returns a complete role snapshot for the device.
func DefaultDeviceRoles(d Device) DeviceRoles {
	var roles DeviceRoles
	if ControlledLoadRoleApplies(d) {
		roles.ControlledLoad = Ptr(ControlledLoadRoleAppliance)
	}
	if ContactRoleApplies(d) {
		roles.Contact = Ptr(ContactRoleGeneral)
	}
	return roles
}

// ReconcileDeviceRoles preserves applicable choices while filling or clearing
// categories when an adapter changes the device type or capabilities.
func ReconcileDeviceRoles(d Device, current DeviceRoles) DeviceRoles {
	roles := DefaultDeviceRoles(d)
	if ControlledLoadRoleApplies(d) && validControlledLoadRole(current.ControlledLoad) {
		roles.ControlledLoad = current.ControlledLoad
	}
	if ContactRoleApplies(d) && validContactRole(current.Contact) {
		roles.Contact = current.Contact
	}
	return roles
}

// ValidateDeviceRoles requires a complete and applicable role snapshot.
func ValidateDeviceRoles(d Device, roles DeviceRoles) error {
	if ControlledLoadRoleApplies(d) {
		if !validControlledLoadRole(roles.ControlledLoad) {
			return fmt.Errorf("controlled load role is required for a switchable plug")
		}
	} else if roles.ControlledLoad != nil {
		return fmt.Errorf("controlled load role does not apply to device type %q", d.Type)
	}

	if ContactRoleApplies(d) {
		if !validContactRole(roles.Contact) {
			return fmt.Errorf("contact role is required for a contact-reporting device")
		}
	} else if roles.Contact != nil {
		return fmt.Errorf("contact role does not apply to this device")
	}
	return nil
}

func validControlledLoadRole(role *ControlledLoadRole) bool {
	return role != nil && (*role == ControlledLoadRoleAppliance || *role == ControlledLoadRoleLight)
}

func validContactRole(role *ContactRole) bool {
	return role != nil && (*role == ContactRoleGeneral || *role == ContactRoleDoor || *role == ContactRoleWindow)
}
