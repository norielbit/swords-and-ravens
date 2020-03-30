import GameState from "../../../GameState";
import IngameGameState from "../../IngameGameState";
import {ClientMessage} from "../../../../messages/ClientMessage";
import Player from "../../Player";
import Order from "../../game-data-structure/Order";
import Region from "../../game-data-structure/Region";
import World from "../../game-data-structure/World";
import orders from "../../game-data-structure/orders";
import {ServerMessage} from "../../../../messages/ServerMessage";
import EntireGame from "../../../EntireGame";
import {observable} from "mobx";
import * as _ from "lodash";
import BetterMap from "../../../../utils/BetterMap";
import Game from "../../game-data-structure/Game";
import PlanningRestriction from "../../game-data-structure/westeros-card/planning-restriction/PlanningRestriction";
import planningRestrictions from "../../game-data-structure/westeros-card/planning-restriction/planningRestrictions";
import House from "../../game-data-structure/House";
import User from "../../../../server/User";
import PlanningGameState from "../PlanningGameState";

export default class PlaceOrderGameState extends GameState<PlanningGameState> {
    planningRestrictions: PlanningRestriction[];
    // Server-side, the value of the map should never be null.
    // Client-side, the client can receive a null value if it is the order of an other player,
    // it thus represents a face-down order (this player can't see it).
    @observable placedOrders: BetterMap<Region, Order | null> = new BetterMap<Region, Order | null>();
    @observable readyPlayers: Player[] = [];

    get ingameGameState(): IngameGameState {
        return this.parentGameState.parentGameState;
    }

    get planningGameState(): PlanningGameState {
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
    }

    isOrderAvailable(house: House, order: Order): boolean {
        return this.getAvailableOrders(house).includes(order);
    }

    onPlayerMessage(player: Player, message: ClientMessage): void {
        if (message.type == "place-order") {
            const order = message.orderId ?orders.get(message.orderId) : null;
            const region = this.world.regions.get(message.regionId);

            if (!this.getPossibleRegionsForOrders(player.house).includes(region)) {
                return;
            }

            if (order && !this.isOrderAvailable(player.house, order)) {
                return;
            }

            if (order) {
                this.placedOrders.set(region, order);
            } else {
                if (this.placedOrders.has(region)) {
                    this.placedOrders.delete(region);
                }
            }

            if (order) {
                player.user.send({
                    type: "order-placed",
                    order: order.id,
                    region: region.id
                });

                this.ingameGameState.players.values.filter(p => p != player).forEach(p => {
                    p.user.send({
                        type: "order-placed",
                        region: region.id,
                        order: null
                    });
                });
            } else {
                this.entireGame.broadcastToClients({
                    type: "remove-placed-order",
                    regionId: region.id
                })
            }
        } else if (message.type == "ready") {
            if (this.readyPlayers.includes(player)) {
                return;
            }

            if (!this.canReady(player.house).status) {
                return;
            }

            this.readyPlayers.push(player);

            // Check if all player are ready to go the action entireGame state
            if (this.readyPlayers.length == this.ingameGameState.players.values.length) {
                this.planningGameState.onPlaceOrderFinish(this.placedOrders as BetterMap<Region, Order>)
            } else {
                this.entireGame.broadcastToClients({
                    type: "player-ready",
                    userId: player.user.id
                });
            }
        }
    }

    getPossibleRegionsForOrders(house: House): Region[] {
        return this.game.world.getControlledRegions(house).filter(r => r.units.size > 0);
    }

    serializeToClient(admin: boolean, player: Player | null): SerializedPlaceOrderGameState {
        const placedOrders = this.placedOrders.mapOver(r => r.id, (o, r) => {
            // Hide orders that doesn't belong to the player
            // If admin, send all orders.
            if (admin || (player && r.getController() == player.house)) {
                return o ? o.id : null;
            }
            return null;
        });

        return {
            type: "place-order",
            planningRestrictions: this.planningRestrictions.map(pr => pr.id),
            placedOrders: placedOrders,
            readyPlayers: this.readyPlayers.map(p => p.user.id)
        };
    }

    /*
     * Common
     */

    canReady(house: House): {status: boolean; reason: string} {
        const possibleRegions = this.getPossibleRegionsForOrders(house);

        if (possibleRegions.every(r => this.placedOrders.has(r)))
        {
            // All possible regions have orders
            return {status: true, reason: "all-regions-filled"};
        }

        // It is possible that a house controls more areas than it has available orders
        if (this.getAvailableOrders(house).length == 0) {
            return {status: true, reason: "all-available-orders-used"};
        }

        return {status: false, reason: "not-all-regions-filled"};
    }

    /**
     * Client
     */

    assignOrder(region: Region, order: Order | null): void {
        this.entireGame.sendMessageToServer({
            type: "place-order",
            regionId: region.id,
            orderId: order ? order.id : null
        });
    }

    ready(): void {
        this.entireGame.sendMessageToServer({
            type: "ready"
        });
    }

    onServerMessage(message: ServerMessage): void {
        if (message.type == "order-placed") {
            const region = this.world.regions.get(message.region);
            const order = message.order ? orders.get(message.order) : null;

            this.placedOrders.set(region, order);
        } else if (message.type == "remove-placed-order") {
            const region = this.world.regions.get(message.regionId);

            if (this.placedOrders.has(region)) {
                this.placedOrders.delete(region);
            }
        } else if (message.type == "player-ready") {
            const player = this.ingameGameState.players.get(this.entireGame.users.get(message.userId));

            this.readyPlayers.push(player);
        }
    }

    getPhaseName(): string {
        return "Planning";
    }

    /**
     * Queries
     */

    getNotReadyPlayers(): Player[] {
        return _.difference(
            this.ingameGameState.players.values,
            this.readyPlayers
        );
    }

    getWaitedUsers(): User[] {
        return this.getNotReadyPlayers().map(p => p.user);
    }

    getAvailableOrders(house: House): Order[] {
        return this.ingameGameState.game.getAvailableOrders(this.placedOrders, house, this.planningRestrictions);
    }

    isOrderRestricted(order: Order): boolean {
        return this.planningRestrictions.some(restriction => restriction.restriction(order.type));
    }

    isReady(player: Player): boolean {
        return this.readyPlayers.includes(player);
    }

    static deserializeFromServer(planning: PlanningGameState, data: SerializedPlaceOrderGameState): PlaceOrderGameState {
        const placeOrder = new PlaceOrderGameState(planning);

        placeOrder.planningRestrictions = data.planningRestrictions.map(prid => planningRestrictions.get(prid));
        placeOrder.placedOrders = new BetterMap(
            data.placedOrders.map(
                ([regionId, orderId]) => [
                    planning.world.regions.get(regionId),
                    orderId ? orders.get(orderId) : null
                ]
            )
        );
        placeOrder.readyPlayers = data.readyPlayers.map(userId => planning.ingameGameState.players.get(planning.entireGame.users.get(userId)));

        return placeOrder;
    }
}

export interface SerializedPlaceOrderGameState {
    type: "place-order";
    planningRestrictions: string[];
    placedOrders: [string, number | null][];
    readyPlayers: string[];
}
