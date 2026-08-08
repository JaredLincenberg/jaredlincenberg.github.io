---
layout: default
title: Home
permalink: /
eyebrow: "~/"
---

<section class="hero">
  <div class="disclaimer">This site is under construction — content, design, and layout may all change as I build it out.</div>
  <h1 class="hero-title">{{ site.title }}</h1>
  <p class="hero-sub">Interested in nature and programming.</p>
  <div class="hero-actions">
    <a href="{{ '/work/' | relative_url }}" class="btn btn-primary">See my work</a>
    <a href="{{ '/writing/' | relative_url }}" class="btn btn-secondary">Read the journal</a>
  </div>
</section>

{% assign notes = site.field_notes | sort: 'date' | reverse %}
<div class="bento">
  <a href="{% if notes.size > 0 %}{{ notes.first.url | relative_url }}{% else %}{{ '/field-notes/' | relative_url }}{% endif %}" class="bento-tile">
    <div class="bento-label bento-label-green">LATEST FIELD NOTE</div>
    <div class="bento-title">{% if notes.size > 0 %}{{ notes.first.title }}{% else %}No field notes yet{% endif %}</div>
  </a>
  <a href="https://jaredlincenberg.github.io/iNaturalist-Biodiversity/" class="bento-tile">
    <div class="bento-label bento-label-blue">FEATURED PROJECT</div>
    <div class="bento-title">iNaturalist Biodiversity</div>
  </a>
  <a href="{{ '/writing/' | relative_url }}" class="bento-tile">
    <div class="bento-label bento-label-blue">LATEST WRITING</div>
    <div class="bento-title">{% if site.posts.size > 0 %}{{ site.posts.first.title }}{% else %}No posts yet{% endif %}</div>
  </a>
</div>
