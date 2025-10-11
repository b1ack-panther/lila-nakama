import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button } from "react-native";
import { NakamaService } from "../services/nakama";

/*
Leaderboard screen fetches via RPC get_leaderboard.
*/
export default function LeaderboardScreen({ onBack }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    NakamaService.getLeaderboard().then(setRows).catch(()=>{setRows([])});
  }, []);

  return (
    <View style={{flex:1,padding:16}}>
      <Text style={{fontSize:20,fontWeight:"bold",marginBottom:12}}>Leaderboard</Text>
      <FlatList data={rows} keyExtractor={(i)=>i.username} renderItem={({item})=>(
        <View style={{padding:8,flexDirection:"row",justifyContent:"space-between"}}>
          <Text>{item.username}</Text>
          <Text>{item.score} pts</Text>
        </View>
      )} />
      <Button title="Back" onPress={onBack} />
    </View>
  );
}
