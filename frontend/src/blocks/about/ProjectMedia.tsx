import type { Project } from "../../content/site.config";

/** Native, user-controlled playback keeps project evidence on the page. */
export function ProjectMedia({ media }: { media: NonNullable<Project["media"]> }) {
  return (
    <figure className="about-project-media">
      <video
        controls
        playsInline
        preload="none"
        poster={media.poster}
        width={media.width}
        height={media.height}
        aria-label={media.title}
      >
        <source src={media.source} type="video/mp4" />
        <track kind="captions" src={media.captions} srcLang="en" label="English" default />
        <a href={media.source}>Watch {media.title}</a>
      </video>
      <figcaption>
        <p className="about-media-title">{media.title}</p>
        <p>{media.description}</p>
        <details className="about-disclosure">
          <summary>Read the video description</summary>
          <p>{media.transcript}</p>
        </details>
      </figcaption>
    </figure>
  );
}
