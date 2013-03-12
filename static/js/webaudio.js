/* WebAudio */

function fetch_current_playlist()
{
  $.getJSON($SCRIPT_ROOT + '/current-playlist', function(data) {
    $.each(data, function(id, song) {
      $('#playlist tbody').append("<tr id=\"" + song.id + "\"><td>" + song.id + "</td><td>" + song.title + "</td><td>" + song.artist + "</td></tr>");
    });
    insert_playlist_click_handler();
  });
}

function insert_playlist_click_handler()
{
  $('#playlist > tbody > tr').click(function() {
    play_song_by_id(this.id);
  });
}

function play_song_by_id(id)
{
  $.getJSON($SCRIPT_ROOT + '/get-url', {song_id: id}, function(data) {
    if (data.url)
    {
      jp = $("#jquery_jplayer_1");
      jp.jPlayer("setMedia", {mp3: data.url});
      //jp.jPlayer("setMedia", {oga:"http://www.jplayer.org/audio/ogg/TSP-01-Cro_magnon_man.ogg"});
      jp.jPlayer("play");
    }
  });
}
