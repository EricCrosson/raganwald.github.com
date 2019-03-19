---
title: Reginald Braithwaite
layout: default
tags: [allonge, recursion]
years: ["2019", "2018", "2017", "2016", "2015", "2014"]
older: ["2013", "2012", "2011", "2010", "2009", "2008"]
---

*This is a repository of essays and presentations by [Reginald "Raganwald" Braithwaite](http://braythwayt.com)*

<iframe src="https://player.vimeo.com/video/153097877" width="600" height="337" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

<p><a href="https://vimeo.com/153097877">JavaScript Combinators, the &ldquo;six&rdquo; edition</a> from <a href="https://vimeo.com/ndcconferences">NDC Conferences</a> on <a href="https://vimeo.com">Vimeo</a>.</p>

* about: [Reginald "raganwald" Braithwaite](http://braythwayt.com)
* contact: <a href="mailto:reg@braythwayt.com">reg@braythwayt.com</a>
* code: <a href="https://github.com/raganwald">https://github.com/raganwald</a>
* books: <a href="https://leanpub.com/u/raganwald/">https://leanpub.com/u/raganwald/</a>
* talks: <a href="http://braythwayt.com/talks.html">http://braythwayt.com/talks.html</a>

<p><span class="fas fa-igloo"></span> I'm working on a new book, <a href="https://leanpub.com/recursion"><strong>Functions all the way down</strong></a>, a recreational exploration of recursion <i>...in JavaScript</i>. <a href="https://leanpub.com/recursion">Sign up here</a> to be notified when it's available to read online for free.</p>

---

{% for sectionyear in page.years %}

### {{ sectionyear }}

<div class="related">
  <ul>
    {% for post in site.posts %}
      {% capture postyear %}{{post.date | date: '%Y'}}{% endcapture %}
      {% unless post.tags contains "noindex" or postyear != sectionyear %}
        <li>
          <a href="{{ post.url }}">{{ post.title }}</a>
        </li>
      {% endunless %}
    {% endfor %}
  </ul>
</div>

{% endfor %}

### selected older essays

<div class="related">
  <ul>
  <ul>
    {% for oldyear in page.older %}
      {% for post in site.posts %}
        {% capture postyear %}{{post.date | date: '%Y'}}{% endcapture %}
        {% unless post.tags contains "noindex" or postyear != oldyear %}
          <li>
            <a href="{{ post.url }}">{{ post.title }}</a> (<span>{{ post.date | date: "%Y" }}</span>)
          </li>
        {% endunless %}
      {% endfor %}
    {% endfor %}
  </ul>
  </ul>
</div>

---

This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike 4.0 International License</a>.

<a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="http://i.creativecommons.org/l/by-sa/4.0/80x15.png" /></a>
