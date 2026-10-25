import { Play } from "lucide-react";
import { Link } from "react-router-dom";

import BLOG from "../../../content/blog.json";
import COMMUNITY from "../../../content/community.json";
import FILMS from "../../../content/films.json";
import HOME from "../../../content/home.json";
import { TextLink } from "../../../shared/design-system/Editorial";

const film = FILMS.screeningFilms.find(item => item.id === "inquiry-trailer");

/** Finite previews of existing work; reading remains the opening's primary action. */
export function HomeDiscovery() {
  return (
    <section className="home-discovery" id="field-notes" aria-labelledby="home-discovery-title">
      <div className="dot-page-container dot-page-wide">
        <header className="home-discovery__heading">
          <p className="dot-label">{HOME.explore.eyebrow}</p>
          <h2 id="home-discovery-title">{HOME.explore.title}</h2>
        </header>

        <div className="home-discovery__layout">
          {film && <Link to="/films" className="home-discovery__film">
            <div className="home-discovery__poster">
              <img className="home-discovery__poster-light" src="/films/inquiry-trailer-light.webp" width="960" height="540" loading="lazy" decoding="async" alt="" />
              <img className="home-discovery__poster-dark" src="/films/inquiry-trailer-dark.webp" width="960" height="540" loading="lazy" decoding="async" alt="" />
              <span className="home-discovery__play" aria-hidden="true"><Play /></span>
              <span className="home-discovery__runtime">{film.duration} · 12 scenes</span>
            </div>
            <div className="home-discovery__film-copy">
              <span className="dot-label">{HOME.explore.filmLabel}</span>
              <h3>{film.title}</h3>
              <span className="home-discovery__film-action">Enter the Screening Room <span aria-hidden="true">↗</span></span>
            </div>
          </Link>}

          <div className="home-discovery__writing">
            <article className="home-discovery__passage">
              <p className="dot-label">{HOME.explore.storyLabel}</p>
              <h3>{BLOG.startingPoint.title}</h3>
              <blockquote>
                <p>“{BLOG.startingPoint.quote}”</p>
                <cite>{BLOG.startingPoint.sourceLabel}</cite>
              </blockquote>
              <TextLink to={BLOG.startingPoint.to}>{BLOG.startingPoint.linkLabel}</TextLink>
            </article>
            <aside className="home-discovery__conversation" aria-label={HOME.explore.communityLabel}>
              <div>
                <p className="dot-label">{HOME.explore.communityLabel}</p>
                <p>{COMMUNITY.description}</p>
              </div>
              <nav aria-label="Author and community">
                <TextLink to="/community">{COMMUNITY.conversationAction}</TextLink>
                <TextLink to="/about" icon={null}>{HOME.explore.authorLabel}</TextLink>
              </nav>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
