// hooks/useNakamaClient.js
import { useState, useCallback } from "react";
import { Client } from "@heroiclabs/nakama-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

export function useNakamaClient() {
	const [client, setClient] = useState(null);
	const [session, setSession] = useState(null);
	const [socket, setSocket] = useState(null);
	const [matchId, setMatchId] = useState(null);

	// Authenticate the device
	const authenticate = useCallback(async (username) => {
		if (!username.trim()) return;
		const newClient = new Client("defaultkey", "localhost", "7350"); // replace with your local IP
		newClient.ssl = false;
		setClient(newClient);

		// let deviceId = await AsyncStorage.getItem("deviceId");
		let deviceId = "";
		if (!deviceId) {
			deviceId = uuidv4();
			await AsyncStorage.setItem("deviceId", deviceId);
		}

		const newSession = await newClient.authenticateDevice(
			deviceId,
			true,
			username
		);

		setSession(newSession);
		await AsyncStorage.setItem("user_id", newSession.user_id);

		const newSocket = newClient.createSocket(newClient.ssl, false);

		await newSocket.connect(newSession);
		setSocket(newSocket);

		console.log("✅ Authenticated:", newSession.user_id);
	}, []);

	// Find match (RPC)
	const findMatch = useCallback(
		async (ai = false) => {
			if (!client || !session) return;
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

	// Send move
	const makeMove = useCallback(
		async (index) => {
			if (!socket || !matchId) return;
			const data = { position: index };
			try {
				await socket.sendMatchState(matchId, 4, JSON.stringify(data));
			} catch (error) {
				console.log("make move error: ", error);
			}
			console.log("🕹 Move sent:", index);
		},
		[socket, matchId]
	);

	// Invite AI
	const inviteAI = useCallback(async () => {
		if (!socket || !matchId) return;
		await socket.sendMatchState(matchId, 7, "");
		console.log("🤖 AI invited");
	}, [socket, matchId]);

	return {
		client,
		session,
		socket,
		matchId,
		authenticate,
		findMatch,
		makeMove,
		inviteAI,
	};
}
