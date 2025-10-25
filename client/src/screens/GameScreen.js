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
	StyleSheet,
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
	const [board, setBoard] = useState(Array(9).fill(null));
	const [status, setStatus] = useState("Joining match...");
	const [loading, setLoading] = useState(true);
	const [localMark, setLocalMark] = useState(null);
	const [turnMark, setTurnMark] = useState(null);
	const [winner, setWinner] = useState(null);
	const [nextGameAt, setNextGameAt] = useState(null);
	const [countdown, setCountdown] = useState(null);
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

	function normalizeMark(raw) {
		if (raw === 1 || raw === "1") return "X";
		if (raw === 2 || raw === "2") return "O";
		if (raw === "X" || raw === "O") return raw;
		return null;
	}

	function setStatusFromTurn(turn, lm = localMark) {
		if (!turn) {
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
				if (typeof rawData === "object") return rawData;
			} catch (err) {
				console.warn("parseMatchPayload error:", err);
			}
			return null;
		}

		function handleMatchData(matchData) {
			const payload = parseMatchPayload(matchData.data);
			if (!payload) return;

			if (payload.marks && localUserId) {
				const raw =
					payload.marks[localUserId] ?? payload.marks[localUserId.toString()];
				const normalized = normalizeMark(raw);
				if (normalized) {
					setLocalMark(normalized);
				}
			}

			if (payload.board) {
				const normalizedBoard = payload.board.map((cell) =>
					normalizeMark(cell)
				);
				setBoard(normalizedBoard);
			}

			const w = normalizeMark(payload.winner);
			setWinner(w);

			const tm = normalizeMark(payload.mark);
			setTurnMark(tm);

			const maybeLocal =
				payload.marks && localUserId
					? (normalizeMark(
							payload.marks[localUserId] ??
								payload.marks[localUserId.toString()]
						) ?? localMark)
					: localMark;
			setStatusFromTurn(tm, maybeLocal);

			if (payload.nextGameStart) {
				const date = new Date(payload.nextGameStart * 1000);
				setNextGameAt(date);
				setCountdown(
					// Math.floor(Math.max(0, date.getTime() - Date.now() - 24000) / 1000)
					10
				);
			} else if (payload?.deadline) {
				setNextGameAt(null);
				// const tictime = Math.floor(
				// 	(new Date(payload.deadline * 1000).getTime() - Date.now()) / 1000
				// );
				setCountdown(10);
			}

			if (!w) {
				const isFull = payload.board
					? payload.board.every((c) => normalizeMark(c) !== null)
					: board.every((c) => c !== null);
				if (isFull) {
					setStatus("It's a Draw!");
				}
			}

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

	async function handleCellPress(i) {
		if (winner) return;
		if (!socket) {
			Alert.alert("No nakama socket");
			return;
		}
		if (loading) return;
		if (movePending) return;
		if (board[i] !== null) return;

		if (localMark && turnMark && localMark !== turnMark) {
			Alert.alert("Not your turn", "Wait for opponent to play");
			return;
		}

		const optimistic = board.slice();
		optimistic[i] = localMark || "X";
		setBoard(optimistic);
		setStatus("Move sent");
		setMovePending(true);

		try {
			await onMove(i);
		} catch (err) {
			console.error("onMove error:", err);
			Alert.alert("Move failed", err.message || String(err));
			setBoard((prev) => {
				const copy = prev.slice();
				if (copy[i] === (localMark || "X")) copy[i] = null;
				return copy;
			});
			setMovePending(false);
		}
	}

	const isBoardFull = board.every((c) => c !== null);
	const isYourTurn =
		localMark && turnMark && localMark === turnMark && !movePending;

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#06b6d4" />
				<Text style={styles.loadingText}>Joining match...</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerRow}>
					<View style={styles.headerLeft}>
						<View style={styles.iconContainer}>
							<MaterialIcons name="games" size={30} color="#00F0FF" />
						</View>
						<Text style={styles.title}>Tic Tac Toe</Text>
					</View>
					<View style={styles.userInfo}>
						<Text style={styles.usernameLabel}>Username</Text>
						<Text style={styles.username}>#{username}</Text>
					</View>
				</View>
			</View>

			{/* Game Board */}
			<Animated.View
				style={[
					styles.boardContainer,
					{ transform: [{ scale: boardScale }], opacity: boardOpacity },
				]}
			>
				<View style={styles.board}>
					{[0, 1, 2].map((r) => (
						<View key={r} style={styles.row}>
							{[0, 1, 2].map((c) => {
								const i = r * 3 + c;
								const val = board[i];
								const clickable = !winner && val === null && isYourTurn;

								const cellStyle = [
									styles.cell,
									val === "X" && styles.cellX,
									val === "O" && styles.cellO,
									styles.cellEmpty,
								];

								return (
									<TouchableOpacity
										key={i}
										onPress={() => handleCellPress(i)}
										disabled={!clickable}
										style={cellStyle}
										activeOpacity={clickable ? 0.7 : 1}
									>
										<Text
											style={[
												styles.cellText,
												val === "X" && styles.cellTextX,
												val === "O" && styles.cellTextO,
											]}
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
				<Text style={styles.countdown}>
					{nextGameAt ? `Next game in` : `Time remaining`} {countdown}s
				</Text>
			)}

			<Text style={styles.status}>
				{winner === "draw"
					? "It's a Draw!"
					: winner
						? `${winner} Wins!`
						: isBoardFull && !winner
							? "It's a Draw!"
							: `${status}`}
			</Text>

			{/* Buttons */}
			<View style={styles.buttonContainer}>
				<TouchableOpacity
					onPress={onExit}
					style={styles.backButton}
					activeOpacity={0.8}
				>
					<View style={styles.buttonContent}>
						<MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
						<Text style={styles.buttonText}>Back to Lobby</Text>
					</View>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#1a1a2e",
	},
	loadingText: {
		marginTop: 12,
		color: "#FFFFFF",
		fontSize: 16,
	},
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#1a1a2e",
		padding: 16,
		width: "100%",
	},
	header: {
		marginBottom: 32,
		width: "100%",
	},
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-end",
		width: "100%",
		gap: 8,
	},
	headerLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	iconContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: "rgba(0, 240, 255, 0.2)",
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		fontSize: 28,
		fontWeight: "800",
		color: "#FFFFFF",
		letterSpacing: 2,
	},
	userInfo: {
		alignItems: "flex-end",
	},
	usernameLabel: {
		color: "#FFFFFF",
		fontSize: 14,
	},
	username: {
		color: "#00F0FF",
		fontSize: 16,
		fontWeight: "600",
	},
	boardContainer: {
		backgroundColor: "#2a2a3e",
		borderRadius: 24,
		padding: 16,
		marginBottom: 32,
		borderWidth: 4,
		borderColor: "#00F0FF",
		shadowColor: "#00F0FF",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 12,
		elevation: 8,
	},
	board: {
		gap: 12,
	},
	row: {
		flexDirection: "row",
		gap: 12,
	},
	cell: {
		width: 96,
		height: 96,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 4,
		backgroundColor: "#000",
	},
	cellX: {
		backgroundColor: "rgba(0, 240, 255, 0.2)",
		borderColor: "#00F0FF",
		shadowColor: "#00F0FF",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.4,
		shadowRadius: 8,
		elevation: 4,
	},
	cellO: {
		backgroundColor: "rgba(255, 20, 147, 0.2)",
		borderColor: "#FF1493",
		shadowColor: "#FF1493",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.4,
		shadowRadius: 8,
		elevation: 4,
	},
	cellEmpty: {
		backgroundColor: "#2a2a3e",
		borderColor: "rgba(255, 255, 255, 0.3)",
	},
	cellText: {
		fontSize: 36,
		fontWeight: "800",
	},
	cellTextX: {
		color: "#00F0FF",
	},
	cellTextO: {
		color: "#FF1493",
	},
	countdown: {
		color: "#FFFFFF",
		fontSize: 18,
		fontWeight: "700",
		marginTop: 12,
	},
	status: {
		color: "#FFFFFF",
		textAlign: "center",
		fontSize: 24,
		fontWeight: "800",
		marginVertical: 16,
		letterSpacing: 1,
	},
	buttonContainer: {
		width: "100%",
		gap: 16,
		marginTop: 16,
	},
	backButton: {
		backgroundColor: "rgba(138, 43, 226, 0.8)",
		borderRadius: 25,
		paddingVertical: 16,
		shadowColor: "#8A2BE2",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.4,
		shadowRadius: 8,
		elevation: 6,
	},
	buttonContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
	buttonText: {
		fontSize: 18,
		fontWeight: "700",
		color: "#FFFFFF",
		textTransform: "uppercase",
		letterSpacing: 1.5,
	},
});
