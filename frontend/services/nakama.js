// Nakama client wrapper for React Native
import { Client, Socket, Session } from "@heroiclabs/nakama-js";
import DeviceInfo from "react-native-device-info";
import AsyncStorage from "@react-native-async-storage/async-storage";

/*
Creates a Nakama client and socket, authenticates with device ID,
manages session tokens and auto-refresh (1 hour expiry).
*/
const SERVER_KEY = process.env.NAKAMA_SERVER_KEY || "defaultkey";
const HOST = process.env.NAKAMA_HOST || "127.0.0.1";
const PORT = process.env.NAKAMA_PORT || "7350";
const USE_SSL = false;

const client = new Client(SERVER_KEY, HOST, PORT, USE_SSL);
let socket = null;
let session = null;

export const NakamaService = {
  init: () => {
    socket = client.createSocket(false);
  },
  authenticateDevice: async () => {
    let deviceId = await AsyncStorage.getItem("lila:deviceId");
    if (!deviceId) {
      deviceId = DeviceInfo.getUniqueId();
      await AsyncStorage.setItem("lila:deviceId", deviceId);
    }
    // authenticate
    const resp = await client.authenticateDevice(deviceId, true, null, null, null, null);
    session = resp;
    await AsyncStorage.setItem("lila:sessionToken", session.token);
    await AsyncStorage.setItem("lila:refreshToken", session.refresh_token || "");
    // connect socket
    await socket.connect(session, true);
    return session;
  },
  createQuickMatch: async () => {
    // Call RPC registered in Go runtime
    const rpc = await client.rpc(session, "create_quick_match", "");
    const parsed = JSON.parse(rpc.payload);
    return parsed.match_id;
  },
  joinMatch: async (matchId, onData) => {
    await socket.joinMatch(matchId);
    socket.onmatchdata = (m) => {
      if (m && m.data) {
        try {
          const payload = JSON.parse(new TextDecoder().decode(m.data));
          onData(payload);
        } catch(err){}
      }
    };
  },
  sendMove: async (matchId, row, col) => {
    const payload = JSON.stringify({row, col});
    // opcode 1 used in match loop
    await socket.send(matchId, 1, payload);
  },
  getLeaderboard: async () => {
    const rpc = await client.rpc(session, "get_leaderboard", "");
    return JSON.parse(rpc.payload);
  }
};
