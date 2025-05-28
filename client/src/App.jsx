import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Register from "./pages/Register";
import Recognize from "./pages/Recognize";
import LiveRecognition from "./pages/LiveRecognition";
import ChatWidget from "./pages/ChatWidget";
import "./App.css"; // Assuming you have some global styles

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <button
        onClick={() => navigate("/register")}
      >
        Register
      </button>
      <button
        onClick={() => navigate("/recognize")}
      >
        Recognize
      </button>
      <button
        onClick={() => navigate("/liveRecognition")}
      >
        LiveRecognition
      </button>
      <button
        onClick={() => navigate("/chat")}
      >
        Chat
      </button>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/Recognize" element={<Recognize />} />
        <Route path="/LiveRecognition" element={<LiveRecognition />} />
        <Route path="/Chat" element={<ChatWidget />} />
        <Route path="*" element={<div>404 Not Found</div>} />
        
      </Routes>
    </Router>
  );
}

export default App;
