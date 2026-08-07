from __future__ import annotations

import collections.abc
import dataclasses
import datetime
import email.utils
import hashlib
import html
import re
import xml.etree.ElementTree as ET


@dataclasses.dataclass(frozen=True)
class RssFeedItem:
    title: str
    link: str | None
    external_id: str
    published_at: datetime.datetime | None
    excerpt: str | None
    tags: tuple[str, ...]


@dataclasses.dataclass(frozen=True)
class RssFeed:
    title: str
    link: str | None
    items: tuple[RssFeedItem, ...]


def stable_external_id(prefix: str, value: str, *, max_length: int = 64) -> str:
    digest: str = hashlib.sha256(value.encode("utf-8")).hexdigest()[:32]
    return f"{prefix}:{digest}"[:max_length]


def stable_slug(value: str, *, max_length: int = 120) -> str:
    slug: str = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return slug[:max_length] or "untitled"


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1].lower()


def _children(element: ET.Element, name: str) -> list[ET.Element]:
    return [child for child in list(element) if _local_name(child.tag) == name]


def _first_child(element: ET.Element, name: str) -> ET.Element | None:
    children: list[ET.Element] = _children(element, name)
    return children[0] if children else None


def _text(element: ET.Element | None) -> str:
    if element is None:
        return ""
    return (element.text or "").strip()


def _clean_text(value: str, *, max_length: int = 500) -> str:
    without_tags: str = re.sub(r"<[^>]+>", " ", value)
    normalized: str = re.sub(r"\s+", " ", html.unescape(without_tags)).strip()
    return normalized[:max_length]


def _parse_date(value: str) -> datetime.datetime | None:
    if not value:
        return None
    try:
        parsed: datetime.datetime = email.utils.parsedate_to_datetime(value)
    except (TypeError, ValueError):
        normalized: str = value.replace("Z", "+00:00")
        try:
            parsed: datetime.datetime = datetime.datetime.fromisoformat(normalized)
        except ValueError:
            return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=datetime.UTC)
    return parsed.astimezone(datetime.UTC)


def _rss_categories(item: ET.Element) -> tuple[str, ...]:
    values: list[str] = [
        _clean_text(_text(category), max_length=80) for category in _children(item, "category")
    ]
    return tuple(sorted({value for value in values if value}))


def _atom_link(entry: ET.Element) -> str | None:
    for link in _children(entry, "link"):
        href: str = link.attrib.get("href", "").strip()
        if href and link.attrib.get("rel", "alternate") in {"alternate", ""}:
            return href
    return None


def _parse_rss_channel(channel: ET.Element, fallback_title: str) -> RssFeed:
    title: str = _clean_text(
        _text(_first_child(channel, "title")) or fallback_title, max_length=200
    )
    link: str | None = _text(_first_child(channel, "link")) or None
    parsed_items: list[RssFeedItem] = []

    for item in _children(channel, "item"):
        item_title: str = _clean_text(_text(_first_child(item, "title")), max_length=300)
        item_link: str | None = _text(_first_child(item, "link")) or None
        guid: str = _text(_first_child(item, "guid")) or item_link or item_title
        description: str = _text(_first_child(item, "description"))
        pub_date: str = _text(_first_child(item, "pubdate"))
        if not item_title and not item_link:
            continue
        parsed_items.append(
            RssFeedItem(
                title=item_title or item_link or "Untitled post",
                link=item_link,
                external_id=stable_external_id("post", guid),
                published_at=_parse_date(pub_date),
                excerpt=_clean_text(description) if description else None,
                tags=_rss_categories(item),
            )
        )

    return RssFeed(title=title, link=link, items=tuple(parsed_items))


def _atom_categories(entry: ET.Element) -> tuple[str, ...]:
    values: list[str] = [
        _clean_text(category.attrib.get("term", ""), max_length=80)
        for category in _children(entry, "category")
    ]
    return tuple(sorted({value for value in values if value}))


def _parse_atom_feed(root: ET.Element, fallback_title: str) -> RssFeed:
    title: str = _clean_text(_text(_first_child(root, "title")) or fallback_title, max_length=200)
    link: str | None = _atom_link(root)
    parsed_items: list[RssFeedItem] = []

    for entry in _children(root, "entry"):
        item_title: str = _clean_text(_text(_first_child(entry, "title")), max_length=300)
        item_link: str | None = _atom_link(entry)
        entry_id: str = _text(_first_child(entry, "id")) or item_link or item_title
        summary: str = _text(_first_child(entry, "summary")) or _text(
            _first_child(entry, "content")
        )
        updated: str = _text(_first_child(entry, "published")) or _text(
            _first_child(entry, "updated")
        )
        if not item_title and not item_link:
            continue
        parsed_items.append(
            RssFeedItem(
                title=item_title or item_link or "Untitled post",
                link=item_link,
                external_id=stable_external_id("post", entry_id),
                published_at=_parse_date(updated),
                excerpt=_clean_text(summary) if summary else None,
                tags=_atom_categories(entry),
            )
        )

    return RssFeed(title=title, link=link, items=tuple(parsed_items))


def parse_feed(xml_text: str, *, fallback_title: str = "Imported publication") -> RssFeed:
    root: ET.Element[str] = ET.fromstring(xml_text)
    root_name: str = _local_name(root.tag)

    if root_name == "rss":
        channel: ET.Element[str] | None = _first_child(root, "channel")
        if channel is None:
            raise ValueError("RSS feed is missing channel.")
        return _parse_rss_channel(channel, fallback_title)

    if root_name == "feed":
        return _parse_atom_feed(root, fallback_title)

    raise ValueError(f"Unsupported feed root: {root_name}.")


def normalize_topics(
    values: collections.abc.Iterable[str], *, max_topics: int = 12
) -> tuple[str, ...]:
    seen: set[str] = set()
    topics: list[str] = []
    for value in values:
        normalized: str = _clean_text(value, max_length=80)
        key: str = stable_slug(normalized)
        if normalized and key not in seen:
            seen.add(key)
            topics.append(normalized)
        if len(topics) >= max_topics:
            break
    return tuple(topics)
