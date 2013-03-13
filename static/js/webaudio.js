/* WebAudio */

playlist = {
  current_song: 0,
  random: false,
  songs: {},
  order: [],
  queue: [],
  last_played: []
};

$.fn.animateHighlight = function(highlightColor, duration) {
  var highlightBg = highlightColor || "#FFFF9C";
  var animateMs = duration || 1500;
  var originalBg = this.css("backgroundColor");
  this.stop().css("background-color", highlightBg).animate({backgroundColor: originalBg}, animateMs);
};

function fetch_current_playlist()
{
  $.getJSON($SCRIPT_ROOT + '/current-playlist', function(data) {
    $.each(data, function(id, song) {
      insert_song_into_playlist(song);
    });
  });
}

function song_in_playlist(song)
{
  return (playlist.songs[song.id] != null);
}

function previous_song()
{
  if (playlist.random)
  {
    if (playlist.last_played.length > 0)
    {
      playlist.current_song = playlist.last_played.pop();
    }
    else
    {
      playlist.current_song = Math.ceil(Math.random() * playlist.order.length - 1);
    }
  }
  else
  {
    playlist.current_song--;
  
    if (playlist.current_song < 0)
      playlist.current_song = playlist.order.length - 1;
  }

  song = playlist.order[playlist.current_song];
  play_song_by_id(song);

}

function next_song()
{
  playlist.last_played.push(playlist.current_song);

  if (playlist.queue.length > 0)
  {
    playlist.current_song = playlist.order.indexOf(pop_queue_song());
    update_queue_positions();
  }
  else
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
  }

  song = playlist.order[playlist.current_song];
  play_song_by_id(song);
}

function insert_song_into_playlist(song)
{
  if (playlist.songs[song.id] == null)
  {
    nr = $('#playlist tbody tr').length + 1;
    dblclick_handler = 'onDblClick="javascript:on_song_dblclick(this, ' + song.id + ');"';
    del_handler = 'onClick="javascript:on_delete_song_click(this, ' + song.id + ');"';

    queue_handler = 'onClick="javascript:on_queue_song_click(this, ' + song.id + ');"';

    var elem = $("<tr " + dblclick_handler + "><td>" + nr + "</td><td>" + song.name + "</td><td>" + song.artist + "</td><td><a " + queue_handler + "><i class=\"queue icon-time\"></i><span></span></a></td><td><a " + del_handler + "><i class=\"icon-remove\"></i></a></tr>");

    $('#playlist tbody').append(elem);
    song.element = elem;
    playlist.songs[song.id] = song;
    playlist.order.push(song.id);
  }
}

function on_song_dblclick(elem, id)
{
  $('#playlist > tbody > tr').attr('class', '');
  play_song_by_id(id);
  $(elem).attr("class", "success");
}

function on_delete_song_click(elem, id)
{
  var index = playlist.order.indexOf(id);
  if (index != -1) playlist.order.splice(index, 1);
  
  if (index == playlist.current_song)
    stop_playback();
  
  index = playlist.queue.indexOf(id);
  if (index > -1)
    remove_song_from_queue(index);

  playlist.songs[id].element.effect("fade", {}, 500, function() {$(elem).closest("tr").remove()});
  playlist.songs[id] = null;
}

function update_queue_positions()
{
  for (var i = 0; i < playlist.queue.length; i++)
  {
    song = playlist.songs[playlist.queue[i]];
    song.element.find("span").text(i+1);
    song.element.find("i.queue").attr("class", "queue");
  }
}

function on_queue_song_click(elem, id)
{
  var index = playlist.queue.indexOf(id);
  if (index == -1)
  {
    playlist.queue.push(id);
    update_queue_positions();
  }
  else
    remove_song_from_queue(index);
}

function pop_queue_song()
{
  var song_id = playlist.queue[0];
  remove_song_from_queue(0);
  return song_id;
}

function remove_song_from_queue(queue_id)
{
  song = playlist.songs[playlist.queue[queue_id]];
  song.element.find("span").text("");
  song.element.find("i.queue").attr("class", "queue icon-time");
  playlist.queue.splice(queue_id, 1);
  update_queue_positions();
}

function stop_playback()
{
  jp = $("#jquery_jplayer_1");
  jp.jPlayer("clearMedia");
  $("#track_name").text("");
  document.title = $APP_NAME;
}

function play_song_by_id(id)
{
  jp = $("#jquery_jplayer_1");
  jp.jPlayer("setMedia", {mp3: "http://127.0.0.1:5000/listen/" + id});
  jp.jPlayer("play");

  // set colored background for playlist
  $('#playlist > tbody > tr').attr('class', '');

  song = playlist.songs[id];
  song.element.attr('class', 'success');
  var index = playlist.order.indexOf(id);
  playlist.current_song = index;

  var song_title = song.artist + " - " + song.name
  $("#track_name").text(song_title);
  document.title = $APP_NAME + " :: " + song_title;
}

function fetch_artists()
{
  $.getJSON($SCRIPT_ROOT + '/get-artists', function(data) {
    $('#3p-artist tbody tr').remove();

    $.each(data, function(id, artist) {
      click_handler = 'onClick="javascript:on_artist_click(this, ' + artist.id + ');"';
      dblclick_handler = 'onDblClick="javascript:on_artist_dblclick(this, ' + artist.id + ');"';
      $('#3p-artist tbody').append("<tr " + click_handler + " " + dblclick_handler + "><td>" + artist.name + "</td></tr>");
    });
  });
}

function on_artist_click(elem, id)
{
  fetch_albums_by_artist(id);
  $('#3p-song tbody tr').remove();
  $('#3p-artist > tbody > tr').attr('class', '');
  $(elem).attr("class", "info");
}

function on_artist_dblclick(elem, id)
{
  on_artist_click(elem, id);
  $(elem).effect("pulsate", {times: 1}, 1000);
  add_songs_by_artist(id);
}

function fetch_playlists()
{
  $.getJSON($SCRIPT_ROOT + '/get-playlists', function(data) {
    $('#2p-playlist tbody tr').remove();

    $.each(data, function(id, playlist) {
      click_handler = "onClick=\"javascript:on_playlist_click(this, "+playlist.id+");\"";
      dblclick_handler = "onDblClick=\"javascript:on_playlist_dblclick(this, "+playlist.id+");\"";
      del_handler = "onClick=\"javascript:on_delete_playlist_click(this, "+playlist.id+", '"+playlist.name+"');\"";

      $('#2p-playlist tbody').append("<tr><td " + click_handler + " " + dblclick_handler + ">" + playlist.name + "</td><td><a " + del_handler + "><i class=\"icon-remove\"></i></a></tr>");
    });
  });
}

function on_delete_playlist_click(elem, id, name)
{
  $("#delete_playlist_name").text(name);
  $("#delete_playlist_button").attr("onClick", "javascript:delete_playlist(" + id + ");$(\"#deleteModal\").modal(\"hide\")");
  $("#deleteModal").modal("show");
}

function on_playlist_click(elem, id)
{
  fetch_songs_in_playlist(id);
  $('#2p-song tbody tr').remove();
  $('#2p-playlist > tbody > tr').attr('class', '');
  $(elem).closest("tr").attr('class', "info");
}

function on_playlist_dblclick(elem, id)
{
  on_playlist_click(elem, id);
  $(elem).effect("pulsate", {times: 1}, 1000);
  add_songs_from_playlist(id);
}

function fetch_albums_by_artist(artist_id)
{
  $.getJSON($SCRIPT_ROOT + '/get-albums',{artist_id: artist_id}, function(data) {
    $('#3p-album tbody tr').remove();

    $('#3p-album tbody').append("<tr onClick=\"javascript:on_album_all_click(this, "+artist_id+");\" onDblClick=\"javascript:on_album_all_blclick(this, "+artist_id+")\"><td>(all)</td></tr>");
    $.each(data, function(id, album) {
      click_handler = "onClick=\"javascript:on_album_click(this, "+album.id+");\"";
      dblclick_handler = "onDblClick=\"javascript:on_album_dblclick(this, "+album.id+");\"";

      $('#3p-album tbody').append("<tr " + click_handler + " " + dblclick_handler + "><td>" + album.name + "</td></tr>");
    });
  });
}

function on_album_all_click(elem, artist_id)
{
  fetch_songs_by_artist(artist_id);
  $('#3p-album > tbody > tr').attr('class', '');
  $(elem).closest("tr").attr("class", "info");
}

function on_album_all_dblclick(elem, artist_id)
{
  on_album_all_click(elem, artist_id);
  $(elem).effect("pulsate", {times: 1}, 1000);
  add_songs_by_artist(artist_id);
}

function on_album_click(elem, id)
{
  fetch_songs_by_album(id);
  $('#3p-album > tbody > tr').attr('class', '');
  $(elem).closest("tr").attr("class", "info");
}

function on_album_dblclick(elem, id)
{
  on_album_click(elem, id);
  $(elem).effect("pulsate", {times: 1}, 1000);
  add_songs_by_album(id);
}

function fetch_songs_by_album(album_id)
{
  $.getJSON($SCRIPT_ROOT + '/get-songs',{album_id: album_id}, function(data) {
    $('#3p-song tbody tr').remove();

    $.each(data, function(id, song) {
      dblclick_handler = 'onDblClick="javascript:on_library_song_dblclick(this, ' + song.id + ');"';

      $('#3p-song tbody').append("<tr " + dblclick_handler + "><td>" + song.name + "</td></tr>");
    });
  });
}

function fetch_songs_by_artist(artist_id)
{
  $.getJSON($SCRIPT_ROOT + '/get-songs',{artist_id: artist_id}, function(data) {
    $('#3p-song tbody tr').remove();

    $.each(data, function(id, song) {
      dblclick_handler = 'onDblClick="javascript:on_library_song_dblclick(this, ' + song.id + ');"';
      $('#3p-song tbody').append("<tr " + dblclick_handler + "><td>" + song.name + "</td></tr>");
    });
  });
}

function fetch_songs_in_playlist(playlist_id)
{
  $.getJSON($SCRIPT_ROOT + '/get-songs',{playlist_id: playlist_id}, function(data) {
    $('#2p-song tbody tr').remove();

    $.each(data, function(id, song) {
      dblclick_handler = 'onDblClick="javascript:on_library_song_dblclick(this, ' + song.id + ');"';
      $('#2p-song tbody').append("<tr " + dblclick_handler + "><td>" + song.name + "</td></tr>");
    });
  });
}

function on_library_song_dblclick(elem, id)
{
  $.getJSON($SCRIPT_ROOT + '/get-song',{song_id: id}, function(data) {
    insert_song_into_playlist(data);
    $(elem).effect("pulsate", {times: 1}, 1000);
  });

}

function add_songs_by_album(album_id)
{
  $.getJSON($SCRIPT_ROOT + '/get-songs',{album_id: album_id}, function(data) {
    $.each(data, function(id, song) {
      insert_song_into_playlist(song);
    });
  });
}

function add_songs_by_artist(artist_id)
{
  $.getJSON($SCRIPT_ROOT + '/get-songs',{artist_id: artist_id}, function(data) {
    $.each(data, function(id, song) {
      insert_song_into_playlist(song);
    });
  });
}

function add_songs_from_playlist(playlist_id)
{
  $.getJSON($SCRIPT_ROOT + '/get-songs',{playlist_id: playlist_id}, function(data) {
    $.each(data, function(id, song) {
      insert_song_into_playlist(song);
    });
  });
}

function clear_playlist()
{
  playlist.songs = {};
  playlist.order = [];
  $('#playlist > tbody > tr').effect("fade", {}, 500, function(){$('#playlist > tbody > tr').remove()});
  
  stop_playback();
}

function delete_playlist(id)
{
  $.getJSON($SCRIPT_ROOT + '/delete-playlist',{playlist_id: id}, function(data) {
    fetch_playlists(); 
  });
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

function update_library()
{
  $.getJSON($SCRIPT_ROOT + '/update-library', function(data) {
    $("#update_new").text(data['new']);
    $("#update_updated").text(data['updated']);
    $("#updateModal").modal("show");
  });
}
