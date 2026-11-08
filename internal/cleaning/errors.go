package cleaning

import "errors"

// RejectedError means no cleaning operation was accepted by the device.
type RejectedError struct{ Err error }

func (e *RejectedError) Error() string { return e.Err.Error() }
func (e *RejectedError) Unwrap() error { return e.Err }
func Reject(err error) error {
	if err == nil {
		return nil
	}
	var rejected *RejectedError
	if errors.As(err, &rejected) {
		return err
	}
	return &RejectedError{Err: err}
}
func IsRejected(err error) bool { var rejected *RejectedError; return errors.As(err, &rejected) }
