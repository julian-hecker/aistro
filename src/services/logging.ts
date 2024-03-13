import fs from "node:fs";
import util from "node:util";

import { Service } from "typedi";

@Service()
export class FileLoggingService {
    /** Logs for this run will be saved in this file */
    private fileName = `logs/${new Date()
        .toISOString()
        .replace(/[^\w]/g, "-")}.log`;

    // https://gist.github.com/designbyadrian/2eb329c853516cef618a
    // constructor() {
    //     if (!window || !window.console) return;
    //     let property: keyof Console;
    //     for (property in console) {
    //         if (typeof console[property] !== "function") return;
    //         const method: Function = console[property];
    //         if (typeof this[property] !== "function") return;
    //         console[property] = this[property];
    //     }
    // }

    log(...data: any[]): void;
    log(message?: any, ...optionalParams: any[]): void;
    log(message?: unknown, ...optionalParams: unknown[]): void {
        let data: string;
        if (!optionalParams.length) data = util.format(message);
        else data = util.format(message, optionalParams);
        fs.appendFileSync(this.fileName, data + "\n");
    }
}
