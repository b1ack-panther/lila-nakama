import {
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	Animated,
	Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";

export default function LobbyScreen({ onPlay, setScreen, onLogout }) {
	const cardAnimations = useRef([
		new Animated.Value(0),
		new Animated.Value(0),
		new Animated.Value(0),
		new Animated.Value(0),
	]).current;

	useEffect(() => {
		const useNativeDriver = Platform.OS !== "web";

		Animated.stagger(100, [
			Animated.spring(cardAnimations[0], { toValue: 1, useNativeDriver }),
			Animated.spring(cardAnimations[1], { toValue: 1, useNativeDriver }),
			Animated.spring(cardAnimations[2], { toValue: 1, useNativeDriver }),
			Animated.spring(cardAnimations[3], { toValue: 1, useNativeDriver }),
		]).start();
	}, []);

	const AnimatedCard = ({ index, children, onPress }) => (
		<Animated.View
			style={{
				opacity: cardAnimations[index],
				transform: [
					{
						translateY: cardAnimations[index].interpolate({
							inputRange: [0, 1],
							outputRange: [20, 0],
						}),
					},
				],
			}}
		>
			<TouchableOpacity
				onPress={onPress}
				activeOpacity={0.7}
				className="rounded-3xl mb-4 active:scale-95"
			>
				{children}
			</TouchableOpacity>
		</Animated.View>
	);

	return (
		<ScrollView className="flex-1 bg-color-background flex justify-center">
			<View>
				{/* Header */}
				<View className="mb-12">
					<View className="flex-row items-center gap-3 mb-2">
						<View className="w-10 h-10 rounded-full bg-color-primary bg-opacity-20 items-center justify-center">
							<MaterialIcons name="games" size={24} color="#06b6d4" />
						</View>
						<Text className="text-3xl font-bold text-color-text">
							Tic Tac Toe
						</Text>
					</View>
				</View>

				{/* Play vs AI Card */}
				<AnimatedCard index={0} onPress={() => onPlay(true)}>
					<View className="bg-gradient-to-br from-color-primary hover:bg-gray-500/30 duration-200 to-color-primary-dark rounded-3xl p-4 shadow-lg">
						<View className="flex-row items-center justify-between">
							<View className="flex-1">
								<Text className="text-color-text font-bold text-xl mb-1">
									Play vs AI
								</Text>
								<Text className="text-color-text opacity-80 text-sm">
									Challenge the computer
								</Text>
							</View>
							<View className="w-12 h-12 rounded-full bg-white opacity-50 items-center justify-center">
								<MaterialIcons name="smart-toy" size={28} color="black" />
							</View>
						</View>
					</View>
				</AnimatedCard>

				{/* Play Online Card */}
				<AnimatedCard index={1} onPress={() => onPlay(false)}>
					<View className="bg-gradient-to-br from-color-accent hover:bg-gray-500/30 duration-200 to-color-accent-light rounded-3xl p-4 shadow-lg">
						<View className="flex-row items-center justify-between">
							<View className="flex-1">
								<Text className="text-color-text font-bold text-xl mb-1">
									Play Online
								</Text>
								<Text className="text-color-text opacity-80 text-sm">
									Multiplayer with friends
								</Text>
							</View>
							<View className="w-12 h-12 rounded-full bg-white opacity-50 items-center justify-center">
								<MaterialIcons name="people" size={28} color="black" />
							</View>
						</View>
					</View>
				</AnimatedCard>

				{/* Leaderboard Card */}
				<AnimatedCard index={2} onPress={() => setScreen("leaderboard")}>
					<View className="bg-color-surface  hover:bg-gray-500/30 duration-200 rounded-3xl p-4 shadow-lg">
						<View className="flex-row items-center justify-between">
							<View className="flex-1">
								<Text className="text-color-text font-bold text-xl mb-1">
									Leaderboard
								</Text>
								<Text className="text-color-text-secondary text-sm">
									Top players worldwide
								</Text>
							</View>
							<View className="w-12 h-12 rounded-full bg-color-primary bg-opacity-20 items-center justify-center">
								<MaterialIcons name="leaderboard" size={28} color="#06b6d4" />
							</View>
						</View>
					</View>
				</AnimatedCard>

				<AnimatedCard index={2} onPress={() => onLogout()}>
					<View className="bg-color-surface border-2 border-color-border rounded-3xl p-3 shadow-lg hover:bg-gray-500/30 duration-200">
						<View className="	h-12 flex flex-row gap-4 w-full rounded-full bg-color-primary bg-opacity-20 items-center justify-center">
							<MaterialIcons name="logout" size={20} color="#64748b" />
							<Text className="text-color-text font-bold text-xl">Logout</Text>
						</View>
					</View>
				</AnimatedCard>
			</View>
		</ScrollView>
	);
}
