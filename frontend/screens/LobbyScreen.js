import React from "react";
import { View, Text, Button } from "react-native";
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
    <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
      <Text style={{fontSize:24,fontWeight:"bold",marginBottom:16}}>Lila Tic-Tac-Toe</Text>
      <Button title="Find Match" onPress={findMatch} />
      <View style={{height:16}} />
      <Button title="Leaderboard" onPress={onLeaderboard} />
    </View>
  );
}
