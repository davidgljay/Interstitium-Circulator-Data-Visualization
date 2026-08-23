# Design brief: Circulating to address political violence

## What this is
An interactive data visualization summarizing 31 interviews conducted as part of a "circulator" project on preventing political violence (PV). Interviewees are tagged by focus area (e.g. Local Resilience, Research, Strategy), and the visualization should let someone explore the interview set both by focus area and by theme.

## Source data
Structured data already exists as JSON, grouped by tag. Each tag entry includes:
- `count` — number of people interviewed under that tag
- `next_steps_percent` - percentage of people for whom the “next steps” column has a clear action.
- `participants` — list of names and titles/organizations
- `key_points` — list of `{name, detail}` — notable things each person said
- `struggles` — list of `{name, detail}` — challenges each person raised
- `support_offered` — list of `{name, detail}` — support/resources each person offers
- `summaries` — one short synthesis sentence per topic (`key_points`, `struggles`, `support_offered`) specific to that tag

There's also an `overall` object with one synthesis sentence per topic across all 31 interviews, and a `total_interviews` count.

Nine tags total: Ecosystem Building, Government, International, Local Resilience, Narrative, Philanthropists, Research, Strategy, Training. Interview counts per tag range from 5 to 13. People can appear under multiple tags.

*(Attach the `viz_data.json` file when starting the Claude Design session so the data is available to build from.)*

## Layout and views

### 1. Home view
- Title: "Circulating to address political violence"
- One small stat tile up top: total interviews (31)
- An “Insights" box on the left with a pie chart “% of participants who found circulator conversations supportive of their work”. This pulls from the number for whome the “support” column is filled in, we should follow up and ask them this directly for more direct reporting.
- A cluster of bubbles, one per tag, sized proportionally to that tag's interview count (sqrt scale, not linear — smallest tag should still read clearly, largest shouldn't dominate the whole screen). Each bubble shows the tag name and its interview count.
- Below the bubbles, a caption noting that bubble size = number of people interviewed.
- Bubbles should dynamically attract to one another (with a skill like D3’s gravity) and stay a certain distance apart, moving slightly. A user should be able to click and drag a bubble and have it move with momentum. When clicked, bubbles should wobble slightly.
- Below that, three clickable summary cards laid out side by side: Key points, Struggles, Support offered — each showing the `overall` synthesis sentence for that topic.

### 2. Tag detail view (click a bubble)
- Back link to return to the home view
- Tag name and interview count shown at top
- Taking roughly half the page, a chord diagram which shows how much interviewees who identify with this tag also identify with other tags. See https://observablehq.com/@d3/chord-diagram/2
  - Clicking this chord diagram should show overlaps with other tags but should not switch the tag being displayed.
- Three columns: Key points, Struggles, Support offered
  - Columns are presented as boxes overlaying a blurred-out version of the bubble diagram.
  - Each column starts with that tag's short synthesis summary
  - Below this, a compressed and expandable list of people interviewed by position and organization (not named). This should list a few, then have a “view all” button
  - Below the summary, a list of individual entries in quotes. Entries should not be attributed and should each be contained in their own small bow.

### 3. Topic breakdown view (click one of the three home-page summary cards)
- Back link to return to the home view
- Topic name at top, with the overall cross-interview summary sentence for that topic
- A grid of cards, one per tag, colored with the same scheme as the bubbles, each showing:
  - Tag name + interview count
  - That tag's synthesis summary for this specific topic
  - A “view all” link which shrinks other tag windows into a row on the side and lists relevant quotes for that topic. 
  - Clicking anywhere outside outside of a tag should bring back the default tag view.
  - As with the other view, this should appear overlayed on top of a blurred out version of the bubble diagram.

## Visual style

Brand reference: [the-interstitium.com](https://www.the-interstitium.com) — this project's parent site (Interstitia). Pull fonts and color palette from there rather than inventing a new system. Values below were read directly from the live site's computed styles.

**Fonts**
- Headings / display: `Archivo Black` — bold, blocky sans, used at large sizes (e.g. 70px hero heading) at font-weight 500, no letter-spacing tricks, sentence case (not all-caps on the live site)
- Body / UI text: `proxima-nova` — clean, humanist sans for paragraphs, nav, and buttons
- Fallbacks seen in the stylesheet: `Verdana, sans-serif` and `"Times New Roman", Times, serif` (serif appears rarely, likely a single legacy block — safe to ignore)
- If `Archivo Black` and `proxima-nova` aren't available as web fonts in Claude Design, use the closest free equivalents: `Archivo Black` (Google Fonts, same name, free) for headings, and `Inter` or `Montserrat` for body as a proxima-nova stand-in

**Colors** (as observed on the live site)
- White `#FFFFFF` — dominant page background
- Light gray `#EFEFEF` — secondary section background
- Navy `#171D3A` — primary body text color, and used as a dark section background
- Teal-green `#0AB28A` — hero section background / primary accent
- Purple `#492C8C` — button background, secondary accent
- Blue `#3B94FF` — tertiary accent
- Magenta `#C508EB` — rare accent, used sparingly (illustration/highlight only)
- White text `#FFFFFF` is used on all the saturated color backgrounds (navy, teal, purple, blue)

Use this palette instead of a green/blue-only restriction: treat navy, teal-green, purple, and blue as the four primary hues for the nine tag bubbles (roughly 2 tags per hue, varying tint/shade), reserve magenta as a rare highlight (e.g. a single standout stat or the "view all" affordance) rather than a tag color, and keep white and light gray as the page and card backgrounds for the light-mode look already specified below.

**Other style notes**
- Flat design — no gradients, drop shadows, or glow effects (matches the flat, poster-like feel of the source site)
- Background should be light ("light mode")
- Clean, minimal, editorial feel — generous whitespace, sentence case throughout, no all-caps
- Bubbles and tag labels should use rounded/pill shapes; cards use standard rounded corners (~12px)
- Designs should be prepared for desktop and mobile

## Interaction notes
- Clicking a bubble or a summary card should feel like "drilling in" — some kind of transition or at least a clear back-navigation affordance is expected
- All interactions should be single-page (no reloads) — home, tag detail, and topic breakdown are three states of the same view

## Technical Notes
- All language should be in a single yaml-file, so that it can be easily edited if AI-generated text fails to capture the interviews sufficiently.
- The visualization can have a build process to generate a single HTML file. Eventually it will be served as a static file on Github Pages, ideally with a build process on upload.

## Reference
This is a second pass at a design first sketched by hand (bubble layout with tag names, a three-column breakdown per bubble, and topic-level summary cards at the bottom of the home view) and already built once as a working HTML prototype. This brief describes the same structure and data for a fresh design pass in Claude Design.