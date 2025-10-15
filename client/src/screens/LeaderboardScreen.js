import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { NakamaService } from "../hooks/useNakamaClient";

/*
Leaderboard screen fetches via RPC get_leaderboard.
*/
export default function LeaderboardScreen({ onBack }) {
	const [rows, setRows] = useState([]);
	useEffect(() => {
		NakamaService.getLeaderboard()
			.then(setRows)
			.catch(() => {
				setRows([]);
			});
	}, []);

	return (
		<View className="flex-1 p-4 bg-white">
			<Text className="text-xl font-bold mb-3">Leaderboard</Text>
			<FlatList
				data={rows}
				keyExtractor={(i) => i.username}
				renderItem={({ item }) => (
					<View className="p-2 flex-row justify-between border-b border-gray-200">
						<Text className="text-gray-800">{item.username}</Text>
						<Text className="font-semibold">{item.score} pts</Text>
					</View>
				)}
			/>
			<TouchableOpacity
				className="bg-gray-500 py-3 px-6 rounded-lg mt-4 self-center"
				onPress={onBack}
			>
				<Text className="text-white font-semibold">Back</Text>
			</TouchableOpacity>
		</View>
	);
}
