// display timeout
// Source: https://stackoverflow.com/questions/20618355/the-simplest-possible-javascript-countdown-timer
function startTimer(duration, display) {
  var timer = duration, minutes, seconds;
  setInterval(function () {
    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    display.text(minutes + ":" + seconds);

    if (--timer < 0) {
        timer = duration;
    }
  }, 1000);
}

// load timeout
chrome.storage.sync.get('timeout', function(data){
  var timeout = data.timeout;

  var duration = 60 * timeout,
      display = $('#timeout');
  startTimer(duration, display);
});