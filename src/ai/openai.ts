import { ChatOpenAI } from "@langchain/openai";
import OpenAI from "openai";

import { OPENAI_API_KEY } from "../config/environment";

export const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export const chatOpenAI = new ChatOpenAI({ openAIApiKey: OPENAI_API_KEY });
