import fetch from "node-fetch";
import FormData from "form-data";
import { Buffer } from "buffer";

export const config = {
  api: {
    bodyParser: true, // kita terima JSON
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64, prompt, duration } = req.body;

    // Convert base64 ke buffer
    const buffer = Buffer.from(imageBase64, "base64");

    // Buat form-data untuk upload binary
    const formData = new FormData();
    formData.append("model", "gen2");
    formData.append(
      "input",
      JSON.stringify({ mode: "image_to_video", prompt, duration })
    );
    formData.append("file", buffer, { filename: "input.png" });

    // Kirim ke Runway
    const runwayRes = await fetch("https://api.dev.runwayml.com/v1/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RUNWAY_API_KEY}` },
      body: formData,
    });

    const data = await runwayRes.json();

    if (!data.id) return res.status(500).json({ error: "Gagal buat task" });

    const taskId = data.id;

    // Polling status real-time
    let result = null;
    let progress = 0;
    for (let i = 0; i < 30; i++) {
      const statusRes = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${process.env.RUNWAY_API_KEY}` },
      });
      const status = await statusRes.json();

      if (status.progress) progress = status.progress; // update progress

      if (status.status === "succeeded") {
        result = status;
        break;
      } else if (status.status === "failed") {
        return res.status(500).json({ error: "Task gagal" });
      }

      await new Promise(r => setTimeout(r, 3000)); // tunggu 3 detik
    }

    if (!result) return res.status(500).json({ error: "Task timeout" });

    // Kirim progress + video URL
    return res.status(200).json({
      progress: 100,
      videoUrl: result.output[0].url,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
                                }
