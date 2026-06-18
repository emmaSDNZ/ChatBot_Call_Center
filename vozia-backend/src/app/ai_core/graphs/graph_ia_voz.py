from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import (
    BaseMessage,
)
from app.ai_core.nodes.nodes_ia_voz import (extract_transcript_node, 
                                            build_prompt_node,
                                            llm_analysis_node,
                                            parse_response_node,
                                            update_state_node
                                            )
# ============================================================
# LLM
# ============================================================
memory = MemorySaver()
# ============================================================
# STATE
# ============================================================

class IaVozState(TypedDict):
    messages: List[BaseMessage]
    call_state: Dict[str, Any]
    transcript: str
    prompt: List[BaseMessage]
    llm_response: str
    parsed: Dict[str, Any]

# ============================================================
# GRAPH
# ============================================================

workflow = StateGraph(IaVozState)

workflow.add_node("extract_transcript", extract_transcript_node)
workflow.add_node("build_prompt", build_prompt_node)
workflow.add_node("llm_analysis", llm_analysis_node)
workflow.add_node("parse_response", parse_response_node)
workflow.add_node("update_state", update_state_node)


workflow.set_entry_point("extract_transcript")

workflow.add_edge("extract_transcript", "build_prompt")
workflow.add_edge("build_prompt", "llm_analysis")
workflow.add_edge("llm_analysis", "parse_response")
workflow.add_edge("parse_response", "update_state")
workflow.add_edge("update_state", END)


# ============================================================
# COMPILE
# ============================================================

app_agent_call_state = workflow.compile(
    checkpointer=memory
)