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

  // 更新聊天訊息
  const updateChatMessage = async () => {
    if (window.auth.principalText && window.auth.isAuthenticated) {
      const conversation = await getConversation(window.auth.principalText);
      if (conversation) {
        setChatMessage(conversation.conversation);
      }
    }
  };

  // 格式化數學公式
  const formatMathEquations = (input) => {
    const lines = input.split("\n");
    return lines
      .map((line) => {
        // 處理行內公式 $...$
        const inlineFormatted = line.replace(/\$(.+?)\$/g, (_, content) => {
          return `\\(${content}\\)`; // MathJax 行內公式格式
        });

        // 處理獨立公式 $$...$$
        return inlineFormatted.replace(/\$\$(.+?)\$\$/g, (_, content) => {
          return `\\[${content}\\]`; // MathJax 獨立公式格式
        });
      })
      .join("\n");
  };

  // 提交多行訊息處理
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

    if (question.trim()) {
      // 處理多行輸入並格式化數學公式
      const multiLineMessages = question
        .trim()
        .split("\n")
        .map((line) => ({ content: formatMathEquations(line), role: "user" }));

      const updatedMessages = [...chatMessage, ...multiLineMessages];
      setChatMessage(() => [...updatedMessages]);
      await chatCompletion(updatedMessages);
      setQuestion(""); // 清空輸入框
    }
  };

  useEffect(() => {
    updateChatMessage();
  }, []);

  // 渲染新的聊天訊息後觸發 MathJax
  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typeset();
    }
  }, [chatMessage]);

  // 驗證 OpenAI API Key
  const onValidateOpenaiAPI = (e) => {
    if (e.target.value.match(/^sk-[a-zA-Z0-9-_]{32,}$/)) {
      setOpenaiKey(e.target.value);
    } else {
      setOpenaiKey("");
    }
  };

  // 儲存 OpenAI API Key
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
              placeholder="Enter multiple lines or math equations..."
              rows="4"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  handleSubmit(e);
                }
              }}
            />
            {loading && <Loading />}
            {!loading && (
              <button
                onClick={(e) => {
                  handleSubmit(e);
                }}
                className="auth-button auth-button__hover"
              >
                Send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
