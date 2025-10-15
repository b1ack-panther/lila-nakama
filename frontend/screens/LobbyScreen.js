import React from "react";
import { View, Text, Button, TouchableOpacity } from "react-native";
import { NakamaService } from "../services/nakama";

/*
Lobby screen: Find match and view leaderboard.
*/
export default function LobbyScreen({ onPlay, onLeaderboard }) {
  const findMatch = async () => {
    const matchId = await NakamaService.createQuickMatch();
    onPlay(matchId);
  };
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-2xl font-bold mb-4">Lila Tic-Tac-Toe</Text>
      <TouchableOpacity 
        className="bg-blue-500 py-3 px-6 rounded-lg mb-4" 
        onPress={findMatch}>
        <Text className="text-white font-semibold">Find Match</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        className="bg-gray-500 py-3 px-6 rounded-lg" 
        onPress={onLeaderboard}>
        <Text className="text-white font-semibold">Leaderboard</Text>
      </TouchableOpacity>
    </View>
  );
}
