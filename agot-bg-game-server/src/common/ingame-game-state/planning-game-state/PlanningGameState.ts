import GameState from "../../GameState";
import IngameGameState from "../IngameGameState";
import {ClientMessage} from "../../../messages/ClientMessage";
import Player from "../Player";
import Order from "../game-data-structure/Order";
import Region from "../game-data-structure/Region";
import World from "../game-data-structure/World";
import orders from "../game-data-structure/orders";
import {ServerMessage} from "../../../messages/ServerMessage";
import EntireGame from "../../EntireGame";
import {observable} from "mobx";
import * as _ from "lodash";
import BetterMap from "../../../utils/BetterMap";
import Game from "../game-data-structure/Game";
import PlanningRestriction from "../game-data-structure/westeros-card/planning-restriction/PlanningRestriction";
import planningRestrictions from "../game-data-structure/westeros-card/planning-restriction/planningRestrictions";
import House from "../game-data-structure/House";
import User from "../../../server/User";
import PlaceOrderGameState, { SerializedPlaceOrderGameState } from "./place-order-game-state/PlaceOrderGameState";
import ClaimVassalsGameState, { SerializedClaimVassalsGameState } from "./claim-vassals-game-state/ClaimVassalsGameState";

export default class PlanningGameState extends GameState<IngameGameState, PlaceOrderGameState | ClaimVassalsGameState> {
    planningRestrictions: PlanningRestriction[];

    get ingameGameState(): IngameGameState {
        return this.parentGameState;
    }

    get game(): Game {
        return this.ingameGameState.game;
    }

    get world(): World {
        return this.game.world;
    }

    get entireGame(): EntireGame {
        return this.ingameGameState.entireGame;
    }

    firstStart(planningRestrictions: PlanningRestriction[]): void {
        this.ingameGameState.log({
            type: "planning-phase-began"
        });

        this.planningRestrictions = planningRestrictions;

        this.setChildGameState(new PlaceOrderGameState(this));
    }

    onServerMessage(message: ServerMessage): void {
        this.childGameState.onServerMessage(message);
    }

    onPlayerMessage(player: Player, message: ClientMessage): void {
        this.childGameState.onPlayerMessage(player, message);
    }

    onPlaceOrderFinish(orders: BetterMap<Region, Order>) {
        this.ingameGameState.proceedToActionGameState(orders, this.planningRestrictions);
    }

    serializeToClient(admin: boolean, player: Player | null): SerializedPlanningGameState {
        return {
            type: "planning",
            childGameState: this.childGameState.serializeToClient(admin, player)
        };
    }

    static deserializeFromServer(ingameGameState: IngameGameState, data: SerializedPlanningGameState): PlanningGameState {
        const planningGameState = new PlanningGameState(ingameGameState);

        planningGameState.childGameState = planningGameState.deserializeChildGameState(data.childGameState);
        
        return planningGameState;
    }

    deserializeChildGameState(data: SerializedPlanningGameState["childGameState"]): PlanningGameState["childGameState"] {
        switch (data.type) {
            case "place-order":
                return PlaceOrderGameState.deserializeFromServer(this, data);
            case "claim-vassals":
                return ClaimVassalsGameState.deserializeFromServer(this, data);
        }
    }
}

export interface SerializedPlanningGameState {
    type: "planning";
    childGameState: SerializedPlaceOrderGameState | SerializedClaimVassalsGameState;
}
