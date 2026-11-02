import { lazy, Suspense, useId } from "react";
import { doctrineNodes } from "../../content/doctrine/doctrineData";
import { useIllustrationPlayback } from "../../attention-os/reader/useIllustrationPlayback";
import { IllustrationControl } from "./BookDiagram";

const BookConceptArt = lazy(() => import("./BookConceptArt"));

export default function BookConceptIllustration({ concept }: { concept: string }) {
  const node = doctrineNodes.find(entry => entry.id === concept)!;
  const playback = useIllustrationPlayback();
  const id = useId();
  return <figure className="book-concept-study" data-book-concept={concept} aria-labelledby={id}>
    <div ref={playback.ref} className="book-illustration" data-playback={playback.state}>
      <div className="book-concept-study__art" role="img" aria-label={`${node.title}: ${node.oneLine}`}>
        <Suspense fallback={<div className="book-concept-study__placeholder" />}><BookConceptArt concept={concept} time={playback.time} /></Suspense>
      </div>
      <IllustrationControl playback={playback} title={node.title} />
    </div>
    <figcaption id={id} className="book-concept-study__caption">
      <span className="book-figure__label">Concept illustration · {node.source.claimLevel}</span>
      <strong>{node.title}</strong><span>{node.oneLine}</span>
    </figcaption>
  </figure>;
}
