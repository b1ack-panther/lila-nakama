import React, { useCallback, useRef } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	Animated,
	StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

export default function LobbyScreen({ onPlay, setScreen, onLogout }) {
	const AnimatedCard = ({ children, onPress }) => {
		const scaleAnim = useRef(new Animated.Value(1)).current;

		const handlePressIn = useCallback(() => {
			Animated.spring(scaleAnim, {
				toValue: 0.95,
				useNativeDriver: true,
				speed: 50,
				bounciness: 4,
			}).start();
		}, [scaleAnim]);

		const handlePressOut = useCallback(() => {
			Animated.spring(scaleAnim, {
				toValue: 1,
				useNativeDriver: true,
				speed: 50,
				bounciness: 4,
			}).start();
		}, [scaleAnim]);

		return (
			<Animated.View
				style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}
			>
				<TouchableOpacity
					onPress={onPress}
					onPressIn={handlePressIn}
					onPressOut={handlePressOut}
					activeOpacity={0.9}
					className="rounded-3xl mb-4"
				>
					{children}
				</TouchableOpacity>
			</Animated.View>
		);
	};

	const handlePlayAI = useCallback(() => {
		onPlay(true);
	}, [onPlay]);

	const handlePlayOnline = useCallback(() => {
		onPlay(false);
	}, [onPlay]);

	const handleLeaderboard = useCallback(() => {
		setScreen("leaderboard");
	}, [setScreen]);

	return (
		<View className="flex-1 bg-color-background">
			<StatusBar style="light" />
			<ScrollView
				className="flex-1"
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View className="px-6 py-8">
					{/* Header */}
					<View className="mb-12">
						<View className="flex-row items-center gap-3 mb-2">
							<View className="w-12 h-12 rounded-full bg-cyan-500/20 items-center justify-center">
								<MaterialIcons name="games" size={28} color="#06b6d4" />
							</View>
							<Text className="text-4xl font-bold text-white">Tic Tac Toe</Text>
						</View>
						<Text className="text-gray-400 text-base ml-15 mt-1">
							Choose your game mode
						</Text>
					</View>

					{/* Play vs AI Card */}
					<AnimatedCard onPress={handlePlayAI} delay={0}>
						<LinearGradient
							colors={["#06b6d4", "#0891b2", "#0e7490"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							className="rounded-3xl p-6 shadow-xl"
							style={styles.shadowCard}
						>
							<View className="flex-row items-center justify-between">
								<View className="flex-1">
									<Text className="text-white font-bold text-2xl mb-2">
										Play vs AI
									</Text>
									<Text className="text-white/80 text-base">
										Challenge the computer
									</Text>
								</View>
								<View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center">
									<MaterialIcons name="smart-toy" size={32} color="white" />
								</View>
							</View>
						</LinearGradient>
					</AnimatedCard>

					{/* Play Online Card */}
					<AnimatedCard onPress={handlePlayOnline} delay={100}>
						<LinearGradient
							colors={["#8b5cf6", "#7c3aed", "#6d28d9"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							className="rounded-3xl p-6 shadow-xl"
							style={styles.shadowCard}
						>
							<View className="flex-row items-center justify-between">
								<View className="flex-1">
									<Text className="text-white font-bold text-2xl mb-2">
										Play Online
									</Text>
									<Text className="text-white/80 text-base">
										Compete with players
									</Text>
								</View>
								<View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center">
									<MaterialIcons name="people" size={32} color="white" />
								</View>
							</View>
						</LinearGradient>
					</AnimatedCard>

					{/* Leaderboard Card */}
					<AnimatedCard onPress={handleLeaderboard} delay={200}>
						<View className="bg-gray-800/60 border-2 border-gray-700 rounded-3xl p-6 shadow-lg">
							<View className="flex-row items-center justify-between">
								<View className="flex-1">
									<Text className="text-white font-bold text-2xl mb-2">
										Leaderboard
									</Text>
									<Text className="text-gray-400 text-base">
										Top players worldwide
									</Text>
								</View>
								<View className="w-14 h-14 rounded-full bg-yellow-500/20 items-center justify-center">
									<MaterialIcons name="leaderboard" size={32} color="#eab308" />
								</View>
							</View>
						</View>
					</AnimatedCard>

					{/* Logout Button */}
					<AnimatedCard onPress={onLogout} delay={300}>
						<View className="bg-gray-800/40 border-2 border-gray-700 rounded-3xl p-4 shadow-lg mt-4">
							<View className="flex-row items-center justify-center gap-3">
								<MaterialIcons name="logout" size={22} color="#94a3b8" />
								<Text className="text-gray-300 font-semibold text-lg">
									Logout
								</Text>
							</View>
						</View>
					</AnimatedCard>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	scrollContent: {
		flexGrow: 1,
		justifyContent: "center",
	},
	cardContainer: {
		marginBottom: 0,
	},
	shadowCard: {
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 8,
		},
		shadowOpacity: 0.44,
		shadowRadius: 10.32,
		elevation: 16,
	},
});
