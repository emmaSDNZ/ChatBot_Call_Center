import { API_URL } from "../config/api";

export async function POST_API_CHAT_COPILOT(req) {
  try {
    const body = await req.json();
    const { message, active_model, page_context } = body;

    const fastapiResponse = await fetch(
      `${API_URL}/copilot/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          session_id: "default-session",
          active_model: active_model || "openai",
          page_context: page_context || null,
        }),
      }
    );

    if (!fastapiResponse.ok) {
      throw new Error(
        `FastAPI error: ${fastapiResponse.status}`
      );
    }

    const data = await fastapiResponse.json();

    return Response.json({
      success: true,
      data: {
        reply: data.response,
      },
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error.message ||
          "Internal API error",
      },
      { status: 500 }
    );
  }
}