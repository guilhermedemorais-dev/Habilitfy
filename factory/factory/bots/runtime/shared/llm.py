import os
from pathlib import Path
from typing import Any, Dict

import yaml
from langchain_openai import ChatOpenAI


def load_config(config_path: str | Path) -> Dict[str, Any]:
    path = Path(config_path)
    if not path.exists():
        raise FileNotFoundError(f"Config not found: {path}")
    data = yaml.safe_load(path.read_text()) or {}
    return data


def build_llm(config: Dict[str, Any]) -> ChatOpenAI:
    llm_cfg = config.get("llm", {})
    provider = llm_cfg.get("provider", "openai")
    if provider != "openai":
        raise ValueError(f"Unsupported LLM provider: {provider}")

    model = os.getenv("FACTORY_LLM_MODEL", llm_cfg.get("model", "gpt-4o-mini"))
    temperature = float(os.getenv("FACTORY_LLM_TEMPERATURE", llm_cfg.get("temperature", 0.2)))
    max_completion_raw = (
        os.getenv("FACTORY_LLM_MAX_COMPLETION_TOKENS")
        or os.getenv("FACTORY_LLM_MAX_TOKENS")
        or llm_cfg.get("max_completion_tokens")
        or llm_cfg.get("max_tokens")
    )
    max_completion_tokens = int(max_completion_raw) if max_completion_raw is not None else None

    model_kwargs = {}
    if max_completion_tokens is not None:
        model_kwargs["max_completion_tokens"] = max_completion_tokens

    # Pass provider-specific params via model_kwargs to avoid strict constructor typing issues.
    return ChatOpenAI(model=model, temperature=temperature, model_kwargs=model_kwargs)
