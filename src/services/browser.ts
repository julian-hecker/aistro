import { Browser, Page } from "puppeteer";
import { Service } from "typedi";

// https://blog.logrocket.com/dependency-injection-node-js-typedi/
@Service()
export class BrowserService {
    private interactiveElementsSelector =
        "a[href]:not([href^='#']), input, button, textarea, select";

    // https://dev.to/somedood/the-proper-way-to-write-async-constructors-in-javascript-1o8c
    // https://stackoverflow.com/a/40753934/10712881
    constructor(public browser: Browser) {}

    // public async fetchPage(url: string): Promise<string> {
    //     const res = await this.page.goto(url);
    //     if (!res || !res.ok) return "";
    //     return await this.page.content();
    // }

    // public async extractInteractiveElements(): Promise<string[]> {
    //     const elements = await this.page.$$eval(
    //         this.interactiveElementsSelector,
    //         (elements) => {
    //             function recursivelyRemoveExtraneousAttributes(
    //                 element: Element
    //             ): Element {
    //                 const attributesToRemove = ["style", "src", "class"];

    //                 attributesToRemove.forEach((attr) =>
    //                     element.removeAttribute(attr)
    //                 );

    //                 element
    //                     .getAttributeNames()
    //                     .filter((name) => name.startsWith("data-"))
    //                     .map((name) => element.removeAttribute(name));

    //                 const children = Array.from(element.children);

    //                 if (children.length)
    //                     children.map(recursivelyRemoveExtraneousAttributes);

    //                 return element;
    //             }
    //             return elements
    //                 .map(recursivelyRemoveExtraneousAttributes)
    //                 .map((element) => element.outerHTML);
    //         }
    //     );
    //     return elements;
    // }
}

// to connect to an existing browser, use port from "/c/Program Files/Google/Chrome/Application/chrome.exe" --remote-debugging-port=9222

/**
 * Cleans up Markup for the AI
 */
@Service()
export class MarkupService {}

@Service()
export class NavigationService {
    constructor(protected page: Page) {}

    public goto = this.page.goto.bind(this.page);
    public goBack = this.page.goBack.bind(this.page);
    public goForward = this.page.goForward.bind(this.page);
}

export interface ElementData {
    id: string;
    tagName: string;
    textContent: string;
    outerHTML: string;
    rect: DOMRect;
}

@Service()
export class PageInteractionService extends NavigationService {
    private interactiveElementsSelector =
        "a[href], input, button, textarea, select";

    constructor(protected page: Page) {
        super(page);
    }

    public async extractInteractiveElements(): Promise<ElementData[]> {
        // await this.page.addScriptTag({
        //     content: stringifyFunctions(
        //         elementToSelector,
        //         recursivelyRemoveExtraneousAttributes
        //     ),
        // });

        // Eval callback runs in the browser and lacks script context
        const elementsData = await this.page.$$eval(
            this.interactiveElementsSelector,
            (elements) =>
                elements.map((element, index) => {
                    // if element doesn't have an id, give it one
                    element.id ||= `id-${element.tagName.toLowerCase()}-${index}`;
                    return {
                        id: element.id,
                        tagName: element.tagName,
                        textContent: element.textContent?.trim() ?? "",
                        outerHTML: element.outerHTML,
                        // figure out parent context some other time
                        // parentHtml: element.parentElement?.outerHTML,
                        rect: element.getBoundingClientRect().toJSON(),
                    } as ElementData;
                })
        );

        // do any mutations on the data here even if we have to use more deps
        return elementsData;
    }

    public async clickLink(selector: string) {
        const [res] = await Promise.all([
            this.page.waitForNavigation(),
            this.page.click(selector),
        ]);
    }

    public async typeInput(selector: string, text: string) {
        return await this.page.type(selector, text, { delay: 25 });
    }
}

/**
 * Stringifies a set of functions to be passed to the browser by Puppeteer.
 *
 * **NOTICE!** Passed functions must be self-contained. No external references.
 *
 * @param functions {Function[]} Functions to be stringified and passed to the browser
 * @returns {string} Stringified functions
 *
 */
function stringifyFunctions(...functions: Function[]): string {
    return functions.map((fn) => fn.toString()).join("\n\n");
}

function recursivelyRemoveExtraneousAttributes(element: Element): Element {
    const attributesToRemove = ["style", "src", "class"];

    attributesToRemove.forEach((attr) => element.removeAttribute(attr));

    element
        .getAttributeNames()
        .filter((name) => name.startsWith("data-"))
        .map((name) => element.removeAttribute(name));

    const children = Array.from(element.children);

    if (children.length) children.map(recursivelyRemoveExtraneousAttributes);

    return element;
}

// https://stackoverflow.com/a/67840046/10712881
// https://github.com/ericclemmons/unique-selector
function elementToSelector(element: Element | null): string {
    if (!element) return "";

    const { tagName, id, parentElement } = element;

    if (tagName === "HTML") return "HTML";

    let str = tagName;

    if (id) return `${str}#${id.split(/\s/).join("#")}`;

    const childIndex = [...(element.parentElement?.children ?? "")].indexOf(
        element
    );

    str += `:nth-child(${childIndex})`;

    return `${elementToSelector(parentElement)} > ${str}`;
}
