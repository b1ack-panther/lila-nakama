// screens/SignInScreen.js
import React, { useState } from "react";
import { View, Text, Button, ActivityIndicator, TextInput } from "react-native";

export default function SignInScreen({ onAuthenticated, loading }) {
	const [username, setUsername] = useState("");

	const handleSignIn = () => {
		if (!username.trim()) {
			alert("Please enter a username");
			return;
		}
		onAuthenticated(username.trim());
	};

	return (
		<View className="flex-1 justify-center items-center bg-gray-100 px-6">
			<Text className="text-2xl font-semibold mb-4 text-gray-800">
				Welcome to Lila TicTacToe
			</Text>

			<TextInput
				className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 m-4 text-lg focus-visible:border-0 focus-visible:outline-none "
				placeholder="Enter your username"
				value={username}
				onChangeText={setUsername}
				autoCapitalize="none"
				autoCorrect={false}
			/>

			{loading ? (
				<ActivityIndicator size="large" color="#000" />
			) : (
				<Button title="Sign In" onPress={handleSignIn} />
			)}
		</View>
	);
}
