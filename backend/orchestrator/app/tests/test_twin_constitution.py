"""Minty's constitution is binding, so these assert it rather than read it.

Three things can rot independently: the articles, the prompt rendered from them,
and the document that explains them to a human. These fail when any two disagree,
and when an article claims a runtime control that does not exist.
"""

from __future__ import annotations

import importlib
import pathlib
import re

import app.domains.twin.constitution as constitution
import app.domains.twin.service as service

DOC = pathlib.Path(__file__).resolve().parents[4] / "docs/blueprint/13-MINTY-CONSTITUTION.md"


def test_article_ids_are_unique_and_stable() -> None:
    ids = [article.id for article in constitution.ARTICLES]
    assert len(ids) == len(set(ids))
    # Referenced by refusals, docs, and tests; renaming one silently breaks them.
    assert "grounded-only" in ids
    assert "refuse-over-guess" in ids


def test_every_article_reaches_the_model() -> None:
    prompt = constitution.system_prompt()
    for article in constitution.ARTICLES:
        assert article.rule in prompt, f"{article.id} never reaches Minty"


def test_service_prompt_is_the_constitution() -> None:
    # The prompt is not written in the service; it is rendered from the articles.
    assert service.SYSTEM_PROMPT == constitution.system_prompt()


def test_enforced_articles_name_a_control_that_exists() -> None:
    """An article claiming code enforcement must point at real code.

    This is the line between a guarantee and a wish. If the named symbol is gone,
    the article is now instruction only and must say so.
    """

    for article in constitution.ENFORCED_ARTICLES:
        assert article.enforced_by is not None
        module_path, _, symbol = article.enforced_by.rpartition(".")
        module = importlib.import_module(module_path)
        assert hasattr(module, symbol), (
            f"{article.id} names a missing control: {article.enforced_by}"
        )


def test_every_refusal_is_an_article_being_kept() -> None:
    for code in service._REFUSAL_TEXT:  # noqa: SLF001 - the refusal table is the contract
        article_id = service._REFUSAL_ARTICLE[code]  # noqa: SLF001
        assert constitution.article(article_id).id == article_id


def test_refusals_speak_the_reader_s_language() -> None:
    """A refusal is read by someone holding a book, not by an engineer."""

    machinery = ("graph", "grounding", "retrieval", "context window", "node id")
    for code, text in service._REFUSAL_TEXT.items():  # noqa: SLF001
        lowered = text.lower()
        for word in machinery:
            assert word not in lowered, f"{code} exposes internal vocabulary: {word!r}"


def test_document_lists_exactly_the_articles_in_force() -> None:
    """The published explanation cannot drift from what Minty is actually given."""

    document = DOC.read_text(encoding="utf-8")
    documented = set(re.findall(r"^\| `([a-z-]+)` \|", document, re.MULTILINE))
    assert documented == {article.id for article in constitution.ARTICLES}


def test_document_agrees_about_what_is_enforced() -> None:
    document = DOC.read_text(encoding="utf-8")
    for article in constitution.ARTICLES:
        row = re.search(rf"^\| `{article.id}` \| .* \| (.+) \|$", document, re.MULTILINE)
        assert row is not None, f"{article.id} has no row in the constitution document"
        claimed = row.group(1).strip().strip("`")
        if article.enforced_by is None:
            assert claimed == "Instruction", f"{article.id} is instruction, documented as {claimed}"
        else:
            # The document names the control without its package prefix.
            assert article.enforced_by.endswith(claimed), (
                f"{article.id} is enforced by {article.enforced_by}, documented as {claimed}"
            )
