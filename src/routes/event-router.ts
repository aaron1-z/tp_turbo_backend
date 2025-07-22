import { Server, Socket } from "socket.io";
import { PlaceBetPayload } from "../interfaces/bet-interface";
import {handlePlaceBet} from "../controllers/bet-controller";

export const registerSocketEvents = (io: Server, socket: Socket) => {
    socket.on('place_bet', (payload: PlaceBetPayload) => {
        handlePlaceBet(io, socket, payload);
    });
};