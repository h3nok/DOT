# /// script
# requires-python = ">=3.11"
# dependencies = ["matplotlib==3.11.2"]
# ///
"""Render the AI letter's cover from its existing evidence-chart data.

Run: uv run frontend/scripts/prepare-amm-energy-plot.py
The Markdown remains the data source. This does not verify the cited estimates.
"""
import json
import re
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import MultipleLocator

root = Path(__file__).resolve().parents[1]
article = root / "src/content/essays/amm-ai-will-not-kill-you.md"
chart = json.loads(re.search(r"```evidence-chart\s*(\{.*?\})\s*```", article.read_text(), re.S)[1])
rows = chart["rows"]
paper, ink, rust, muted = "#f6f1e7", "#232525", "#a73524", "#656157"
plt.rcParams.update({"font.family": "DejaVu Sans", "hatch.linewidth": 1.6})
fig = plt.figure(figsize=(12.8, 8), dpi=125, facecolor=paper)
fig.text(.07, .91, "Electricity behind the interface", color=ink, size=29, weight="bold")
fig.text(.07, .85, "Global data centers · TWh per year", color=muted, size=20)
ax = fig.add_axes((.14, .2, .79, .51), facecolor=paper)
ax.set_axisbelow(True)
ax.grid(axis="y", color="#d9d0c2", linewidth=.7)
ax.spines[["top", "right", "left"]].set_visible(False)
ax.spines["bottom"].set_color(muted)
ax.set_ylim(0, chart["maximum"])
ax.set_xlim(-.65, 1.65)
ax.yaxis.set_major_locator(MultipleLocator(250))
ax.tick_params(axis="y", labelsize=15, colors=muted, length=0, pad=10)
ax.tick_params(axis="x", length=0, pad=12)
for i, row in enumerate(rows):
    projection = row["kind"] == "projection"
    ax.bar(i, row["value"], width=.65, color=paper if projection else ink,
           edgecolor=rust if projection else ink, linewidth=2,
           hatch="///" if projection else None)
    ax.text(i, row["value"] - 70, str(row["value"]), ha="center", va="top",
            fontsize=40, weight="bold", color=rust if projection else paper,
            bbox={"facecolor": paper if projection else ink, "edgecolor": "none", "pad": 4})
ax.set_xticks(range(len(rows)), [row["label"].replace(" · ", "\n") for row in rows],
              fontsize=22, color=ink, linespacing=1.3)
fig.text(.07, .045, "Source: IEA · Key Questions on Energy and AI (2026)", size=13, color=muted)
fig.text(.07, .015, "All data centers, not AI alone. Estimates and projections remain uncertain.", size=12, color=muted)
output = article.with_suffix("") / "electricity-plot.png"
fig.savefig(output, dpi=125, facecolor=paper, metadata={"Description": chart["limits"], "Source": rows[0]["url"]})
plt.close(fig)
print(output)
