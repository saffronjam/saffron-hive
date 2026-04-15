package device

// Ptr returns a pointer to the given value. It is used throughout the codebase
// to conveniently construct pointer fields for partial-update structs.
func Ptr[T any](v T) *T { return &v }
