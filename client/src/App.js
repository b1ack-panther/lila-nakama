import React, { useState, useEffect, useCallback } from "react";
import { View, StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import SignInScreen from "./screens/SignInScreen";
import LobbyScreen from "./screens/LobbyScreen";
import GameScreen from "./screens/GameScreen";
import LeaderboardScreen from "./screens/LeaderboardScreen";
import { useNakamaClient } from "./hooks/useNakamaClient.js";

import "../global.css";

// Screen navigation constants
const SCREENS = {
	SIGNIN: "signin",
	LOBBY: "lobby",
	GAME: "game",
	LEADERBOARD: "leaderboard",
};

export default function App() {
	const {
		session,
		authenticate,
		findMatch,
		makeMove,
		matchId,
		socket,
		client,
		logout,
	} = useNakamaClient();

	const [screen, setScreen] = useState(SCREENS.SIGNIN);

	// Auto-navigate to lobby when authenticated
	useEffect(() => {
		if (session && screen === SCREENS.SIGNIN) {
			setScreen(SCREENS.LOBBY);
		}
	}, [session, screen]);

	// Memoized navigation handlers
	const handlePlay = useCallback(
		async (ai) => {
			try {
				await findMatch(ai);
				setScreen(SCREENS.GAME);
			} catch (error) {
				console.error("Failed to find match:", error);
			}
		},
		[findMatch]
	);

	const handleLogout = useCallback(async () => {
		try {
			await logout();
			setScreen(SCREENS.SIGNIN);
		} catch (error) {
			console.error("Failed to logout:", error);
		}
	}, [logout]);

	const handleExitGame = useCallback(() => {
		setScreen(SCREENS.LOBBY);
	}, []);

	const handleBackToLobby = useCallback(() => {
		setScreen(SCREENS.LOBBY);
	}, []);

	// Render active screen
	const renderScreen = () => {
		switch (screen) {
			case SCREENS.SIGNIN:
				return <SignInScreen onAuthenticated={authenticate} />;

			case SCREENS.LOBBY:
				return (
					<LobbyScreen
						onPlay={handlePlay}
						onLogout={handleLogout}
						setScreen={setScreen}
					/>
				);

			case SCREENS.GAME:
				return (
					<GameScreen
						matchId={matchId}
						onMove={makeMove}
						onExit={handleExitGame}
						socket={socket}
						session={session}
					/>
				);

			case SCREENS.LEADERBOARD:
				return (
					<LeaderboardScreen
						onBack={handleBackToLobby}
						nkClient={client}
						session={session}
					/>
				);

			default:
				return <SignInScreen onAuthenticated={authenticate} />;
		}
	};

	return (
		<SafeAreaProvider>
			<StatusBar barStyle="light-content" backgroundColor="#000000" />
			<SafeAreaView
				className="flex-1 bg-color-background"
				edges={["top", "bottom"]}
			>
				<View className="flex-1 px-2 max-w-xl mx-auto w-full">
					{renderScreen()}
				</View>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}
