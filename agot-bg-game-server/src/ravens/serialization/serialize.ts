import {ObjectReference, SerializedValue} from "./Change";
import {classNameSymbol} from "./serializable";

export function serializeObject(value: {[key: string]: any}): ObjectReference {
    if (!value.hasOwnProperty(classNameSymbol)) {
        throw new Error();
    }

    if (!value.hasOwnProperty("id")) {
        throw new Error();
    }

    return {
        className: value[classNameSymbol as unknown as string] as string,
        id: value["id"]
    };
}

export function serialize(value: any): SerializedValue {
    if (typeof value == "number" || typeof value == "string"|| typeof value == "boolean") {
        return value;
    } else if (typeof value == "object") {
        if (value == null) {
            return null;
        } else {
            return serializeObject(value);
        }
    } else {
        throw new Error();
    }
}
