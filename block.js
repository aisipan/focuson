$(function(){
	var bg = chrome.extension.getBackgroundPage();
  var focuson = bg.focuson;

  // Give date and clock in the page
  setInterval(function() {
    var date = new Date(),
        time = date.toLocaleTimeString();
    $("#time").html(time);
  }, 1000);

  var today = new Date();
  var day = today.getDay();
  switch (day) {
    case 0:
        day = "Sunday";
        break;
    case 1:
        day = "Monday";
        break;
    case 2:
        day = "Tuesday";
        break;
    case 3:
        day = "Wednesday";
        break;
    case 4:
        day = "Thursday";
        break;
    case 5:
        day = "Friday";
        break;
    case 6:
        day = "Saturday";
  }
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();
  if(dd<10) {
      dd = '0'+dd;
  } 
  if(mm<10) {
      mm = '0'+mm;
  } 
  today = day + ', ' + mm + '/' + dd + '/' + yyyy;
  $("#today").text(today);

  focuson.storage.loadTodos(function(data){
    // console.log(data);
  	// console.log(data);
  	// $.each(data, function(index, value){
  	// 	var task = value.task;
  	// 	var deadline = value.deadline;
    //    console.log(deadline);
  	// 	/*console.log(task);
  	// 	console.log(deadline);*/
  	// 	$(".todo").append("<tr><td>"+task+"</td><td class='deadline'>"+deadline+"</td></tr>");
  	// });


    // disorting berdasarkan deadline
    var deadline_asc = data.sort(function(a, b){
      if (new Date(a.deadline).getTime() > new Date(b.deadline).getTime()) return 1;
      if (new Date(a.deadline).getTime() < new Date(b.deadline).getTime()) return -1;
      return 0;
    });

    // select only undone task
    var undone = data.filter(function(element){
      var now = Date.now();
      var deadlineToMilliseconds = new Date(element.deadline).getTime();
      return deadlineToMilliseconds > now && element.done === false;
    });

    if (undone.length <= 0) {
      $("#warning-message").html("No tasks for now.");
    }
    for (var i = 0; i < undone.length; i++) {
      var id=[i][0];
      var task = undone[i].task;
      var deadline = undone[i].deadline;
      // var deadlineToMilliseconds = new Date(deadline).getTime();
      
      tr = $("<tr id="+id+"/>");
      tr.append("<td>"+task+"</td>");
      tr.append("<td>"+deadline+"</td>");
      // tr.append("<td><button class='btn btn-default btn-xs doneTodo'><i class='fa fa-check'></i></button></td>");
      // if (deadlineToMilliseconds < now) {
      //   tr.append("<td class='overdue'><span class='label label-danger' title='Terlewati'>Overdue</span></td>");
      // } else {
      //   tr.append("<td><span class='label label-primary' title='Belum selesai'>Undone</span></td>");
      // }
      // tr.append("<td><button class='btn btn-default btn-xs doneTodo'><i class='fa fa-check'></i></button>"+
      //   "<button class='btn btn-default btn-xs deleteTodo'><i class='fa fa-trash'></i></button>"+
      //   "</td>");
      $('#todoListArea').append(tr);
    }

    /* // kalo disorting descending
    var deadline_desc = data.sort(function(a, b){
      if (a.deadline > b.deadline) return -1;
      if (a.deadline < b.deadline) return 1;
      return 0;
    });*/
  });

/*  // display timeout
  // Source: https://stackoverflow.com/questions/20618355/the-simplest-possible-javascript-countdown-timer
  function startTimer(duration, display) {
    var timer = duration, minutes, seconds;
    var countdown = setInterval(function () {
      minutes = parseInt(timer / 60, 10);
      seconds = parseInt(timer % 60, 10);

      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;

      display.text(minutes + ":" + seconds);

      if (--timer < 0) {
          // timer = duration;
          // timer = 0;
          alert('overtime');
          clearInterval(countdown);
          return;
      }
    }, 1000);
  }

  // load timeout
  chrome.storage.sync.get('timeout', function(data){
    var timeout = data.timeout;

    var duration = 3 * timeout,
        display = $('#timeout');
    startTimer(duration, display);
  });
*/
$("#cek").click(function(){
  chrome.storage.sync.get({dataTimeout: []}, function(data){
    var timeout = data.dataTimeout; // array of timeout that contains timeFocus and timeRest
    var timeFocus = timeout[0].timeFocus;
    var timeRest = timeout[0].timeRest;
  });
});
  
});