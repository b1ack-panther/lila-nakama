import { useState, useCallback, useEffect, useRef } from "react";
import { Client } from "@heroiclabs/nakama-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

// Constants
const NAKAMA_CONFIG = {
	SERVER_KEY: "defaultkey",
	HOST: "34.131.145.246",
	PORT: 7350,
	USE_SSL: false,
};

const STORAGE_KEYS = {
	DEVICE_ID: "deviceId",
	USER_ID: "userId",
};

const RPC_IDS = {
	FIND_MATCH: "find_match",
};

const MATCH_STATES = {
	MAKE_MOVE: 4,
	INVITE_AI: 7,
};

export function useNakamaClient() {
	const [client, setClient] = useState(null);
	const [session, setSession] = useState(null);
	const [socket, setSocket] = useState(null);
	const [matchId, setMatchId] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Use refs to prevent socket reconnection issues
	const socketRef = useRef(null);
	const isInitializedRef = useRef(false);

	// Initialize Nakama client
	useEffect(() => {
		if (isInitializedRef.current) return;

		const initializeClient = async () => {
			try {
				// Create Nakama client
				const newClient = new Client(
					NAKAMA_CONFIG.SERVER_KEY,
					NAKAMA_CONFIG.HOST,
					NAKAMA_CONFIG.PORT
				);
				newClient.ssl = NAKAMA_CONFIG.USE_SSL;
				setClient(newClient);

				// Try auto-authentication using stored session
				const deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
				const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);

				if (deviceId && userId) {
					await autoAuthenticate(newClient, deviceId);
				} else {
					console.log("No stored credentials found");
				}
			} catch (err) {
				console.error("Client initialization failed:", err);
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		isInitializedRef.current = true;
		initializeClient();

		// Cleanup function
		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
		};
	}, []);

	// Auto-authenticate with stored credentials
	const autoAuthenticate = async (clientInstance, deviceId) => {
		try {
			const newSession = await clientInstance.authenticateDevice(
				deviceId,
				true
			);
			setSession(newSession);

			// Create and connect socket
			const newSocket = clientInstance.createSocket(
				NAKAMA_CONFIG.USE_SSL,
				false
			);
			await newSocket.connect(newSession);

			socketRef.current = newSocket;
			setSocket(newSocket);

			console.log("Auto-authentication successful");
		} catch (err) {
			console.error("Auto-authentication failed:", err);
			// Clear invalid stored credentials
			await AsyncStorage.multiRemove([
				STORAGE_KEYS.DEVICE_ID,
				STORAGE_KEYS.USER_ID,
			]);
			throw err;
		}
	};

	// Manual authentication (Sign In / Register)
	const authenticate = useCallback(
		async (username) => {
			const trimmedUsername = username.trim();
			if (!trimmedUsername) {
				throw new Error("Username cannot be empty");
			}

			if (!client) {
				throw new Error("Client not initialized");
			}

			setLoading(true);
			setError(null);

			try {
				// Get or create device ID
				let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
				if (!deviceId) {
					deviceId = uuidv4();
					await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
				}

				// Authenticate with device ID
				let newSession = await client.authenticateDevice(deviceId, true);

				// Update account with username
				try {
					await client.updateAccount(newSession, {
						username: trimmedUsername,
					});
					console.log("Username updated successfully");

					// Re-authenticate to get updated session
					newSession = await client.authenticateDevice(deviceId, true);
				} catch (err) {
					console.error("Username update error:", err);

					// Check if username is already taken
					if (err.message?.includes("already exists")) {
						throw new Error("This username is already taken");
					}
					throw err;
				}

				setSession(newSession);
				await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, newSession.user_id);

				// Create and connect socket
				const newSocket = client.createSocket(NAKAMA_CONFIG.USE_SSL, false);
				await newSocket.connect(newSession);

				socketRef.current = newSocket;
				setSocket(newSocket);

				console.log("Authentication successful");
			} catch (err) {
				console.error("Authentication error:", err);
				setError(err.message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[client]
	);

	// Logout function
	const logout = useCallback(async () => {
		setLoading(true);

		try {
			// Disconnect socket
			if (socketRef.current) {
				await socketRef.current.disconnect();
				socketRef.current = null;
			}

			// Clear state
			setSocket(null);
			setSession(null);
			setMatchId(null);
			setError(null);

			// Clear stored user ID (keep device ID for re-authentication)
			await AsyncStorage.removeItem(STORAGE_KEYS.USER_ID);

			console.log("Logout successful");
		} catch (err) {
			console.error("Logout error:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, []);

	// Find match
	const findMatch = useCallback(
		async (ai = false) => {
			if (!client || !session || !socket) {
				throw new Error("Client, session, or socket not available");
			}

			setLoading(true);
			setError(null);

			try {
				const response = await client.rpc(session, RPC_IDS.FIND_MATCH, { ai });

				const newMatchId = response.payload.matchIds[0];

				if (!newMatchId) {
					throw new Error("No match ID returned from server");
				}

				await socket.joinMatch(newMatchId);
				setMatchId(newMatchId);

				console.log("Match found:", newMatchId);
				return newMatchId;
			} catch (err) {
				console.error("Find match error:", err);
				setError(err.message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[client, session, socket]
	);

	// Make a move
	const makeMove = useCallback(
		async (position) => {
			if (!socket || !matchId) {
				throw new Error("Socket or match ID not available");
			}

			try {
				const data = { position };
				await socket.sendMatchState(
					matchId,
					MATCH_STATES.MAKE_MOVE,
					JSON.stringify(data)
				);
				console.log("Move made at position:", position);
			} catch (err) {
				console.error("Make move error:", err);
				setError(err.message);
				throw err;
			}
		},
		[socket, matchId]
	);

	// Invite AI to match
	const inviteAI = useCallback(async () => {
		if (!socket || !matchId) {
			throw new Error("Socket or match ID not available");
		}

		try {
			await socket.sendMatchState(matchId, MATCH_STATES.INVITE_AI, "");
			console.log("AI invited to match");
		} catch (err) {
			console.error("Invite AI error:", err);
			setError(err.message);
			throw err;
		}
	}, [socket, matchId]);

	return {
		client,
		session,
		socket,
		matchId,
		loading,
		error,
		authenticate,
		findMatch,
		makeMove,
		inviteAI,
		logout,
	};
}
