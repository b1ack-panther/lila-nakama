package main

import "testing"

func TestApplyMoveAndWin(t *testing.T) {
	st := newEmptyState()

	// Create two players
	p1 := "player-1"
	p2 := "player-2"
	st.Players[p1] = "X"
	st.Players[p2] = "O"
	st.Turn = p1

	// p1 takes center
	if err := applyMove(st, p1, 1, 1); err != nil {
		t.Fatalf("expected move ok, got error: %v", err)
	}
	// p2 attempts same cell -> error
	if err := applyMove(st, p2, 1, 1); err == nil {
		t.Fatalf("expected error for occupied cell")
	}
	// continue to make X win: p1: (0,0), p2: (0,1), p1: (2,2)
	// adjust turn to p1 for testing sequences
	st.Turn = p1
	_ = applyMove(st, p1, 0, 0)
	// next turn should be p2
	if st.Turn != p2 {
		t.Fatalf("expected turn to be p2, got %s", st.Turn)
	}
	_ = applyMove(st, p2, 0, 1)
	st.Turn = p1
	_ = applyMove(st, p1, 2, 2)

	// Now check for a win - diagonal (0,0),(1,1),(2,2)
	if sym, _, ok := st.checkWin(); !ok || sym != "X" {
		t.Fatalf("expected X to win, got sym=%s ok=%v", sym, ok)
	}
}
