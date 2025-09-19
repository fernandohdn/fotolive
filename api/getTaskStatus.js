import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { taskId } = req.body;

    const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      headers: {
        "Authorization": `Bearer ${process.env.RUNWAY_API_KEY}`
      }
    });

    const status = await response.json();
    res.status(200).json(status);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
