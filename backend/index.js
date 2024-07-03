import OpenAI from "openai";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();
const app = express();
const port = 8000;
app.use(cors());
app.use(express.json());
const sessions = {};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Route to create a new thread (session)
app.post("/create-session", async (req, res) => {
  try {
    const sessionId = uuidv4();
    console.log("sessionId created", sessionId);

    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content:
            "Refer to the document and keep your responses short and concise.",
          attachments: [
            {
              file_id: process.env.OPENAI_FILE_ID,
              tools: [{ type: "file_search" }],
            },
          ],
        },
      ],
    });

    sessions[sessionId] = thread;
    console.log("thread", thread);
    res.status(200).json({ sessionId, thread });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

app.post("/", async (request, response) => {
  const { question, sessionId } = request.body;

  try {
    // Check if session exists
    const session = sessions[sessionId];
    if (!session) {
      return response.status(404).json({ error: "Session not found" });
    }

    const threadId = session.id;

    // Add messages to the thread
    await createMessage(question, threadId);

    // Run the Assistant on the Thread to generate a response by calling the model and the tools.
    const run = await runThread(threadId);

    // Retrieve the current run
    let currentRun = await retrieveRun(threadId, run.id);

    // Poll for updates and check if run status is completed
    while (currentRun.status !== "completed") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log(currentRun.status);
      currentRun = await retrieveRun(threadId, run.id);
    }

    // Get messages from the thread
    const { data } = await listMessages(threadId);

    response.json({
      output: data[0].content[0].text.value.replace(/【\d+:\d+†source】/g, ""),
    });
    console.log(
      data[0].content[0].text.value.replace(/【\d+:\d+†source】/g, "")
    );
  } catch (error) {
    console.error(error);
    response.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

async function createMessage(question, threadId) {
  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: question,
  });
}

async function runThread(threadId) {
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: process.env.OPENAI_ASSISTANT_ID,
  });
  return run;
}

async function listMessages(threadId) {
  const listMessages = await openai.beta.threads.messages.list(threadId);
  return listMessages;
}

async function retrieveRun(threadId, run) {
  const currentRun = await openai.beta.threads.runs.retrieve(threadId, run);
  return currentRun;
}

// TODO:
// // Route to clear session
// app.delete("/clear-session", (req, res) => {
//   const { sessionId } = req.body;

//   if (sessions[sessionId]) {
//     delete sessions[sessionId];
//     res.status(200).json({ message: "Session cleared" });
//   } else {
//     res.status(404).json({ error: "Session not found" });
//   }
// });

// Create an assistant
// const assistant = await openai.beta.assistants.create({
//   name: "Resume reader",
//   instructions:
//     "Create a chatbot that advocates for a resume based solely on extracted information from the resume itself. Respond truthfully and accurately to queries from recruiters about the resume content. If the answer is not found in the resume, infer the best possible response. If unable to provide an answer, respond with 'I'm sorry I don't know'. Avoid annotations in responses and ensure full document comprehension to handle repeated keywords effectively. Remove any annotations in your answers",
//   tools: [{ type: "file_search" }],
//   model: "gpt-3.5-turbo",
//   // model: "gpt-4o",
// });

// Read file
// const file = await openai.files.create({
//   file: fs.createReadStream("context.txt"),
//   purpose: "assistants",
// });

// Create a new thread
// const thread = await openai.beta.threads.create({
//   messages: [
//     {
//       role: "user",
//       content:
//         "Refer to the document and keep your responses short and concise.",
//       attachments: [
//         {
//           file_id: process.env.OPENAI_FILE_ID,
//           tools: [{ type: "file_search" }],
//         },
//       ],
//     },
//   ],
// });
// console.log("thread", thread);
