import React, { useEffect } from "react";
// import "./App.css";
import "./index.css";
import Chat from "./components/Chat";
import { Toaster } from "react-hot-toast";

const App = function AppWrapper() {
  return (
    <>
      <main>
        <div className="watermark">My Chat Bot</div>
        <Chat />
      </main>
      <Toaster />
    </>
  );
};

export default App;
