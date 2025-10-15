// screens/GameScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

/*
GameScreen:
- Displays a 3x3 tic-tac-toe board.
- Uses Nakama socket events via props (matchId, onMove).
- Handles live board updates.
*/

export default function GameScreen({ matchId, onExit, onMove, socket }) {
	const [board, setBoard] = useState([
		["", "", ""],
		["", "", ""],
		["", "", ""],
	]);
	const [loading, setLoading] = useState(true);
	const [turn, setTurn] = useState(null);
	const [winner, setWinner] = useState(null);
	// const { socket } = useNakamaClient();

	useEffect(() => {
		console.log(matchId, "nakama-socket-----", socket);
		if (!matchId || !socket) return;

		setLoading(true);

		const handleMatchData = (data) => {
			try {
				const content = JSON.parse(
					new TextDecoder().decode(new Uint8Array(Object.values(data.data)))
				);
				console.log(content);
				if (content.board) setBoard(content.board);
				if (content.turn) setTurn(content.turn);
				if (content.winner) setWinner(content.winner);
			} catch (err) {
				console.warn("⚠️ Invalid match state data:", err);
			}
		};

		// Listen to Nakama socket updates
		socket.onmatchdata = (matchData) => {
			handleMatchData(matchData);
		};

		setLoading(false);

		return () => {
			// Cleanup listener
			socket.onmatchdata = null;
		};
	}, [matchId, socket]);

	const makeMove = async (r, c) => {
		if (winner) return; // prevent moves after game end
		if (board[r][c] !== "") return; // already filled

		const index = r * 3 + c;
		console.log('make move clicked--', index);
		await onMove(index); // delegate to Nakama hook function
	};

	const renderCell = (r, c) => {
		const val = board[r][c];
		return (
			<TouchableOpacity
				key={`${r}-${c}`}
				onPress={() => makeMove(r, c)}
				className="w-20 h-20 justify-center items-center border border-gray-400"
			>
				<Text className="text-3xl font-bold text-gray-800">{val}</Text>
			</TouchableOpacity>
		);
	};

	if (loading) {
		return (
			<View className="flex-1 justify-center items-center bg-white">
				<ActivityIndicator size="large" color="#000" />
				<Text className="text-gray-600 mt-3">Joining match...</Text>
			</View>
		);
	}

	return (
		<View className="flex-1 items-center pt-10 bg-white">
			<Text className="text-lg mb-2 font-semibold text-gray-800">
				Match ID: {matchId}
			</Text>

			{turn && (
				<Text className="text-md mb-4 text-gray-600">Current turn: {turn}</Text>
			)}

			<View className="w-[260px] h-[260px] flex-row flex-wrap">
				{[0, 1, 2].map((r) => [0, 1, 2].map((c) => renderCell(r, c)))}
			</View>

			{winner && (
				<Text className="text-xl text-green-600 mt-4 font-semibold">
					🎉 Winner: {winner}
				</Text>
			)}

			<View className="mt-6" />
			<TouchableOpacity
				className="bg-red-500 py-3 px-6 rounded-lg"
				onPress={onExit}
			>
				<Text className="text-white font-semibold">Exit to Lobby</Text>
			</TouchableOpacity>
		</View>
	);
}
