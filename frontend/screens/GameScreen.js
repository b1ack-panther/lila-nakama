import React, { useEffect, useState } from "react";
import { View, Text, Button, TouchableOpacity } from "react-native";
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
      <TouchableOpacity key={`${r}-${c}`} onPress={()=>makeMove(r,c)} style={{width:80,height:80,justifyContent:"center",alignItems:"center",borderWidth:1}}>
        <Text style={{fontSize:32}}>{val}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{flex:1,alignItems:"center",paddingTop:40}}>
      <Text style={{fontSize:18,marginBottom:12}}>Match: {matchId}</Text>
      <View style={{width:260,height:260,flexDirection:"row",flexWrap:"wrap"}}>
        {[0,1,2].map(r => [0,1,2].map(c => renderCell(r,c)))}
      </View>
      <View style={{height:20}} />
      <Button title="Exit to Lobby" onPress={onExit} />
    </View>
  );
}
