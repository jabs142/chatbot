import { FormEvent, useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! How may I assist you?" },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  interface ChatMessage {
    role: string;
    content: string;
  }

  const chat = async (e: FormEvent<HTMLFormElement>, message: string) => {
    e.preventDefault();

    if (!message) return;
    setIsTyping(true);

    setChats((prevChats) => [...prevChats, { role: "user", content: message }]);

    setMessage("");

    fetch("http://localhost:8000/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chats: [...chats, { role: "user", content: message }],
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setChats((prevChats) => [...prevChats, data.output]);
        setIsTyping(false);
      })
      .catch((error) => {
        console.log(error);
        setIsTyping(false);
      });
  };

  return (
    <main>
      <h1>Chatbot</h1>

      <section>
        {chats.map((chat, index) => (
          <p key={index} className={chat.role === "user" ? "user_msg" : ""}>
            <span>
              <b>{chat.role.toUpperCase()}</b>
            </span>
            <span>:</span>
            <span>{chat.content}</span>
          </p>
        ))}
      </section>

      <div className={isTyping ? "" : "hide"}>
        <p>
          <i>{isTyping ? "Typing" : ""}</i>
        </p>
      </div>

      <form action="" onSubmit={(e) => chat(e, message)}>
        <input
          type="text"
          name="message"
          value={message}
          placeholder="Type a message here and hit Enter..."
          onChange={(e) => setMessage(e.target.value)}
          className="inputText"
        />
      </form>
    </main>
  );
}
export default App;
