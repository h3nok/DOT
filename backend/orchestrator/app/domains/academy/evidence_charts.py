"""Portable chart figures: validate at release; render accessible email tables."""

from __future__ import annotations

import html
import json
import math

import markdown_it


def parse_chart(source: str) -> dict:
    if len(source) > 24_000:
        raise ValueError("Chart data is too large.")
    try:
        value = json.loads(source)

        def text(item, limit=800):
            return isinstance(item, str) and 0 < len(item.strip()) and len(item) <= limit

        def number(item):
            return type(item) in {float, int} and math.isfinite(item) and item >= 0

        if not (
            text(value["title"], 200)
            and text(value["period"], 100)
            and text(value["unit"], 80)
            and text(value["status"])
            and text(value["limits"])
            and isinstance(value["rows"], list)
            and 2 <= len(value["rows"]) <= 24
            and number(value["maximum"])
            and value["maximum"] > 0
        ):
            raise ValueError
        for row in value["rows"]:
            if not (
                text(row["label"], 140)
                and number(row["value"])
                and row["value"] <= value["maximum"]
                and text(row["source"], 400)
                and text(row["url"], 2048)
                and row["url"].lower().startswith("https://")
            ):
                raise ValueError
        return value
    except (ValueError, TypeError, KeyError, OverflowError) as exc:
        raise ValueError(
            "Complete the chart title, period, units, values, sources, and limits."
        ) from exc


def chart_tokens(body: str):
    return [
        token
        for token in markdown_it.MarkdownIt("commonmark").parse(body)
        if token.type == "fence" and token.info.strip() == "evidence-chart"
    ]


def render_html(source: str) -> str:
    data = parse_chart(source)
    escaped = {
        key: html.escape(data[key]) for key in ("title", "period", "unit", "status", "limits")
    }
    rows = "".join(
        '<tr><th scope="row">'
        + html.escape(row["label"])
        + f'</th><td>{row["value"]}</td><td><a href="'
        + html.escape(row["url"], quote=True)
        + '">'
        + html.escape(row["source"])
        + "</a></td></tr>"
        for row in data["rows"]
    )
    return (
        f"<figure><h3>{escaped['title']}</h3>"
        f"<p>{escaped['period']} · {escaped['unit']}</p><p>{escaped['status']}</p>"
        '<table><thead><tr><th scope="col">Category</th><th scope="col">Value</th>'
        f'<th scope="col">Cited source</th></tr></thead><tbody>{rows}</tbody></table>'
        f"<p>{escaped['limits']}</p></figure>"
    )


def plain_text(body: str) -> str:
    lines = body.splitlines(keepends=True)
    for token in reversed(chart_tokens(body)):
        data = parse_chart(token.content)
        replacement = (
            f"{data['title']}\n{data['period']} · {data['unit']}\n{data['status']}\n"
            + "\n".join(
                f"{row['label']}: {row['value']} {data['unit']} — {row['source']}: {row['url']}"
                for row in data["rows"]
            )
            + f"\n{data['limits']}\n"
        )
        start, end = token.map
        lines[start:end] = [replacement]
    return "".join(lines)
