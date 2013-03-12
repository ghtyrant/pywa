drop table if exists artist;
create table artist (
  id integer primary key autoincrement,
  name string not null
);

drop table if exists album;
create table album (
  id integer primary key autoincrement,
  artist_id integer,
  name string not null
);

drop table if exists song;
create table song (
  id integer primary key autoincrement,
  artist_id integer,
  album_id integer,
  name string not null,
  path string not null,
  last_update integer
);

drop table if exists playlist;
create table playlist (
  id integer primary key autoincrement,
  name string not null
);

drop table if exists playlist_songs;
create table playlist_songs (
  playlist_id integer,
  song_id integer
);

drop table if exists library;
create table library (
  last_update integer
);
