import { FunctionDefinition } from "@langchain/core/language_models/base";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import {
    AIMessage,
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import {
    createOpenAIFnRunnable,
    createOpenAPIChain,
    createStructuredOutputRunnable,
} from "langchain/chains/openai_functions";
import { StructuredOutputParser } from "langchain/output_parsers";
import { Service } from "typedi";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

const jsonParser = new JsonOutputFunctionsParser();

const interactSchema = z.object({
    id: z.string().describe("the id of the element to interact with"),
    type: z
        .enum(["click", "input"])
        .describe("the type of interaction to have with the element"),
    payload: z
        .optional(z.string())
        .describe(
            "any data that needs to be provided to the element. for example, the text to be inputted as a plain string."
        ),
});

export type Interaction = z.infer<typeof interactSchema>;

const zodParser = StructuredOutputParser.fromZodSchema(interactSchema);

const interactFunctionSchema: FunctionDefinition = {
    name: "interact_with_html",
    description:
        "determines which html element to interact with and what to do with it",
    parameters: zodToJsonSchema(interactSchema),
};

// https://js.langchain.com/docs/modules/chains/additional/openai_functions/
// createStructuredOutputRunnable();
// createOpenAIFnRunnable();
// createOpenAPIChain();

const instructions = `You are a AI that has the ability to browse the web to reach your goals by interacting with HTML elements on a page.

The user will pass a list of interactive elements and you must choose which one makes the most sense to interact with to achieve your goal.


Your goal: find information about this job applicant.`;

// Respond with a single valid JSON object containing the id of the element to interact with, which type of interaction, and NOTHING ELSE. The type of interaction may be one of: click, input, select.

// Examples:

// {
//     "id": "a-27",
//     "type": "click"
// }

// {
//     "id": "name-input",
//     "type": "input",
// }

// {
//     "id": "topping-dropdown",
//     "type": "select"
// }

// todo: sanitize all html elsewhere
// pass in all html here
// provide a pagination, like 10/30
// give an option, next
// maybe we want to store past elements' summaries?
// how to call functions?

/** Decides which elements to interact with and how */
@Service()
export class DecisionService {
    constructor(protected chatModel: BaseChatModel) {}

    public async aaa(htmls: string[]) {
        const chain = (this.chatModel as ChatOpenAI)
            // .bind({ functions: [interactFunctionSchema] })
            .pipe(zodParser);
        console.log(zodParser.getFormatInstructions());

        const system = new SystemMessage(instructions);
        const human = new HumanMessage(htmls.slice(0, 10).join("\n\n\n"));
        const res = await chain.invoke([system, human]);
        // const res = await (this.chatModel as ChatOpenAI).invoke(
        //     [system, human],
        //     {
        //         functions: [interactFunctionSchema],
        //         // function_call: { name: interactFunctionSchema.name },
        //     }
        // );
        console.log(res);
        return res;
    }

    public async decide(htmlElements: string[]): Promise<Interaction> {
        const systemMessage = new SystemMessage(instructions);
        const userMessage = new HumanMessage(htmlElements.join("\n\n\n"));
        const messages = [systemMessage, userMessage];
        const res = (await this.chatModel.invoke(messages)) as AIMessage;
        console.log(res);
        if (typeof res.content !== "string")
            throw new Error("AI Response not a string");
        try {
            return JSON.parse(res.content) as Interaction;
        } catch (err) {
            console.error(err);
            throw new Error("AI Response was not valid JSON");
        }
    }
}
