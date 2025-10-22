import React, { useState, useEffect } from "react";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import SignInScreen from "./screens/SignInScreen";
import LobbyScreen from "./screens/LobbyScreen";
import GameScreen from "./screens/GameScreen";
import LeaderboardScreen from "./screens/LeaderboardScreen";
import { useNakamaClient } from "./hooks/useNakamaClient.js";
import "../global.css";
import { View } from "react-native";

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

	const [screen, setScreen] = useState("signin");
	console.log(session)
	useEffect(() => {
		if (session) setScreen("lobby");
	}, [session]);

	return (
		<SafeAreaProvider>
			<SafeAreaView className="flex-1 ">
				<View className="w-full bg-color-background h-dvh overflow-y-scroll flex items-center justify-center">
					<View className=" px-2 max-w-xl mx-auto w-full h-full">
						{screen === "signin" && (
							<SignInScreen onAuthenticated={authenticate} />
						)}

						{screen === "lobby" && (
							<LobbyScreen
								onPlay={async (ai) => {
									await findMatch(ai);
									setScreen("game");
								}}
								onLogout={async () => {
									await logout();
									setScreen("signin");
								}}
								setScreen={setScreen}
							/>
						)}

						{screen === "game" && (
							<GameScreen
								matchId={matchId}
								onMove={makeMove}
								onExit={() => setScreen("lobby")}
								socket={socket}
								session={session}
							/>
						)}

						{screen === "leaderboard" && (
							<LeaderboardScreen
								onBack={() => setScreen("lobby")}
								nkClient={client}
								session={session}
							/>
						)}
					</View>
				</View>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}
