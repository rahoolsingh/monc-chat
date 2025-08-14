import "dotenv/config";
import { OpenAI } from "openai";

const client = new OpenAI();

import personaData from "./personaData.js";

async function main() {
    // These api calls are stateless (Zero Shot)
    const response = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
            {
                role: "system",
                content: personaData.hitesh.persona,
            },
            { role: "user", content: "sir aapna number dona" },
        ],
    });

    console.log(response.choices[0].message.content);
    console.log(response.choices[0].message.content.split("\n"));
}

main();
