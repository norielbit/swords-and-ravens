import GameState from "../../../../GameState";
import ClaimVassalsGameState from "../ClaimVassalsGameState";
import Player from "../../../../ingame-game-state/Player";
import { ServerMessage } from "../../../../../messages/ServerMessage";
import { ClientMessage } from "../../../../../messages/ClientMessage";
import House from "../../../../ingame-game-state/game-data-structure/House";

export default class ClaimVassalGameState extends GameState<ClaimVassalsGameState> {
    house: House;

    firstStart(house: House): void {
        this.house = house;
    }

    onServerMessage(message: ServerMessage): void {

    }

    onPlayerMessage(player: Player, message: ClientMessage): void {

    }

    static deserializeFromServer(claimVassals: ClaimVassalsGameState, data: SerializedClaimVassalGameState): ClaimVassalGameState {
        const claimVassal = new ClaimVassalGameState(claimVassals);

        claimVassal.house = claimVassals.game.houses.get(data.house);
        
        return claimVassal;
    }
}

export interface SerializedClaimVassalGameState {
    type: "claim-vassal";
    house: string;
}