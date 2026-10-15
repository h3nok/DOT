import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EvidenceChart } from "./EvidenceChart";
import { parseEvidenceChart } from "./evidenceChart";

const figure = { title: "Synthetic comparison", period: "Fixture period", unit: "units", maximum: 100, status: "Unverified fixture", limits: "These values do not explain causation.", rows: [{ label: "First", value: 10, source: "First source", url: "https://example.test/first" }, { label: "Second", value: 90, source: "Second source", url: "https://example.test/second" }] };
afterEach(cleanup);
describe("inspectable figures", () => {
  it("connects the selected value to its source, retaining all values in a table", () => {
    render(<EvidenceChart source={JSON.stringify(figure)} />);
    fireEvent.click(screen.getByRole("button", { name: "Inspect Second: 90 units" }));
    expect(screen.getByRole("button", { name: "Inspect Second: 90 units" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Second: 90 units")).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Second source" })[0]).toHaveAttribute("href", "https://example.test/second");
    fireEvent.click(screen.getByText("All values and sources"));
    expect(screen.getByRole("table")).toHaveTextContent("First10First source");
    expect(screen.getByText(figure.limits)).toBeVisible();
  });
  it("rejects misleading scales, nonnumeric values, absent provenance and executable links", () => {
    for (const invalid of [ { ...figure, maximum: 50 }, { ...figure, rows: [{ ...figure.rows[0], value: -1 }, figure.rows[1]] }, { ...figure, period: "" }, { ...figure, rows: [{ ...figure.rows[0], url: "javascript:alert(1)" }, figure.rows[1]] } ]) expect(parseEvidenceChart(JSON.stringify(invalid))).toBeNull();
    render(<EvidenceChart source='{"title":"incomplete"}' />);
    expect(screen.getByText(/data needs correction/)).toBeVisible();
    expect(screen.queryByRole("group", { name: "Inspect a value" })).not.toBeInTheDocument();
  });
});
