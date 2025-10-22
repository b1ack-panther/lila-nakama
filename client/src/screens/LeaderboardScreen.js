import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function LeaderboardSimple({ onBack, nkClient, session }) {
	const [rows, setRows] = useState([]);
	const [loading, setLoading] = useState(false);

	const leaderboardId = "tictactoe_global";

	useEffect(() => {
		const fetchLeaderboard = async () => {
			setLoading(true);
			try {
				const result = await nkClient.listLeaderboardRecords(
					session,
					leaderboardId,
					[],
					50 // fetch top 50 players for simplicity
				);
				setRows(result.records || []);
			} catch (err) {
				console.error("Leaderboard fetch failed:", err);
			} finally {
				setLoading(false);
			}
		};
		fetchLeaderboard();
	}, []);
	console.log(rows)
	const getMedalIcon = (rank) => {
		if (rank === 1) return "🥇";
		if (rank === 2) return "🥈";
		if (rank === 3) return "🥉";
		return null;
	};

	return (
		<View className="flex-1 bg-color-background max-h-dvh">
			{/* Header */}
			<View className="px-6 pt-6 pb-4 border-b border-color-border bg-color-background">
				<View className="flex-row items-center justify-between">
					<View className="flex-row items-center gap-3">
						<View className="w-10 h-10 rounded-full bg-color-primary bg-opacity-20 items-center justify-center">
							<MaterialIcons name="leaderboard" size={24} color="#06b6d4" />
						</View>
						<Text className="text-2xl font-bold text-color-text">
							Leaderboard
						</Text>
					</View>
					<TouchableOpacity onPress={() => onBack()} activeOpacity={0.7}>
						<View className="w-10 h-10 rounded-full bg-color-surface items-center justify-center">
							<MaterialIcons name="arrow-back" size={20} color="#06b6d4" />
						</View>
					</TouchableOpacity>
				</View>
			</View>

			{/* Leaderboard List */}
			<View className="flex-1  overflow-y-scroll h-full">
				{loading ? (
					<View className="py-10 items-center justify-center">
						<ActivityIndicator size="small" color="#06b6d4" />
					</View>
				) : rows.length === 0 ? (
					<View className="flex-1 items-center justify-center py-12">
						<View className="w-16 h-16 rounded-full bg-color-surface items-center justify-center mb-4">
							<MaterialIcons name="leaderboard" size={32} color="#64748b" />
						</View>
						<Text className="text-color-text-secondary mt-4">
							No players yet
						</Text>
					</View>
				) : (
					rows.map((item) => (
						<View
							key={item.owner_id}
							className="px-6 py-4 border-b border-color-border flex-row items-center justify-between"
						>
							<View className="flex-row items-center gap-4 flex-1">
								<View className="w-8 h-8 items-center justify-center">
									{getMedalIcon(item.rank) ? (
										<Text className="text-lg">{getMedalIcon(item.rank)}</Text>
									) : (
										<Text className="text-color-text-secondary font-bold text-sm">
											{item.rank}
										</Text>
									)}
								</View>
								<View className="flex-1">
									<Text className="text-color-text font-semibold text-base">
										{item.username || `Player ${item.owner_id.slice(0, 8)}`}
									</Text>
									{item.owner_id === session?.user_id && (
										<View className="flex-row items-center gap-1 mt-1">
											<View className="w-2 h-2 rounded-full bg-color-primary" />
											<Text className="text-color-primary text-xs font-medium">
												You
											</Text>
										</View>
									)}
								</View>
							</View>
							<Text className="text-color-primary font-bold text-lg">
								{item.score}
							</Text>
						</View>
					))
				)}
			</View>

			{/* Back Button */}
			<View className="py-4 border-t border-color-border bg-color-background">
				<TouchableOpacity
					onPress={onBack}
					activeOpacity={0.7}
					className="bg-color-surface border-color-border rounded-2xl py-3 mx-6"
				>
					<View className="flex-row items-center justify-center gap-2">
						<MaterialIcons name="arrow-back" size={20} color="#06b6d4" />
						<Text className="text-color-text font-semibold">Back to Lobby</Text>
					</View>
				</TouchableOpacity>
			</View>
		</View>
	);
}
