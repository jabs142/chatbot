import OpenAI from "openai";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

const app = express();
const port = 8000;
app.use(bodyParser.json());
app.use(cors());
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/", async (request, response) => {
  console.log("request", request);
  const { chats } = request.body;
  console.log("chats", chats);

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        ...chats,
      ],
      model: "gpt-3.5-turbo",
    });

    response.json({
      output: completion.choices[0].message,
    });
    console.log(completion.choices[0].message.content);
    console.log(
      "Response:",
      response.json({
        output: completion.choices[0].message,
      })
    );
  } catch (error) {
    console.error(error);
    response.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// async function streaming() {
//   const stream = await openai.chat.completions.create({
//     model: "gpt-3.5-turbo",
//     messages: [{ role: "user", content: "Say this is a test" }],
//     stream: true,
//   });
//   for await (const chunk of stream) {
//     process.stdout.write(chunk.choices[0]?.delta?.content || "");
//   }
// }
// streaming();
