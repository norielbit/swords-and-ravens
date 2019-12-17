import serializable from "./serializable";
import {observable} from "mobx";
import observeChanges from "./observeChanges";

describe("observeChanges", () => {
    it("correctly picks up changes", () => {
        @serializable("root-class")
        class RootClass {
            notObservedProperty = "test";
            @observable testNumber = 3;
            @observable testArray = [1, 2, 3];
        }

        const changes = observeChanges(() => {
            const rootClass = new RootClass();

            expect(rootClass.constructor).toBe(RootClass);
            expect(rootClass).toBeInstanceOf(RootClass);

            rootClass.testNumber = 5;
            rootClass.notObservedProperty = "test2";
            rootClass.testArray.push(4);
            rootClass.testArray.pop();
            rootClass.testArray.splice(0, 2);
        });

        expect(changes).toHaveLength(0);
    });
});
