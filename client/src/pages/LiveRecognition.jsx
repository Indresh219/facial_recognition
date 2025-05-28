import React, { useRef, useEffect, useState } from "react";

export default function LiveRecognition() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [matches, setMatches] = useState([]);

  // Start webcam
  useEffect(() => {
    async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;

      // ✅ Wait until metadata is loaded before playing
      videoRef.current.onloadedmetadata = async () => {
        try {
          await videoRef.current.play();
        } catch (err) {
          console.error("Play error:", err);
        }
      };
    }
  } catch (err) {
    console.error("Webcam error:", err);
  }
}
    startWebcam();
  }, []);

  // Capture current frame as base64
  const captureFrame = () => {
    const video = videoRef.current;
    if (!video) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL("image/jpeg");
  };

  // Draw name boxes on the canvas
  const drawBoxes = (matches) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "lime";
    ctx.lineWidth = 3;
    ctx.font = "18px Arial";
    ctx.fillStyle = "lime";

    matches.forEach(({ name, box }) => {
      const [top, right, bottom, left] = box;
      const width = right - left;
      const height = bottom - top;
      ctx.strokeRect(left, top, width, height);
      ctx.fillText(name, left, top > 20 ? top - 5 : top + 15);
    });
  };

  // Face recognition loop
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const image = captureFrame();
      if (!image) return;

      try {
        const res = await fetch("http://localhost:8000/live-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image }),
        });

        const data = await res.json();

        if (data.matches && data.matches.length > 0) {
          const matchBoxes = data.matches.map((m) => ({
            name: m.name,
            box: m.box,
          }));
          setMatches(matchBoxes);
          drawBoxes(matchBoxes);
        } else {
          setMatches([]);
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      } catch (err) {
        console.error("Recognition error:", err);
      }
    }, 1000); // 1 frame per second

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div style={{ position: "relative", width: "720px", height: "560px" }}>
      <video
        ref={videoRef}
        style={{ position: "absolute", top: 0, left: 0, width: "720px", height: "560px" }}
        muted
        autoPlay
      />
      <canvas
        ref={canvasRef}
        width="720"
        height="560"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
    </div>
  );
}
