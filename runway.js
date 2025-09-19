import fetch from "node-fetch";
import FormData from "form-data";
import { Buffer } from "buffer";

export const config = {
  api: { bodyParser: true }, // terima JSON
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64, prompt, duration } = req.body;

    // 1. Convert imageBase64 ke buffer
    const buffer = Buffer.from(imageBase64, "base64");

    // 2. Buat FormData
    const formData = new FormData();
    formData.append("model", "gen2");
    formData.append(
      "input",
      JSON.stringify({ mode: "image_to_video", prompt, duration })
    );
    formData.append("file", buffer, { filename: "input.png" });

    // 3. Kirim ke Runway buat task
    const createRes = await fetch("https://api.dev.runwayml.com/v1/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RUNWAY_API_KEY}` },
      body: formData,
    });

    const task = await createRes.json();
    if (!task.id) return res.status(500).json({ error: "Gagal buat task" });

    const taskId = task.id;

    // 4. Polling sampai task selesai
    let result = null;
    let progress = 0;
    while (!result) {
      const statusRes = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${process.env.RUNWAY_API_KEY}` },
      });
      const status = await statusRes.json();

      progress = status.progress || progress;

      if (status.status === "succeeded") result = status;
      else if (status.status === "failed") return res.status(500).json({ error: "Task gagal" });

      // Delay 2 detik tiap polling
      if (!result) await new Promise(r => setTimeout(r, 2000));
    }

    // 5. Kembalikan progress + video URL ke browser
    res.status(200).json({
      progress: 100,
      videoUrl: result.output[0].url,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
