//import { joinRoom } from "@trystero-p2p/torrent";
import { joinRoom as joinRoomWS } from "@trystero-p2p/ws-relay";
import { JoinRoomConfig, MessageAction, Room } from "trystero";
import { selfId } from "trystero";
import { PlayerMap } from "./Player";
import { IInputManager, KeyState } from "./Input/IInputManager";

type GetHostAction = { id: string };

type InputUpdateAction = IInputManager["keys"];

export default class NetworkManager {
  private room: Room;
  private isHost: boolean = false;
  private inputUpdateAction: MessageAction<InputUpdateAction>;

  peers: { [id: string]: { ping: number } } = {};

  constructor(
    private roomId: string,
    private players: PlayerMap,
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
    );

    this.setupPingPolling();
    // // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    // const getHost = this.room.makeAction<{}, GetHostAction>("getHost", {
    //   kind: "request",
    //   onRequest: () => {
    //     return { id: this.isHost ? selfId : this.hostId };
    //   },
    // });

    // getHost
    //   .requestMany(
    //     {},
    //     {
    //       target: Object.keys(peers)[0],
    //     },
    //   )
    //   .then((response) => {
    //     console.log(`Host ID received: ${response.id}`);
    //     this.hostId = response.id;
    //   });

    this.inputUpdateAction =
      this.room.makeAction<InputUpdateAction>("inputUpdate");

    this.room.onPeerJoin = (pId) => {
      this.peers[pId] = { ping: 0 };
      console.log(`${pId} joined`);
    };

    this.room.onPeerLeave = (peerId) => {
      delete this.peers[peerId];
      console.log(`${peerId} left`);
    };
  }

  initHost() {
    this.isHost = true;
    console.log(`Initializing host for room: ${this.roomId}`);
  }

  handlePeerJoin() {
    this.room.onPeerJoin = (pId) => console.log(`${pId} joined`);
  }

  onLocalInputUpdate(inputManager: IInputManager) {
    this.inputUpdateAction.send(inputManager.keys);
  }

  private setupPingPolling() {
    setInterval(
      async () =>
        Object.keys(this.peers).forEach((id) => {
          this.room.ping(id).then((ping) => {
            console.log(`Ping for ${id}: ${ping}`);
            if (this.peers[id]) {
              this.peers[id].ping = ping;
            }
          });
        }),
      1000,
    );
  }
}
