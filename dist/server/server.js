"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const port = 3000;
class App {
    constructor(port) {
        this.avatars = new Map();
        this.port = port;
        const app = (0, express_1.default)();
        app.use(express_1.default.static(path_1.default.join(__dirname, "../client")));
        this.server = new http_1.default.Server(app);
        this.io = new socket_io_1.Server(this.server, {
            cors: {
                origin: "http://localhost:8080",
                methods: ["GET", "POST"],
                credentials: true,
            },
        });
        this.io.on("connection", (socket) => {
            console.log(socket.id + " connected");
            socket.on("disconnect", () => {
                console.log("socket disconnected : " + socket.id);
                socket.broadcast.emit("leavingAvatar", socket.id);
                this.avatars.delete(socket.id);
            });
            socket.on("currLoc", (position, rotation) => {
                const modelName = this.avatars.get(socket.id).modelName;
                this.avatars.set(socket.id, {
                    modelName: modelName,
                    position: position,
                    rotation: rotation,
                });
            });
            socket.on("newAvatar", (modelName, position, rotation) => {
                const allAvatars = Array.from(this.avatars, ([sockId, value]) => ({
                    sockId,
                    ...value,
                }));
                socket.emit("currState", allAvatars);
                socket.broadcast.emit("newAvatar", socket.id, modelName, position, rotation);
                this.avatars.set(socket.id, {
                    modelName: modelName,
                    position: position,
                    rotation: rotation,
                });
            });
            socket.on("updateAvatar", (mixerUpdateDelta, keysPressed) => {
                socket.broadcast.emit("updateAvatar", socket.id, mixerUpdateDelta, keysPressed);
            });
        });
    }
    Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`);
        });
    }
}
new App(port).Start();
