from flask import Flask, request, session, g, redirect, url_for, abort, render_template, flash
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
MUSIC_DIR = "/src/http/music"
MUSIC_ADDRESS = "http://localhost/music/"

app = Flask(__name__)
app.config.from_object(__name__)

"""def connect_db():
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
  for (path, dirs, files) in os.walk(app.config['MUSIC_DIR']):
    for f in files:
      print(f)
      if f.endswith(".mp3"):
        path = os.path.join(path, f)
        
        rel_path = path[len(app.config['MUSIC_DIR'])+1:]
        cur = g.db.execute("select id, last_update from song where filename=?", rel_path)
        print("checking song " + rel_path)
        if cur.rowcount == 0:
          data = eyed3.load(path)
          lib.append({'id':-1, 'artist':data.tag.artist, 'title':data.tag.title, 'filename':rel_path})
          print("New song: " + rel_path)
        elif cur.rowcount == 1:
          row = cur.fetchone()
          if row[1] < os.path.getmtime(path):
            print("Update song: " + rel_path)
            data = eyed3.load(path)
            lib.append({'id': row[0], 'artist':data.tag.artist, 'title':data.tag.title, 'filename':rel_path})

  count_new = 0
  count_update = 0
  for song in lib:
    cur = g.db.execute("select id from artist where name=?", [song['artist']])
    artist_id = -1
    
    if cur.rowcount == 1:
      artist_id = cur.fetchone()[0]
    else:
      cur = g.db.execute("insert into artist (name) values (?)", [song['artist']])
      artist_id = cur.lastrowid

    if song['id'] == -1:
      g.db.execute("insert into song (name, artist_id, filename, last_update) values (?, ?, ?, ?)", [song['title'], artist_id, song['filename'], time.time()])
      count_new += 1
    else:
      g.db.execute("update song set name=?, artist_id=?, filename=?, last_update=? where id=?", [song['title'], artist_id, song['filename'], time.time()])
      count_update += 1
  
  g.db.commit()

  return (count_new, count_update)
"""
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
  cur = g.db.execute("select filename from library where id=?", [song_id])
  data = cur.fetchone()
  return json.dumps({'url': app.config['MUSIC_ADDRESS'] + data[0][0]})

@app.route("/update-library")
def update_lib():
  (new, updated) = update_library()
  return json.dumps({'new': new, 'updated': updated})

if __name__ == "__main__":
  app.run()
