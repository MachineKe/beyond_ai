import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null); // Reference for the textarea

  useEffect(() => {
    // Auto-scroll to the latest message
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    // Auto-adjust the height of the textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: "You", text: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const response = await axios.post("http://127.0.0.1:5001/chat", {
        message: input,
      });

      setMessages([...newMessages, { sender: "Beyond Ai", text: response.data.response }]);
      setError(null);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to get response. Check the backend.");
    }
  };

  const copyToClipboard = (text, index, isCode = false) => {
    navigator.clipboard.writeText(text);
    if (isCode) {
      setCopiedCodeIndex(index);
      setTimeout(() => setCopiedCodeIndex(null), 1500);
    } else {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    }
  };

  const renderMessage = (msg, index) => {
    const codeBlocks = msg.text.match(/```([\w+]*)\n([\s\S]*?)```/g);

    if (codeBlocks) {
      return msg.text.split(/```[\w+]*\n[\s\S]*?```/g).map((text, i) => {
        const codeMatch = codeBlocks[i] ? codeBlocks[i].match(/```([\w+]*)\n([\s\S]*?)```/) : null;
        const language = codeMatch ? codeMatch[1] || "plaintext" : "plaintext";
        const code = codeMatch ? codeMatch[2] : "";

        return (
          <div key={i}>
            {text && <p className="text-gray-200">{text}</p>}
            {code && (
              <div className="relative">
                <SyntaxHighlighter language={language} style={dracula} wrapLongLines className="rounded-lg text-sm">
                  {code}
                </SyntaxHighlighter>
                <button
                  onClick={() => copyToClipboard(code, index, true)}
                  className="absolute top-2 right-2 bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded"
                >
                  {copiedCodeIndex === index ? "Copied!" : "Copy Code"}
                </button>
              </div>
            )}
          </div>
        );
      });
    }

    return <p className="text-gray-200">{msg.text}</p>;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-white">
      <div className="flex flex-col flex-grow w-full h-full p-4">
        <h2 className="text-xl font-semibold text-center text-gray-300 mb-4">Beyond Ai</h2>
        <div ref={chatContainerRef} className="flex-grow overflow-y-auto bg-gray-800 p-4 rounded-lg shadow-md h-full">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"} mb-2`}>
              <div className={`p-3 max-w-[80%] rounded-lg ${msg.sender === "You" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-200"}`}>
                <strong>{msg.sender}</strong>
                {renderMessage(msg, index)}

                {msg.sender === "Beyond Ai" && (
                  <button
                    onClick={() => copyToClipboard(msg.text, index)}
                    className="mt-2 bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded"
                  >
                    {copiedIndex === index ? "Copied!" : "Copy Response"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-center mt-2">{error}</p>}

        <div className="flex mt-4">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 p-3 rounded-l-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden min-h-[40px] max-h-[150px]"
            rows={1}
          />
          <button 
            onClick={sendMessage} 
            className="ml-2 px-4 py-3 bg-green-500 hover:bg-green-600 rounded-r-lg transition duration-300"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
