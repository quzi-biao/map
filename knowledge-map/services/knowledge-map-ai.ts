import type { Node, Edge } from "reactflow"
import { sendChatRequest, type Message, sendStreamingChatRequest } from "./ai"
import { BASE_MAP_GENERATION_PROMPT, EMPTY_MAP_GUIDANCE_PROMPT } from "./prompts"

interface AiKnowledgeMapResponse {
  nodes: Node[]
  edges: Edge[]
}

interface UserInfo {
  learning_goal: string
  current_knowledge: string
}

// 解析AI返回的用户信息
export function parseUserInfo(aiResponse: string): UserInfo | null {
  try {
    // 尝试从AI响应中提取用户信息JSON
    const match = aiResponse.match(/<user_info>([\s\S]*?)<\/user_info>/)
    if (!match || !match[1]) {
      return null
    }

    const jsonString = match[1].trim()
    return JSON.parse(jsonString)
  } catch (error) {
    console.error("Error parsing user info:", error)
    return null
  }
}

// 引导用户收集学习目标和知识背景
export async function guidanceConversation(messages: Message[], onChunk?: (chunk: string) => void): Promise<string> {
  // 添加系统提示
  const messagesWithSystem = [{ role: "system" as const, content: EMPTY_MAP_GUIDANCE_PROMPT }, ...messages]

  try {
    // 使用流式API以获得更好的用户体验
    if (onChunk) {
      return await sendStreamingChatRequest(messagesWithSystem, onChunk)
    } else {
      return await sendChatRequest(messagesWithSystem)
    }
  } catch (error) {
    console.error("Error in guidance conversation:", error)
    throw error
  }
}

// 生成基础知识地图
export async function generateBaseKnowledgeMap(
  userLearningGoal: string,
  currentKnowledge = "",
): Promise<AiKnowledgeMapResponse> {
  const systemPrompt = BASE_MAP_GENERATION_PROMPT

  const userPrompt = `
用户的学习目标如下：
"${userLearningGoal}"

${currentKnowledge ? `用户当前的知识背景：\n"${currentKnowledge}"` : ""}

请根据上述要求，为该学习目标生成知识地图的 JSON 数据。
`

  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]

  try {
    const aiResponseString = await sendChatRequest(messages)

    // 尝试解析JSON字符串
    // AI可能会将JSON包装在\`\`\`json ... \`\`\`中，或者直接输出JSON
    const jsonOnlyString = aiResponseString
      .replace(/^```json\s*/i, "")
      .replace(/\s*```\s*$/, "") // 更稳健地移除尾部的反引号和可选的空白
      .trim()

    let parsedResponse: AiKnowledgeMapResponse
    try {
      parsedResponse = JSON.parse(jsonOnlyString)
    } catch (e: any) {
      console.error("Failed to parse AI response as JSON. Raw response string (after stripping):", jsonOnlyString)
      console.error("Parsing error:", e.message)
      // 如果JSON嵌入在字符串中，尝试找到它
      const match = jsonOnlyString.match(/\{[\s\S]*\}/)
      if (match && match[0]) {
        try {
          parsedResponse = JSON.parse(match[0])
          console.log("Successfully parsed after extracting from potential wrapper text.")
        } catch (e2: any) {
          console.error("Failed to parse extracted JSON. Extracted string:", match[0])
          console.error("Second parsing error:", e2.message)
          throw new Error(`AI response was not valid JSON even after extraction. Error: ${e2.message}`)
        }
      } else {
        throw new Error(`AI response was not valid JSON. Error: ${e.message}`)
      }
    }

    if (
      !parsedResponse ||
      typeof parsedResponse !== "object" ||
      !parsedResponse.nodes ||
      !parsedResponse.edges ||
      !Array.isArray(parsedResponse.nodes) ||
      !Array.isArray(parsedResponse.edges)
    ) {
      console.error("AI JSON response is missing nodes or edges arrays, or is not an object. Response:", parsedResponse)
      throw new Error("AI response JSON structure is invalid.")
    }

    console.log("Parsed response:", parsedResponse)
    return parsedResponse
  } catch (error) {
    console.error("Error generating base knowledge map from AI:", error)
    throw error
  }
}
