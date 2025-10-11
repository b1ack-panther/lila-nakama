import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, View, Button } from "react-native";
import { NakamaService } from "./services/nakama";
import LobbyScreen from "./screens/LobbyScreen";
import GameScreen from "./screens/GameScreen";
import LeaderboardScreen from "./screens/LeaderboardScreen";

/*
Simple navigation: render selected screen statefully.
In production, use react-navigation. For demo keep it simple.
*/

export default function App() {
  const [screen, setScreen] = useState("lobby");
  const [session, setSession] = useState(null);
  const [matchId, setMatchId] = useState(null);

  useEffect(() => {
    NakamaService.init();
    NakamaService.authenticateDevice().then(s => {
      setSession(s);
      console.log("Authenticated:", s.token);
    }).catch(err => console.warn(err));
  }, []);

  return (
    <SafeAreaView style={{flex:1}}>
      {screen === "lobby" && <LobbyScreen onPlay={(m)=>{ setMatchId(m); setScreen("game"); }} onLeaderboard={()=>setScreen("leaderboard")} />}
      {screen === "game" && <GameScreen matchId={matchId} onExit={()=>setScreen("lobby")} />}
      {screen === "leaderboard" && <LeaderboardScreen onBack={()=>setScreen("lobby")} />}
    </SafeAreaView>
  );
}
