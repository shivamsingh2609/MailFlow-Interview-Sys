import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const generateEmailContent = async (prompt) => {
  try {
    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: `You are a professional email marketing assistant. 
Always return the output as a JSON object with exactly these keys: 
"name" (short campaign name), "subject" (email subject), and "message" (email body). 
Do NOT include any extra text outside the JSON.`,
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const rawContent = response.choices[0]?.message?.content || "";

    // Try to parse JSON
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (err) {
      throw new Error("AI did not return valid JSON: " + rawContent);
    }

    return parsed; // { name, subject, message }
  } catch (error) {
    throw new Error("AI generation failed: " + error.message);
  }
};
