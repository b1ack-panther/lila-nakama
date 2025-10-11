package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"
	"database/sql"

	"github.com/heroiclabs/nakama-common/runtime"
)

// XoxoMatch implements runtime.Match
type XoxoMatch struct {
	logger runtime.Logger
	db     *sql.DB
	nk     runtime.NakamaModule
}

type MatchState struct {
	Board   [3][3]string       `json:"board"`
	Players map[string]string `json:"players"`
	Turn    string            `json:"turn"`
	Winner  string            `json:"winner"`
	Created int64             `json:"created"`
	Updated int64             `json:"updated"`
}

func newEmptyState() *MatchState {
	return &MatchState{
		Board:   [3][3]string{},
		Players: map[string]string{},
		Turn:    "",
		Winner:  "",
		Created: time.Now().Unix(),
		Updated: time.Now().Unix(),
	}
}

func (s *MatchState) checkWin() (winnerSymbol string, pos [3][2]int, ok bool) {
	b := s.Board
	for i := 0; i < 3; i++ {
		if b[i][0] != "" && b[i][0] == b[i][1] && b[i][1] == b[i][2] {
			return b[i][0], [3][2]int{{i,0},{i,1},{i,2}}, true
		}
		if b[0][i] != "" && b[0][i] == b[1][i] && b[1][i] == b[2][i] {
			return b[0][i], [3][2]int{{0,i},{1,i},{2,i}}, true
		}
	}
	if b[0][0] != "" && b[0][0] == b[1][1] && b[1][1] == b[2][2] {
		return b[0][0], [3][2]int{{0,0},{1,1},{2,2}}, true
	}
	if b[0][2] != "" && b[0][2] == b[1][1] && b[1][1] == b[2][0] {
		return b[0][2], [3][2]int{{0,2},{1,1},{2,0}}, true
	}
	return "", [3][2]int{}, false
}

func (s *MatchState) isBoardFull() bool {
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			if s.Board[i][j] == "" {
				return false
			}
		}
	}
	return true
}

func stateToBytes(s *MatchState) ([]byte, error) {
	return json.Marshal(s)
}

// ---- runtime.Match interface functions ----

func (m *XoxoMatch) MatchInit(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, params map[string]interface{}) (interface{}, int, string) {
	logger.Info("MatchInit creating new tic-tac-toe game state")
	return newEmptyState(), 1, ""
}

// MatchJoinAttempt — validate whether a presence can join
// Returns: (state, accept, reason)
func (m *XoxoMatch) MatchJoinAttempt(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule,
	dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presence runtime.Presence, metadata map[string]string) (interface{}, bool, string) {

	logger.Info("MatchJoinAttempt: user", presence.GetUserId())

	// Accept up to 2 players
	st := state.(*MatchState)
	if len(st.Players) >= 2 {
		return state, false, "match is full"
	}
	// allow
	return state, true, ""
}

// MatchJoin — called when presences successfully join
func (m *XoxoMatch) MatchJoin(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule,
	dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {

	st := state.(*MatchState)
	for _, p := range presences {
		uid := p.GetUserId()
		if _, ok := st.Players[uid]; !ok {
			if len(st.Players) == 0 {
				st.Players[uid] = "X"
				st.Turn = uid
			} else {
				st.Players[uid] = "O"
			}
		}
	}
	st.Updated = time.Now().Unix()
	if bs, err := stateToBytes(st); err == nil {
		_ = dispatcher.BroadcastMessage(true, 1, bs, nil)
	}
	return st
}

// MatchLeave — called when someone leaves (or disconnects)
func (m *XoxoMatch) MatchLeave(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule,
	dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {

	st := state.(*MatchState)
	for _, p := range presences {
		uid := p.GetUserId()
		if _, exists := st.Players[uid]; exists && st.Winner == "" {
			for other := range st.Players {
				if other != uid {
					st.Winner = other
					break
				}
			}
		}
		delete(st.Players, uid)
	}
	st.Updated = time.Now().Unix()
	if bs, err := stateToBytes(st); err == nil {
		_ = dispatcher.BroadcastMessage(true, 1, bs, nil)
	}
	return st
}

// MatchLoop — main update loop called each tick
// The dispatcher allows broadcasting and receiving signals (player moves come as signals).
func (m *XoxoMatch) MatchLoop(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule,
	dispatcher runtime.MatchDispatcher, tick int64, state interface{}, messages []runtime.MatchData) interface{} {

	st := state.(*MatchState)
	updated := false

	for _, msg := range messages {
		if msg.GetOpCode() == 2 {
			var payload struct{ X int `json:"x"`; Y int `json:"y"` }
			if err := json.Unmarshal(msg.GetData(), &payload); err != nil {
				logger.Warn("Invalid move payload: %v", err)
				continue
			}
			playerID := msg.GetPresence().GetUserId()
			if err := applyMove(st, playerID, payload.X, payload.Y); err != nil {
				errMsg, _ := json.Marshal(map[string]string{"error": err.Error()})
				_ = dispatcher.BroadcastMessage(false, 3, errMsg, []runtime.Presence{msg.GetPresence()})
				continue
			}
			// check win/draw
			if sym, _, win := st.checkWin(); win {
				for uid, s := range st.Players {
					if s == sym {
						st.Winner = uid
						break
					}
				}
			} else if st.isBoardFull() {
				st.Winner = "draw"
			}
			st.Updated = time.Now().Unix()
			updated = true
		}
	}

	if updated {
		if bs, err := stateToBytes(st); err == nil {
			_ = dispatcher.BroadcastMessage(true, 1, bs, nil)
		}
		// If finished -> terminate match by returning nil (signals server to call MatchTerminate)
		if st.Winner != "" {
			// Write any final persistence in MatchTerminate; return nil to indicate termination in many Nakama versions.
			return nil
		}
	}

	return st
}

// MatchSignal - optional; not used here
func (m *XoxoMatch) MatchSignal(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule,
	dispatcher runtime.MatchDispatcher, tick int64, state interface{}, data string) interface{} {
	return state
}

// MatchTerminate — called when match ends (we'll persist winner info here)

func (m *XoxoMatch) MatchTerminate(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule,
	dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) {

	// Note: state may be nil depending on server; try to parse both cases.
	var st *MatchState
	switch v := state.(type) {
	case *MatchState:
		st = v
	default:
		// attempt to fetch last stored state from server (not implemented here), or skip
		logger.Info("MatchTerminate: no state available")
		return
	}

	if st == nil {
		return
	}

	if st.Winner != "" && st.Winner != "draw" {
		// write to Nakama leaderboard
		recordMatchResult(ctx, nk, m.logger, st.Winner)
	}

	if bs, err := stateToBytes(st); err == nil {
		_ = dispatcher.BroadcastMessage(true, 1, bs, nil)
	}
}

// --- helper: applyMove validates and applies a move to the state
func applyMove(st *MatchState, playerID string, x, y int) error {
	if st.Winner != "" {
		return errors.New("match already finished")
	}
	// Validate coords
	if x < 0 || x > 2 || y < 0 || y > 2 {
		return fmt.Errorf("invalid coordinates")
	}
	// Check player is part of match
	symbol, ok := st.Players[playerID]
	if !ok {
		return fmt.Errorf("player not in match")
	}
	// Check turn
	if st.Turn != playerID {
		return fmt.Errorf("not your turn")
	}
	// Check cell empty
	if st.Board[x][y] != "" {
		return fmt.Errorf("cell already occupied")
	}
	// Apply move
	st.Board[x][y] = symbol
	// Switch turn to other player
	for uid := range st.Players {
		if uid != playerID {
			st.Turn = uid
			break
		}
	}
	return nil
}

// ensureWinsTable exists
func ensureWinsTable(ctx context.Context, db *sql.DB, logger runtime.Logger) error {
	if db == nil {
		return nil
	}
	_, err := db.ExecContext(ctx, `
	CREATE TABLE IF NOT EXISTS players_wins (
		user_id UUID PRIMARY KEY,
		wins INT DEFAULT 0
	);
	`)
	if err != nil {
		logger.Error("ensureWinsTable failed: %v", err)
	}
	return err
}
