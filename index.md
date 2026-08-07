---
layout: default
title: Home
permalink: /
---

<section class="hero">
  <h1 class="hero-title">{{ site.title }}</h1>
  <p class="hero-sub">Interested in nature and programming.</p>
  <div class="hero-actions">
    <a href="{{ '/work/' | relative_url }}" class="btn btn-primary">See my work</a>
    <a href="{{ '/writing/' | relative_url }}" class="btn btn-secondary">Read the journal</a>
  </div>
</section>

<div class="bento">
  <a href="https://jaredlincenberg.github.io/iNaturalist-Biodiversity/" class="bento-tile">
    <div class="bento-label bento-label-blue">FEATURED PROJECT</div>
    <div class="bento-title">iNaturalist Biodiversity</div>
  </a>
  <a href="{{ '/writing/' | relative_url }}" class="bento-tile">
    <div class="bento-label bento-label-blue">LATEST WRITING</div>
    <div class="bento-title">{% if site.posts.size > 0 %}{{ site.posts.first.title }}{% else %}No posts yet{% endif %}</div>
  </a>
</div>
