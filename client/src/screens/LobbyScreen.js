// screens/LobbyScreen.js
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export default function LobbyScreen({ onPlay, onLeaderboard }) {
	return (
		<View className="flex-1 justify-center items-center bg-white">
			<Text className="text-3xl font-bold mb-6 text-gray-900">
				Lila Tic-Tac-Toe
			</Text>

			{/* Play vs AI */}
			<TouchableOpacity
				className="bg-green-500 py-3 px-8 rounded-xl mb-4 shadow"
				onPress={() => onPlay(true)} // <-- true = AI mode
			>
				<Text className="text-white text-lg font-semibold">Play vs AI 🤖</Text>
			</TouchableOpacity>

			{/* Play Online (multiplayer) */}
			<TouchableOpacity
				className="bg-blue-500 py-3 px-8 rounded-xl mb-4 shadow"
				onPress={() => onPlay(false)} // <-- false = multiplayer mode
			>
				<Text className="text-white text-lg font-semibold">
					Play Online 🧍‍♂️🧍‍♀️
				</Text>
			</TouchableOpacity>

			{/* Leaderboard */}
			<TouchableOpacity
				className="bg-gray-700 py-3 px-8 rounded-xl shadow"
				onPress={onLeaderboard}
			>
				<Text className="text-white text-lg font-semibold">Leaderboard 🏆</Text>
			</TouchableOpacity>
		</View>
	);
}
