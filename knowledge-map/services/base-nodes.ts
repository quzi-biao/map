import { type Node, type Edge } from "reactflow";
import { UnderstandingLevel } from "@/types/knowledge-map"; // Used for type safety of the response
import { sendChatRequest, type Message } from "./ai";
import { BASE_MAP_GENERATION_PROMPT } from "./prompts";

interface AiKnowledgeMapResponse {
  nodes: Node[];
  edges: Edge[];
}

export async function generateBaseKnowledgeMap(
  userLearningGoal: string,
): Promise<AiKnowledgeMapResponse> {
  const systemPrompt = BASE_MAP_GENERATION_PROMPT;

  const userPrompt = `
用户的学习目标如下：
"${userLearningGoal}"

请根据上述要求，为该学习目标生成知识地图的 JSON 数据。
`;

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const aiResponseString = await sendChatRequest(messages); // Using a capable model and lower temperature for structured JSON

    // Attempt to parse the JSON string
    // The AI might wrap the JSON in ```json ... ``` or just output the JSON directly.
    const jsonOnlyString = aiResponseString
        .replace(/^```json\s*/i, "")
        .replace(/\s*```\s*$/, "") // More robustly remove trailing backticks and optional whitespace
        .trim();
        
    let parsedResponse: AiKnowledgeMapResponse;
    try {
        parsedResponse = JSON.parse(jsonOnlyString);
    } catch (e: any) {
        console.error("Failed to parse AI response as JSON. Raw response string (after stripping):", jsonOnlyString);
        console.error("Parsing error:", e.message);
        // Try to find JSON object within the string if it's embedded
        const match = jsonOnlyString.match(/\{[\s\S]*\}/);
        if (match && match[0]) {
            try {
                parsedResponse = JSON.parse(match[0]);
                console.log("Successfully parsed after extracting from potential wrapper text.");
            } catch (e2: any) {
                console.error("Failed to parse extracted JSON. Extracted string:", match[0]);
                console.error("Second parsing error:", e2.message);
                throw new Error(`AI response was not valid JSON even after extraction. Error: ${e2.message}`);
            }
        } else {
            throw new Error(`AI response was not valid JSON. Error: ${e.message}`);
        }
    }
    

    if (!parsedResponse || typeof parsedResponse !== 'object' || !parsedResponse.nodes || !parsedResponse.edges || !Array.isArray(parsedResponse.nodes) || !Array.isArray(parsedResponse.edges)) {
      console.error("AI JSON response is missing nodes or edges arrays, or is not an object. Response:", parsedResponse);
      throw new Error("AI response JSON structure is invalid.");
    }
    
    // Optional: Add more detailed validation for node/edge structure if needed.
    console.log("Parsed response:", parsedResponse);
    return parsedResponse;

  } catch (error) {
    console.error("Error generating base knowledge map from AI:", error);
    // Fallback to an empty map or re-throw
    // For now, re-throwing so the caller can decide how to handle.
    throw error; 
  }
}
