import React, { useState, useEffect } from "react";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import SignInScreen from "./screens/SignInScreen";
import LobbyScreen from "./screens/LobbyScreen";
import GameScreen from "./screens/GameScreen";
import LeaderboardScreen from "./screens/LeaderboardScreen";
import { useNakamaClient } from "./hooks/useNakamaClient.js";
import "../global.css";

export default function App() {
	const { session, authenticate, findMatch, makeMove, matchId, socket } =
		useNakamaClient();

	const [screen, setScreen] = useState("signin");

	useEffect(() => {
		if (session) setScreen("lobby");
	}, [session]);

	return (
		<SafeAreaProvider>
			<SafeAreaView className="flex-1">
				{screen === "signin" && <SignInScreen onAuthenticated={authenticate} />}

				{screen === "lobby" && (
					<LobbyScreen
						onPlay={async (ai) => {
							await findMatch(ai);
							setScreen("game");
						}}
						onLeaderboard={() => setScreen("leaderboard")}
					/>
				)}

				{screen === "game" && (
					<GameScreen
						matchId={matchId}
						onMove={makeMove}
						onExit={() => setScreen("lobby")}
						socket={socket}
					/>
				)}

				{screen === "leaderboard" && (
					<LeaderboardScreen onBack={() => setScreen("lobby")} />
				)}
			</SafeAreaView>
		</SafeAreaProvider>
	);
}
