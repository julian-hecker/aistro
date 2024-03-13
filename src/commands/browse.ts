import { Command } from "commander";
import { scraping } from "../utils/scraping";
import {
    BrowserService,
    PageInteractionService,
    NavigationService,
} from "../services/browser";
import puppeteer, { Browser, Page } from "puppeteer";
import Container from "typedi";
import { DecisionService } from "../services/ai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { chatOpenAI } from "../ai/openai";
import { FileLoggingService } from "../services/logging";

export const browseCommand = new Command("browse")
    .description("get html from a url")
    .argument("<url>", "page to visit")
    .option(
        "-h, --headless [headless]",
        "whether to operate an actual browser or not",
        true
    )
    .action(scraping);

export const newBrowse = new Command("newbrowse")
    .description("get shit done")
    .argument("<url>", "website url")
    .action(async (url: string) => {
        const logger = Container.get(FileLoggingService);
        const browser = await puppeteer.launch({
            headless: "new",
            devtools: true,
            defaultViewport: null,
        });
        const page = (await browser.pages())[0];
        Container.set(Page, page);
        const interactionService = Container.get(PageInteractionService);
        await interactionService.goto(url, { waitUntil: "networkidle0" });
        const els = await interactionService.extractInteractiveElements();
        console.log(els);
        Container.set(BaseChatModel, chatOpenAI);
        const decisionService = Container.get(DecisionService);
        // const decision = await decisionService.decide(
        //     els.map((el) => el.outerHTML)
        // );
        const decision = await decisionService.aaa(
            els.map((el) => el.outerHTML)
        );
        console.log(decision);
        // await browserService.fetchPage(url);
        // const interactive = await browserService.extractInteractiveElements();
        // console.log(interactive);
        console.log(browser.wsEndpoint());
        await browser.close();
    });
