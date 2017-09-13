(function(){
	'use strict';

	var focusOff = true; // turnOff at first initiate
	var pomodoroOff = true; // me too
	var tabIdToDomain = {};

	function getCurrentTime() {
		// update variabel current_time_ms tiap detik nambah 1000
		current_time_ms = current_time_ms + delay;
	}

	function blockOrNot() {
		// cek tombol focus mode aktif/tidak aktif
		if (focusOff) {
			// ngecek tab block page, terus diredirect ke domain aslinya soalnya focuson ga aktif
	    focuson.tab.getActiveTabInTopWindow(function(tabData){
	    	if (!tabData) {
	    		return;
	    	}
	    	if (typeof tabData === "undefined") {
	    		return;
	    	}
	    	var tabId = tabData.id;
	    	var tabUrl = tabData.url;
	    	var tabDomain = focuson.util.extractsDomain(tabUrl);
	    	// console.log(tabUrl);

	    	if (tabDomain === "chrome-extension:") {
	    		if (tabUrl.split('#')[0] === "chrome-extension://" + extension_id + "/block.html") {
	    			var blockedDomain = tabUrl.split('#')[1];
	    			chrome.tabs.update(tabId, {url: "http://" + blockedDomain});
	    		}
	    	}
	    });

			return;
		}
		
		focuson.storage.loadTimeManagement(function(data){
			if (typeof data === "undefined") {
      	// alert("Set your time management first");
      	return;
      }
			if (typeof data[0].type === "undefined") {
      	// alert("Set your time management first");
      	return;
      }
	    var time_management_type = data[0].type;

	    focuson.tab.getActiveTabInTopWindow(function(tabData){
	    	if (!tabData) {
	    		return;
	    	}
				if (typeof tabData === "undefined") {
					return;
				}
				var tabId = tabData.id;
				var tabDomain = focuson.util.extractsDomain(tabData.url);
				// if (typeof tabDomain === "undefined" || tabDomain === "") {
				// 	return;
				// }
				console.log(tabData);
				// console.log(time_management_type);

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
						if ($.inArray(tabDomain, blockedUrls_array) > -1) {
							// maka arahkan ke halaman block.html
							chrome.tabs.update(tabId, {url: chrome.extension.getURL("block.html") + "#" + tabDomain});
							// return {redirectUrl: chrome.extension.getURL("block.html") + "#" + tabDomain};
						}
						else {
							// kalo ngga maka bisa browsing
						}
					}); // end loadBlockedUrls
	      } // end always block

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
	      } // end of work time


			}); // end of getActiveTabInTopWindow


	  });
	}
	setInterval(blockOrNot, 1000);

	setInterval(getCurrentTime, delay);

	function getRuntime(){
		return chrome.runtime.onMessage ? chrome.runtime : chrome.extension;
	}

	var setupWormholeListener = function() {

		getRuntime().onMessage.addListener(function(request, sender, sendResponse) {
			if (request.type === "getFocusPreference") { // koneksi dengan popup.js
				sendResponse({off: focusOff}); // sending keadaan mati (true / false ?)
				// console.log('focusOff: '+focusOff);
			}
			else if (request.type === "toggleFocusPreference") { // koneksi dengan popup js
				focusOff = request.disabled;
				if (focusOff) {
					
				}				
				focuson.storage.toggleFocusButtonPreference(!request.disabled, function(response){
					// sendResponse("");
					console.log(response);
				});
				console.log('focusOff: '+focusOff);
			} 
			else if (request.type === "addManualBlock") {
				var domain = request.domain;
				var error = focuson.validate.domain(domain);
				if (error) {
					sendResponse({error:error});
					return true;
				}
				focuson.storage.loadBlockedUrls(function(data){
					var blockedUrls = data;
					var push = blockedUrls.push({url: domain});
					if (push) {
						chrome.storage.sync.set({dataUrl: blockedUrls}, function(){
							sendResponse({ok:true});
						});
					}
				});
				return true;
			}
			else if (request.type === "getPomodoroPreference") {
				sendResponse({off: pomodoroOff});
			}
			else if (request.type === "togglePomodoro") {
				pomodoroOff = request.disabled;
				focuson.storage.togglePomodoro(!pomodoroOff, function(response){
					sendResponse("");
				});
			}
			sendResponse("");
			return true;
		});
		
	};
	
	var init = function() {
		focuson.storage.loadWormholes(function(){
			// read settings
			chrome.storage.sync.get(FOCUSON_STATE_SETTING, function(items) {
				if (items[FOCUSON_STATE_SETTING] === "NO") {
					focusOff = true;
				}
			});
			chrome.storage.sync.get(POMODORO_STATE_SETTING, function(items) {
				if (items[POMODORO_STATE_SETTING] === "NO") {
					pomodoroOff = true;
				}
			});
		});

		setupWormholeListener();
	};

	return {
		init: init
	};

})().init();




