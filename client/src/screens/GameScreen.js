// screens/GameScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
	Animated,
	Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function GameScreen({
	matchId,
	onExit,
	onMove,
	socket,
	session,
}) {
	const { user_id: localUserId, username } = session;
	// board uses null for empty cells (consistent with new UI)
	const [board, setBoard] = useState(Array(9).fill(null));
	const [status, setStatus] = useState("Joining match...");
	const [loading, setLoading] = useState(true);
	const [localMark, setLocalMark] = useState(null); // "X" | "O" | null
	const [turnMark, setTurnMark] = useState(null); // "X" | "O" | null
	const [winner, setWinner] = useState(null); // "X" | "O" | null
	const [nextGameAt, setNextGameAt] = useState(null);

	const [countdown, setCountdown] = useState(null);

	// Prevent double clicks until server confirms / turn changes
	const [movePending, setMovePending] = useState(false);

	// Animation values
	const boardAnimValue = useRef(new Animated.Value(1)).current;
	const winnerScale = useRef(new Animated.Value(0.9)).current;
	const winnerOpacity = useRef(new Animated.Value(0)).current;

	const boardScale = boardAnimValue.interpolate({
		inputRange: [0, 1],
		outputRange: [0.9, 1],
	});
	const boardOpacity = boardAnimValue.interpolate({
		inputRange: [0, 1],
		outputRange: [0.8, 1],
	});

	useEffect(() => {
		const useNativeDriver = Platform.OS !== "web";
		if (winner) {
			Animated.parallel([
				Animated.spring(winnerScale, { toValue: 1, useNativeDriver }),
				Animated.timing(winnerOpacity, {
					toValue: 1,
					duration: 500,
					useNativeDriver,
				}),
			]).start();
		} else {
			Animated.parallel([
				Animated.timing(winnerOpacity, {
					toValue: 0,
					duration: 300,
					useNativeDriver,
				}),
				Animated.spring(winnerScale, { toValue: 0.9, useNativeDriver }),
			]).start();
		}
	}, [winner]);

	// Countdown

	useEffect(() => {
		if (countdown == null || countdown <= 0) {
			return;
		}

		const intervalId = setInterval(() => {
			setCountdown((prev) => {
				if (prev == null || prev <= 1) {
					clearInterval(intervalId);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(intervalId);
	}, [countdown]);

	// leave match on unmount
	useEffect(() => {
		const handleLeaveMatch = async () => {
			try {
				if (socket && matchId) await socket.leaveMatch(matchId);
			} finally {
				if (onExit) onExit();
			}
		};
		return () => handleLeaveMatch();
	}, [matchId, socket]);

	// helper: map numeric/raw marks to "X"/"O"/null
	function normalizeMark(raw) {
		if (raw === 1 || raw === "1") return "X";
		if (raw === 2 || raw === "2") return "O";
		if (raw === "X" || raw === "O") return raw;
		return null;
	}

	// sets status based on the current turn and localMark
	function setStatusFromTurn(turn, lm = localMark) {
		// turn: "X" | "O" | null
		if (!turn) {
			// if game ended, status will be set elsewhere
			setStatus("Waiting...");
			return;
		}
		if (lm) {
			if (turn === lm) setStatus("Your turn");
			else setStatus("Opponent's turn");
		} else {
			setStatus(`${turn}'s turn`);
		}
	}
	// socket handling
	useEffect(() => {
		if (!matchId || !socket) {
			setStatus("No match/socket");
			setLoading(false);
			return;
		}

		setLoading(true);
		setStatus("Finding opponent...");
		setBoard(Array(9).fill(null));
		setLocalMark(null);
		setTurnMark(null);
		setWinner(null);
		setNextGameAt(null);
		setMovePending(false);

		function parseMatchPayload(rawData) {
			try {
				if (rawData == null) return null;
				if (rawData instanceof Uint8Array) {
					const txt = new TextDecoder().decode(rawData);
					return JSON.parse(txt);
				}
				// if server already gives object
				if (typeof rawData === "object") return rawData;
			} catch (err) {
				console.warn("parseMatchPayload error:", err);
			}
			return null;
		}

		function handleMatchData(matchData) {
			const payload = parseMatchPayload(matchData.data);
			if (!payload) return;

			// If server gives per-user marks mapping, set localMark first
			if (payload.marks && localUserId) {
				const raw =
					payload.marks[localUserId] ?? payload.marks[localUserId.toString()];
				const normalized = normalizeMark(raw);
				if (normalized) {
					// ensure localMark is set before computing status
					setLocalMark(normalized);
				}
			}

			// board updates
			if (payload.board) {
				const normalizedBoard = payload.board.map((cell) =>
					normalizeMark(cell)
				);
				setBoard(normalizedBoard);
			}

			// winner
			const w = normalizeMark(payload.winner);
			setWinner(w);

			// turnMark comes from payload.mark (server indicates whose turn it is)
			const tm = normalizeMark(payload.mark);
			setTurnMark(tm);

			// status computation — use the fresh localMark value if provided in payload
			// If we just set localMark above, we want to compute status with that value.
			const maybeLocal =
				payload.marks && localUserId
					? (normalizeMark(
							payload.marks[localUserId] ??
								payload.marks[localUserId.toString()]
						) ?? localMark)
					: localMark;
			setStatusFromTurn(tm, maybeLocal);

			// next game time / deadline support

			if (payload.nextGameStart) {
				const date = new Date(payload.nextGameStart * 1000);
				setNextGameAt(date);
				setCountdown(
					Math.floor(Math.max(0, date.getTime() - Date.now()) / 1000)
				);
			} else if (payload?.deadline) {
				const tictime = Math.floor(
					(new Date(payload.deadline * 1000).getTime() - Date.now()) / 1000
				);
				setCountdown(tictime);
			}

			// If game ended and no winner but board full => draw / tie
			if (!w) {
				const isFull = payload.board
					? payload.board.every((c) => normalizeMark(c) !== null)
					: board.every((c) => c !== null);
				if (isFull) {
					setStatus("It's a Draw!");
				}
			}

			// If we receive an authoritative state after a move, clear movePending
			// (server accepted or rejected the optimistic move)
			setMovePending(false);
			setLoading(false);
		}

		function handleMatchPresence(matchPresence) {
			const joins = matchPresence.joins || [];
			const leaves = matchPresence.leaves || [];
			console.log(matchPresence);
			for (const p of leaves) {
				if (p?.user_id !== localUserId) {
					setStatus("Opponent left");
					setCountdown(0);
				}
			}
			if (joins.length > 0) {
				setStatus("Opponent found — Starting game...");
			}
			setLoading(false);
		}

		const previousOnMatchData = socket.onmatchdata;
		const previousOnMatchPresence = socket.onmatchpresence;

		socket.onmatchdata = (m) => {
			if (m.match_id && m.match_id !== matchId) return;
			handleMatchData(m);
		};

		socket.onmatchpresence = (m) => {
			if (m.match_id && m.match_id !== matchId) return;
			handleMatchPresence(m);
		};

		setLoading(false);

		return () => {
			socket.onmatchdata = previousOnMatchData ?? null;
			socket.onmatchpresence = previousOnMatchPresence ?? null;
		};
	}, [matchId, socket, localUserId]);

	// click handler with optimistic move and movePending lock
	async function handleCellPress(i) {
		// disables clicking if: winner exists, loading, movePending (we already clicked), cell occupied, not player's turn
		if (winner) return;
		if (!socket) {
			Alert.alert("No nakama socket");
			return;
		}
		if (loading) return;
		if (movePending) return;
		if (board[i] !== null) return;

		// must be your turn according to server-provided turnMark
		if (localMark && turnMark && localMark !== turnMark) {
			Alert.alert("Not your turn", "Wait for opponent to play");
			return;
		}

		// optimistic update
		const optimistic = board.slice();
		optimistic[i] = localMark || "X";
		setBoard(optimistic);
		setStatus("Move sent");
		setMovePending(true);

		try {
			await onMove(i); // caller should send match RPC / message to server
			// don't clear movePending here; wait for authoritative matchdata from server to clear it
			// but as a safety, if server call returns quickly we can clear
		} catch (err) {
			console.error("onMove error:", err);
			Alert.alert("Move failed", err.message || String(err));
			// revert optimistic
			setBoard((prev) => {
				const copy = prev.slice();
				if (copy[i] === (localMark || "X")) copy[i] = null;
				return copy;
			});
			setMovePending(false);
		}
	}

	// derived flags
	const isBoardFull = board.every((c) => c !== null);
	const isYourTurn =
		localMark && turnMark && localMark === turnMark && !movePending;

	// UI while joining
	if (loading) {
		return (
			<View className="flex-1 justify-center items-center bg-white">
				<ActivityIndicator size="large" color="#06b6d4" />
				<Text className="mt-3 text-white">Joining match...</Text>
			</View>
		);
	}

	return (
		<View className="flex-1 items-center justify-center bg-color-background dark:bg-color-background-dark p-4 relative w-full">
			<View className="absolute inset-0 rounded-lg" />
			{/* Header */}
			<View className="mb-8 w-full">
				<View className="flex-row justify-between gap-2 w-full items-end">
					<View className="flex flex-row items-center gap-2">
						<View className="w-12 h-12 rounded-full bg-neon-blue/20 items-center justify-center">
							<MaterialIcons name="games" size={30} color="#00F0FF" />
						</View>
						<Text className="text-3xl font-extrabold text-white tracking-widest">
							Tic Tac Toe
						</Text>
					</View>
					<View>
						<Text className="text-white">Username</Text>
						<Text className="text-color-primary">#{username}</Text>
					</View>
				</View>
			</View>

			{/* Game Board */}
			<Animated.View
				style={{ transform: [{ scale: boardScale }], opacity: boardOpacity }}
				className="bg-color-surface/10 rounded-3xl p-4 mb-8 border-4 border-neon-blue dark:border-neon-purple shadow-xl shadow-neon-blue/30 dark:shadow-neon-purple/30"
			>
				<View className="gap-3">
					{[0, 1, 2].map((r) => (
						<View key={r} className="flex-row gap-3">
							{[0, 1, 2].map((c) => {
								const i = r * 3 + c;
								const val = board[i];
								const clickable = !winner && val === null && isYourTurn;
								return (
									<TouchableOpacity
										key={i}
										onPress={() => handleCellPress(i)}
										disabled={!clickable}
										className={`w-24 h-24 rounded-xl items-center justify-center border-4 transition-all duration-300 ease-in-out
											${
												val
													? val === "X"
														? "bg-neon-blue/20 border-neon-blue shadow-lg shadow-neon-blue/40"
														: "bg-neon-pink/20 border-neon-pink shadow-lg shadow-neon-pink/40"
													: "bg-color-surface/10 border-color-border/50 hover:bg-neon-blue/10"
											}
											${clickable ? "active:scale-95" : ""}
										}`}
									>
										<Text
											className={`text-3xl font-extrabold
												${val === "X" ? "text-neon-blue" : "text-neon-pink"}
											}`}
										>
											{val ?? ""}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					))}
				</View>
			</Animated.View>

			{countdown !== null && countdown > 0 && (
				<Text className="text-white text-lg font-bold mt-3 animate-pulse">
					{nextGameAt ? `Next game in` : `Time remaining`} {countdown}s
				</Text>
			)}

			<Text className="text-white text-center text-2xl font-extrabold my-4 tracking-wide">
				{winner === "draw"
					? "It's a Draw!"
					: winner
						? `${winner} Wins!`
						: isBoardFull && !winner
							? "It's a Draw!"
							: `${status}`}
			</Text>

			{/* Buttons */}
			<View className="w-full gap-4 mt-4">
				<TouchableOpacity
					onPress={onExit}
					className="bg-neon-purple/80 rounded-full py-4 shadow-lg shadow-neon-purple/40 active:scale-95 transition-all duration-300"
				>
					<View className="flex-row items-center justify-center gap-2">
						<MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
						<Text className="text-lg font-bold text-white uppercase tracking-wider">
							Back to Lobby
						</Text>
					</View>
				</TouchableOpacity>
			</View>
		</View>
	);
}
