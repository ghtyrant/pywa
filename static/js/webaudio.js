/* WebAudio */

playlist = { current_song: 0, random: false, saved: false, songs: {}, order: [] };


function fetch_current_playlist()
{
  $.getJSON($SCRIPT_ROOT + '/current-playlist', function(data) {
    $.each(data, function(id, song) {
      insert_song_into_playlist(song);
    });
    insert_playlist_click_handler();
  });
}

function song_in_playlist(song)
{
  return (playlist.songs[song.id] != null);
}

function next_song()
{
  if (playlist.random)
  {
    playlist.current_song = Math.ceil(Math.random() * playlist.order.length - 1);
  }
  else
  {
    playlist.current_song++;
  
    if (playlist.current_song >= playlist.order.length)
      playlist.current_song = 0;
  }

  song = playlist.order[playlist.current_song];
  play_song_by_id(song);
}

function insert_song_into_playlist(song)
{
  if (playlist.songs[song.id] == null)
  {
    nr = $('#playlist tbody tr').length + 1
    $('#playlist tbody').append("<tr data-id=\"" + song.id + "\" class=\"no-select\"><td>" + nr + "</td><td>" + song.name + "</td><td>" + song.artist + "</td><td><a onClick=\"javascript:remove_song(" + song.id + ");\"><i class=\"icon-remove\"></i></a></tr>");
    playlist.songs[song.id] = song;
    playlist.order.push(song.id);
  }
}

function remove_song(id)
{
  var index = playlist.order.indexOf(id);
  if (index != -1) playlist.order.splice(index, 1);

  playlist.songs[id] = null;
  $('#playlist > tbody').find("[data-id=" + id + "]").remove();
  
  if (index == playlist.current_song)
  {
    stop_playback();
  }
}

function stop_playback()
{
  jp = $("#jquery_jplayer_1");
  jp.jPlayer("clearMedia");
  $("#track_name").text("");
}

function insert_playlist_click_handler()
{
  $('#playlist > tbody > tr').dblclick(function() {
    $('#playlist > tbody > tr').attr('class', '');
    play_song_by_id($(this).data('id'));
    this.className = "success";
  });
}

function play_song_by_id(id)
{
  jp = $("#jquery_jplayer_1");
  jp.jPlayer("setMedia", {mp3: "http://127.0.0.1:5000/listen/" + id});
  jp.jPlayer("play");

  // set colored background for playlist
  $('#playlist > tbody > tr').attr('class', '');
  $('#playlist > tbody').find("[data-id=" + id + "]").attr('class', 'success');

  song = playlist.songs[id];
  var index = playlist.order.indexOf(id);
  playlist.current_song = index;
  $("#track_name").text(song.artist + " - " + song.name);
}

function fetch_artists()
{
  $.getJSON($SCRIPT_ROOT + '/get-artists', function(data) {
    $('#3p-artist tbody tr').remove();

    $.each(data, function(id, artist) {
      $('#3p-artist tbody').append("<tr data-id=\"" + artist.id + "\"><td>" + artist.name + "</td></tr>");
    });
    insert_3p_artist_click_handler();
  });
}

function insert_3p_artist_click_handler()
{
  $('#3p-artist > tbody > tr').click(function() {
    fetch_albums_by_artist($(this).data('id'));
    $('#3p-song tbody tr').remove();
    $('#3p-artist > tbody > tr').attr('class', '');
    this.className = "info";
  });

  $('#3p-artist > tbody > tr').dblclick(function() {
    fetch_albums_by_artist($(this).data('id'));
    $('#3p-song tbody tr').remove();
    $('#3p-artist > tbody > tr').attr('class', '');
    this.className = "info";
    add_songs_by_artist($(this).data('id'));
  });
}

function fetch_playlists()
{
  $.getJSON($SCRIPT_ROOT + '/get-playlists', function(data) {
    $('#2p-playlist tbody tr').remove();

    $.each(data, function(id, playlist) {
      $('#2p-playlist tbody').append("<tr data-id=\"" + playlist.id + "\"><td>" + playlist.name + "</td></tr>");
    });
    insert_2p_playlist_click_handler();
  });
}

function insert_2p_playlist_click_handler()
{
  $('#2p-playlist > tbody > tr').click(function() {
    fetch_songs_in_playlist($(this).data('id'));
    $('#2p-song tbody tr').remove();
    $('#2p-playlist > tbody > tr').attr('class', '');
    this.className = "info";
  });

  $('#2p-playlist > tbody > tr').dblclick(function() {
    fetch_songs_in_playlist($(this).data('id'));
    $('#2p-song tbody tr').remove();
    $('#2p-playlist > tbody > tr').attr('class', '');
    this.className = "info";
    add_songs_from_playlist($(this).data('id'));
  });
}

function fetch_albums_by_artist(artist_id)
{
  $.getJSON($SCRIPT_ROOT + '/get-albums',{artist_id: artist_id}, function(data) {
    $('#3p-album tbody tr').remove();

    $('#3p-album tbody').append("<tr data-id=\"-1\" data-artist-id=\"" + artist_id + "\"><td>(all)</td></tr>");
    $.each(data, function(id, album) {
      $('#3p-album tbody').append("<tr data-id=\"" + album.id + "\" data-artist-id=\"" + artist_id + "\"><td>" + album.name + "</td></tr>");
    });
    insert_3p_album_click_handler();
  });
}

function insert_3p_album_click_handler()
{
  $('#3p-album > tbody > tr').click(function() {
    if ($(this).data('id') > -1)
      fetch_songs_by_album($(this).data('id'));
    else
      fetch_songs_by_artist($(this).data('artist-id'));
    $('#3p-album > tbody > tr').attr('class', '');
    this.className = "info";
  });
}

function fetch_songs_by_album(album_id)
{
  $.getJSON($SCRIPT_ROOT + '/get-songs',{album_id: album_id}, function(data) {
    $('#3p-song tbody tr').remove();

    $.each(data, function(id, song) {
      $('#3p-song tbody').append("<tr data-id=\"" + song.id + "\"><td>" + song.name + "</td></tr>");
    });
    insert_3p_song_click_handler();
  });
}

function fetch_songs_by_artist(artist_id)
{
  $.getJSON($SCRIPT_ROOT + '/get-songs',{artist_id: artist_id}, function(data) {
    $('#3p-song tbody tr').remove();

    $.each(data, function(id, song) {
      $('#3p-song tbody').append("<tr data-id=\"" + song.id + "\"><td>" + song.name + "</td></tr>");
    });
    insert_3p_song_click_handler();
  });
}

function fetch_songs_in_playlist(playlist_id)
{
  $.getJSON($SCRIPT_ROOT + '/get-songs',{playlist_id: playlist_id}, function(data) {
    $('#2p-song tbody tr').remove();

    $.each(data, function(id, song) {
      $('#2p-song tbody').append("<tr data-id=\"" + song.id + "\"><td>" + song.name + "</td></tr>");
    });
    insert_2p_song_click_handler();
  });
}

function add_songs_by_album(album_id)
{
  $.getJSON($SCRIPT_ROOT + '/get-songs',{album_id: album_id}, function(data) {
    $.each(data, function(id, song) {
      insert_song_into_playlist(song);
    });
    insert_playlist_click_handler();
  });
}

function add_songs_by_artist(artist_id)
{
  $.getJSON($SCRIPT_ROOT + '/get-songs',{artist_id: artist_id}, function(data) {
    $.each(data, function(id, song) {
      insert_song_into_playlist(song);
    });
    insert_playlist_click_handler();
  });
}

function add_songs_from_playlist(playlist_id)
{
  $.getJSON($SCRIPT_ROOT + '/get-songs',{playlist_id: playlist_id}, function(data) {
    $.each(data, function(id, song) {
      insert_song_into_playlist(song);
    });
    insert_playlist_click_handler();
  });
}

function insert_3p_song_click_handler()
{
  $('#3p-song > tbody > tr').dblclick(function() {
    $.getJSON($SCRIPT_ROOT + '/get-song',{song_id: $(this).data('id')}, function(data) {
      if (!song_in_playlist(data))
      {
        insert_song_into_playlist(data);
        insert_playlist_click_handler();
      }
    });

  });
}

function insert_2p_song_click_handler()
{
  $('#2p-song > tbody > tr').dblclick(function() {
    $.getJSON($SCRIPT_ROOT + '/get-song',{song_id: $(this).data('id')}, function(data) {
      if (!song_in_playlist(data))
      {
        insert_song_into_playlist(data);
        insert_playlist_click_handler();
      }
    });

  });
}

function clear_playlist()
{
  playlist.songs = {};
  playlist.order = [];
  $('#playlist > tbody > tr').remove();
  
  stop_playback();
}

function save_playlist(overwrite)
{
  if (!overwrite)
    overwrite = false;
  
  var name = $("#playlist_save_name").val();

  $.post($SCRIPT_ROOT + '/save-playlist', {name:name, songs:playlist.order, overwrite:overwrite}, function(data) {
    if (data["error"] != "success")
    {
      $("#saveModal").modal("hide");
      $("#overwriteModal").modal("show");
      $('#overwrite_name').text(name);
    }
    else
    {
      $("#saveModal").modal("hide");
      $("#overwriteModal").modal("hide");
      $("#successModal").modal("show");
    }
  }, "json");
}
