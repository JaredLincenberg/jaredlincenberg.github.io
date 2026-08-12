---
layout: default
title: Photos
permalink: /gallery/
eyebrow: "~/gallery"
wide: true
---

# Photos

A running collection of sightings from walks around Colorado, logged on [iNaturalist](https://www.inaturalist.org/people/jared_lincenberg). For more, follow along on Instagram: <a href="https://www.instagram.com/jay_rock_photos/">@jay_rock_photos</a> and <a href="https://www.instagram.com/jaredlplants/">@jaredlplants</a>.

<h2 class="section-heading">Highlights</h2>
<div class="photo-grid">
{% for entry in site.data.photos %}{% assign filename = entry[0] %}{% assign photo = entry[1] %}{% if photo.highlight %}
  {% include photo-card.html filename=filename photo=photo %}
{% endif %}{% endfor %}
</div>

<h2 class="section-heading">More Photos</h2>
<div class="photo-grid">
{% for entry in site.data.photos %}{% assign filename = entry[0] %}{% assign photo = entry[1] %}{% unless photo.highlight %}
  {% include photo-card.html filename=filename photo=photo %}
{% endunless %}{% endfor %}
</div>

<dialog id="photo-lightbox">
  <div class="lightbox-body">
    <button type="button" class="lightbox-close" aria-label="Close">&times;</button>
    <button type="button" class="lightbox-prev lightbox-nav" aria-label="Previous photo">&larr;</button>
    <button type="button" class="lightbox-next lightbox-nav" aria-label="Next photo">&rarr;</button>
    <div class="lightbox-image-wrap">
      <img id="lightbox-image" src="" alt="">
    </div>
    <div class="lightbox-info">
      <div class="photo-meta">
        <span id="lightbox-location"></span>
        <span id="lightbox-date"></span>
      </div>
      <p class="photo-caption" id="lightbox-caption"></p>
      <a href="#" id="lightbox-observation" class="photo-observation-link" target="_blank" rel="noopener">View on iNaturalist &rarr;</a>
    </div>
  </div>
</dialog>
