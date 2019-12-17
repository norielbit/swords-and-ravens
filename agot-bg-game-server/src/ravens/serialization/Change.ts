type Change = ObjectCreation
    | ObjectPropertyUpdate
    | ArraySplice | ArrayUpdate;

interface ObjectCreation {
    type: "object-creation";
    className: string;
    objectData: {[key: string]: SerializedValue};
}

interface BasePropertyUpdate {
    target: ObjectReference;
    propertyName: string;
}

interface ObjectPropertyUpdate extends BasePropertyUpdate {
    type: "property-update";
    newValue: SerializedValue;
}

interface ArraySplice extends BasePropertyUpdate {
    type: "array-splice";
    index: number;
    removedCount: number;
    addedCount: number;
    added: SerializedValue[];
}

interface ArrayUpdate extends BasePropertyUpdate {
    type: "array-update";
    index: number;
    newValue: SerializedValue;
}

export type SerializedValue = null | boolean | number | string | ObjectReference;

export interface ObjectReference {
    className: string;
    id: string;
}


export default Change;
