import React, { useState, useCallback } from "react";
import {
	View,
	Text,
	ActivityIndicator,
	TextInput,
	TouchableOpacity,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

export default function SignInScreen({ onAuthenticated, loading = false }) {
	const [username, setUsername] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSignIn = useCallback(async () => {
		// Validate username
		const trimmedUsername = username.trim();

		if (!trimmedUsername) {
			Alert.alert("Invalid Input", "Please enter a username");
			return;
		}

		if (trimmedUsername.length < 3) {
			setError("Username must be at least 3 characters");
			return;
		}

		if (trimmedUsername.length > 20) {
			setError("Username must be less than 20 characters");
			return;
		}

		// Dismiss keyboard
		Keyboard.dismiss();

		setIsSubmitting(true);
		setError("");

		try {
			await onAuthenticated(trimmedUsername);
		} catch (err) {
			const errorMessage =
				err?.message || "This username has already been used.";
			setError(errorMessage);
			console.error("Authentication error:", err);
		} finally {
			setIsSubmitting(false);
		}
	}, [username, onAuthenticated]);

	const handleUsernameChange = useCallback(
		(text) => {
			setUsername(text);
			// Clear error when user starts typing
			if (error) setError("");
		},
		[error]
	);

	const isLoading = loading || isSubmitting;
	const isButtonDisabled = isLoading || !username.trim();

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			className="flex-1"
		>
			<StatusBar style="light" />
			<LinearGradient
				colors={["#1a1a2e", "#16213e", "#0f3460"]}
				className="flex-1 justify-center items-center px-6"
			>
				{/* Header */}
				<View className="absolute top-20 flex-row items-center justify-center gap-2">
					<MaterialIcons name="games" size={32} color="#00F0FF" />
					<Text className="text-3xl font-extrabold text-white tracking-widest">
						Tic Tac Toe
					</Text>
				</View>

				{/* Main Content */}
				<View className="w-full max-w-md">
					{/* Username Input */}
					<TextInput
						className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 my-4 text-lg text-white placeholder:text-white/60"
						placeholder="Enter your username"
						placeholderTextColor="rgba(255, 255, 255, 0.6)"
						value={username}
						onChangeText={handleUsernameChange}
						onSubmitEditing={handleSignIn}
						autoCapitalize="none"
						autoCorrect={false}
						autoComplete="username"
						returnKeyType="done"
						maxLength={20}
						editable={!isLoading}
						selectTextOnFocus
						style={{
							textAlignVertical: "center",
						}}
					/>

					{/* Error Message */}
					{error ? (
						<View className="flex-row items-center gap-2 mb-4 px-2">
							<MaterialIcons name="error-outline" size={18} color="#ef4444" />
							<Text className="text-red-400 flex-1">{error}</Text>
						</View>
					) : null}

					{/* Sign In Button */}
					<TouchableOpacity
						onPress={handleSignIn}
						disabled={isButtonDisabled}
						activeOpacity={0.8}
						className={`w-full rounded-xl py-4 my-4 items-center justify-center shadow-lg ${
							isButtonDisabled
								? "bg-gray-500 opacity-50"
								: "bg-[#00F0FF] active:bg-[#00d0df]"
						}`}
					>
						{isLoading ? (
							<ActivityIndicator size="small" color="#FFFFFF" />
						) : (
							<Text className="text-xl font-bold text-white uppercase tracking-wider">
								Sign In
							</Text>
						)}
					</TouchableOpacity>

					{/* Helper Text */}
					<Text className="text-center text-white/50 text-sm mt-2">
						Username must be 3-20 characters
					</Text>
				</View>
			</LinearGradient>
		</KeyboardAvoidingView>
	);
}
