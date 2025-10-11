package main

// Simple types shared between files

// Player record (for matches or DB)
type Player struct {
	ID       string `json:"id"`
	DeviceID string `json:"device_id"`
	Name     string `json:"name"`
}
