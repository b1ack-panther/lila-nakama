package main

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/heroiclabs/nakama-common/api"
	"github.com/heroiclabs/nakama-common/runtime"
)

// afterAuthDevice is called after successful device authentication.
// It stores name in Nakama user metadata and optionally in custom players table.
func afterAuthDevice(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule,
	out *api.Session, in *api.AuthenticateDeviceRequest) error {

	// Pull provided name (frontend should pass vars.name)
	name, ok := in.Vars["name"]
	if !ok || name == "" {
		if len(out.UserId) >= 5 {
			name = fmt.Sprintf("Guest-%s", out.UserId[:5])
		} else {
			name = "Guest"
		}
	}

	// Update Nakama account metadata (best-effort; don't fail auth flow if this fails)
	metadata := map[string]interface{}{"name": name}
	if err := nk.AccountUpdateId(ctx, out.UserId, name, metadata, "", "", "", ""); err != nil {
		logger.Warn("AccountUpdateId failed (non-fatal): %v", err)
	} else {
		logger.Debug("Account metadata set for user %s name=%s", out.UserId, name)
	}

	// Persist to custom players table (optional)
	if err := savePlayerToDB(ctx, db, out.UserId, in.Id, name, logger); err != nil {
		logger.Warn("savePlayerToDB failed (non-fatal): %v", err)
	} else {
		logger.Debug("Player saved/updated in players table: %s (%s)", name, in.Id)
	}

	return nil
}

// savePlayerToDB inserts or updates a player record in the custom players table
func savePlayerToDB(ctx context.Context, db *sql.DB, userID, deviceID, name string, logger runtime.Logger) error {
	if db == nil {
		return fmt.Errorf("database connection is nil")
	}

	// Use upsert (INSERT ... ON CONFLICT) to handle both new and existing players
	query := `
	INSERT INTO players (id, device_id, name)
	VALUES ($1, $2, $3)
	ON CONFLICT (device_id) DO UPDATE
	SET name = $3
	`

	_, err := db.ExecContext(ctx, query, userID, deviceID, name)
	return err
}
