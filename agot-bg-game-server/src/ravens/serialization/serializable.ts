import {
    IObservableArray,
    isObservableArray,
    isObservableMap,
    isObservableObject,
    isObservableProp,
    observe
} from "mobx";
import {addChange} from "./observeChanges";
import {serialize, serializeObject} from "./serialize";

export const classNameSymbol = Symbol("className");

export default function serializable(className: string) {
    return <T extends {new(...args: any[]): {}}>(constructor: T)=> {
        return class extends constructor {
            constructor(...args: any[]) {
                super(args);

                // @ts-ignore
                this[classNameSymbol] = className;

                // Log the creation of a new object
                addChange({
                    type: "object-creation",
                    className,
                    objectData: {}
                });

                Object.keys(this).filter(key => isObservableProp(this, key)).forEach((key) => {
                    // @ts-ignore
                    const value = this[key];

                    // Observe changes of value for this property
                    observe(this, key as keyof this, change => {
                        console.log(change);
                    });

                    // If this property is a special data structure,
                    // observe changes of the underlying data structure
                    if (isObservableArray(value)) {
                        // The "as" is there to force "change" to be an ObservableArray change.
                        observe(value as IObservableArray, change => {
                            switch (change.type) {
                                case "update":
                                    addChange({
                                        type: "array-update",
                                        target: serializeObject(this),
                                        propertyName: key,
                                        index: change.index,
                                        newValue: serialize(change.newValue)
                                    });
                                case "splice":
                                    throw new Error();
                            }
                        })
                    } else if (isObservableMap(value)) {
                        throw new Error();
                    }
                });
            }
        };
    }
}
