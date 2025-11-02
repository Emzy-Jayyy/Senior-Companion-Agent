import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Define what the API returns
interface JokeResponse {
  id: number;
  type: string;
  setup: string;
  punchline: string;
}

// Create the tool
export const jokeTool = createTool({
  id: "get-random-joke",
  description: "Fetches a random joke from the Official Joke API",
  inputSchema: z.object({}).describe("No input required"),
  outputSchema: z.object({
    setup: z.string(),
    punchline: z.string(),
    type: z.string(),
  }),
  execute: async () => {
    return await getRandomJoke();
  },
});

// Actual function to fetch joke
const getRandomJoke = async () => {
  const url = "https://official-joke-api.appspot.com/random_joke";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch joke");
  }

  const data = (await response.json()) as JokeResponse;

  return {
    setup: data.setup,
    punchline: data.punchline,
    type: data.type,
  };
};
