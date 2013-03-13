pywa
====
Flask based web audio player. Uses JPlayer, jquery and bootstrap for a responsive frontend and flask with sqlite3 as backend.
The backend will scan and index a provided directory, extracting basic ID3 tags and storing them in a sqlite3 database.
It's in a very early stage and has not been tested with huge libraries.

Screenshots
===========

* http://skyr.at/pywa/main.png - The main playlist, containing a few songs, some of the are queued.
* http://skyr.at/pywa/library.png - The three-pane library view.
* http://skyr.at/pywa/playlists.png - Playlist management. Currently only allows viewing and deleting them.

Features
========
Not too many, at the moment:

* Typical three-pane view of your library (split into Artists, Albums and Songs).
* Adding of single songs, albums or everything of an artist with a double click (also works for playlists).
* Shuffle- and normal playback mode
* Basic playback controls
* Saving & deleting playlists (playlists get saved on the server)
* Manage playback by queueing songs (player will return to random/normal mode after playing the queue)

Requirements
============

* Python (2.7, may work on other versions)
* flask (0.9, +dependencies like jinja2)
* pysqlite (2.6.3)
* simplejson
* eyed3

What sucks
==========
Code is far from being clean. This is my first Flask project and I hardly every use JavaScript, so expect a bit of a mess.
There is no fancy dragging and dropping, nor is there sorting of tables yet. Also, a responsive search function would be cool (including the possibility to use the exact search result and append it to the playlist).
More options when adding stuff would be cool (Append songs, replace playlist, ...).
Some fancy graphics, maybe grab album covers from somewhere, also some caching of AJAX results in JS.
