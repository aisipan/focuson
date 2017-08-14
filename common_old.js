;
'use strict';

var extension_id = chrome.runtime.id;
var FOCUSON_STATE_SETTING = "FOCUSON_STATE";
var TIME_MANAGEMENT_SETTING = "TIME_MANAGEMENT";
var TIMER_DATA_DATE_SETTING = "TIMER_DATA_DATE";
var TIMER_DATA_SETTING = "TIME_DATA";
var POMODORO_STATE_SETTING = "POMODORO_STATE";
// var dataTodoList = [];
// var dataBlockedSites;

var TIME_MANAGEMENT_TYPE;
var countdownFocus = null;
var countdownRest = null;

// var TYPE_ALWAYS_BLOCK = 1;
// var TYPE_WORK_TIME = 2;
// var TYPE_SET_MINUTE = 3;
// var TYPE_POMODORO = 4;

var d = new Date();
var day = d.getDay();

var focuson = {
	wormholes: null,
	timers: null,
	blockedUrls: null,
	// timeManagement : null,
	util : {
		byteCount: function (s) {
      return encodeURI(s).split(/%..|./).length - 1;
    },
		safeJSON: function(json, defaultVal){
			try {
				var result = JSON.parse(json);
				return result;
			}
			catch(e) {
				console.log('not json');
			}
			return defaultVal;
		},
		isValidDomain: function (s) {
      s = s.toLowerCase();
      return typeof s === "string" && s.match(/^([a-z\d](-*[a-z\d])*)(\.([a-z\d](-*[a-z\d])*))*$/);
    },
		extractsDomain: function(url){
      if (!url) {
        return "";
      }
      var domain = url.replace(/https?:\/\//, ""); // ngilangin url di bagian https:// atau http:// nya
      var firstSlash = domain.indexOf("/");
      if (firstSlash >= 0)
      {
      	// ngambil domain nya aja, slash (/)
        domain = domain.substring(0, firstSlash);
      }
      domain = domain.toLowerCase();
      return focuson.util.normalizeDomain(domain);
    },
    normalizeDomain: function (s) {
      // removes trailing slashes
      // ngapus url yang dibelakang slash setelah domain (ngambil domainnya aja)
      return s.replace(/\/+$/g, "").toLowerCase();
    },
    checkPopupTurnOn: function() {
    	return chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function(tabs) {
      	var url = tabs[0].url;
      	var domain = focuson.util.extractsDomain(url);

      	// pertama, cek pilihan time management
				focuson.storage.loadTimeManagement(function(data){
					console.log(data);
		      if (typeof data[0].type === "undefined") {
		      	alert("Please set Time Management");
		      	return;
		      }
		      var time_management_type = data[0].type;

		      // kalo misal always block
		      if (time_management_type === 0) {
		        // console.log('Your last setting: always block');

		        // load blocked sites -> BLOCK
						focuson.storage.loadBlockedUrls(function(data){
							var blockedUrls = data;
							var blockedUrls_array = []; // populated blockedUrls into one array
							$.map(blockedUrls, function(obj, index){
								var blockedUrl = obj.url;
								blockedUrls_array.push(blockedUrl);
							});
							console.log(blockedUrls_array);
							// kalo domain yang dicari di kolom pencarian ada sama dengan yang di array blockedUrls_array,
							if ($.inArray(domain, blockedUrls_array) > -1) {
								// maka arahkan ke halaman block.html
								chrome.tabs.update({url: chrome.extension.getURL("block.html") + "#" + domain});
								return {redirectUrl: chrome.extension.getURL("block.html") + "#" + domain};
							}
							else {
								// kalo ngga maka bisa browsing
							}
						}); // end loadBlockedUrls
		      }

		      // kalo misal work time, cek settingannya
		      else if (time_management_type === 1) {
		        // alert('Your last setting: set my work time');
		        var days = data[0].days;
		        var start_time = data[0].start_time;
		        var start_time_ms = focuson.timer.getTimeMilliseconds(start_time); // convert to milliseconds
		        var finish_time = data[0].finish_time;
		        var finish_time_ms = focuson.timer.getTimeMilliseconds(finish_time); // convert to milliseconds
		        var current_time_ms = chrome.extension.getBackgroundPage().current_time_ms;	        
		        
		        // cek hari ini, apakah sama dengan data yang ada di days?
		        if ($.inArray(day, days) > -1) {
		        	// kalo hari ini termasuk hari yang dilarang, cek waktunya
		        	if (current_time_ms < start_time_ms || current_time_ms > finish_time_ms ) {
		        		// kalo waktu sekarang diluar dari jam kerja (out of work time), maka boleh
			          // console.log('di luar jam kerja');
			          return;
			        } 
			        else {
			        	// kalo masih di jam kerja, ga boleh (block)
			          // console.log("masih jam kerja");

			          // load blocked sites -> BLOCK
								focuson.storage.loadBlockedUrls(function(data){
									var blockedUrls = data;
									var blockedUrls_array = []; // populated blockedUrls into one array
									$.map(blockedUrls, function(obj, index){
										var blockedUrl = obj.url;
										blockedUrls_array.push(blockedUrl);
									});				
									// kalo domain yang dicari di kolom pencarian ada sama dengan yang di array blockedUrls_array,
									if ($.inArray(domain, blockedUrls_array) > -1) {
										// maka arahkan ke halaman block.html
										chrome.tabs.update({url: chrome.extension.getURL("block.html") + "#" + domain});
										return {redirectUrl: chrome.extension.getURL("block.html") + "#" + domain};
									}
									else {
										// kalo ngga maka bisa browsing
									}
								}); // end loadBlockedUrls

			          return;
			        }		        
		        	// console.log('hari ini ga boleh browsing');
		        	return;
		        } 
		        else {
		        	// kalo hari ini bukan hari yang dilarang, maka diperbolehkan untuk browsing
		        	// console.log('hari ini boleh browsing');
		        	// var code = setInterval(function(){alert('hari ini boleh browsing');}, 2000);
		        	// chrome.tabs.executeScript(info.tabId, {code:'document.body.style.backgroundColor="blue"'});
		        	return;
		        }
		      }
				});	// end load time management
      }); // end chrome.tabs.query
		}, // end checkPreference function
		checkPopupTurnOff: function() {
		},
		checkPopupTurnOnTest: function(){
			chrome.tabs.query({}, function(tabs){
				tabs.forEach(function(tab){
					var tabId = tab.id;
					var tabDomain = focuson.util.extractsDomain(tab.url);
					console.log(tabId);
					console.log(tabDomain);

					// not allowed to inject the chrome webstore
					/*if (tab.url.indexOf('https://chrome.google.com') == 0) {
		        return;
		      }*/
		      if (tabDomain === "chrome:" || tabDomain === "chrome-extension:") {
		      	return;
		      }

		      chrome.tabs.executeScript(tabId, {file: 'assets/jquery.min.js'});
		    //   chrome.tabs.executeScript(tabId, {code: 'var focuson = focuson;'}, function(){
			  	// 	chrome.tabs.executeScript(tabId, {file: 'checktab.js'});
			  	// });
			  	chrome.tabs.executeScript(tabId, {file: 'checktab.js'}, function(){
			  		chrome.tabs.sendMessage(tabId, {msg: focuson}, function(response){

			  		});
			  	});
				});
			});
		},

	},
	storage : {
		loadWormholes: function(callback) {
			// apa sih ini maksudnya, ngga ngerti :(
			if (typeof callback === "undefined") {
				callback = function(){};
			}
			if (!focuson.wormholes) {
				chrome.storage.sync.get(function(items) {
					focuson.wormholes = {};
					for (var key in items)
					{
						if (key === FOCUSON_STATE_SETTING ||
							key === TIMER_DATA_DATE_SETTING ||
							key === TIMER_DATA_SETTING ) 
						{
							// not a wormhole
							continue;
						}
						// a wormhole definition.
						// var wormhole = focuson.util.safeJSON(items[key], null);
						
					}
				});
			}
			else {
				callback();
			}
		},
		toggleFocusButtonPreference: function(enabled) {
			if (enabled)
      {
        // remove this setting, it's on by default
        chrome.storage.sync.remove(FOCUSON_STATE_SETTING);
        console.log('enabled: '+enabled);

      //   chrome.tabs.query({}, function(tabs){
      //   	tabs.forEach(function(tab){
      //   		var tabId = tab.id;
						// var tabDomain = focuson.util.extractsDomain(tab.url);

						// // not allowed to inject the chrome webstore
			   //    if (tabDomain === "chrome:" || tabDomain === "chrome-extension:") {
			   //    	return;
			   //    }

			   //    // pertama, cek pilihan time management
						// focuson.storage.loadTimeManagement(function(data){
						// 	if (data[0].type === "undefined") {
						// 		alert('Set your time management first');
						// 		return;
						// 	}
				  //     var time_management_type = data[0].type;

				  //     // kalo misal always block
				  //     if (time_management_type === 0) {
				  //       console.log('Your last setting: always block');

				  //       // load blocked sites -> BLOCK
						// 		focuson.storage.loadBlockedUrls(function(data){
						// 			var blockedUrls = data;
						// 			var blockedUrls_array = []; // populated blockedUrls into one array
						// 			$.map(blockedUrls, function(obj, index){
						// 				var blockedUrl = obj.url;
						// 				blockedUrls_array.push(blockedUrl);
						// 			});
						// 			// kalo domain yang dicari di kolom pencarian ada sama dengan yang di array blockedUrls_array,
						// 			if ($.inArray(tabDomain, blockedUrls_array) > -1) {
						// 				// maka arahkan ke halaman block.html
						// 				chrome.tabs.update(tabId, {url: chrome.extension.getURL("block.html") + "#" + tabDomain});
						// 				// return {redirectUrl: chrome.extension.getURL("block.html") + "#" + tabDomain};
						// 			}
						// 			else {
						// 				// kalo ngga maka bisa browsing
						// 			}
						// 		}); // end loadBlockedUrls
				  //     }

				  //     // kalo misal work time, cek settingannya
				  //     else if (time_management_type === 1) {
				  //       // alert('Your last setting: set my work time');
				  //       var days = data[0].days;
				  //       var start_time = data[0].start_time;
				  //       var start_time_ms = focuson.timer.getTimeMilliseconds(start_time); // convert to milliseconds
				  //       var finish_time = data[0].finish_time;
				  //       var finish_time_ms = focuson.timer.getTimeMilliseconds(finish_time); // convert to milliseconds
				  //       var current_time_ms = chrome.extension.getBackgroundPage().current_time_ms;
				        
				  //       /*console.log('current_time :'+current_time_ms);
				  //       console.log('start_time: '+start_time_ms);
				  //       console.log('finish_time: '+finish_time_ms);*/
				        
				  //       // cek hari ini, apakah sama dengan data yang ada di days?
				  //       if ($.inArray(day, days) > -1) {
				  //       	// kalo hari ini termasuk hari yang dilarang, cek waktunya
				  //       	if (current_time_ms < start_time_ms || current_time_ms > finish_time_ms ) {
				  //       		// kalo waktu sekarang diluar dari jam kerja (out of work time), maka boleh
					 //          console.log('di luar jam kerja');
					 //          return;
					 //        } 
					 //        else {
					 //        	// kalo masih di jam kerja, ga boleh (block)
					 //          console.log("masih jam kerja");

					 //          // load blocked sites
						// 				focuson.storage.loadBlockedUrls(function(data){
						// 					var blockedUrls = data;
						// 					var blockedUrls_array = []; // populated blockedUrls into one array
						// 					$.map(blockedUrls, function(obj, index){
						// 						var blockedUrl = obj.url;
						// 						blockedUrls_array.push(blockedUrl);
						// 					});				
						// 					// kalo tabDomain yang dicari di kolom pencarian ada sama dengan yang di array blockedUrls_array,
						// 					if ($.inArray(tabDomain, blockedUrls_array) > -1) {
						// 						// maka arahkan ke halaman block.html
						// 						chrome.tabs.update(tabId, {url: chrome.extension.getURL("block.html") + "#" + tabDomain});
						// 						// return {redirectUrl: chrome.extension.getURL("block.html") + "#" + tabDomain};
						// 					}
						// 					else {
						// 						// kalo ngga maka bisa browsing
						// 					}
						// 				}); // end loadBlockedUrls

					 //          return;
					 //        }		        
				  //       	console.log('hari ini ga boleh browsing');
				  //       	return;
				  //       } 
				  //       else {
				  //       	// kalo hari ini bukan hari yang dilarang, maka diperbolehkan untuk browsing
				  //       	console.log('hari ini boleh browsing');
				  //       	// chrome.tabs.executeScript({code:alert('hari ini boleh browsing')});
				  //       	return;
				  //       }
				  //     }
						// });	// end of load time management
      //   	}); // end of tab forEach
      //   }); // end of tabs.query

        /*// logika turn on focus mode button
        // pertama cek apakah tab aktif tersebut masuk ke dalam blocked sites, kalo iya maka redirect ke block page
        chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function(tabs) {
        	var tabId = tabs[0].id;
        	var tabUrl = tabs[0].url;
        	var tabDomain = focuson.util.extractsDomain(tabUrl);

        	focuson.storage.loadBlockedUrls(function(data){
        		var blockedUrls = data;
        		var blockedUrls_array = [];
						$.map(blockedUrls, function(obj, index){
							var blockedUrl = obj.url;
							blockedUrls_array.push(blockedUrl);
						});

						if ($.inArray(tabDomain, blockedUrls_array) > 0) {
							console.log('ada');
							chrome.tabs.update({url: "chrome-extension://" + extension_id + "/block.html#" + tabDomain});
						}
        	});
        });*/

        // end of first logic

        /*// load blockedSites, then check tab active is a blocked sites or not?
        focuson.storage.loadBlockedUrls(function(data){
        	var blockedUrls = data;
        	console.log(blockedUrls);
        	chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function(tabs) {
        		var tabUrl = tabs[0].url;
        		if (tabUrl === "chrome-extension://"+ extension_id +"/block.html#") {
        			var blockedDomain = tabUrl.split('#')[1];
			      	var blockedUrls_array = [];
							$.map(blockedUrls, function(obj, index){
								var blockedUrl = obj.url;
								blockedUrls_array.push(blockedUrl);
							});

							if ($.inArray(blockedDomain, blockedUrls_array) > 0) {
								// kalo ngga ada, ngga ngapus data tapi redirect ke domain yang ingin dituju
								chrome.tabs.update({url: "http://"+blockedDomain});
								return;
							}
        		}
        	});
        });*/


        // cek logika kedua, panggil setupWormholeListener() function
        // focuson.util.checkPopupTurnOnTest();
     
      }
      else 
      {
        // set it to off in settings
        var setting = {};
        setting[FOCUSON_STATE_SETTING] = "NO";
        chrome.storage.sync.set(setting);
        
      /*  chrome.tabs.query({}, function(tabs){
        	tabs.forEach(function(tab){
        		var tabId = tab.id;
						var tabDomain = focuson.util.extractsDomain(tab.url);

						// not allowed to inject the chrome webstore
			      if (tabDomain === "chrome:" || tabDomain === "chrome-extension:") {
			      	return;
			      }


			      // pertama, cek pilihan time management
						focuson.storage.loadTimeManagement(function(data){
				      var time_management_type = data[0].type;

				      // kalo misal always block
				      if (time_management_type === 0) {
				        console.log('Your last setting: always block');

				        // load blocked sites -> BLOCK
								focuson.storage.loadBlockedUrls(function(data){
									var blockedUrls = data;
									var blockedUrls_array = []; // populated blockedUrls into one array
									$.map(blockedUrls, function(obj, index){
										var blockedUrl = obj.url;
										blockedUrls_array.push(blockedUrl);
									});
									// kalo domain yang dicari di kolom pencarian ada sama dengan yang di array blockedUrls_array,
									if ($.inArray(tabDomain, blockedUrls_array) > -1) {
										// maka arahkan ke halaman block.html
										chrome.tabs.update(tabId, {url: chrome.extension.getURL("block.html") + "#" + tabDomain});
										// return {redirectUrl: chrome.extension.getURL("block.html") + "#" + tabDomain};
									}
									else {
										// kalo ngga maka bisa browsing
									}
								}); // end loadBlockedUrls
				      }

				      // kalo misal work time, cek settingannya
				      else if (time_management_type === 1) {
				        // alert('Your last setting: set my work time');
				        var days = data[0].days;
				        var start_time = data[0].start_time;
				        var start_time_ms = focuson.timer.getTimeMilliseconds(start_time); // convert to milliseconds
				        var finish_time = data[0].finish_time;
				        var finish_time_ms = focuson.timer.getTimeMilliseconds(finish_time); // convert to milliseconds
				        var current_time_ms = chrome.extension.getBackgroundPage().current_time_ms;
				        
				        console.log('current_time :'+current_time_ms);
				        console.log('start_time: '+start_time_ms);
				        console.log('finish_time: '+finish_time_ms);
				        
				        // cek hari ini, apakah sama dengan data yang ada di days?
				        if ($.inArray(day, days) > -1) {
				        	// kalo hari ini termasuk hari yang dilarang, cek waktunya
				        	if (current_time_ms < start_time_ms || current_time_ms > finish_time_ms ) {
				        		// kalo waktu sekarang diluar dari jam kerja (out of work time), maka boleh
					          console.log('di luar jam kerja');
					          return;
					        } 
					        else {
					        	// kalo masih di jam kerja, ga boleh (block)
					          console.log("masih jam kerja");

					          // load blocked sites
										focuson.storage.loadBlockedUrls(function(data){
											var blockedUrls = data;
											var blockedUrls_array = []; // populated blockedUrls into one array
											$.map(blockedUrls, function(obj, index){
												var blockedUrl = obj.url;
												blockedUrls_array.push(blockedUrl);
											});				
											// kalo tabDomain yang dicari di kolom pencarian ada sama dengan yang di array blockedUrls_array,
											if ($.inArray(tabDomain, blockedUrls_array) > -1) {
												// maka arahkan ke halaman block.html
												chrome.tabs.update(tabId, {url: chrome.extension.getURL("block.html") + "#" + tabDomain});
												// return {redirectUrl: chrome.extension.getURL("block.html") + "#" + tabDomain};
											}
											else {
												// kalo ngga maka bisa browsing
											}
										}); // end loadBlockedUrls

					          return;
					        }		        
				        	console.log('hari ini ga boleh browsing');
				        	return;
				        } 
				        else {
				        	// kalo hari ini bukan hari yang dilarang, maka diperbolehkan untuk browsing
				        	console.log('hari ini boleh browsing');
				        	// chrome.tabs.executeScript({code:alert('hari ini boleh browsing')});
				        	return;
				        }
				      }
						});	// end of load time management
        	}); // end of tab forEach
        }); // end of tabs.query*/
      }
		},
		loadTimeManagement: function(callback) {
			if (typeof callback === "undefined") {
				callback = function(){};
			}
			chrome.storage.sync.get({dataTimeManagement: []}, function(result){
				var data = result.dataTimeManagement;				
				callback(data);
			});
		},
		loadBlockedUrls: function(callback) {
			if (typeof callback === "undefined") {
				callback = function(){};
			}
			chrome.storage.sync.get({dataUrl: []}, function(result){
				var data = result.dataUrl;
				callback(data);
				/*$.map(data, function(val, index){
					var blockedUrls = val.url;
					focuson.blockedUrls = blockedUrls;
					callback(focuson.blockedUrls);
				});*/
			});
		},
		loadTodos: function(callback) {
			if (typeof callback === "undefined") {
				callback = function(){};
			}
			chrome.storage.sync.get({dataTodo: []}, function(result){
				var data = result.dataTodo;
				callback(data);
				/*$.map(data, function(obj, index){
					var deadline = obj.deadline;
					var task = obj.task;
					callback(deadline,task);
				});*/
			});
		},
		/*loadTimeInterrupt: function(callback) {
			if (typeof callback === "undefined") {
				callback = function(){};
			}
			chrome.storage.sync.get({dataTimeInterrupt: dataTimeInterrupt}, function(result){
				var data = result.dataTodo;
				callback(data);
			});
		}*/
		togglePomodoro: function(enabled) {
			if (enabled) {
				// console.log('pomodoro enabled');
				chrome.storage.sync.remove(POMODORO_STATE_SETTING);
				// chrome.storage.sync.get({dataTimeout: []}, function(data){
				// 	var timeout = data.dataTimeout;
				// 	console.log(timeout);
				// 	timeout.push({
				// 		// timeFocus: 25*60,
				// 		// timeRest: 3*60
				// 		timeFocus: 1*10,
				// 		timeRest: 1*10
				// 	});
				// 	chrome.storage.sync.set({dataTimeout: timeout}, function(res){
				// 		var timeFocus = timeout[0].timeFocus;
				// 		var timeRest = timeout[0].timeRest;
				// 		return focuson.timer.startPomodoro(timeFocus);
				// 	});
				// });				
				var timeFocus = 10;
				// console.log(focuson.timer.startPomodoro(timeFocus));
				// return focuson.timer.startPomodoro(timeFocus);
				console.log('start focus');
				// return;
			}
			else {
				// console.log('pomodoro disabled');
				var setting = {};
				setting[POMODORO_STATE_SETTING] = "NO";
				chrome.storage.sync.set(setting);
				// clearInterval(countdown); // stop the timer
				/*chrome.storage.sync.get({dataTimeout: []}, function(data){
					var timeout = data.dataTimeout;
					// var timeFocus = timeout[0].timeFocus;
					// var timeRest = timeout[0].timeRest;
					timeout.length = 0;
					chrome.storage.sync.set({dataTimeout: timeout}, function(res){
						console.log('stopping');
						clearInterval(countdownFocus); // stop the timer
					// return focuson.timer.endPomodoro(timeRest);
					});
				});*/
				// clearInterval(countdownFocus);
				console.log('stopping');
			}
		}
	},
	tab: {
    getActiveTabInTopWindow: function(callback){
      chrome.windows.getLastFocused(function(winInfo){
        if (!winInfo || !winInfo.focused)
        {
          callback();
          return;
        }
        chrome.tabs.query({active: true, windowId: winInfo.id}, function(tabInfo){
          if (!tabInfo || tabInfo.length == 0)
          {
            callback();
            return;
          }
          callback(tabInfo[0].id);
        })
      });
    }
  },
	timer : {
		// fungsi convert waktu ke millisecond (source: http://jsfiddle.net/qs3XZ/)
	  // untuk logika work time
	  getTimeMilliseconds: function(timeString) {
	    var t = timeString.match(/(\d{1,2}):(\d{2}) ([AP]M)/);
	    return new Date(0).setUTCHours(parseInt(t[1], 10) + (t[3] === 'AM'? 0 : 12), parseInt(t[2], 10));
	  },
	  // source: https://stackoverflow.com/questions/19700283/how-to-convert-time-milliseconds-to-hours-min-sec-format-in-javascript
	  msToTime: function(duration) {
	  	var milliseconds = parseInt((duration%1000)/100), 
	  			seconds = parseInt((duration/1000)%60),
	  			minutes = parseInt((duration/(1000*60))%60),
	  			hours = parseInt((duration/(1000*60*60))%24);

      hours = (hours < 10) ? "0" + hours : hours;
      minutes = (minutes < 10) ? "0" + minutes : minutes;
      seconds = (seconds < 10) ? "0" + seconds : seconds;

      return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
	  },
	  startPomodoro: function(duration) {
	  	var timer = duration, minutes, seconds;
	  	countdownFocus = setInterval(function(){
	  		minutes = parseInt(timer / 60, 10);
	  		seconds = parseInt(timer % 60, 10);

	  		minutes = minutes < 10 ? "0" + minutes : minutes;
	  		seconds = seconds < 10 ? "0" + seconds : seconds;

	  		console.log(minutes + ":" + seconds);

	  		if (--timer < 0) {
	  			alert('Focus time pomodoro finished. Now take a rest!');
					clearInterval(countdownFocus);
	  			// return focuson.timer.startRest(5); // 3 minutes to rest, masih test
	  			return focuson.timer.startRest(5);
	  		}
	  	}, 1000);
	  },
	  startRest: function(duration) {
	  	var timer = duration, minutes, seconds;
	  	countdownRest = setInterval(function(){
	  		minutes = parseInt(timer / 60, 10);
	  		seconds = parseInt(timer % 60, 10);

	  		minutes = minutes < 10 ? "0" + minutes : minutes;
	  		seconds = seconds < 10 ? "0" + seconds : seconds;

	  		console.log(minutes + ":" + seconds);

	  		if (--timer < 0) {
	  			alert('Rest time pomodoro finished. Go back to focus mode');
	  			clearInterval(countdownRest);
	  			return focuson.timer.startPomodoro(10); // 25 minutes to focus, masih test
	  		}
	  	}, 1000);
	  }
		/*loadTimers: function() {
			if (typeof callback === "undefined")
			{
				callback = function(){};
			}
			chrome.storage.sync.get(TIMER_DATA_DATE_SETTING, function(items) {
				var now = new Date();
				var currentDate = now.getFullYear()+"/"+(now.getMonth()+1)+"/"+now.getDate();
				var timerDataDate = null;
				if (typeof items[TIMER_DATA_DATE_SETTING] !== "undefined")
				{
					timerDataDate = items[TIMER_DATA_DATE_SETTING];
				}
				if (currentDate !== timerDataDate) 
				{
					// ok dates don't match, another day. reset the timers
					focuson.timers = {};
					callback(focuson.timers);
					focuson.timer.saverTimers();
				}
				else {
					// ok there is some data for today. load it.
					chrome.storage.sync.get(TIMER_DATA_SETTING, function(items) {
						if (typeof items[TIMER_DATA_SETTING] !== "undefined") {
							// load the timer.
							var timers = focuson.util.safeJSON(items[TIMER_DATA_SETTING], {});
							focuson.timers = timers;
							callback(focuson.timers);
						}
						else {
							// fall back.
							focuson.timers = {};
							callback(focuson.timers);
						}
					});
				}
			}); // end chrome.storage.sync.get
		} // end loadTimers
		,
		saveTimers: function(){
      chrome.storage.sync.get(TIMER_DATA_DATE_SETTING, function(items) {
        var timerDataDate = items[TIMER_DATA_DATE_SETTING];
        var now = new Date();
        var currentDate = now.getFullYear()+"/"+(now.getMonth()+1)+"/"+now.getDate();
        if (currentDate !== timerDataDate) {
          // we are in a new day. clear timer
          focuson.timers = {};
        }
        var items = {};
        items[TIMER_DATA_DATE_SETTING] = currentDate;
        items[TIMER_DATA_SETTING] = JSON.stringify(focuson.timers);
        chrome.storage.sync.set(items);
      });
    },*/		
	},
	validate : {
		domain : function(domain)
		{
			if (!domain || domain.length === 0 || !focuson.util.isValidDomain(domain))
			{
				return "Invalid domain: " + domain + ". Eg. facebook.com";
			}
			return null;
		}
	}
};


var delay = 1000;
var current_time = d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
var current_time_ms = focuson.timer.getTimeMilliseconds(current_time);






