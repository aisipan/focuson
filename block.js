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
      $('#todoListArea').append(tr);
    }

    /* // kalo disorting descending
    var deadline_desc = data.sort(function(a, b){
      if (a.deadline > b.deadline) return -1;
      if (a.deadline < b.deadline) return 1;
      return 0;
    });*/
  });

$("#cek").click(function(){
  chrome.storage.sync.get({dataTimeout: []}, function(data){
    var timeout = data.dataTimeout; // array of timeout that contains timeFocus and timeRest
    var timeFocus = timeout[0].timeFocus;
    var timeRest = timeout[0].timeRest;
  });
});
  
});