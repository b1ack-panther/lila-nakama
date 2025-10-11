package main

import (
	"context"
	"database/sql"
	"encoding/json"

	"github.com/heroiclabs/nakama-common/runtime"
)

const leaderboardID = "tictactoe_global_rank"

// createLeaderboard ensures the Nakama leaderboard exists.
// Parameters chosen: authoritative=true, sort="desc", operator="sum".
func createLeaderboard(ctx context.Context, nk runtime.NakamaModule, logger runtime.Logger) error {
	metadata := map[string]interface{}{
		"description": "Global TicTacToe wins leaderboard",
	}
	// Note: signature may vary across versions: (ctx, id, authoritative, sort, operator, metadata)
	_, err := nk.LeaderboardCreate(ctx, leaderboardID, true, "desc", "sum", metadata)
	if err != nil {
		// Many Nakama versions return an error if leaderboard exists; treat that as non-fatal
		logger.Warn("LeaderboardCreate: %v", err)
	}
	logger.Info("Leaderboard ready: %s", leaderboardID)
	return nil
}

func recordMatchResult(ctx context.Context, nk runtime.NakamaModule, logger runtime.Logger, winnerID string) {
	if winnerID == "" || winnerID == "draw" {
		return
	}
	// We write score=1 for each win; with operator "sum" leaderboard totals will accumulate.
	score := int64(1)
	meta := map[string]interface{}{"reason": "match_win"}
	if err := nk.LeaderboardRecordWrite(ctx, leaderboardID, winnerID, winnerID, score, meta, 0); err != nil {
		logger.Error("LeaderboardRecordWrite failed: %v", err)
	} else {
		logger.Info("LeaderboardRecordWrite success for user %s", winnerID)
	}
}

// rpcGetLeaderboard is an RPC endpoint to list top records
func rpcGetLeaderboard(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	limit := int64(10)
	records, ownerRecord, prev, next, err := nk.LeaderboardRecordsList(ctx, leaderboardID, nil, limit, "")
	if err != nil {
		logger.Error("LeaderboardRecordsList failed: %v", err)
		return "", err
	}
	resp := map[string]interface{}{
		"records":      records,
		"owner_record": ownerRecord,
		"prev_cursor":  prev,
		"next_cursor":  next,
	}
	b, _ := json.Marshal(resp)
	return string(b), nil
}
