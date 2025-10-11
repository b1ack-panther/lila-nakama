package main

import (
	"context"
	"database/sql"

	"github.com/heroiclabs/nakama-common/runtime"
)

func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, initializer runtime.Initializer) error {
	logger.Info("Lila TicTacToe Backend initializing...")

	// Run DB migrations (optional - creates players table)
	if err := runMigrations(ctx, db, logger); err != nil {
		logger.Error("Failed to run DB migrations: %v", err)
		return err
	}

	// Register authentication hook
	if err := initializer.RegisterAfterAuthenticateDevice(afterAuthDevice); err != nil {
		logger.Error("RegisterAfterAuthenticateDevice failed: %v", err)
		return err
	}

	// Ensure leaderboard exists
	if err := createLeaderboard(ctx, nk, logger); err != nil {
		// log but continue if leaderboard already exists or non-fatal
		logger.Error("createLeaderboard error: %v", err)
	}

	// Register match handler named "xoxo"
	if err := initializer.RegisterMatch("xoxo", func(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, params map[string]interface{}) (runtime.Match, error) {
		return &XoxoMatch{
			logger: logger,
			db:     db,
			nk:     nk,
		}, nil
	}); err != nil {
		logger.Error("RegisterMatch failed: %v", err)
		return err
	}

	// RPC to fetch leaderboard (client can call /v2/rpc/get_leaderboard)
	if err := initializer.RegisterRpc("get_leaderboard", rpcGetLeaderboard); err != nil {
		logger.Error("RegisterRpc get_leaderboard failed: %v", err)
		// not fatal
	}

	logger.Info("Lila Backend loaded: Auth, Match, Leaderboard")
	return nil
}
