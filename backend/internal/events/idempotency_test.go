package events

import (
	"sync"
	"testing"
	"time"
)

func TestIdempotentAppendConcurrentAndRestart(t *testing.T) {
	dir := t.TempDir()
	store := NewFileEventStoreWithDir(dir)
	event := Event{ID: "operation", Type: EventTypeItemAdded, Timestamp: time.Now().UTC(), Payload: ItemAddedPayload{ItemID: "item", Title: "Milk", CreatedBy: "Alex"}}
	var wg sync.WaitGroup
	for range 20 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if err := store.Append("list", event); err != nil {
				t.Error(err)
			}
		}()
	}
	wg.Wait()
	restarted := NewFileEventStoreWithDir(dir)
	event.Timestamp = time.Now().UTC()
	if err := restarted.Append("list", event); err != nil {
		t.Fatal(err)
	}
	all, err := restarted.ReadAll("list")
	if err != nil || len(all) != 1 {
		t.Fatalf("events=%d err=%v", len(all), err)
	}
	event.Payload = ItemAddedPayload{ItemID: "item", Title: "Other", CreatedBy: "Alex"}
	if err := restarted.Append("list", event); err == nil {
		t.Fatal("expected key collision error")
	}
}

func TestRevisionCheckedUnderAppendLock(t *testing.T) {
	store := NewFileEventStoreWithDir(t.TempDir())
	first := Event{ID: "first", Type: EventTypeListRenamed, Payload: ListRenamedPayload{Name: "A"}}
	if err := store.Append("list", first); err != nil {
		t.Fatal(err)
	}
	next := Event{ID: "next", ExpectedRevision: "first", Type: EventTypeListRenamed, Payload: ListRenamedPayload{Name: "B"}}
	if err := store.Append("list", next); err != nil {
		t.Fatal(err)
	}
	if err := store.Append("list", next); err != nil {
		t.Fatalf("accepted retry must ignore stale revision: %v", err)
	}
	next.ID = "conflicting"
	if err := store.Append("list", next); err != ErrRevisionConflict {
		t.Fatalf("expected revision conflict, got %v", err)
	}
}
