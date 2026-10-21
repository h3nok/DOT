function html(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

export function buildSetupText(setup) {
  return `DIGITAL ORGANISM THEORY — CHANNEL SETUP

Channel creation is pending. This package contains local artwork and proposed
profile text. It does not reserve a handle or create a YouTube account.

VISUAL REFERENCE
The website's opening dot, single ring, and surrounding curved field.
The banner and title card carry: Conditioning · Choice · Agency.
Palette: ${setup.brand.name}. Warm ivory ${setup.brand.palette.surface},
deep green ${setup.brand.palette.ink}, jade ${setup.brand.palette.accent}.
${setup.video ? `splash-intro.mp4 is the finished ${setup.video.duration_seconds}-second introductory opening video with quiet digital audio.
It presents DOT's proposed model of reality in creation order, one typewriter line per scene: T × E (speculative), Big C emerging and stabilizing itself, Big C building tools — Reality Frames (RF₁…RFₙ, RF₀) — Little c, and choosing with others — before settling into the Digital Organism Theory brand lockup.
${setup.bumper ? `splash-bumper.mp4 is the ${setup.bumper.duration_seconds}-second episode-opening cut of the same animation (no captions).\n` : ""}splash.png is its still poster.` : "The PNG files are still exports of that visual language."}

1. CREATE THE CHANNEL
Sign in to YouTube with the Google account you want to own the channel.
Open Settings > Add or manage channel(s) > Create a channel.
Use this display name: ${setup.name}
Try these handles in order: ${setup.proposed_handles.join(", ")}
YouTube must confirm availability. These are proposals, not reserved handles.
Select avatar.png as the profile picture and complete channel creation.
Official guide: ${setup.sources.create}

2. ADD THE ARTWORK
Open YouTube Studio > Customization > Profile.
Upload banner.png (2560 x 1440) and avatar.png (800 x 800).
Check YouTube's crop preview, then publish the profile changes.
banner-mobile.png is a crop reference only; upload the full banner.png.
watermark.png (512 x 512, transparent) is optional for future videos.
Official branding guide: ${setup.sources.branding}

3. ADD THE PROFILE TEXT AND LINKS
Review channel-description.txt, then paste it into the Description field.
It is third-person project copy for your review, not a quotation from the author.
Add these profile links in order:
${setup.links.map((link) => `${link.title}: ${link.url}`).join("\n")}
Publish the profile changes.
Official profile guide: ${setup.sources.profile}

4. RECORD THE ACTUAL CHANNEL ADDRESS
Copy the address from your newly created channel page and keep it with your
records. The website can be connected after this address is confirmed.
Handle guidance: ${setup.sources.handles}

DONE FOR NOW
A trailer, first video, playlists, thumbnails, and upload schedule can wait.
The thumbnail, title-card, and end-card files are optional templates for future work.
No published episodes, publishing cadence, channel ownership, or reserved handle are claimed.

PROPOSED PLAYLISTS (FOR WHEN VIDEOS ARE PUBLISHED)
${(setup.playlists ?? []).map((playlist, index) => `${index + 1}. ${playlist.title}\n   ${playlist.description}`).join("\n")}

FILES
banner.png / avatar.png — profile uploads
watermark.png — optional transparent video mark
${setup.video ? `splash-intro.mp4 — ${setup.video.width} x ${setup.video.height}${setup.video.width >= 3840 ? " (4K)" : ""}, 30 fps, ${setup.video.duration_seconds} seconds, H.264 video with quiet digital AAC audio\nsplash-storyboard.png — keyframes showing the motion sequence\n` : ""}${setup.bumper ? `splash-bumper.mp4 — ${setup.bumper.width} x ${setup.bumper.height}${setup.bumper.width >= 3840 ? " (4K)" : ""}, 30 fps, ${setup.bumper.duration_seconds} seconds, episode-opening cut\n` : ""}splash.png — still title card and video poster
end-card.png — 1920 x 1080 closing video colophon card (Book One + AMM + Claim levels)
thumbnail-*.png — 1280 x 720 thumbnail templates for Book One, Epistemic Method, and AMM
channel-description.txt — proposed description to review and paste
channel-setup.json — structured setup record; confirmed handle and URL are empty
index.html — open locally for previews and copy controls
*.svg — editable artwork, with embedded local fonts
FONT-LICENSES.txt — font license notices

MANIFESTO
Serves L1 (calm), L7 (honest setup state), L9 (local assets without trackers),
and L10 (one setup step at a time). Violates no manifesto law.
`;
}

export function buildSetupPage(setup, fontStyles = "", files = {}) {
  const palette = setup.brand.palette;
  const profileLinks = setup.links.map((link, index) => `
    <div class="profile-link">
      <label for="link-${index}">${html(link.title)}</label>
      <div class="field-row"><input id="link-${index}" readonly value="${html(link.url)}"><button data-copy="link-${index}" type="button">Copy URL</button></div>
    </div>`).join("");
  const handles = setup.proposed_handles.map((handle) => `<li><code>${html(handle)}</code></li>`).join("");
  const videoSection = setup.video ? `
  <section id="splash-video" aria-labelledby="video-heading">
    <div class="step-heading"><span class="step-number">Play</span><h2 id="video-heading">Emergence, in motion.</h2></div>
    <video class="artwork" controls playsinline preload="metadata" poster="${html(setup.video.poster)}" width="1920" height="1080" aria-label="Digital Organism Theory introductory opening animation with quiet digital audio">
      <source src="${html(setup.video.file)}" type="video/mp4">
      <p><a href="${html(setup.video.file)}" download>Download the opening video</a></p>
    </video>
    <p class="muted">${setup.video.duration_seconds} seconds · ${setup.video.width} × ${setup.video.height}${setup.video.width >= 3840 ? " (4K)" : ""} · 30 fps · H.264 MP4 · AAC 48kHz stereo, quiet digital audio. DOT’s proposed model of reality in creation order, one typewriter line per scene: T × E (speculative) → Big C emerges and stabilizes itself → Big C builds tools: Reality Frames (RF₁ · RF₂ · RFₙ, then RF₀) → Little c (c₁ … cₙ) → seeing the rules and choosing with others → the Digital Organism Theory brand lockup.</p>
    <div class="actions"><a class="download primary" href="${html(setup.video.file)}" download>Download ${setup.video.duration_seconds}s intro MP4</a><a class="download" href="${html(setup.video.storyboard)}" download>View ${setup.video.duration_seconds}s storyboard</a><a href="splash.png" download>Still poster PNG</a></div>
    ${setup.bumper ? `
    <h3 style="margin-top:32px">${setup.bumper.duration_seconds}-Second Episode Opener</h3>
    <video class="artwork" controls playsinline preload="metadata" poster="${html(setup.bumper.poster)}" width="1920" height="1080" aria-label="Digital Organism Theory ${setup.bumper.duration_seconds}-second episode opener with quiet digital audio">
      <source src="${html(setup.bumper.file)}" type="video/mp4">
      <p><a href="${html(setup.bumper.file)}" download>Download the episode opener</a></p>
    </video>
    <p class="muted">${setup.bumper.duration_seconds} seconds · the same animation as a fast build with no captions, ending on the brand lockup. Short enough to open every episode.</p>
    <div class="actions"><a class="download primary" href="${html(setup.bumper.file)}" download>Download ${setup.bumper.duration_seconds}s opener MP4</a><a class="download" href="${html(setup.bumper.storyboard)}" download>View ${setup.bumper.duration_seconds}s storyboard</a></div>
    ` : ""}
    ${setup.trailer ? `
    <h3 style="margin-top:32px">40-Second Channel Trailer (DOT · Current Affairs · AMM)</h3>
    <video class="artwork" controls playsinline preload="metadata" poster="thumbnail-introduction.png" width="1920" height="1080" aria-label="Digital Organism Theory 40-second channel trailer with quiet digital audio">
      <source src="${html(setup.trailer.file)}" type="video/mp4">
      <p><a href="${html(setup.trailer.file)}" download>Download the 40-second channel trailer</a></p>
    </video>
    <p class="muted">${setup.trailer.duration_seconds} seconds · ${setup.trailer.width} × ${setup.trailer.height} · 30 fps · H.264 MP4 · AAC 48kHz stereo, quiet digital score. Connects the current-affairs hook, Book One’s new model of reality (T × E → Big C → RF₀ → Little c), The American Millennial Manifesto (Dependence → Extraction → Power → Shared Agency), the 3 channel streams, and the closing colophon.</p>
    <div class="actions"><a class="download primary" href="${html(setup.trailer.file)}" download>Download 40s Channel Trailer MP4</a><a class="download" href="${html(setup.trailer.storyboard)}" download>View 40s Trailer Storyboard</a><a href="thumbnail-introduction.png" download>Trailer Thumbnail PNG</a></div>
    ` : ""}
    <p class="muted">Use the 40-second trailer as your channel trailer or upload it directly; use the ${setup.bumper ? `${setup.bumper.duration_seconds}-second opener` : `${setup.video.duration_seconds}-second intro`} at the start of future episodes.</p>
  </section>` : "";
  const thumbnails = [
    ["introduction", "Book One — What is a digital organism?"],
    ["concepts", "Book One — Canvas. Painting. Character."],
    ["agency", "Book One — When fear governs the loop."],
    ["open-questions", "Epistemic Method — Where the theory is still open."],
    ["amm", "AMM — How a system gets inside us."],
    ["amm-power", "AMM — Dependence. Extraction. Power."],
  ].map(([file, label]) => `<figure>
      <img src="thumbnail-${file}.png" width="1280" height="720" alt="${html(label)}" loading="lazy">
      <figcaption>${html(label)}<br><a href="thumbnail-${file}.png" download>PNG</a> · <a href="thumbnail-${file}.svg" download>Editable SVG</a></figcaption>
    </figure>`).join("");
  const playlists = (setup.playlists ?? []).map((playlist, index) => `
    <div class="asset-card">
      <label for="playlist-title-${index}">Playlist ${index + 1} title</label>
      <div class="field-row"><input id="playlist-title-${index}" readonly value="${html(playlist.title)}"><button data-copy="playlist-title-${index}" type="button">Copy title</button></div>
      <label for="playlist-desc-${index}">Description</label>
      <div class="field-row"><input id="playlist-desc-${index}" readonly value="${html(playlist.description)}"><button data-copy="playlist-desc-${index}" type="button">Copy</button></div>
    </div>`).join("");
  const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Digital Organism Theory — Channel setup kit</title>
  <style>
    ${fontStyles}
    :root { color-scheme:light; --paper:#041a13; --ink:#fcfbf6; --mint:#086946; --muted:#163d2f; --edge:#b8d8c9; --raised:#ffffff; --control:#e6f6ef; font-family:"Space Grotesk",system-ui,sans-serif; font-size:18px; color:var(--paper); background:radial-gradient(circle at 50% 0%, #ffffff 0%, #effaf5 36%, #fcfbf6 76%); line-height:1.68; }
    * { box-sizing:border-box; }
    body { margin:0; }
    main { max-width:1360px; margin:auto; padding:44px 36px 72px; }
    a { color:var(--mint); font-weight:600; text-underline-offset:4px; }
    a,button,input,textarea,summary { outline-offset:5px; }
    :focus-visible { outline:2px solid var(--mint); }
    a,button { touch-action:manipulation; }
    button,.download { display:inline-flex; align-items:center; justify-content:center; min-height:46px; padding:11px 20px; border:1.5px solid var(--edge); border-radius:9px; background:var(--control); color:var(--paper); font:inherit; font-size:16px; font-weight:600; cursor:pointer; text-decoration:none; }
    button:hover,.download:hover { border-color:var(--mint); }
    .download.primary { color:var(--ink); background:var(--mint); border-color:var(--mint); }
    .topline,.eyebrow,.step-number { font:700 14px/1.7 "JetBrains Mono",monospace; letter-spacing:.1em; text-transform:uppercase; color:var(--mint); }
    .topline { display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px; padding-bottom:20px; border-bottom:1.5px solid var(--edge); }
    .topline span:last-child { color:var(--muted); }
    h1,h2,h3 { font-weight:700; line-height:1.12; color:#041a13; }
    h1 { font-size:clamp(42px,6vw,72px); letter-spacing:-.04em; margin:14px 0 22px; max-width:17ch; }
    h2 { font-size:clamp(28px,3.2vw,40px); letter-spacing:-.025em; margin:8px 0 18px; }
    h3 { font-size:23px; margin:16px 0 12px; }
    p { max-width:72ch; }
    .lead { font:600 24px/1.58 "Source Serif 4",Georgia,serif; color:#0d3527; max-width:52ch; }
    .muted,figcaption { color:var(--muted); font-size:16px; line-height:1.62; }
    .hero { display:grid; grid-template-columns:1fr 220px; align-items:center; gap:36px; padding:48px 0; }
    .hero img { width:220px; border-radius:50%; }
    .actions { display:flex; flex-wrap:wrap; gap:12px; margin:22px 0; }
    section { padding:38px 0; border-top:1.5px solid var(--edge); }
    .step-heading { display:flex; align-items:baseline; gap:18px; }
    figure { margin:22px 0; }
    img,video { display:block; max-width:100%; height:auto; }
    .artwork { border:1.5px solid var(--edge); border-radius:14px; overflow:hidden; box-shadow:0 12px 32px rgba(4,26,19,0.06); }
    figcaption { margin-top:12px; font-weight:500; }
    .asset-grid,.profile-grid { display:grid; grid-template-columns:1fr 1fr; gap:30px; }
    .asset-card,.note { padding:26px; border:1.5px solid var(--edge); border-radius:14px; background:var(--raised); }
    .asset-card figure { margin:0; }
    .avatar { width:180px; border-radius:50%; }
    .checker { display:grid; place-items:center; width:180px; height:180px; background:repeating-conic-gradient(var(--ink) 0% 25%,var(--edge) 0% 50%) 50%/24px 24px; border-radius:10px; }
    .checker img { width:150px; }
    label { display:block; margin:18px 0 8px; color:#0b2e22; font-size:16px; font-weight:600; }
    input,textarea { width:100%; min-width:0; border:1.5px solid var(--edge); border-radius:8px; padding:13px 14px; color:var(--paper); background:var(--raised); font:500 16px/1.65 "Space Grotesk",system-ui,sans-serif; }
    textarea { resize:vertical; min-height:320px; }
    .field-row { display:flex; gap:10px; }
    .field-row button { flex-shrink:0; }
    .handles { display:flex; flex-wrap:wrap; gap:10px; list-style:none; margin:12px 0; padding:0; }
    code { font:600 15px/1.7 "JetBrains Mono",monospace; overflow-wrap:anywhere; }
    .handles code { display:block; padding:9px 14px; background:var(--control); border:1.5px solid var(--edge); border-radius:6px; }
    ol { padding-left:24px; max-width:78ch; }
    li { margin:14px 0; }
    .handles li { margin:0; }
    details { border:1.5px solid var(--edge); border-radius:14px; padding:22px 26px; background:var(--raised); }
    summary { cursor:pointer; font-size:20px; font-weight:700; color:#041a13; }
    .templates { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:26px; }
    .title-card { max-width:100%; }
    .status { min-height:24px; color:var(--mint); font-weight:600; }
    footer { padding-top:24px; border-top:1.5px solid var(--edge); }
    @media(max-width:700px) { main { padding:24px 20px 40px; } .hero { grid-template-columns:1fr; gap:16px; padding:36px 0; } .hero img { width:112px; grid-row:1; } .asset-grid,.profile-grid,.templates { grid-template-columns:1fr; } .field-row { flex-wrap:wrap; } .field-row input { flex-basis:100%; } .asset-card,.note { padding:18px; } }
    @media print { :root { color-scheme:light; color:#142822; background:white; } button,.actions,.extras { display:none; } main { padding:0; } section { break-inside:avoid; } input,textarea { color:#142822; background:white; } }
  </style>
</head>
<body>
<main>
  <div class="topline"><span>DOT / Channel setup kit / ${html(setup.brand.name)}</span><span>Prepared locally · Channel creation pending</span></div>
  <header class="hero">
    <div>
      <p class="eyebrow">Conditioning · Choice · Agency</p>
      <h1>Digital Organism Theory</h1>
      <p class="lead">The website’s opening dot, ring, and field, adapted for YouTube.</p>
      <p class="muted">Start with the banner, profile picture, and proposed description. You can set up the channel before making a video.</p>
      <div class="actions">${setup.video ? '<a class="download primary" href="#splash-video">Watch the splash video</a><a class="download" href="START-HERE.txt" download>Download setup guide</a>' : '<a class="download primary" href="START-HERE.txt" download>Download setup guide</a><a class="download" href="#profile">Prepare the profile</a>'}</div>
    </div>
    <img src="avatar.png" width="800" height="800" alt="DOT opening dot and ring in a curved field, jade on warm ivory">
  </header>

${videoSection}

  <section aria-labelledby="artwork-heading">
    <div class="step-heading"><span class="step-number">01</span><h2 id="artwork-heading">Upload the identity.</h2></div>
    <h3>Channel banner</h3>
    <figure><img class="artwork" src="banner.png" width="2560" height="1440" alt="Digital Organism Theory banner with the opening dot, single ring, and curved field; Conditioning, Choice, Agency; author credit and dotheory.org"><figcaption>2560 × 1440 PNG. The name, author, subject line, and website sit inside a conservative central safe area. The field uses the website’s own radial geometry.</figcaption></figure>
    <div class="actions"><a class="download primary" href="banner.png" download>Download banner PNG</a><a class="download" href="banner.svg" download>Editable SVG</a></div>
    <details><summary>Check the mobile-safe composition</summary><figure><img src="banner-mobile.png" width="1520" height="400" alt="Central banner crop retaining all essential text"><figcaption>1520 × 400 crop reference. Upload the full banner above; confirm the crop in YouTube Studio.</figcaption></figure></details>
    <div class="asset-grid">
      <div class="asset-card"><h3>Profile picture</h3><figure><img class="avatar" src="avatar.png" width="800" height="800" alt="Circular preview of the DOT profile picture"><figcaption>800 × 800 PNG, composed for a circular crop.</figcaption></figure><div class="actions"><a class="download primary" href="avatar.png" download>Download profile PNG</a><a href="avatar.svg" download>SVG</a></div></div>
      <div class="asset-card"><h3>Video watermark <span class="muted">/ optional, for later</span></h3><figure><div class="checker"><img src="watermark.png" width="512" height="512" alt="Transparent DOT opening dot and ring watermark"></div><figcaption>512 × 512 transparent PNG. The checkerboard is a preview background.</figcaption></figure><div class="actions"><a class="download" href="watermark.png" download>Download watermark PNG</a><a href="watermark.svg" download>SVG</a></div></div>
    </div>
  </section>

  <section id="profile" aria-labelledby="profile-heading">
    <div class="step-heading"><span class="step-number">02</span><h2 id="profile-heading">Prepare the profile.</h2></div>
    <div class="profile-grid">
      <div>
        <label for="channel-name">Channel display name</label><div class="field-row"><input id="channel-name" readonly value="${html(setup.name)}"><button data-copy="channel-name" type="button">Copy name</button></div>
        <h3>Try these handles in order</h3><ul class="handles">${handles}</ul>
        <p class="muted">All three are proposals. YouTube must confirm availability during setup; none has been reserved or verified.</p>
        <h3>Profile links</h3>${profileLinks}
      </div>
      <div>
        <label for="description">Proposed channel description · ${setup.description.length} characters</label>
        <textarea id="description" readonly spellcheck="false">${html(setup.description)}</textarea>
        <div class="actions"><button data-copy="description" type="button">Copy description</button><a href="channel-description.txt" download>Download TXT</a></div>
        <p class="muted">Project copy for your review, written in third person. It makes no promise of existing videos or a publishing schedule.</p>
      </div>
    </div>
    <p class="status" role="status" id="copy-status" aria-live="polite"></p>
  </section>

  <section aria-labelledby="create-heading">
    <div class="step-heading"><span class="step-number">03</span><h2 id="create-heading">Create the channel.</h2></div>
    <ol>
      <li>Sign in to YouTube with the Google account you want to own the channel. Open <strong>Settings → Add or manage channel(s) → Create a channel</strong>.</li>
      <li>Use <strong>${html(setup.name)}</strong> as the display name. Try your preferred handle and upload <strong>avatar.png</strong>. Complete channel creation.</li>
      <li>Open <strong>YouTube Studio → Customization → Profile</strong>. Upload <strong>banner.png</strong>, review the crop, and add the description and profile links above. Publish the profile changes.</li>
      <li>Copy the address from your new channel page. Keep that confirmed address for the later website connection.</li>
    </ol>
    <div class="note"><strong>That is enough for this stage.</strong><p>A trailer, playlists, and the first video can wait until you have content. The artwork uses your website address, so it works with whichever handle you choose.</p></div>
    <p class="muted">Official instructions: <a href="${html(setup.sources.create)}">Create a channel</a> · <a href="${html(setup.sources.profile)}">Edit the profile</a> · <a href="${html(setup.sources.branding)}">Artwork requirements</a> · <a href="${html(setup.sources.handles)}">Handles</a></p>
  </section>

  <section class="extras" aria-labelledby="extras-heading">
    <div class="step-heading"><span class="step-number">Later</span><h2 id="extras-heading">Keep these for your videos &amp; playlists.</h2></div>
    <details open><summary>Video title cards, colophon end-screen &amp; 6 thumbnail templates</summary><p class="muted">Design templates spanning Book One (Consciousness: A Digital Organism), Epistemic Discipline, and The American Millennial Manifesto. These do not represent existing videos.</p><div class="templates">${thumbnails}</div><div class="asset-grid"><figure class="title-card"><img src="splash.png" width="1920" height="1080" alt="Digital Organism Theory still opening title card" loading="lazy"><figcaption>1920 × 1080 opening title card &amp; video poster. <a href="splash.png" download>PNG</a> · <a href="splash.svg" download>Editable SVG</a></figcaption></figure><figure class="title-card"><img src="end-card.png" width="1920" height="1080" alt="Digital Organism Theory and AMM closing colophon card" loading="lazy"><figcaption>1920 × 1080 closing colophon end-card (Book One + AMM + Claim levels). <a href="end-card.png" download>PNG</a> · <a href="end-card.svg" download>Editable SVG</a></figcaption></figure></div></details>
    ${playlists ? `<details style="margin-top:18px"><summary>Proposed 3-playlist architecture (DOT · AMM · Epistemic Method)</summary><p class="muted">One unified channel organized into three finite playlists connecting inward inquiry (Book One) with public life (AMM) and epistemic method.</p><div class="templates">${playlists}</div></details>` : ""}
  </section>

  <footer>
    <p class="muted">Local setup kit. No channel has been created by this package.</p>
    <p class="muted"><a href="START-HERE.txt" download>Setup guide</a> · <a href="channel-setup.json" download>Structured setup record</a> · <a href="FONT-LICENSES.txt">Font licenses</a></p>
    <details><summary>Rebuild the kit</summary><p>From the repository root, with FFmpeg installed:</p><code>pnpm --dir frontend exec node scripts/render-channel-kit.mjs --video</code><p class="muted">Set DOT_FFMPEG to the FFmpeg executable path if it is outside PATH. The renderer uses the shared identity, released book metadata, author record, local fonts, and Chromium. Video export samples every frame and decodes the delivered MP4 to verify its duration, dimensions, frame count, and codec. The setup page embeds the video and artwork for local use. SVG files remain editable; some editors need the named fonts installed.</p><p class="muted">Serves manifesto laws L1, L2, L7, L9, and L10; violates none. This is an off-site asset kit.</p></details>
  </footer>
</main>
<script>
  document.querySelectorAll("button[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const field = document.getElementById(button.dataset.copy);
      const status = document.getElementById("copy-status");
      try {
        await navigator.clipboard.writeText(field.value);
        status.textContent = "Copied. Paste into YouTube Studio when ready.";
      } catch {
        field.focus();
        field.select();
        status.textContent = "Text selected. Use your device’s Copy command.";
      }
    });
  });
</script>
</body>
</html>
`;
  // Data URLs make the preview and native downloads work when opened directly
  // from the extracted kit, without a web server or file:// fetch permissions.
  return page.replace(/\b(href|src|poster)="([^"]+)"(?: download)?/g, (attribute, kind, file) => {
    if (!files[file]) return attribute;
    return `${kind}="${html(files[file])}"${kind === "href" ? ` download="${html(file)}"` : ""}`;
  });
}
