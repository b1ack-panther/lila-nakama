package main

import (
	"context"
	"database/sql"

	"github.com/heroiclabs/nakama-common/runtime"
)

// runMigrations ensures the optional players table exists
func runMigrations(ctx context.Context, db *sql.DB, logger runtime.Logger) error {
	if db == nil {
		logger.Warn("DB is nil; skipping migrations")
		return nil
	}
	query := `
	CREATE TABLE IF NOT EXISTS players (
		id UUID PRIMARY KEY,
		device_id TEXT UNIQUE NOT NULL,
		name TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT NOW()
	);
	`
	if _, err := db.ExecContext(ctx, query); err != nil {
		logger.Error("Migration failed: %v", err)
		return err
	}
	logger.Info("Migration: players table ready")
	return nil
}
