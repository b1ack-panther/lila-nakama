import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { NakamaService } from "../services/nakama";

/*
Simple board rendering and interaction.
*/
export default function GameScreen({ matchId, onExit }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!matchId) return;
    NakamaService.joinMatch(matchId, (payload) => {
      if (payload && payload.state) {
        setState(payload.state);
      }
    });
  }, [matchId]);

  const makeMove = (r,c) => {
    NakamaService.sendMove(matchId, r, c);
  };

  const renderCell = (r,c) => {
    const val = state?.board?.[r]?.[c] || "";
    return (
      <TouchableOpacity 
        key={`${r}-${c}`} 
        onPress={()=>makeMove(r,c)} 
        className="w-20 h-20 justify-center items-center border border-gray-400">
        <Text className="text-3xl">{val}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 items-center pt-10 bg-white">
      <Text className="text-lg mb-3">Match: {matchId}</Text>
      <View className="w-[260px] h-[260px] flex-row flex-wrap">
        {[0,1,2].map(r => [0,1,2].map(c => renderCell(r,c)))}
      </View>
      <View className="h-5" />
      <TouchableOpacity 
        className="bg-red-500 py-3 px-6 rounded-lg" 
        onPress={onExit}>
        <Text className="text-white font-semibold">Exit to Lobby</Text>
      </TouchableOpacity>
    </View>
  );
}
