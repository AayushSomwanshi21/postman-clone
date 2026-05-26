import re

VARIABLE_PATTERN = re.compile(r"\{\{(\w+)\}\}")


def interpolate_content(template: str, variables: dict[str, str]) -> str:
    return VARIABLE_PATTERN.sub(
        lambda match: variables.get(match.group(1), match.group(0)),
        template,
    )


def find_unresolved_variables(content: str) -> list[str]:
    return sorted({match.group(1) for match in VARIABLE_PATTERN.finditer(content)})
