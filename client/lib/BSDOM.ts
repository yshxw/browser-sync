import {Observable} from "rxjs/Rx";
import {Inputs} from "./index";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Log} from "./Log";

export namespace BSDOM {
    export enum Events {
        PropSet = "@@BSDOM.Events.PropSet",
        StyleSet = "@@BSDOM.Events.StyleSet",
        LinkReplace = "@@BSDOM.Events.LinkReplace"
    }

    export function propSet(incoming): [Events.PropSet, any] {
        return [Events.PropSet, incoming];
    }

    export function styleSet(incoming): [Events.StyleSet, any] {
        return [Events.StyleSet, incoming];
    }

    export type LinkReplacePayload = {
        target: HTMLLinkElement,
        nextHref: string,
        prevHref: string,
        pathname: string,
        basename: string,
    }

    export function linkReplace(incoming: LinkReplacePayload): [Events.LinkReplace, LinkReplacePayload] {
        return [Events.LinkReplace, incoming];
    }
}

export const domHandlers$ = new BehaviorSubject({
    [BSDOM.Events.PropSet](xs) {
        return xs
            .do(event => {
                const {target, prop, value} = event;
                target[prop] = value;
            })
            .map(e => Log.consoleInfo(`[PropSet]`, e.target, `${e.prop} = ${e.pathname}`))
    },
    [BSDOM.Events.StyleSet](xs) {
        return xs
            .do((event) => {
                const {style, styleName, newValue, pathName} = event;
                style[styleName] = newValue;
            })
            .map(e => Log.consoleDebug(`[StyleSet] ${e.styleName} = ${e.pathName}`))
    },
    [BSDOM.Events.LinkReplace](xs: Observable<BSDOM.LinkReplacePayload>, inputs: Inputs) {
        return xs
            .withLatestFrom<BSDOM.LinkReplacePayload, any>(inputs.option$.pluck("injectNotification"))
            .filter(([, inject]) => inject)
            .map(([incoming, inject]) => {
                const message = `[LinkReplace] ${incoming.basename}`;
                if (inject === 'overlay') {
                    return Log.overlayInfo(message);
                }
                return Log.consoleInfo(message);
            })
    },
});
