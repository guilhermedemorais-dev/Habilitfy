# Skill to Contract

This tool converts a SKILL.md into an executable contract used by the Factory.
It extracts structure (capabilities, patterns, anti-patterns) and generates:
- research checklist
- plan template
- validation rules
- risk and impact classification

Usage:
```bash
python tools/skill-to-contract/skill_to_contract.py \
  --input path/to/SKILL.md \
  --output contract.yaml
```

Output:
- YAML contract with normalized fields and classifications.
- See contract.schema.json for the output shape.

Notes:
- The parser uses section headings like Capabilities, Patterns, Anti-Patterns,
  Inputs, Outputs, Requirements, and Related Skills.
- Unknown sections are preserved under raw_sections.
