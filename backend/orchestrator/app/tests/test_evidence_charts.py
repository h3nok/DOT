"""Chart publication boundaries and accessible, non-executable email output."""

import json

import fastapi
import pytest

from app.domains.academy import evidence_charts as charts
from app.domains.academy.writing_drafts import validate_release


def figure():
    return {
        "title": "Synthetic <comparison>",
        "period": "Fixture period",
        "unit": "units",
        "maximum": 100,
        "status": "Unverified fixture",
        "limits": "Does not explain causation.",
        "rows": [
            {
                "label": "First",
                "value": 10,
                "source": "First source",
                "url": "https://example.test/1",
            },
            {
                "label": "Second",
                "value": 90,
                "source": "Second source",
                "url": "https://example.test/2",
            },
        ],
    }


def test_chart_transforms_preserve_values_and_source_limits():
    source = json.dumps(figure())
    rendered = charts.render_html(source)
    assert "&lt;comparison&gt;" in rendered
    assert '<th scope="row">First</th><td>10</td>' in rendered
    assert "Unverified fixture" in rendered
    assert "Does not explain causation." in rendered
    text = charts.plain_text(f"Before\n\n```evidence-chart\n{source}\n```\n\nAfter")
    assert "First: 10 units — First source: https://example.test/1" in text
    assert text.startswith("Before") and text.endswith("After")
    assert "evidence-chart" not in text


def test_invalid_chart_cannot_be_released_even_by_bypassing_the_editor():
    for change in ({"maximum": 2}, {"maximum": float("nan")}, {"period": ""}):
        source = json.dumps({**figure(), **change})
        with pytest.raises(fastapi.HTTPException) as rejected:
            validate_release(f"```evidence-chart\n{source}\n```", {})
        assert rejected.value.status_code == 409
    data = figure()
    data["rows"][0]["url"] = "javascript:alert(1)"
    with pytest.raises(ValueError):
        charts.parse_chart(json.dumps(data))


def test_projection_kind_is_preserved_and_invalid_kinds_cannot_be_released():
    data = figure()
    data["rows"][1]["kind"] = "projection"
    assert charts.parse_chart(json.dumps(data))["rows"][1]["kind"] == "projection"
    data["rows"][1]["kind"] = "certain"
    with pytest.raises(fastapi.HTTPException) as rejected:
        validate_release(f"```evidence-chart\n{json.dumps(data)}\n```", {})
    assert rejected.value.status_code == 409
