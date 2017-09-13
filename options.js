$(function() {

  var bg = chrome.extension.getBackgroundPage();
  var focuson = bg.focuson;
  var current_time = bg.current_time;
  var current_time_ms = bg.current_time_ms;  
  
  function getRuntime() {
    return chrome.runtime.onMessage ? chrome.runtime : chrome.extension;
  }

  var today = new Date();

  // Give date and clock in the page
  // source: https://jsfiddle.net/jenniferperrin/czPBU/
  setInterval(function() {
    var date = new Date(),
        time = date.toLocaleTimeString();
    $("#time").html(time);
  }, 1000);

  var now = Date.now(); // return milliseconds of date from 1 jan 1970  
  var c_time = today.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
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
  today_v = day + ', ' + mm + '/' + dd + '/' + yyyy;
  today = mm + '/' + dd + '/' + yyyy;
  $("#today").text(today_v);

  getTodoList();
  getBlockedUrl();

  // side bar navigation
  $("div.bhoechie-tab-menu>div.list-group>a").click(function(e) {
      e.preventDefault();
      $(this).siblings('a.active').removeClass("active");
      $(this).addClass("active");
      var index = $(this).index();
      $("div.bhoechie-tab>div.bhoechie-tab-content").removeClass("active");
      $("div.bhoechie-tab>div.bhoechie-tab-content").eq(index).addClass("active");
  });

  // show datetimepicker
  $('#datetimepicker1').datetimepicker({
      sideBySide: true,
      calendarWeeks: true,
      minDate: new Date()
  });

  // show info
  $('[data-toggle="popover"]').popover({
    container: 'body'
  });

  // close info when click outside (anywhere in page)
  $('body').on('click', function (e) {
    $('[data-toggle="popover"]').each(function () {
        //the 'is' for buttons that trigger popups
        //the 'has' for icons within a button that triggers a popup
        if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
            $(this).popover('hide');
          }
    });
  });

  $("#blocked_sites").click(function(){    
    var blockedUrls_arr = [];
    var data_url_arr = [];
    
    var el_sosmed = $(".sosmed").each(function(){
      var data_url = $(this).data('url'); 
      data_url_arr.push(data_url);
    });
    
    focuson.storage.loadBlockedUrls(function(data) {
      // console.log(data); // show the array of blocked sites
      var blockedUrls = data;
      $.map(blockedUrls, function(obj, index){
        var blockedUrl = obj.url;
        blockedUrls_arr.push(blockedUrl);
      });
    });
  });

  // when user click sosmed
  $('.sosmed').click(function(){
    $(this).toggleClass('red');
    /*$(this).css({
      color: '#c0392b'
    });*/
  	console.log($(this).attr('data-url'));
  });
  $("#block_all_sosmed").click(function(){
    $('.sosmed').toggleClass('red');
    /*$('.sosmed').css({
      color: '#c0392b'
    });*/
  });

  /*********************************MENU TO TODO LIST***********************************/

  // coba saving to storage
  $("#addTask").click(function(){
    var dateAndTimeNow = moment().format('MM/DD/YYYY hh:mm:ss A');
    console.log(dateAndTimeNow);
    var task = $("#task").val();    
    var deadline = $("#deadline").val();
    
    if (task === null || task === '') {
        alert('Define your task');
    } else if (deadline === null || deadline === '') {
        alert('Put your deadline time');
    } else {
        chrome.storage.sync.get({dataTodo: []}, function(result){
          var dataTodo = result.dataTodo;
          dataTodo.push({
              task: task,
              start_at: dateAndTimeNow,
              finish_at: '-',
              deadline: deadline,
              done: false,
              rec: '-'
          });
          chrome.storage.sync.set({dataTodo: dataTodo}, function(){ 
              $("#task").val("");
              $("#deadline").val("");
              getTodoList();
          });
        });
    }
      
  });

  // ngeget data
  function getTodoList() {
    chrome.storage.sync.get({dataTodo: []}, function(result){
      var tr;
      var data = result.dataTodo;
      var no = 1;

      // disorting berdasarkan deadline
      data = data.sort(function(a, b){
        if (new Date(a.deadline).getTime() > new Date(b.deadline).getTime()) return 1;
        if (new Date(a.deadline).getTime() < new Date(b.deadline).getTime()) return -1;
        return 0;
      });

      $('#todoListArea').html("");

      // console.log(data);
      // var now = Date.now();
      for (var i = 0; i < data.length; i++) {
        var id=[i][0];
        var task = data[i].task;
        var start_at = data[i].start_at;
        var finish_at = data[i].finish_at;
        var deadline = data[i].deadline;
        var status = data[i].done;
        var rec = data[i].rec;
        var deadlineToMilliseconds = new Date(deadline).getTime();

        tr = $("<tr id="+id+"/>");
        tr.append("<td>"+task+"</td>");
        tr.append("<td>"+start_at+"</td>");
        tr.append("<td>"+finish_at+"</td>");
        tr.append("<td>"+deadline+"</td>");
        if (deadlineToMilliseconds < now && status === false) {
          tr.append("<td class='overdue'><span class='label label-danger' title='Terlewati dan belum selesai'>Terlewati dan belum selesai</span></td>");
        }
        else if(deadlineToMilliseconds < now && status === true){
          tr.append("<td class='overdue'><span class='label label-warning' title='Terlewati dan selesai'>Terlewati dan selesai</span></td>");
        } 
        else if(deadlineToMilliseconds > now && status === false) {
          tr.append("<td><span class='label label-primary' title='Belum selesai'>Belum selesai</span></td>");
        }
        else if(deadlineToMilliseconds > now && status === true) {
          tr.append("<td><span class='label label-success' title='Telah selesai'>Selesai</span></td>"); 
        }
        tr.append("<td>"+rec+" hours</td>");
        if (status === false) {
          tr.append("<td><button class='btn btn-default btn-xs doneTodo'><i class='fa fa-check'></i></button>"+
          "<button class='btn btn-default btn-xs deleteTodo'><i class='fa fa-trash'></i></button>"+
          "</td>");
        }
        else if (status === true) {
          // disable check button if done is true
          tr.append("<td><button class='btn btn-default btn-xs' disabled><i class='fa fa-check'></i></button>"+
          "<button class='btn btn-default btn-xs deleteTodo'><i class='fa fa-trash'></i></button>"+
          "</td>");
        }
        
        $('#todoListArea').append(tr);
      }

    });
  }

  $(document).on("click", ".deleteTodo", deleteTodo);
  $(document).on("click", ".doneTodo", doneTodo);

  function deleteTodo(){
    var theElement = $(this).parent().parent();
    var index = $(this).parent().parent().attr('id');
    var confirmation = confirm('Are you sure you want to delete this task?');

    if (confirmation) {
      focuson.storage.loadTodos(function(data){
        // disort dulu dari yang terlama
        data = data.sort(function(a, b){
          if (new Date(a.deadline).getTime() > new Date(b.deadline).getTime()) return 1;
          if (new Date(a.deadline).getTime() < new Date(b.deadline).getTime()) return -1;
          return 0;
        });

        var res = data.splice(index, 1);
        if (res) {
          chrome.storage.sync.set({dataTodo: data}, function(){
            alert('Deleted');
          });
          theElement.remove();
        }
      });
    }
  }

  function doneTodo(){
    var dateAndTimeNow = moment().format('MM/DD/YYYY hh:mm:ss A');
    var theElement = $(this).parent().parent();
    var index = $(this).parent().parent().attr('id');
    console.log(index);
    var confirmation = confirm('Are you sure you have finished this task?');

    if (confirmation) {
      focuson.storage.loadTodos(function(data){
        // disort dulu dari yang terlama
        data = data.sort(function(a, b){
          if (new Date(a.deadline).getTime() > new Date(b.deadline).getTime()) return 1;
          if (new Date(a.deadline).getTime() < new Date(b.deadline).getTime()) return -1;
          return 0;
        });

        

        var todo = data[index]; // get the ID

        var start_at = todo.start_at;
        var start_at_toMilliseconds = new Date(start_at).getTime();
        var dateAndTimeNow_toMilliseconds = new Date(dateAndTimeNow).getTime();
        var selisih = dateAndTimeNow_toMilliseconds - start_at_toMilliseconds;
        var rec = focuson.timer.msToTime(selisih);

        todo.done = !todo.done;
        todo.finish_at = dateAndTimeNow;
        todo.rec = rec;

        // updating data done
        chrome.storage.sync.set({dataTodo: data}, function(){
          getTodoList();
          alert("Congratulations! You've done one task. Fighting!");
        });
      });
    }

  }

  ///*********************************MENU TO TODO LIST***********************************/



  /*********************************CRUD TO BLOCK SITES***********************************/

  // add Url to blocked list
  $("#addUrl").click(function(){
      var url = $("#url").val();
      if (url === null || url === '') {
          alert('Put link that you want to block');
      } else {
        // validate url untuk ngedapetin domainnya aja
        var domain = focuson.util.extractsDomain($.trim(url));
        getRuntime().sendMessage({
          type: "addManualBlock",
          domain: domain
        }, function(response){
          if (response && response.ok) {
            getBlockedUrl();
            $("#url").val("");
            $("#focuson-message").html('<div class="col-md-12">'+
                      '<div class="alert alert-success alert-dismissable">'+
                        '<a href="#" class="close" data-dismiss="alert" aria-label="close"><i class="fa fa-close"></i></a>'+
                        '<strong>Success!</strong> You have blocked <strong>'+domain+'</strong>'+
                      '</div>'+
                    '</div>');

          } else {
            $("#focuson-message").html('<div class="col-md-12">'+
                      '<div class="alert alert-danger alert-dismissable">'+
                        '<a href="#" class="close" data-dismiss="alert" aria-label="close"><i class="fa fa-close"></i></a>'+
                        '<strong>Error! </strong>'+response.error+
                      '</div>'+
                    '</div>');
          }
        });
      }
  });

  function getBlockedUrl() {
    focuson.storage.loadBlockedUrls(function(data){
      var tr;
      var no = 1;
      $('#blockedSitesArea').html("");
      $.each(data, function(key, value){
          tr = $("<tr id="+key+"/>");
          // tr.append("<td>"+ no++ +"</td>");
          tr.append("<td>"+value.url+"</td>");
          tr.append("<td><span class='label label-danger'>Blocked</span></td>");
          tr.append("<td><button class='btn btn-default btn-xs deleteBlockedSites'><i class='fa fa-trash'></i></button></td>");
          $('#blockedSitesArea').append(tr);
      });
    });
  }

  $(document).on("click", ".deleteBlockedSites", deleteBlockedSites);

  function deleteBlockedSites() {
      var theElement = $(this).parent().parent();
      var index = $(this).parent().parent().attr('id');
      var confirmation = confirm('Are you sure you want to delete?');

      if (confirmation) {
        focuson.storage.loadBlockedUrls(function(data){
          var res = data.splice(index,1);
          if (res) {
            chrome.storage.sync.set({dataUrl: data}, function(){
              alert('Deleted');
              getBlockedUrl();
            });
          }
        });
      }
  }

  ///*********************************CRUD TO BLOCK SITES***********************************/


  // toggle radio button on time management setting
  $("input[type=radio][data-toggle=radio-collapse]").each(function(index, item) {
    var $item = $(item);
    var $target = $($item.data('target'));

    $('input[type=radio][name="'+ item.name + '"]').on('change', function() {
      if ($item.is(':checked')) {
        $target.collapse('show');
      } else {
        $target.collapse('hide');
      }
    });
  });

  $("#start_time_picker").datetimepicker({
      format: 'LT',
  });

  $("#finish_time_picker").datetimepicker({
      format: 'LT',
  });

  // load time management settings dan timeout
  $("#time_management").click(function(){
    focuson.storage.loadTimeManagement(function(data) {      
      if (typeof data[0].type === "undefined") {
        return;
      }
      // manipulasi tampilan time management setting berdasarkan database
      var time_management_type = data[0].type;

      // checked radio button berdasarkan tipe pilihannya
      var elem = $("input:radio[name=time_management]")[time_management_type]; 
      elem.checked = true;
      $('.collapse').collapse('show');

      if (time_management_type === 0) {
        // alert('Your last setting: always block');
      }
      else if (time_management_type === 1) {
        // alert('Your last setting: set my work time');

        var days = data[0].days;
        var start_time = data[0].start_time;
        var finish_time = data[0].finish_time;

        $("#start_time").val(start_time);
        $("#finish_time").val(finish_time);
        
        // populating days array to checkbox
        for (var i = 0; i < days.length; i++) {
          var value = days[i];
          var selector = $(".days[value="+value+"]");
          if (selector) {
            selector.prop("checked", true);
          }
        }
      }
    }); // end of loadTimeManagement

  });  

  $("#saveTimeManagement").click(function(){
    var time_management = $("input:radio[name=time_management]:checked").val();
    var days = $(".days").find("input[type='checkbox']:checked");
    var start_time = $("#start_time").val();
    var finish_time = $("#finish_time").val();
    var activeDays_arr = [];
    var d = new Date();

    $.map(days, function(obj, index){
      var activeDays = parseInt(obj.value);
      activeDays_arr.push(activeDays);
    });

    focuson.storage.loadTimeManagement(function(data){
      var dataTimeManagement = data;
      console.log(dataTimeManagement);
      if (time_management === '1') {
        dataTimeManagement.length = 0; // clear previous setting
        dataTimeManagement.push({type: 0});
        chrome.storage.sync.set({dataTimeManagement: dataTimeManagement}, function(){
          console.log('setting to always block');
          alert('setting has been saved to always block');
        });
        console.log(dataTimeManagement);
      }
      else if (time_management === '2') {
        dataTimeManagement.length = 0; // clear previous setting
        dataTimeManagement.push({
          type: 1,
          days: activeDays_arr,
          start_time: start_time,
          finish_time: finish_time
        });
        chrome.storage.sync.set({dataTimeManagement: dataTimeManagement}, function(){
          // console.log('setting to work time');
          alert('setting has been saved to work time');

        });
        console.log(dataTimeManagement);
      }
    });
    return false;
  }); // end of saveManagementTime button

  // pomodoro technique
  function togglePomodoro(disabled) {
    if (disabled) {
      // console.log('pomodoro mati');
      // alert('Pomodoro Off');
    }
    else {
      // console.log('pomodoro nyala');
      // alert('Pomodoro On');
    }
  }

  function checkPomodoroPreference() {
    getRuntime().sendMessage({type: "getPomodoroPreference"}, function(response){
      var disabled = response.off;
      togglePomodoro(disabled); // ngirim pesan kondisi ke togglePomodoro, tampilannya mau seperti apa
      if (disabled) {
        // keadaan button switch
        $("#pomodoro_switch").bootstrapToggle('off');
      } else {
        $("#pomodoro_switch").bootstrapToggle('on');
      }

      $("#pomodoro_switch").on("change",function(){
        // ketika ditoggle
        var disabled = !$(this).prop("checked");
        getRuntime().sendMessage({
          type: "togglePomodoro",
          disabled: disabled
        });
        togglePomodoro(disabled);
      });
    });
  }
  checkPomodoroPreference();


});