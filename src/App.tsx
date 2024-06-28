import { FormEvent, useEffect, useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! How may I assist you?" },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    async function fetchInitialMessage() {
      try {
        const response = await fetch("http://localhost:8000/");
        if (!response.ok) {
          throw new Error("Failed to fetch initial message");
        }
        const data = await response.json();
        setChats((prevChats) => [...prevChats, data.output]);
        setIsTyping(false);
      } catch (error) {
        console.error("Error fetching initial message:", error);
        setIsTyping(false);
      }
    }

    fetchInitialMessage();
  }, []); // Empty dependency array ensures useEffect runs only once on mount

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

    try {
      const response = await fetch("http://localhost:8000/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: message,
        }),
      });

      const data = await response.json();
      setChats((prevChats) => [
        ...prevChats,
        { role: "assistant", content: data.output },
      ]);
      setIsTyping(false);
    } catch (error) {
      console.log(error);
      setIsTyping(false);
    }
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
