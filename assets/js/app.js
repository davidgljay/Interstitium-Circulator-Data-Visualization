(function () {
  "use strict";

  var DATA = window.__DATA__;
  var COPY = window.__COPY__;
  var TAGS = Object.keys(DATA.tags);

  var TAG_COLORS = {
    "Philanthropists": "#927BC2",
    "Local Resilience": "#26BB97",
    "Ecosystem Building": "#563B94",
    "Training": "#6AD0B4",
    "Research": "#2A304A",
    "Strategy": "#499CFF",
    "Narrative": "#5C6481",
    "International": "#6F789D",
    "Government": "#99C5FF"
  };

  function tagColor(tagName) {
    return TAG_COLORS[tagName] || "#171D3A";
  }

  function tagCount(tagName) {
    return DATA.tags[tagName].count;
  }

  function esc(str) {
    var d = document.createElement("div");
    d.textContent = str == null ? "" : String(str);
    return d.innerHTML;
  }

  // sentence-case a tag name for small in-graphic labels (e.g. "Local resilience")
  function tagLabel(tagName) {
    return tagName.charAt(0) + tagName.slice(1).toLowerCase();
  }

  // ---------- derived data ----------

  function allParticipantNames() {
    var set = new Set();
    TAGS.forEach(function (t) {
      DATA.tags[t].participants.forEach(function (p) { set.add(p.name); });
    });
    return set;
  }

  function computeNextStepsPercent() {
    var weightedSum = 0, totalCount = 0, min = Infinity, max = -Infinity;
    TAGS.forEach(function (t) {
      var tag = DATA.tags[t];
      weightedSum += tag.count * tag.next_steps_percent;
      totalCount += tag.count;
      min = Math.min(min, tag.next_steps_percent);
      max = Math.max(max, tag.next_steps_percent);
    });
    return {
      pct: Math.round(weightedSum / totalCount),
      min: min,
      max: max
    };
  }

  var OVERLAP_MATRIX = (function () {
    var tagSets = TAGS.map(function (t) {
      return new Set(DATA.tags[t].participants.map(function (p) { return p.name; }));
    });
    var n = TAGS.length;
    var matrix = [];
    for (var i = 0; i < n; i++) {
      matrix.push([]);
      for (var j = 0; j < n; j++) {
        if (i === j) { matrix[i].push(0); continue; }
        var shared = 0;
        tagSets[i].forEach(function (name) { if (tagSets[j].has(name)) shared++; });
        matrix[i].push(shared);
      }
    }
    return matrix;
  })();

  function overlapForTag(tagName) {
    var idx = TAGS.indexOf(tagName);
    return TAGS.map(function (t, j) {
      return { tag: t, shared: OVERLAP_MATRIX[idx][j] };
    }).filter(function (d) { return d.tag !== tagName; })
      .sort(function (a, b) { return b.shared - a.shared; });
  }

  // ---------- state / router ----------

  var state = {
    view: "home",
    tag: null,
    topic: null,
    expandedTag: null,
    chordFocus: null,
    mobileTab: "key_points"
  };

  function goHome(push) {
    state.view = "home"; state.tag = null; state.topic = null;
    if (push !== false) history.pushState({ view: "home" }, "", "#/");
    render();
  }
  function goTag(tagName, push) {
    state.view = "tag"; state.tag = tagName; state.chordFocus = null; state.mobileTab = "key_points";
    if (push !== false) history.pushState({ view: "tag", tag: tagName }, "", "#/tag/" + encodeURIComponent(tagName));
    render();
  }
  function goTopic(topicKey, push) {
    state.view = "topic"; state.topic = topicKey; state.expandedTag = null;
    if (push !== false) history.pushState({ view: "topic", topic: topicKey }, "", "#/topic/" + topicKey);
    render();
  }

  window.addEventListener("popstate", function (e) {
    var s = e.state || { view: "home" };
    if (s.view === "tag") { state.view = "tag"; state.tag = s.tag; }
    else if (s.view === "topic") { state.view = "topic"; state.topic = s.topic; state.expandedTag = null; }
    else { state.view = "home"; }
    render();
  });

  // ---------- render dispatch ----------

  var app = document.getElementById("app");

  function render() {
    var el = document.createElement("div");
    el.className = "view";
    app.innerHTML = "";
    app.appendChild(el);

    if (state.view === "tag") renderTagDetail(el);
    else if (state.view === "topic") renderTopicBreakdown(el);
    else renderHome(el);

    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  // ================= HOME =================

  function renderHome(root) {
    var nextSteps = computeNextStepsPercent();

    root.innerHTML =
      '<header class="home-header">' +
        "<h1>" + esc(COPY.site.title) + "</h1>" +
        '<p class="standfirst">' + esc(COPY.site.standfirst) + "</p>" +
      "</header>" +
      '<div class="stat-tile">' +
        '<div class="stat-number">' + DATA.total_interviews + "</div>" +
        '<div class="stat-label">' + esc(COPY.home.stat_label) + "</div>" +
      "</div>" +
      '<div class="insight-focus-row">' +
        '<div class="insights-card">' +
          '<div class="insights-ring-wrap" id="insights-ring"><span class="insights-ring-pct">' + nextSteps.pct + "%</span></div>" +
          '<div class="insights-text">' +
            '<div class="insights-title">' + esc(COPY.home.insights_title) + "</div>" +
            '<div class="insights-headline">' + esc(COPY.home.insights_headline) + "</div>" +
            '<span class="insights-subtext">' + esc((COPY.home.insights_subtext_prefix + " " + nextSteps.min + "–" + nextSteps.max + "% " + COPY.home.insights_subtext_suffix).trim()) + "</span>" +
          "</div>" +
        "</div>" +
        '<div class="focus-card">' +
          '<div class="focus-title">' + esc(COPY.home.focus_areas.title) + "</div>" +
          "<p>" + esc(COPY.home.focus_areas.body) + "</p>" +
        "</div>" +
      "</div>" +
      '<div class="bubble-field-wrap"><svg id="bubble-field" class="bubble-field"></svg></div>' +
      '<p class="bubble-caption">' + esc(COPY.home.bubble_caption) + "</p>" +
      '<div class="summary-cards">' +
        summaryCard("key_points", "teal") +
        summaryCard("struggles", "purple") +
        summaryCard("support_offered", "blue") +
      "</div>";

    drawInsightsRing(document.getElementById("insights-ring"), nextSteps.pct, 76);
    drawBubbleField(document.getElementById("bubble-field"), true);

    Array.prototype.forEach.call(root.querySelectorAll(".summary-card"), function (card) {
      card.addEventListener("click", function () { goTopic(card.dataset.topic); });
    });
  }

  function summaryCard(topicKey, accent) {
    var c = COPY.home.cards[topicKey];
    return (
      '<button class="summary-card" data-topic="' + topicKey + '">' +
        '<span class="card-accent" style="background:var(--' + accent + ')"></span>' +
        "<h3>" + esc(c.title) + "</h3>" +
        "<p>" + esc(DATA.overall[topicKey]) + "</p>" +
      "</button>"
    );
  }

  // ---------- insights donut ring ----------

  function drawInsightsRing(container, pct, size) {
    var svg = d3.select(container).append("svg").attr("width", size).attr("height", size);
    var r = size / 2;
    var stroke = size * 0.14;
    var radius = r - stroke / 2;
    var circumference = 2 * Math.PI * radius;
    var g = svg.append("g").attr("transform", "translate(" + r + "," + r + ") rotate(-90)");

    g.append("circle")
      .attr("r", radius)
      .attr("fill", "none")
      .attr("stroke", "#EFEFEF")
      .attr("stroke-width", stroke);

    g.append("circle")
      .attr("r", radius)
      .attr("fill", "none")
      .attr("stroke", "#C508EB")
      .attr("stroke-width", stroke)
      .attr("stroke-linecap", "round")
      .attr("stroke-dasharray", circumference)
      .attr("stroke-dashoffset", circumference * (1 - pct / 100));
  }

  // ---------- bubble field (D3 force sim) ----------

  var bubbleSimCache = null;

  function drawBubbleField(svgEl, interactive) {
    var width = svgEl.parentElement.clientWidth || 800;
    var height = Math.max(320, Math.min(460, width * 0.42));
    var svg = d3.select(svgEl).attr("viewBox", "0 0 " + width + " " + height)
      .attr("width", "100%").attr("height", height);

    var rScale = d3.scaleSqrt()
      .domain(d3.extent(TAGS, tagCount))
      .range([38, Math.min(88, height / 4.4)]);

    var nodes = TAGS.map(function (t) {
      return {
        id: t,
        count: tagCount(t),
        r: rScale(tagCount(t)),
        color: tagColor(t),
        x: width / 2 + (Math.random() - 0.5) * width * 0.6,
        y: height / 2 + (Math.random() - 0.5) * height * 0.6
      };
    });

    var simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(6))
      .force("collide", d3.forceCollide().radius(function (d) { return d.r + 6; }).iterations(3))
      .force("x", d3.forceX(width / 2).strength(0.03))
      .force("y", d3.forceY(height / 2).strength(0.03))
      .alphaDecay(0)
      .velocityDecay(0.35);

    var node = svg.selectAll("g.bubble").data(nodes).enter().append("g")
      .attr("class", "bubble")
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", function (d) { return d.id + ", " + d.count + " interviews"; });

    node.append("circle")
      .attr("class", "bubble-circle")
      .attr("r", function (d) { return d.r; })
      .attr("fill", function (d) { return d.color; })
      .style("transform-box", "fill-box")
      .style("transform-origin", "center");

    node.append("text")
      .attr("class", "bubble-label")
      .attr("y", -2)
      .attr("font-size", function (d) { return Math.max(10, Math.min(14, d.r / 3.4)) + "px"; })
      .text(function (d) { return tagLabel(d.id); })
      .call(wrapBubbleLabel);

    node.append("text")
      .attr("class", "bubble-count")
      .attr("y", function (d) { return d.r * 0.42; })
      .attr("font-size", function (d) { return Math.max(12, Math.min(20, d.r / 2.6)) + "px"; })
      .text(function (d) { return d.count; });

    function ticked() {
      nodes.forEach(function (d) {
        d.x = Math.max(d.r, Math.min(width - d.r, d.x));
        d.y = Math.max(d.r, Math.min(height - d.r, d.y));
      });
      node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
    }
    simulation.on("tick", ticked);
    simulation.alphaTarget(0.04).restart();

    if (interactive) {
      var drag = d3.drag()
        .clickDistance(6)
        .on("start", function (event, d) {
          simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
          d._history = [{ x: event.x, y: event.y, t: Date.now() }];
        })
        .on("drag", function (event, d) {
          d.fx = event.x; d.fy = event.y;
          d._history.push({ x: event.x, y: event.y, t: Date.now() });
          if (d._history.length > 5) d._history.shift();
        })
        .on("end", function (event, d) {
          simulation.alphaTarget(0.04);
          d.fx = null; d.fy = null;
          var h = d._history || [];
          if (h.length >= 2) {
            var a = h[0], b = h[h.length - 1];
            var dt = Math.max(1, b.t - a.t);
            d.vx = (b.x - a.x) / dt * 16;
            d.vy = (b.y - a.y) / dt * 16;
          }
        });
      node.call(drag);

      node.on("click", function (event, d) {
        var g = d3.select(this);
        g.classed("wobble", true);
        setTimeout(function () { g.classed("wobble", false); }, 420);
        setTimeout(function () { goTag(d.id); }, 180);
      });
      node.on("keydown", function (event, d) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          var g = d3.select(this);
          g.classed("wobble", true);
          setTimeout(function () { g.classed("wobble", false); }, 420);
          setTimeout(function () { goTag(d.id); }, 180);
        }
      });
    }

    bubbleSimCache = simulation;
    return { nodes: nodes, width: width, height: height };
  }

  function wrapBubbleLabel(textSel) {
    textSel.each(function (d) {
      var words = tagLabel(d.id).split(" ");
      var el = d3.select(this);
      if (words.length === 1 || d.r < 44) return;
      el.text(null);
      var mid = Math.ceil(words.length / 2);
      var line1 = words.slice(0, mid).join(" ");
      var line2 = words.slice(mid).join(" ");
      el.append("tspan").attr("x", 0).attr("dy", "-0.15em").text(line1);
      el.append("tspan").attr("x", 0).attr("dy", "1.05em").text(line2);
    });
  }

  // static (non-interactive, settled) bubble field used as blurred backdrop
  function drawStaticBubbleField(svgEl) {
    var res = drawBubbleField(svgEl, false);
    if (bubbleSimCache) {
      for (var i = 0; i < 120; i++) bubbleSimCache.tick();
      bubbleSimCache.stop();
      d3.select(svgEl).selectAll("g.bubble").attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    }
  }

  // ================= TAG DETAIL =================

  function renderTagDetail(root) {
    var tagName = state.tag;
    var tag = DATA.tags[tagName];
    var t = COPY.tag_detail;

    root.innerHTML =
      '<button class="back-link" id="back-home">' + esc(COPY.nav.back_arrow) + " " + esc(t.back_label) + "</button>" +
      '<header class="tag-detail-header">' +
        "<h1>" + esc(tagName) + "</h1>" +
        '<span class="pill pill--ghost">' + tag.count + " " + esc(t.interviews_suffix) + "</span>" +
      "</header>" +
      '<section class="overlap-section">' +
        '<div class="overlap-title">' + esc(t.overlap_title) + "</div>" +
        '<div class="overlap-subtitle">' + esc(t.overlap_subtitle) + "</div>" +
        '<div class="chord-wrap"><svg id="chord-diagram"></svg></div>' +
        '<div class="overlap-caption">' + esc(t.overlap_caption) + "</div>" +
      "</section>" +
      '<div class="blurred-field-bg">' +
        '<svg id="bg-bubbles"></svg>' +
        '<div class="columns-overlay">' +
          '<div class="tabs-row">' +
            tabBtn("key_points", t.columns.key_points) +
            tabBtn("struggles", t.columns.struggles) +
            tabBtn("support_offered", t.columns.support_offered) +
          "</div>" +
          '<div class="columns-row" id="columns-row">' +
            detailColumn(tagName, "key_points", t) +
            detailColumn(tagName, "struggles", t) +
            detailColumn(tagName, "support_offered", t) +
          "</div>" +
          '<div class="mobile-column" id="mobile-column"></div>' +
        "</div>" +
      "</div>";

    document.getElementById("back-home").addEventListener("click", function () { goHome(); });
    drawStaticBubbleField(document.getElementById("bg-bubbles"));
    drawChordDiagram(document.getElementById("chord-diagram"), tagName);
    renderMobileColumn();

    Array.prototype.forEach.call(root.querySelectorAll(".tab-btn"), function (btn) {
      btn.addEventListener("click", function () {
        state.mobileTab = btn.dataset.topic;
        Array.prototype.forEach.call(root.querySelectorAll(".tab-btn"), function (b) {
          b.classList.toggle("active", b.dataset.topic === state.mobileTab);
        });
        renderMobileColumn();
      });
    });

    bindViewAllButtons(root, tagName);
  }

  function tabBtn(topicKey, label) {
    var active = state.mobileTab === topicKey ? " active" : "";
    return '<button class="tab-btn' + active + '" data-topic="' + topicKey + '">' + esc(label) + "</button>";
  }

  function renderMobileColumn() {
    var mc = document.getElementById("mobile-column");
    if (!mc) return;
    mc.innerHTML = detailColumn(state.tag, state.mobileTab, COPY.tag_detail);
    bindViewAllButtons(mc, state.tag);
  }

  var WHO_PREVIEW_COUNT = 4;

  function detailColumn(tagName, topicKey, t) {
    var tag = DATA.tags[tagName];
    var entries = tag[topicKey];
    var preview = tag.participants.slice(0, WHO_PREVIEW_COUNT);
    var whoId = "who-" + topicKey;
    return (
      '<div class="detail-column" data-topic="' + topicKey + '">' +
        "<h3>" + esc(t.columns[topicKey]) + "</h3>" +
        '<p class="synthesis">' + esc(tag.summaries[topicKey]) + "</p>" +
        '<div class="who-list" id="' + whoId + '">' +
          '<div class="who-title">' + esc(t.who_we_spoke_to) + "</div>" +
          '<ul>' + preview.map(function (p) { return "<li>" + esc(p.title_org) + "</li>"; }).join("") + "</ul>" +
          (tag.participants.length > WHO_PREVIEW_COUNT
            ? '<button class="pill pill--ghost view-all-who">' + esc(t.view_all) + " " + tag.count + "</button>"
            : "") +
        "</div>" +
        entries.map(function (e) { return '<div class="quote-box">“' + esc(e.detail) + '”</div>'; }).join("") +
      "</div>"
    );
  }

  function bindViewAllButtons(root, tagName) {
    Array.prototype.forEach.call(root.querySelectorAll(".view-all-who"), function (btn) {
      btn.addEventListener("click", function () {
        var wrap = btn.closest(".who-list");
        var ul = wrap.querySelector("ul");
        var tag = DATA.tags[tagName];
        ul.innerHTML = tag.participants.map(function (p) { return "<li>" + esc(p.title_org) + "</li>"; }).join("");
        btn.remove();
      });
    });
  }

  // ---------- chord diagram ----------

  var CHORD_LABEL_ABBR = {
    "Ecosystem Building": "Ecosystem bldg",
    "Government": "Gov't",
    "International": "Int'l",
    "Local Resilience": "Local resil.",
    "Philanthropists": "Philanthr."
  };

  function drawChordDiagram(svgEl, activeTag) {
    var size = Math.min(680, Math.max(380, (svgEl.parentElement.clientWidth || 560)));
    var width = size, height = size;
    var outerR = Math.min(width, height) * 0.24;
    var innerR = outerR - 14;

    var activeIdx = TAGS.indexOf(activeTag);
    var order = [activeIdx].concat(TAGS.map(function (_, i) { return i; }).filter(function (i) { return i !== activeIdx; }));
    var orderedTags = order.map(function (i) { return TAGS[i]; });
    var matrix = order.map(function (i) {
      return order.map(function (j) { return OVERLAP_MATRIX[i][j]; });
    });

    var chord = d3.chord().padAngle(0.05).sortSubgroups(d3.descending)(matrix);
    var arcGen = d3.arc().innerRadius(innerR).outerRadius(innerR + 14);
    var ribbonGen = d3.ribbon().radius(innerR);

    var svg = d3.select(svgEl).attr("width", width).attr("height", height)
      .attr("viewBox", "0 0 " + width + " " + height);
    var g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ") rotate(-90)");

    var focus = 0; // index into `order`/`orderedTags`, defaults to the active tag itself

    var ribbons = g.append("g").attr("fill-opacity", 0.7)
      .selectAll("path").data(chord).enter().append("path")
      .attr("class", "chord-ribbon")
      .attr("d", ribbonGen)
      .attr("fill", function (d) { return tagColor(orderedTags[d.source.index]); })
      .attr("stroke", "none");

    var groups = g.append("g").selectAll("g").data(chord.groups).enter().append("g");

    groups.append("path")
      .attr("class", "chord-tag-arc")
      .attr("d", arcGen)
      .attr("fill", function (d, i) { return i === 0 ? "#171D3A" : "#C9CCDC"; })
      .style("cursor", "pointer");

    // curved labels that wrap along the outside of the ring, following its
    // own arc rather than radiating outward
    var labelR = outerR + 12;
    function arcPoint(r, a) { return [r * Math.sin(a), -r * Math.cos(a)]; }

    groups.append("path")
      .attr("class", "chord-label-path")
      .attr("id", function (d, i) { return "chord-label-path-" + i; })
      .attr("fill", "none")
      .attr("stroke", "none")
      .attr("d", function (d) {
        var flip = ((d.startAngle + d.endAngle) / 2) > Math.PI;
        var p0 = arcPoint(labelR, d.startAngle);
        var p1 = arcPoint(labelR, d.endAngle);
        var largeArc = (d.endAngle - d.startAngle) > Math.PI ? 1 : 0;
        return flip
          ? "M" + p1[0] + "," + p1[1] + "A" + labelR + "," + labelR + " 0 " + largeArc + ",0 " + p0[0] + "," + p0[1]
          : "M" + p0[0] + "," + p0[1] + "A" + labelR + "," + labelR + " 0 " + largeArc + ",1 " + p1[0] + "," + p1[1];
      });

    groups.append("text")
      .attr("class", "chord-tag-label")
      .attr("font-size", "10px")
      .append("textPath")
      .attr("href", function (d, i) { return "#chord-label-path-" + i; })
      .attr("xlink:href", function (d, i) { return "#chord-label-path-" + i; })
      .attr("startOffset", "50%")
      .attr("text-anchor", "middle")
      .text(function (d, i) { return CHORD_LABEL_ABBR[orderedTags[i]] || orderedTags[i]; });

    function applyFocus() {
      ribbons.attr("opacity", function (d) {
        return (d.source.index === focus || d.target.index === focus) ? 0.85 : 0.08;
      });
      groups.select(".chord-tag-arc").attr("fill", function (d, i) {
        return i === focus ? "#171D3A" : "#C9CCDC";
      });
    }
    applyFocus();

    groups.on("click", function (event, d) {
      focus = (focus === d.index) ? 0 : d.index;
      applyFocus();
    });
    groups.on("mouseenter", function (event, d) {
      var prev = focus;
      focus = d.index;
      applyFocus();
      focus = prev;
    });
    groups.on("mouseleave", function () { applyFocus(); });
  }

  // ================= TOPIC BREAKDOWN =================

  function renderTopicBreakdown(root) {
    var topicKey = state.topic;
    var t = COPY.topic_breakdown;
    var titleMap = COPY.tag_detail.columns;

    root.innerHTML =
      '<button class="back-link" id="back-home">' + esc(COPY.nav.back_arrow) + " " + esc(t.back_label) + "</button>" +
      '<header class="topic-header">' +
        "<h1>" + esc(titleMap[topicKey]) + "</h1>" +
        '<p class="synthesis">' + esc(DATA.overall[topicKey]) + "</p>" +
      "</header>" +
      '<div id="topic-layout" class="topic-layout"></div>';

    document.getElementById("back-home").addEventListener("click", function () { goHome(); });
    renderTopicLayout();
  }

  function renderTopicLayout() {
    var layout = document.getElementById("topic-layout");
    if (!layout) return;
    var topicKey = state.topic;
    var t = COPY.topic_breakdown;

    if (!state.expandedTag) {
      layout.className = "topic-layout";
      layout.innerHTML = '<div class="tag-grid">' +
        TAGS.map(function (tagName) { return topicTagCard(tagName, topicKey, t); }).join("") +
        "</div>";
      Array.prototype.forEach.call(layout.querySelectorAll(".view-all-tag"), function (btn) {
        btn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          state.expandedTag = btn.dataset.tag;
          renderTopicLayout();
        });
      });
      return;
    }

    // expanded state: side rail + panel
    layout.className = "topic-layout expanded";
    var otherTags = TAGS.filter(function (tg) { return tg !== state.expandedTag; });
    layout.innerHTML =
      '<div class="side-rail">' +
        '<div class="who-title" style="margin-bottom:4px;">' + esc(t.other_tags_label) + "</div>" +
        otherTags.map(function (tg) {
          return '<button class="rail-item" data-tag="' + esc(tg) + '"><span>' + esc(tg) + '</span><span class="rail-count">' + tagCount(tg) + "</span></button>";
        }).join("") +
      "</div>" +
      '<div class="expanded-panel" id="expanded-panel">' +
        expandedPanelContent(state.expandedTag, topicKey, t) +
      "</div>";

    Array.prototype.forEach.call(layout.querySelectorAll(".rail-item"), function (btn) {
      btn.addEventListener("click", function () {
        state.expandedTag = btn.dataset.tag;
        renderTopicLayout();
      });
    });
    document.getElementById("close-expanded").addEventListener("click", function () {
      state.expandedTag = null;
      renderTopicLayout();
    });
    layout.addEventListener("click", function outsideClick(ev) {
      if (ev.target === layout) {
        state.expandedTag = null;
        renderTopicLayout();
      }
    });
  }

  function topicTagCard(tagName, topicKey, t) {
    var tag = DATA.tags[tagName];
    return (
      '<div class="tag-card" style="background:' + tagColor(tagName) + '">' +
        '<div class="tag-card-head"><h3>' + esc(tagName) + "</h3><span class=\"tag-card-count\">" + tag.count + "</span></div>" +
        "<p>" + esc(tag.summaries[topicKey]) + "</p>" +
        '<button class="pill pill--magenta cta view-all-tag" data-tag="' + esc(tagName) + '" style="background:rgba(255,255,255,0.12); color:#fff; border-color:#fff;">' + esc(t.view_all) + "</button>" +
      "</div>"
    );
  }

  function expandedPanelContent(tagName, topicKey, t) {
    var tag = DATA.tags[tagName];
    var entries = tag[topicKey];
    return (
      '<div class="expanded-head">' +
        "<h3>" + esc(tagName) + " · " + esc(COPY.tag_detail.columns[topicKey]) + "</h3>" +
        '<button class="pill pill--ghost" id="close-expanded">' + esc(t.close_label) + "</button>" +
      "</div>" +
      '<p class="synthesis">' + esc(tag.summaries[topicKey]) + "</p>" +
      '<div class="expanded-quote-grid">' +
        entries.map(function (e) { return '<div class="quote-box">“' + esc(e.detail) + '”</div>'; }).join("") +
      "</div>"
    );
  }

  // ================= init =================

  function initialRouteFromHash() {
    var hash = location.hash.replace(/^#\/?/, "");
    if (hash.indexOf("tag/") === 0) {
      var tagName = decodeURIComponent(hash.slice(4));
      if (DATA.tags[tagName]) { goTag(tagName, false); return; }
    } else if (hash.indexOf("topic/") === 0) {
      var topicKey = hash.slice(6);
      if (DATA.overall[topicKey] !== undefined) { goTopic(topicKey, false); return; }
    }
    goHome(false);
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 200);
  });

  initialRouteFromHash();
})();
