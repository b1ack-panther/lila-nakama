package main

import (
	"context"
	"strings"

	"github.com/heroiclabs/nakama-common/runtime"
)

func InitLeaderboard(ctx context.Context, nk runtime.NakamaModule, logger runtime.Logger) error {
	// This creates the leaderboard only if it doesn’t exist.
	err := nk.LeaderboardCreate(ctx, "tictactoe_global", true, "desc", "incr", "",
		nil, true)
	if err != nil && !strings.Contains(err.Error(), "already exists") {
		logger.Error("Error creating leaderboard: %v", err)
		return err
	}

	logger.Info("Leaderboard 'tictactoe_global' initialized.")
	return nil
}


func updatePlayerStats(ctx context.Context, nk runtime.NakamaModule, logger runtime.Logger, userID string, wins, losses, ties int) (map[string]interface{}, error) {
	// Calculate leaderboard delta: win +10, loss -5, tie +0
	scoreDelta := int64(wins*10 - losses*5)

	// Prepare leaderboard metadata (optional)
	metadata := map[string]interface{}{
		"reason": "match_result",
	}

	// Nakama operator constants:
	// 0 = set, 1 = best, 2 = increment
	account, err := nk.AccountGetId(ctx, userID)
	if err != nil {
		logger.Error("Error fetching username for %s: %v", userID, err)
	}
	username := account.GetUser().GetUsername()
	if scoreDelta != 0 {
		_, err := nk.LeaderboardRecordWrite(ctx,
			"tictactoe_global",
			userID,
			username,
			scoreDelta,
			0,
			metadata,
			nil,
		)
		if err != nil {
			logger.Error("failed updating leaderboard for user %s: %v", userID, err)
		}
	}

	// Return storage stats (if you’re saving these somewhere else)
	stats := map[string]interface{}{
		"wins":   wins,
		"losses": losses,
		"ties":   ties,
	}

	return stats, nil
}


// // Fetch player stats or initialize them if not found
// func getPlayerStats(ctx context.Context, nk runtime.NakamaModule, userID string) (map[string]int, error, any) {
// 	readReq := []*runtime.StorageRead{
// 		{
// 			Collection: "player_stats",
// 			Key:        "summary",
// 			UserID:     userID,
// 		},
// 	}

// 	records, err := nk.StorageRead(ctx, readReq)
// 	if err != nil {
// 		return nil, err
// 	}

// 	stats := map[string]int{"wins": 0, "losses": 0, "total": 0}
// 	if len(records) > 0 && records[0].Value != "" {
// 		if err := json.Unmarshal([]byte(records[0].Value), &stats); err != nil {
// 			return nil, err
// 		}
// 	}
// 	return stats, nil, records
// }

// // Update and persist stats to Nakama storage
// func updatePlayerStats(ctx context.Context, nk runtime.NakamaModule, logger runtime.Logger, userID string, deltaWins, deltaLosses, deltaTotal int) (map[string]int, error) {
// 	stats, err, records := getPlayerStats(ctx, nk, userID)
// 	if err != nil {
// 		return nil, err
// 	}

// 	logger.Warn("records---- %v", records)

// 	stats["wins"] += deltaWins
// 	stats["losses"] += deltaLosses
// 	stats["total"] += deltaTotal

// 	statsJSON, _ := json.Marshal(stats)

// 	write := []*runtime.StorageWrite{
// 		{
// 			Collection:      "player_stats",
// 			Key:             "summary",
// 			UserID:          userID,
// 			Value:           string(statsJSON),
// 			PermissionRead:  2, // readable by friends or public
// 			PermissionWrite: 1, // only owner can write
// 		},
// 	}

// 	if _, err := nk.StorageWrite(ctx, write); err != nil {
// 		return nil, err
// 	}

// 	score := int64(deltaWins*9 - deltaLosses*6 + deltaTotal)

// 	users, err := nk.UsersGetUsername(ctx, []string{userID})
// 	if err != nil {
// 		logger.Error("Couldn't get user name from id: %v", err)
// 	}
// 	var userName string
// 	if len(users) > 0 {
// 		userName = users[0].Username
// 	}
// 	logger.Error("stats-- %v , ---userId %v , -----usrs %v ", stats, userID, users)
// 	if _, err := nk.LeaderboardRecordWrite(ctx, "tictactoe_global", userID, userName, score, score, map[string]interface{}{"stats": stats}, nil); err != nil {
// 		logger.Error("error updating leaderboard for winner: %v", err)
// 	}

// 	return stats, nil
// }
