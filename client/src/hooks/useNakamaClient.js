// hooks/useNakamaClient.js
import { useState, useCallback, useEffect } from "react";
import { Client } from "@heroiclabs/nakama-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

export function useNakamaClient() {
	const [client, setClient] = useState(null);
	const [session, setSession] = useState(null);
	const [socket, setSocket] = useState(null);
	const [matchId, setMatchId] = useState(null);
	const [loading, setLoading] = useState(true); // for auto-login check

	// Initialize Nakama client
	useEffect(() => {
		const initializeClient = async () => {
			const newClient = new Client("defaultkey", "localhost", "7350");
			newClient.ssl = false;
			setClient(newClient);

			// Try auto-authenticate using stored session
			try {
				const deviceId = await AsyncStorage.getItem("deviceId");
				const userId = await AsyncStorage.getItem("userId");

				if (deviceId && userId) {
					const newSession = await newClient.authenticateDevice(deviceId, true);
					setSession(newSession);

					const newSocket = newClient.createSocket(newClient.ssl, false);
					await newSocket.connect(newSession);
					setSocket(newSocket);
				} else {
					console.log("No stored credentials, waiting for manual login.");
				}
			} catch (error) {
				console.log("Auto-authentication failed:", error);
			} finally {
				setLoading(false);
			}
		};

		initializeClient();
	}, []);

	// Authenticate manually (Sign In / Register)
	const authenticate = useCallback(
		async (username) => {
			if (!username.trim()) return;
			if (!client) return;

			let deviceId = await AsyncStorage.getItem("deviceId");
			if (!deviceId) {
				deviceId = uuidv4();
				await AsyncStorage.setItem("deviceId", deviceId);
			}

			const newSession = await client.authenticateDevice(
				deviceId,
				true,
				username
			);
			await client.updateAccount(newSession, {
				username,
			});

			setSession(newSession);
			await AsyncStorage.setItem("userId", newSession.user_id);

			const newSocket = client.createSocket(client.ssl, false);
			await newSocket.connect(newSession);
			setSocket(newSocket);
		},
		[client]
	);

	// Logout function
	const logout = async () => {
		console.log("logout--");
		try {
			if (socket) {
				console.log(socket);
				await socket.disconnect();
				setSocket(null);
			}

			setSession(null);
			setMatchId(null);

			await AsyncStorage.removeItem("userId");
		} catch (error) {
			console.log("Logout error:", error);
		}
	};

	// Find match
	const findMatch = useCallback(
		async (ai = false) => {
			console.log(client, session, socket);
			if (!client || !session || !socket) return;
			const rpcid = "find_match";
			const matches = await client.rpc(session, rpcid, { ai });
			const newMatchId = matches.payload.matchIds[0];
			await socket.joinMatch(newMatchId);
			setMatchId(newMatchId);
			console.log("🎮 Found match:", newMatchId);
			return newMatchId;
		},
		[client, session, socket]
	);

	// Make a move
	const makeMove = useCallback(
		async (index) => {
			if (!socket || !matchId) return;
			const data = { position: index };
			try {
				await socket.sendMatchState(matchId, 4, JSON.stringify(data));
			} catch (error) {
				console.log("make move error: ", error);
			}
		},
		[socket, matchId]
	);

	// Invite AI
	const inviteAI = useCallback(async () => {
		if (!socket || !matchId) return;
		await socket.sendMatchState(matchId, 7, "");
	}, [socket, matchId]);

	return {
		client,
		session,
		socket,
		matchId,
		loading,
		authenticate,
		findMatch,
		makeMove,
		inviteAI,
		logout,
	};
}
