def calculate_overall_confidence(agent_confidences: dict) -> str:
    """
    Returns 'High', 'Medium', or 'Low' based on average confidence.
    """
    if not agent_confidences:
        return "Low"
    
    avg_conf = sum(agent_confidences.values()) / len(agent_confidences)
    
    if avg_conf > 0.8:
        return "High"
    elif avg_conf >= 0.5:
        return "Medium"
    else:
        return "Low"
