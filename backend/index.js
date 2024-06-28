import OpenAI from "openai";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = 8000;
app.use(bodyParser.json());
app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/", async (request, response) => {
  const { question } = request.body;

  try {
    // Add messages to the thread
    await createMessage(question);

    // Run the Assistant on the Thread to generate a response by calling the model and the tools.
    const run = await runThread();

    // Retrieve the current run
    let currentRun = await retrieveRun(process.env.OPENAI_THREAD_ID, run.id);

    // Poll for updates and check if run status is completed
    while (currentRun.status !== "completed") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log(currentRun.status);
      currentRun = await retrieveRun(process.env.OPENAI_THREAD_ID, run.id);
    }

    // Get messages from the thread
    const { data } = await listMessages();

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

async function createMessage(question) {
  await openai.beta.threads.messages.create(process.env.OPENAI_THREAD_ID, {
    role: "user",
    content: question,
  });
}

async function runThread() {
  const run = await openai.beta.threads.runs.create(
    process.env.OPENAI_THREAD_ID,
    {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
    }
  );
  return run;
}

async function listMessages() {
  const listMessages = await openai.beta.threads.messages.list(
    process.env.OPENAI_THREAD_ID
  );
  return listMessages;
}

async function retrieveRun(thread, run) {
  const currentRun = await openai.beta.threads.runs.retrieve(thread, run);
  return currentRun;
}

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
