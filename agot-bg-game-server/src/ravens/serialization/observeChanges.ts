import Change from "./Change";

export let observationCurrentlyBeingDone = false;
export let loggedChanges: Change[] = [];

export default function observeChanges(action: () => void): any[] {
    observationCurrentlyBeingDone = true;
    action();
    observationCurrentlyBeingDone = false;

    const previousLoggedChanges = loggedChanges;
    loggedChanges = [];

    return previousLoggedChanges;
}

export function addChange(change: Change): void {
    if (!observationCurrentlyBeingDone) {
        throw new Error(
            "An observable property of a serializable object was changed"
            + " but the change was not done inside an \"observeChanges\' execution."
        );
    }

    loggedChanges.push(change);
}
