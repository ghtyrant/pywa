#!/usr/bin/env python2.7

from flask import Flask, request, session, g, redirect, url_for, abort, render_template, flash, send_file
from contextlib import closing
import simplejson as json
import sqlite3
import os
import time
import eyed3

# configuration
DATABASE = 'database.db'
DEBUG = True
SECRET_KEY = "12345"
USERNAME = "admin"
PASSWORD = "default"
MUSIC_DIR = u"/srv/http/music"
APP_NAME = u"pywa"

app = Flask(__name__)
app.config.from_object(__name__)

def connect_db():
  return sqlite3.connect(app.config['DATABASE'])

@app.before_request
def before_request():
  g.db = connect_db()

@app.teardown_request
def teardown_request(exception):
  g.db.close()

def init_db():
  with closing(connect_db()) as db:
    with app.open_resource("schema.sql") as f:
      db.cursor().executescript(f.read())
    db.commit()

def update_library():
  lib = []
  print(os.listdir(app.config['MUSIC_DIR']))
  for (path, dirs, files) in os.walk(app.config['MUSIC_DIR']):
    for f in files:
      if f.endswith(".mp3"):
        abs_path = os.path.join(path, f)
        print("Abs: " + abs_path) 
        rel_path = abs_path[len(app.config['MUSIC_DIR'])+1:]
        db_song = g.db.execute(u"select id, last_update from song where path=?", [rel_path]).fetchone()

        if not db_song:
          print(abs_path)
          print("New song: " + rel_path)
          data = eyed3.load(abs_path)
          lib.append({'id':-1, 'artist':data.tag.artist, 'title':data.tag.title, 'album': data.tag.album, 'filename':rel_path})
        else:
          if db_song[1] < os.path.getmtime(abs_path):
            print("Update song: " + rel_path)
            data = eyed3.load(abs_path)
            lib.append({'id': db_song[0], 'artist':data.tag.artist, 'title':data.tag.title, 'album': data.tag.album, 'filename':rel_path})

  count_new = 0
  count_update = 0
  for song in lib:
    db_artist = g.db.execute(u"select id from artist where name=?", [song['artist']]).fetchone()
    artist_id = -1
    
    if db_artist:
      artist_id = db_artist[0]
    else:
      cur = g.db.execute(u"insert into artist (name) values (?)", [song['artist']])
      artist_id = cur.lastrowid

    db_album = g.db.execute(u"select id from album where name=?", [song['album']]).fetchone()
    album_id = -1
    
    if db_album:
      album_id = db_album[0]
    else:
      cur = g.db.execute(u"insert into album (artist_id, name) values (?, ?)", [artist_id, song['album']])
      album_id = cur.lastrowid

    if song['id'] == -1:
      g.db.execute(u"insert into song (name, artist_id, album_id, path, last_update) values (?, ?, ?, ?, ?)", [song['title'], artist_id, album_id, song['filename'], time.time()])
      count_new += 1
    else:
      g.db.execute(u"update song set name=?, artist_id=?, album_id=?, path=?, last_update=? where id=?", [song['title'], artist_id, album_id, song['filename'], time.time(), song['id']])
      count_update += 1
  
  g.db.commit()

  return (count_new, count_update)

@app.route("/", methods=["GET", "POST"])
def index():
  if not "logged_in" in session or session["logged_in"] == False:
    error = None
    if request.method == "POST":
      if request.form['username'] != app.config['USERNAME']:
        error = "Invalid username!"
      elif request.form['password'] != app.config['PASSWORD']:
        error = "Invalid password!"
      else:
        session['logged_in'] = True
        return redirect(url_for('index'))
     
      if error:
        flash(error, "error")

    return render_template("login.html")
  else:
    return render_template("index.html")

@app.route("/logout")
def logout():
  session.pop("logged_in", None)
  flash("You were logged out!")
  return redirect(url_for("index"))

@app.route("/current-playlist")
def current_playlist():
  return ""

@app.route("/get-url")
def get_url():
  song_id = request.args.get('song_id', '0')
  cur = g.db.execute(u"select path from song where id=?", [song_id])
  data = cur.fetchone()
  return json.dumps({'url': app.config['MUSIC_ADDRESS'] + data[0]})

@app.route("/listen/<int:song_id>")
def listen(song_id):
  cur = g.db.execute(u"select path from song where id=?", [song_id])
  data = cur.fetchone()

  return send_file(os.path.join(app.config['MUSIC_DIR'], data[0]))

@app.route("/get-artists")
def get_artists():
  cur = g.db.execute(u"select id,name from artist")
  return json.dumps([dict(id=row[0], name=row[1]) for row in cur.fetchall()])

@app.route("/get-albums")
def get_albums():
  artist_id = request.args.get('artist_id', '0')
  cur = g.db.execute(u"select id, name from album where artist_id=?", [artist_id])
  return json.dumps([dict(id=row[0], name=row[1]) for row in cur.fetchall()])

@app.route("/get-playlists")
def get_playlists():
  cur = g.db.execute(u"select id,name from playlist")
  return json.dumps([dict(id=row[0], name=row[1]) for row in cur.fetchall()])

@app.route("/delete-playlist")
def delete_playlist():
  id = request.args.get('playlist_id')
  print(id)

  g.db.execute(u"delete from playlist_songs where playlist_id=?", [id]);
  g.db.execute(u"delete from playlist where id=?", [id]);
  g.db.commit()

  return json.dumps({'error': 'success'})

@app.route("/save-playlist", methods=["POST"])
def save_playlist():
  name = request.form.get('name', '')
  songs = request.form.getlist('songs[]')
  overwrite = request.form.get('overwrite', False)

  if overwrite == "false":
    overwrite = False

  cur = g.db.execute(u"select id,name from playlist where name=?", [name])
  res = cur.fetchone()
  playlist_id = -1
  if res:
    playlist_id = res[0]
    if not overwrite:
      return json.dumps({'error': 'already-exists'})

  if not res:
    cur = g.db.execute(u"insert into playlist (name) values (?)", [name])
    playlist_id = cur.lastrowid
  else:
    g.db.execute(u"delete from playlist_songs where playlist_id=?", [playlist_id])

  for song in songs:
    g.db.execute(u"insert into playlist_songs (playlist_id, song_id) values (?, ?)", [playlist_id, song])
  
  g.db.commit()

  return json.dumps({'error': 'success'})

@app.route("/get-songs")
def get_songs():
  album_id = request.args.get('album_id')
  artist_id = request.args.get('artist_id')
  playlist_id = request.args.get('playlist_id')

  if album_id:
    cur = g.db.execute(u"select s.id, s.name, a.name as artist, s.path from song as s inner join artist as a on a.id=s.artist_id where s.album_id=?", [album_id])
  elif artist_id:
    cur = g.db.execute(u"select s.id, s.name, a.name as artist, s.path from song as s inner join artist as a on a.id=s.artist_id where s.artist_id=?", [artist_id])
  elif playlist_id:
    cur = g.db.execute(u"select s.id, s.name, a.name as artist, s.path from playlist as p inner join playlist_songs as ps on p.id=ps.playlist_id inner join song as s on s.id=ps.song_id inner join artist as a on a.id=s.artist_id where p.id=?", [playlist_id])
  else:
    return json.dumps({"error": "no id specified"});

  return json.dumps([dict(id=row[0], name=row[1], artist=row[2], path=row[3]) for row in cur.fetchall()])

@app.route("/get-song")
def get_song():
  song_id = request.args.get('song_id')

  cur = g.db.execute(u"select s.id, s.name, a.name as artist, s.path from song as s inner join artist as a on a.id=s.artist_id where s.id=?", [song_id])
  row = cur.fetchone()
  
  if row:
    return json.dumps({'id': row[0], 'name': row[1], 'artist': row[2], 'path': row[3]})

@app.route("/update-library")
def update_lib():
  (new, updated) = update_library()
  return json.dumps({'new': new, 'updated': updated})

if __name__ == "__main__":
  app.run()
