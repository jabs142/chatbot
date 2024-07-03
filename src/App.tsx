import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! How may I assist you?" },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    async function initializeChat() {
      try {
        // Create a new session if session ID doesn't exist
        if (!sessionId) {
          const response = await fetch("http://localhost:8000/create-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error("Failed to create session");
          }

          const data = await response.json();
          setSessionId(data.sessionId);
          console.log("initializeChat setSessionId", data.sessionId);
        }

        const response = await fetch("http://localhost:8000/");
        if (!response.ok) {
          throw new Error("Failed to fetch initial message");
        }
        const data = await response.json();
        console.log("initializeChat data", data);
        setChats((prevChats) => [...prevChats, data.output]);
        setIsTyping(false);
      } catch (error) {
        console.error("Error fetching initial message:", error);
        setIsTyping(false);
      }
    }

    initializeChat();
  }, [sessionId]); // Empty dependency array ensures useEffect runs only once on mount

  interface ChatMessage {
    role: string;
    content: string;
  }

  const sendMessage = async (message: string) => {
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
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const data = await response.json();
      setChats((prevChats) => [
        ...prevChats,
        { role: "assistant", content: data.output },
      ]);
      setIsTyping(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(message);
  };

  return (
    <main>
      <h1>Chatbot</h1>
      <div>
        <section>
          {chats.map((chat, index) => (
            <p
              key={index}
              className={chat.role === "user" ? "user_msg" : "assistant_msg"}
            >
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

        <form action="" onSubmit={handleFormSubmit}>
          <input
            type="text"
            name="message"
            value={message}
            placeholder="Type a message here and hit Enter..."
            onChange={(e) => setMessage(e.target.value)}
            className="inputText"
          />
        </form>
      </div>
    </main>
  );
}
export default App;
