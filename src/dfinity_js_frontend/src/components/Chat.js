import React, { useState, useEffect } from "react";
import useApi from "../hooks/useApi";
import Loading from "./Loading";
import { login, logout } from "../utils/auth";
import toast from "react-hot-toast";
import { getConversation } from "../utils/chat";
import TextInput from "./TextInput";
import { encryptData } from "../utils/encryptData";

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const { loading, chatCompletion, chatMessage, setChatMessage } = useApi();

  const updateChatMessage = async () => {
    if (window.auth.principalText && window.auth.isAuthenticated) {
      const conversation = await getConversation(window.auth.principalText);
      if (conversation) {
        setChatMessage(conversation.conversation);
      }
    }
  };

  const formatMathEquations = (input) => {
    const lines = input.split("\n");
    return lines
      .map((line) => {
        const inlineFormatted = line.replace(/\$(.+?)\$/g, (_, content) => {
          return `\\(${content}\\)`;
        });

        return inlineFormatted.replace(/\$\$(.+?)\$\$/g, (_, content) => {
          return `\\[${content}\\]`;
        });
      })
      .join("\n");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.auth.isAuthenticated) {
      toast.error("You are not authenticated");
      return;
    }

    const openaiKey = localStorage.getItem("icp-dai-open-ai");
    if (!openaiKey) {
      toast.error("No OpenAI key found");
      return;
    }

    if (question) {
      const history = [...chatMessage, { content: formatMathEquations(question), role: "user" }];
      setChatMessage(() => [...history]);
      await chatCompletion(history);
      setQuestion("");
    }
  };

  const formatRole = (role) => {
    if (role === "user") return "User";
    if (role === "assistant") return "ChatBot";
    return role;
  };

  const exportChatHistory = () => {
    const chatHistory = chatMessage
      .map((msg) => {
        const timestamp = new Date().toLocaleString();
        const formattedRole = formatRole(msg.role);
        return `[${timestamp}] ${formattedRole}: ${msg.content}\n-------------------------`;
      })
      .join("\n");

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const filename = `chat_history_${year}${month}${day}_${hours}${minutes}${seconds}.txt`;

    const blob = new Blob([chatHistory], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    updateChatMessage();
  }, []);

  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typeset();
    }
  }, [chatMessage]);

  const onValidateOpenaiAPI = (e) => {
    if (e.target.value.match(/^sk-[a-zA-Z0-9-_]{32,}$/)) {
      setOpenaiKey(e.target.value);
    } else {
      setOpenaiKey("");
    }
  };

  const onSaveOpenaiKey = () => {
    if (!openaiKey) return toast.error("Invalid OpenAI key");
    const encryptedApiKey = encryptData(openaiKey);
    localStorage.setItem("icp-dai-open-ai", encryptedApiKey);
    toast.success("OpenAI key successfully saved and encrypted");
    setOpenaiKey("");
  };

  return (
    <div className="wrapper">
      <div className="wrapper-header">
        <h1>My ChatBot</h1>
        <button 
          className="auth-button auth-button__hover"
          onClick={exportChatHistory}>匯出對話紀錄
        </button>

        <button
          className="auth-button auth-button__hover"
          onClick={() => (window.auth.isAuthenticated ? logout() : login())}
        >
          {window.auth.isAuthenticated ? "Log out" : "Login"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <TextInput
          onChange={onValidateOpenaiAPI}
          placeholder="Enter your OpenAI API key here..."
        />
        <button
          className="auth-button auth-button__hover"
          onClick={onSaveOpenaiKey}
        >
          Save
        </button>
      </div>
      <div className="container">
        <div className="right">
          <div className="chat active-chat">
            <div className="conversation-start"></div>
            {chatMessage.map((message, index) => (
              <div
                key={index}
                className={`bubble ${
                  message.role === "user" ? "me" : "assistant"
                } ${
                  chatMessage.length - 1 === index && !loading
                    ? "last-message"
                    : ""
                }`}
              >
                <span dangerouslySetInnerHTML={{ __html: message.content }} />
              </div>
            ))}

            {loading && (
              <div className={`bubble assistant`}>
                <Loading />
              </div>
            )}
          </div>
          <div className="write">
            <input
              placeholder="Ask me..."
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => (e.key === "Enter" ? handleSubmit(e) : null)}
            />
            {loading && <Loading />}
            {!loading && (
              <a
                onClick={(e) => {
                  handleSubmit(e);
                }}
                className="write-link send"
              ></a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
