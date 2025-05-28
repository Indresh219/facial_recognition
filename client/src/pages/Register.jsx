import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const Register = () => {
  const webcamRef = useRef(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      alert("Please enter a name.");
      return;
    }

    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc || !imageSrc.startsWith("data:image")) {
      alert("Failed to capture valid image from webcam.");
      return;
    }

    const timestamp = new Date().toISOString(); // Format: "2025-05-27T12:34:56.789Z"
    setLoading(true);

    try {
      console.log("📸 Captured image (base64):", imageSrc.slice(0, 50) + "...");
      console.log("📝 Registering:", { name, timestamp });

      const response = await axios.post("http://localhost:5000/register", {
        name,
        image: imageSrc,
        timestamp,
      });

      const data = response.data;

      if (data?.status === "success") {
        alert(`✅ Registered ${data.entry.name} at ${data.entry.timestamp}`);
        console.log("🧾 Server response:", data);
      } else {
        alert(`❌ Registration failed: ${data?.error || "Unknown error"}`);
        console.error("❌ Server response:", data);
      }
    } catch (error) {
      if (error.response) {
        // Server responded with a status outside 2xx
        alert(`⚠️ Server Error: ${error.response.data?.error || error.message}`);
        console.error("🛑 Backend error:", error.response.data);
      } else if (error.request) {
        // Request was made but no response
        alert("⚠️ No response from server.");
        console.error("🕳️ No response:", error.request);
      } else {
        // Something else happened
        alert(`❌ Error: ${error.message}`);
        console.error("❗ Unexpected error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Register Face</h2>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={350}
        videoConstraints={{ facingMode: "user" }}
      />
      <br />
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ margin: "10px", padding: "8px" }}
      />
      <br />
      <button
        onClick={handleRegister}
        style={{ padding: "10px 20px" }}
        disabled={loading}
      >
        {loading ? "Registering..." : "Register"}
      </button>
    </div>
  );
};

export default Register;
  