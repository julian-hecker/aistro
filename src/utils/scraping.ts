import { html_beautify } from "js-beautify";
import { JSDOM } from "jsdom";
import puppeteer, { ElementHandle } from "puppeteer";

export async function scraping(url: string) {
    // const dom = await JSDOM.fromURL(url, {
    //     runScripts: "dangerously",
    //     userAgent:
    //         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    // });

    const browser = await puppeteer.launch({
        headless: "new",
        // headless: false,
        // defaultViewport: null,
        // slowMo: 1000,
        // devtools: true,
        // args: [
        //     "--start-maximized", // you can also use '--start-fullscreen'
        // ],
    });
    const page = (await browser.pages())?.[0];
    await page.goto(url, { waitUntil: "networkidle0" });

    // const bodyHandle = await page.$("body");
    // const html = await page.evaluate((body) => body?.innerHTML, bodyHandle);
    // console.log(html);

    const interactiveHandles = (await page.$$(
        "a[href]:not([href^='#']), input, button, textarea, select"
    )) as ElementHandle<HTMLElement>[];

    const boxes = await Promise.all(
        interactiveHandles.map(async (handle) => {
            const boxModel = await handle.boxModel();
            const boundingBox = await handle.boundingBox();
            const size = (boxModel?.width ?? 0) * (boxModel?.height ?? 0);
            const isVisible = await handle.isVisible();
            const html = await handle.evaluate((b) => b.outerHTML);
            console.log(size, isVisible, boundingBox, html, page);
            const point = await handle.clickablePoint().catch();
            return { isVisible, size, boundingBox, point };
        })
    );

    const cleanBoxes = [...boxes]
        .filter((box) => box.isVisible)
        .sort((a, b) => b.size * b.size - a.size * a.size);

    console.log(cleanBoxes);

    // const elements = await page.evaluate(() => {
    //     return extractInteractiveElements()
    //         .sort((a, b) => getElementSize(a) - getElementSize(b))
    //         .map(getElementContext)
    //         .map(recursivelyRemoveExtraneousElements)
    //         .map(recursivelyRemoveExtraneousAttributes);
    // });

    // const windowHandle = await page.evaluateHandle(() => window);

    await browser.close();

    // extractInteractiveElements()
    //     // .filter(isElementNonEmpty)
    //     .map((element, index) => {
    //         element.id = `${element.tagName}-${index} ${element.id}`;
    //         return element;
    //     })
    //     .map(getElementContext)
    //     .map(recursivelyRemoveExtraneousElements)
    //     .map(recursivelyRemoveExtraneousAttributes)
    //     .forEach((element, index) => {
    //         console.log("=======================", index);
    //         console.log(html_beautify(element.outerHTML));
    //         // console.log(element?.parentElement?.parentElement?.textContent);
    //         // console.log(element.parentElement?.parentElement?.outerHTML);
    //         console.log("=======================", index);
    //     });
}

function getElementSize(element: Element): number {
    const { height, width } = element.getBoundingClientRect();
    return height * width;
}

function extractInteractiveElements() {
    const interactiveSelectors =
        "a[href]:not([href^='#']), button, input, textarea, select";
    // details, [tabindex]:not([tabindex^='-'])

    // document.querySelectorAll("a[href], button, input, textarea, select, details, [tabindex]:not([tabindex^='-'])").forEach(element => element.style.outline = "10px solid red");

    const interactiveElements = Array.from(
        document.querySelectorAll<HTMLElement>(interactiveSelectors)
    );

    return interactiveElements;
}

function isElementNonEmpty(element: Element): boolean {
    const aria = element
        .getAttributeNames()
        .filter((name) => name.startsWith("aria-"));
    console.log(element.textContent, aria);
    return !!element.textContent || !!aria.length;
}

function recursivelyRemoveExtraneousElements(element: Element): Element {
    const elementsToRemoveSelectors = "svg *";
    element
        .querySelectorAll(elementsToRemoveSelectors)
        .forEach((element) => element.remove());
    return element;
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

function getElementContext(element: Element): Element {
    let next = element;
    while (true) {
        const parent = next?.parentElement;
        if (!parent) return element;
        if (
            (parent.textContent ?? "").trim().length >
            (element.textContent ?? "").trim().length
        )
            return parent;
        next = parent;
    }
}

// use puppeteer
// get visual representation of each button
// sort by button size
// paginate if desired button not found
// example: "here are the first 10 buttons on the page, which one do you need to press to complete your action?"
