---
layout: default
title: Writing
permalink: /writing/
eyebrow: "~/writing"
---

# Writing

{% if site.posts.size > 0 %}
<ul class="post-list">
  {% for post in site.posts %}
  <li><a href="{{ post.url | relative_url }}">{{ post.title }}</a> <span class="post-date">{{ post.date | date: "%B %Y" }}</span></li>
  {% endfor %}
</ul>
{% else %}
<p class="empty-state">No posts yet — check back soon.</p>
{% endif %}
