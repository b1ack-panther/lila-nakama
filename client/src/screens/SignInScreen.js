// screens/SignInScreen.js
import React, { useState } from "react";
import {
	View,
	Text,
	ActivityIndicator,
	TextInput,
	TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

export default function SignInScreen({ onAuthenticated, loading }) {
	const [username, setUsername] = useState("");
	const [error, setError] = useState("");

	const handleSignIn = async () => {
		if (!username.trim()) {
			alert("Please enter a username");
			return;
		}
		try {
			await onAuthenticated(username.trim());
			setError("");
		} catch (error) {
			if (error?.status === 409) {
				setError("This username has already been used.");
			}
			console.log(error);
		}
	};

	return (
		<LinearGradient
			colors={["#1a1a2e", "#16213e", "#0f3460"]}
			className="flex-1 justify-center items-center px-6"
		>
			<View className="absolute top-20 flex-row items-center justify-center gap-2">
				<MaterialIcons name="games" size={30} color="#00F0FF" />
				<Text className="text-3xl font-extrabold text-white tracking-widest">
					Tic Tac Toe
				</Text>
			</View>

			<TextInput
				className="w-full bg-color-surface/50 border border-color-border/50 rounded-xl px-4 py-3 my-4 text-lg text-white placeholder:text-white/70 focus-visible:border-0 focus-visible:outline-none"
				placeholder="Enter your username"
				placeholderTextColor="#FFFFFF70"
				value={username}
				onChangeText={setUsername}
				autoCapitalize="none"
				autoCorrect={false}
			/>

			{loading ? (
				<ActivityIndicator size="large" color="#00F0FF" />
			) : (
				<TouchableOpacity
					onPress={handleSignIn}
					className="w-full bg-neon-blue dark:bg-neon-purple rounded-xl py-3 my-4 items-center justify-center shadow-lg shadow-neon-blue/40 hover:bg-shadow-neon-purple/40 active:scale-95 transition-all duration-100 ease-in-out"
				>
					<Text className="text-xl font-bold text-white uppercase tracking-wider">
						Sign In
					</Text>
				</TouchableOpacity>
			)}
			{error.length ? <Text className="my-4 text-red-400">{error}</Text> : null}
		</LinearGradient>
	);
}
