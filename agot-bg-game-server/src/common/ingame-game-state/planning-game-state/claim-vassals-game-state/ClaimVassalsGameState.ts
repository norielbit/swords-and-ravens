import PlanningGameState from "../PlanningGameState";
import GameState from "../../../GameState";
import ClaimVassalGameState, { SerializedClaimVassalGameState } from "./claim-vassal-game-state/ClaimVassalGameState";
import House from "../../game-data-structure/House";
import { ServerMessage } from "../../../../messages/ServerMessage";
import { ClientMessage } from "../../../../messages/ClientMessage";
import Game from "../../game-data-structure/Game";

export default class ClaimVassalsGameState extends GameState<PlanningGameState, ClaimVassalGameState> {

    get game(): Game {
        return this.parentGameState.game;
    }

    firstStart(): void {
        this.proceedNextVassal(null);
    }

    proceedNextVassal(lastToClaim: House | null): void {

    }

    onServerMessage(message: ServerMessage): void {
        this.childGameState.onServerMessage(message);
    }

    onPlayerMessage(player: Player, message: ClientMessage): void {
        this.childGameState.onPlayerMessage(player, message);
    }

    static deserializeFromServer(planningGameState: PlanningGameState, data: SerializedClaimVassalsGameState): ClaimVassalsGameState {
        const claimVassals = new ClaimVassalGameState(planningGameState);

        claimVassals.childGameState = claimVassals.deserializeChildGameState(data.childGameState);
        
        return claimVassals;
    }

    deserializeChildGameState(data: SerializedClaimVassalsGameState["childGameState"]): ClaimVassalsGameState["childGameState"] {
        switch (data.type) {
            case "claim-vassal":
                return ClaimVassalGameState.deserializeFromServer(this, data);
        }
    }

}

export interface SerializedClaimVassalsGameState {
    type: "claim-vassals";
    childGameState: SerializedClaimVassalGameState;
    
}