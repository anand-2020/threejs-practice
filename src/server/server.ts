import express from "express";
import path from "path";
import http from "http";
import { Server, Socket } from "socket.io";

const port: number = 3000;

class App {
  private server: http.Server;
  private port: number;

  private io: Server;
  private avatars: any = new Map();

  constructor(port: number) {
    this.port = port;
    const app = express();
    app.use(express.static(path.join(__dirname, "../client")));

    this.server = new http.Server(app);

    this.io = new Server(this.server, {
      cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    console.log("starting server");
    this.io.on("connection", (socket: Socket) => {
      console.log(socket.id + " connected");

      socket.on("disconnect", () => {
        console.log("socket disconnected : " + socket.id);
        this.avatars.delete(socket.id);
      });

      socket.on(
        "currLoc",
        (position: THREE.Vector3, rotation: THREE.Quaternion) => {
          const modelName = this.avatars.get(socket.id).modelName;
          this.avatars.set(socket.id, {
            modelName: modelName,
            position: position,
            rotation: rotation,
          });
        }
      );

      socket.on(
        "newAvatar",
        (
          modelName: string,
          position: THREE.Vector3,
          rotation: THREE.Quaternion
        ) => {
          const allAvatars = Array.from(this.avatars, ([sockId, value]) => ({
            sockId,
            ...value,
          }));
          socket.emit("currState", allAvatars);
          socket.broadcast.emit(
            "newAvatar",
            socket.id,
            modelName,
            position,
            rotation
          );
          this.avatars.set(socket.id, {
            modelName: modelName,
            position: position,
            rotation: rotation,
          });
        }
      );

      socket.on(
        "updateAvatar",
        (mixerUpdateDelta: number, keysPressed: any) => {
          socket.broadcast.emit(
            "updateAvatar",
            socket.id,
            mixerUpdateDelta,
            keysPressed
          );
        }
      );
    });
  }

  public Start() {
    this.server.listen(this.port, () => {
      console.log(`Server listening on port ${this.port}.`);
    });
  }
}

new App(port).Start();
