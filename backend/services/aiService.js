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
          content:
            "You are a professional email marketing assistant. Write engaging, clear, and persuasive email content.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Error generating email:", error);
    throw new Error("AI generation failed");
  }
};
