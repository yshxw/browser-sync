///<reference path="types.ts"/>
import {Observable} from "rxjs";
import {initDocument, initOptions, initSocket, initWindow} from "./socket";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {initNotify} from "./notify";
import {domHandlers$} from "./BSDOM";
import {SocketEvent, socketHandlers$} from "./SocketNS";
import {merge} from "rxjs/observable/merge";
import {logHandler$} from "./Log";
import {EffectNames, outputHandlers$} from "./Effects";

export interface Inputs {
    window$: Observable<Window>;
    document$: Observable<Document>;
    socket$: Observable<SocketEvent>;
    option$: BehaviorSubject<IBrowserSyncOptions>;
    navigator$: Observable<Navigator>;
    notifyElement$: BehaviorSubject<HTMLElement>;
}

export type EffectStream = Observable<[EffectNames, any]>;
export type AnyStream = Observable<any | [any, any]>;

const window$ = initWindow();
const document$ = initDocument();
const socket$ = initSocket();
const option$ = initOptions();
const navigator$ = initOptions();
const notifyElement$ = initNotify(option$.getValue());

const inputs: Inputs = {
    window$,
    document$,
    socket$,
    option$,
    navigator$,
    notifyElement$
};

function getStream(name: string, inputs) {
    return function(handlers$, inputStream$) {
        return inputStream$
            .groupBy(([name]) => name)
            .withLatestFrom(handlers$)
            .filter(([x, handlers]) => typeof handlers[x.key] === "function")
            .flatMap(([x, handlers]) => {
                return handlers[x.key](x.pluck(1), inputs);
            })
            .share();
    };
}

const output$ = getStream("[socket]", inputs)(socketHandlers$, inputs.socket$);
const effect$ = getStream("[effect]", inputs)(outputHandlers$, output$);
const dom$ = getStream("[dom-effect]", inputs)(domHandlers$, effect$);
const log$ = getStream("[log]", inputs)(
    logHandler$,
    merge(output$, effect$, dom$)
);

log$.subscribe();

// var socket = require("./socket");
// var shims = require("./client-shims");
// var notify = require("./notify");
// // var codeSync = require("./code-sync");
// const { BrowserSync } = require("./browser-sync");
// var ghostMode = require("./ghostmode");
// var events = require("./events");
// var utils = require("./browser.utils");
//
// const mitt = require("mitt").default;
//
// var shouldReload = false;
// var initialised = false;
//
// /**
//  * @param options
//  */
// function init(options: bs.InitOptions) {
//     if (shouldReload && options.reloadOnRestart) {
//         utils.reloadBrowser();
//     }
//
//     var BS = window.___browserSync___ || {};
//     var emitter = mitt();
//
//     if (!BS.client) {
//         BS.client = true;
//
//         var browserSync = new BrowserSync({ options, emitter, socket });
//
//         // codeSync.init(browserSync);
//
//         // // Always init on page load
//         // ghostMode.init(browserSync);
//         //
//         // notify.init(browserSync);
//         //
//         // if (options.notify) {
//         //     notify.flash("Connected to BrowserSync");
//         // }
//     }
//
//     // if (!initialised) {
//     //     socket.on("disconnect", function() {
//     //         if (options.notify) {
//     //             notify.flash("Disconnected from BrowserSync");
//     //         }
//     //         shouldReload = true;
//     //     });
//     //     initialised = true;
//     // }
// }
//
// /**
//  * Handle individual socket connections
//  */
// socket.on("connection", init);
