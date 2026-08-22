// Package health contains shared system-health probes.
package health

import (
	"fmt"
	"syscall"
)

// DiskFreeFraction reports the available fraction of the filesystem containing path.
func DiskFreeFraction(path string) (float64, error) {
	var stat syscall.Statfs_t
	if err := syscall.Statfs(path, &stat); err != nil {
		return 0, err
	}
	if stat.Blocks == 0 {
		return 0, fmt.Errorf("disk total blocks is zero")
	}
	return float64(stat.Bavail) / float64(stat.Blocks), nil
}
