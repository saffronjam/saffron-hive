package device

import "testing"

func TestPtrBool(t *testing.T) {
	p := Ptr(true)
	if *p != true {
		t.Fatalf("expected true, got %v", *p)
	}
}

func TestPtrInt(t *testing.T) {
	p := Ptr(42)
	if *p != 42 {
		t.Fatalf("expected 42, got %d", *p)
	}
}

func TestPtrFloat64(t *testing.T) {
	p := Ptr(3.14)
	if *p != 3.14 {
		t.Fatalf("expected 3.14, got %f", *p)
	}
}

func TestPtrString(t *testing.T) {
	p := Ptr("hello")
	if *p != "hello" {
		t.Fatalf("expected hello, got %s", *p)
	}
}

func TestPtrReturnsDistinctPointers(t *testing.T) {
	a := Ptr(1)
	b := Ptr(1)
	if a == b {
		t.Fatal("expected distinct pointers")
	}
}
