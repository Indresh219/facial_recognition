import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const Recognize = () => {
  const webcamRef = useRef(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleRecognize = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setError("❌ Failed to capture image from webcam.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/recognize", { image: imageSrc });
      const { match } = response.data;

      if (match) {
        setResult(match);
        setError("");
      } else {
        setResult(null);
        setError("❌ No match found.");
      }
    } catch (err) {
      console.error("Recognition error:", err);
      setResult(null);
      setError("❌ Recognition failed.");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>🎯 Recognize Face</h2>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={350}
        videoConstraints={{ facingMode: "user" }}
      />
      <br />
      <button onClick={handleRecognize} style={{ padding: "10px 20px", marginTop: "10px" }}>
        Recognize
      </button>

      {result && (
        <div style={{ marginTop: "20px", color: "green" }}>
          <h3>✅ Match Found!</h3>
          <p><strong>Name:</strong> {result.name}</p>
          <p><strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}</p>
        </div>
      )}

      {error && (
        <div style={{ marginTop: "20px", color: "red" }}>
          <h3>{error}</h3>
        </div>
      )}
    </div>
  );
};

export default Recognize;
// Recognize.jsx