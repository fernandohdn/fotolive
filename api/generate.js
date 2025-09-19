import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64, prompt, duration } = req.body;

    const runwayRes = await fetch("https://api.dev.runwayml.com/v1/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RUNWAY_API_KEY}`
      },
      body: JSON.stringify({
        model: "gen2",
        input: {
          mode: "image_to_video",
          prompt,
          duration,
          image: imageBase64
        }
      })
    });

    const data = await runwayRes.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Runway error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
