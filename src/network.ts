//import { joinRoom } from "@trystero-p2p/torrent";
import { joinRoom as joinRoomWS } from "@trystero-p2p/ws-relay";
import { JoinRoomConfig, MessageAction, Room } from "trystero";
import { selfId } from "trystero";
import { PlayerMap } from "./Player";
import { IInputManager } from "./Input/IInputManager";
import createDebug from "debug";

type GetHostAction = { id: string | null };
type InputUpdateAction = IInputManager["keys"];

const log = createDebug("network");
export default class NetworkManager {
  private room: Room;
  private isHost: boolean = false;
  private hostId: string | null = null;
  private inputUpdateAction: MessageAction<InputUpdateAction>;
  private announceHost!: MessageAction;
  private becomeHostTimeout?: ReturnType<typeof setTimeout>;

  public desynced: boolean = false;

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
    this.setupWaitForHost();

    this.inputUpdateAction =
      this.room.makeAction<InputUpdateAction>("inputUpdate");

    this.room.onPeerJoin = this.handlePeerJoin.bind(this);

    this.room.onPeerLeave = (peerId) => {
      if (peerId === this.hostId) {
        log(`Host ${peerId} left, will attempt to become host`);
        this.desynced = true;
        this.hostId = null;
        this.becomeHostTimeout = setTimeout(() => {
          this.initHost();
        }, Math.random() * 2000);
      }
      delete this.peers[peerId];
      log(`${peerId} left`);
    };
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
  }

  onLocalInputUpdate(inputManager: IInputManager) {
    this.inputUpdateAction.send(inputManager.keys);
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
}
