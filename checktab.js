// pertama, cek pilihan time management
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	console.log(request.msg);
	var focuson = request.msg;


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
							// kalo tabDomain yang dicari di kolom pencarian ada sama dengan yang di array blockedUrls_array,
							if ($.inArray(tabDomain, blockedUrls_array) > -1) {
								// maka arahkan ke halaman block.html
								chrome.tabs.update({url: chrome.extension.getURL("block.html") + "#" + tabDomain});
								return {redirectUrl: chrome.extension.getURL("block.html") + "#" + tabDomain};
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
									// kalo tabDomain yang dicari di kolom pencarian ada sama dengan yang di array blockedUrls_array,
									if ($.inArray(tabDomain, blockedUrls_array) > -1) {
										// maka arahkan ke halaman block.html
										chrome.tabs.update({url: chrome.extension.getURL("block.html") + "#" + tabDomain});
										return {redirectUrl: chrome.extension.getURL("block.html") + "#" + tabDomain};
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
});
				