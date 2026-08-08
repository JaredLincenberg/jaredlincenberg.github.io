---
layout: default
title: Field Notes
permalink: /field-notes/
eyebrow: "~/field-notes"
---

# Field Notes

{% assign notes = site.field_notes | sort: 'date' | reverse %}
{% if notes.size > 0 %}
<ul class="post-list">
  {% for note in notes %}
  <li><a href="{{ note.url | relative_url }}">{{ note.title }}</a> <span class="post-date">{{ note.date | date: "%B %-d, %Y" }}</span></li>
  {% endfor %}
</ul>
{% else %}
<p class="empty-state">No field notes yet — check back soon.</p>
{% endif %}
