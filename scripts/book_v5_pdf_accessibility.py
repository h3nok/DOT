"""Remove one verified, invisible LibreOffice cover duplicate from a v5 PDF.

LibreOffice can export the anchored cover again on the otherwise empty inside
cover, entirely to the left of the page. Its Figure tag remains in reading order
and repeats the cover description. This helper declines to change the PDF unless
the drawing, clipping, structure tree, and parent-tree mapping all identify that
specific duplicate. It does not remove arbitrary empty pages or image tags.
"""

from __future__ import annotations

from pypdf import PdfWriter
from pypdf.generic import (
    ArrayObject,
    ContentStream,
    DecodedStreamObject,
    DictionaryObject,
    IndirectObject,
    NameObject,
)


def _object(value):
    return value.get_object() if isinstance(value, IndirectObject) else value


def _same_reference(left, right):
    return (
        isinstance(left, IndirectObject)
        and isinstance(right, IndirectObject)
        and left.idnum == right.idnum
        and left.generation == right.generation
        and left.pdf is right.pdf
    )


def _intersects(left, right):
    return (
        min(left[2], right[2]) > max(left[0], right[0])
        and min(left[3], right[3]) > max(left[1], right[1])
    )


def _figures(node, seen=None):
    """Walk only structure children, never parent/page back-references."""
    if seen is None:
        seen = set()
    reference = node
    if isinstance(node, IndirectObject):
        identity = (node.idnum, node.generation)
        if identity in seen:
            return
        seen.add(identity)
    node = _object(node)
    if isinstance(node, DictionaryObject):
        if node.get("/S") == "/Figure":
            yield reference, node
        if "/K" in node:
            yield from _figures(node.raw_get("/K"), seen)
    elif isinstance(node, ArrayObject):
        for child in node:
            yield from _figures(child, seen)


def figure_alt_texts(structure) -> list[str]:
    """Read figure descriptions in the PDF's assistive reading order."""
    return [str(figure.get("/Alt", "")) for _, figure in _figures(structure)]


def remove_offpage_inside_cover_duplicate(writer: PdfWriter) -> bool:
    """Return True only when the verified invisible duplicate was removed.

    All checks precede mutation. A PDF with a different cover, any visible inside
    cover content, a changed content-stream shape, or a different tag arrangement
    is left unchanged. Calling the function again is a no-op.
    """
    if len(writer.pages) < 2:
        return False
    first, inside = writer.pages[0], writer.pages[1]
    structure = _object(writer.root_object.get("/StructTreeRoot"))
    if not isinstance(structure, DictionaryObject):
        return False
    if "/StructParents" not in inside or inside.get("/Annots"):
        return False

    stream = inside.get_contents()
    if stream is None:
        return False
    operations = ContentStream(stream, writer).operations
    # This complete stream contains one clipped image and no text or annotations.
    if [operator for _, operator in operations] != [
        b"w", b"BDC", b"q", b"re", b"W*", b"n", b"q", b"cm",
        b"Do", b"Q", b"EMC", b"Q",
    ]:
        return False
    marked = operations[1][0]
    if (
        len(marked) != 2
        or marked[0] != "/Figure"
        or not isinstance(marked[1], DictionaryObject)
        or dict(marked[1]) != {"/MCID": 0}
    ):
        return False
    clip = operations[3][0]
    matrix = operations[7][0]
    image_args = operations[8][0]
    if len(clip) != 4 or len(matrix) != 6 or len(image_args) != 1:
        return False
    x, y, width, height = map(float, clip)
    a, b, c, d, e, f = map(float, matrix)
    if width <= 0 or height <= 0 or a <= 0 or d <= 0 or b != 0 or c != 0:
        return False
    page_box = tuple(map(float, inside.cropbox))
    clip_box = (x, y, x + width, y + height)
    image_box = (e, f, e + a, f + d)
    if _intersects(clip_box, page_box) or _intersects(image_box, page_box):
        return False

    first_images = _object(first["/Resources"].get("/XObject"))
    inside_images = _object(inside["/Resources"].get("/XObject"))
    if not isinstance(first_images, DictionaryObject) or not isinstance(inside_images, DictionaryObject):
        return False
    image_name = image_args[0]
    if image_name not in inside_images:
        return False
    duplicate_image = inside_images.raw_get(image_name)
    first_draws = [args[0] for args, op in ContentStream(first.get_contents(), writer).operations
                   if op == b"Do" and len(args) == 1]
    if not any(name in first_images and _same_reference(first_images.raw_get(name), duplicate_image)
               for name in first_draws):
        return False

    candidates = []
    for reference, figure in _figures(structure):
        if _same_reference(figure.get("/Pg"), inside.indirect_reference):
            candidates.append((reference, figure))
    if len(candidates) != 1:
        return False
    duplicate_ref, duplicate = candidates[0]
    if not isinstance(duplicate_ref, IndirectObject) or duplicate.get("/K") != [0]:
        return False
    alt = duplicate.get("/Alt")
    attributes = _object(duplicate.get("/A"))
    if not isinstance(alt, str) or not alt.startswith("Cover of "):
        return False
    if not isinstance(attributes, DictionaryObject) or len(attributes.get("/BBox", [])) != 4:
        return False
    if _intersects(tuple(map(float, attributes["/BBox"])), page_box):
        return False
    parent_ref = duplicate.get("/P")
    parent = _object(parent_ref)
    if not isinstance(parent, DictionaryObject):
        return False
    siblings = _object(parent.get("/K"))
    if not isinstance(siblings, ArrayObject) or len(siblings) != 2:
        return False
    duplicate_positions = [i for i, child in enumerate(siblings) if _same_reference(child, duplicate_ref)]
    if len(duplicate_positions) != 1:
        return False
    duplicate_index = duplicate_positions[0]
    original = _object(siblings[1 - duplicate_index])
    if (
        not isinstance(original, DictionaryObject)
        or original.get("/S") != "/Figure"
        or original.get("/Alt") != alt
        or original.get("/K") != [0]
        or not _same_reference(original.get("/Pg"), first.indirect_reference)
        or not _same_reference(original.get("/P"), parent_ref)
    ):
        return False
    original_attributes = _object(original.get("/A"))
    if not isinstance(original_attributes, DictionaryObject) or len(original_attributes.get("/BBox", [])) != 4:
        return False
    if not _intersects(tuple(map(float, original_attributes["/BBox"])), tuple(map(float, first.cropbox))):
        return False

    parent_tree = _object(structure.get("/ParentTree"))
    if not isinstance(parent_tree, DictionaryObject) or "/Kids" in parent_tree or "/Limits" in parent_tree:
        return False
    numbers = _object(parent_tree.get("/Nums"))
    if not isinstance(numbers, ArrayObject) or len(numbers) % 2:
        return False
    positions = [i for i in range(0, len(numbers), 2) if numbers[i] == inside["/StructParents"]]
    if len(positions) != 1:
        return False
    parent_index = positions[0]
    mapping = _object(numbers[parent_index + 1])
    if not isinstance(mapping, ArrayObject) or len(mapping) != 1 or not _same_reference(mapping[0], duplicate_ref):
        return False

    # Only this proven invisible page content and its corresponding tag mappings.
    empty = DecodedStreamObject()
    empty.set_data(b"")
    inside[NameObject("/Contents")] = writer._add_object(empty)
    del inside["/StructParents"]
    del siblings[duplicate_index]
    del numbers[parent_index:parent_index + 2]
    return True
