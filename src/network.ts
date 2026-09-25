//import { joinRoom } from "@trystero-p2p/torrent";
import { joinRoom as joinRoomWS } from "@trystero-p2p/ws-relay";
import type {
  JoinRoomConfig,
  MessageAction,
  MessageContext,
  RequestAction,
  Room,
} from "trystero";
import { selfId } from "trystero";
import PlayerManager, { Move } from "./PlayerManager";
import createDebug from "debug";

//temp
import * as THREE from "three";
import Model, { AnimatedModelInstance } from "./models/model";

type GetPlayerDataAction = { id: string; name: string; model: string };

type PlayerMovementAction = {
  direction: THREE.Vector3Tuple;
  timestamp: number;
};

type SerializedPlayerState = {
  id: string;
  position: THREE.Vector3Tuple;
  angle: number;
  ack: number;
};
type GameStateAction = {
  players: SerializedPlayerState[];
};

const log = createDebug("network");
export default class NetworkManager {
  private room: Room;
  private isHost: boolean = false;
  private hostId: string | null = null;
  private getPlayerDataAction: RequestAction<{}, GetPlayerDataAction>;
  private playerMovementAction: MessageAction<PlayerMovementAction>;
  private gameStateAction: MessageAction<GameStateAction>;
  private announceHost!: MessageAction;
  private becomeHostTimeout?: ReturnType<typeof setTimeout>;

  public desynced: boolean = false;

  peers: { [id: string]: { ping: number } } = {};

  constructor(
    private roomId: string,
    private players: PlayerManager,
    //temp
    private scene: THREE.Scene,
    private models: { [name: string]: Model },
  ) {
    const config: JoinRoomConfig = { appId: "pate.ar" };
    //this.room = joinRoom(config, roomId);
    this.room = joinRoomWS(
      {
        ...config,
        relayConfig: {
          urls: [`ws://${window.location.hostname}:8082`],
        },
      },
      roomId,
      { onJoinError: (err) => log(`Error joining room:`, err) },
    );

    this.setupPingPolling();
    this.setupWaitForHost();

    this.getPlayerDataAction = this.room.makeAction<{}, GetPlayerDataAction>(
      "getPlayerData",
      {
        kind: "request",
        onRequest: () => {
          return {
            id: selfId,
            name: "Player " + selfId.slice(0, 4),
            model: "jugadorMa",
          };
        },
      },
    );

    this.playerMovementAction =
      this.room.makeAction<PlayerMovementAction>("playerMovement");
    this.playerMovementAction.onMessage = this.handlePlayerMovement.bind(this);

    this.room.onPeerJoin = this.handlePeerJoin.bind(this);

    this.room.onPeerLeave = this.handlePeerLeave.bind(this);

    this.gameStateAction = this.room.makeAction<GameStateAction>("gameState", {
      kind: "message",
      onMessage: (data) => {
        log("Received game state:", data);
        for (const playerData of data.players) {
          const { id } = playerData;
          if (id === selfId) {
            this.players.reconcileLocalPlayerState(playerData);
            continue;
          }
          const player = this.players.playersMap[id];
          if (!player) {
            log(`Player ${id} not found, skipping game state update`);
            continue;
          }

          player.playerState.position.fromArray(playerData.position);
          player.playerState.angle = playerData.angle;
          player.ack = playerData.ack;
        }
      },
    });
  }

  private initHost() {
    this.isHost = true;
    this.announceHost.send({});
    this.desynced = false;
    log(`Becoming host for room: ${this.roomId}`);
  }

  private handlePeerJoin(pId: string) {
    this.peers[pId] = { ping: 0 };
    if (this.isHost) {
      this.announceHost.send({});
    }
    log(`${pId} joined`);
    this.getPlayerDataAction.request({}, { target: pId }).then((data) => {
      log(`Received player data from ${pId}:`, data);
      this.players.addNetworkPlayer(
        pId,
        new AnimatedModelInstance(this.scene, this.models["jugadorMb"], "idle"),
      );
    });
  }

  private handlePeerLeave(peerId: string) {
    if (peerId === this.hostId) {
      log(`Host ${peerId} left, will attempt to become host`);
      this.desynced = true;
      this.hostId = null;
      this.becomeHostTimeout = setTimeout(() => {
        this.initHost();
      }, Math.random() * 2000);
    }
    this.players.removePlayer(peerId);
    delete this.peers[peerId];
    log(`${peerId} left`);
  }

  sendMovement(move: Move) {
    if (this.isHost) return; // Host doesn't need to send movement to itself
    this.playerMovementAction.send(
      {
        direction: move.direction.toArray(),
        timestamp: move.timestamp,
      },
      { target: this.hostId },
    );
  }

  handlePlayerMovement(
    data: PlayerMovementAction,
    context: MessageContext,
  ): void | Promise<void> {
    // Handle player movement data
    if (!this.isHost) return; // Only the host should process player movements

    this.players.queueNetworkPlayerMovement(context.peerId, {
      direction: new THREE.Vector3(...data.direction),
      timestamp: data.timestamp,
    });
  }

  private setupPingPolling() {
    setInterval(
      async () =>
        Object.keys(this.peers).forEach((id) => {
          this.room.ping(id).then((ping) => {
            //log(`Ping for ${id}: ${ping}`);
            if (this.peers[id]) {
              this.peers[id].ping = ping;
            }
          });
        }),
      1000,
    );
  }

  private setupWaitForHost() {
    this.announceHost = this.room.makeAction("announceHost");
    this.becomeHostTimeout = setTimeout(() => {
      this.initHost();
      const peers = this.room.getPeers();
      log(`Current peers: ${Object.keys(peers).join(", ")}`);
    }, 2000);

    this.announceHost.onMessage = (_, { peerId }) => {
      log(`Host announced by ${peerId}`);
      this.hostId = peerId;
      this.desynced = false;
      clearTimeout(this.becomeHostTimeout);
    };
  }

  update(delta: number) {
    if (this.isHost) {
      this.players.updateNetworkPlayers(delta);
      this.gameStateAction.send({
        players: this.getPlayerStates(),
      });
    }
  }

  getPlayerStates(): SerializedPlayerState[] {
    return Object.values(this.players.playersMap)
      .map((player) => ({
        id: player.id,
        position: player.playerState.position.toArray(),
        angle: player.playerState.angle,
        ack: player.ack,
      }))
      .concat([
        {
          id: selfId,
          position: this.players.localPlayer.playerState.position.toArray(),
          angle: this.players.localPlayer.playerState.angle,
          ack: 0,
        },
      ]);
  }
}
