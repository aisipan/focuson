$(function(){

	var bg = chrome.extension.getBackgroundPage();
  var focuson = bg.focuson;
  var id = bg.extension_id;
  var reload_code = 'window.location.reload();';

  console.log(bg.countdownFocus);
  console.log(bg.countdownRest);

	// var toggleButton = $("#focus-switch-button");

	document.getElementById('option_page').onclick = openOps;

	function openOps(){
		chrome.runtime.openOptionsPage();
	}

	function getRuntime() {
		return chrome.runtime.onMessage ? chrome.runtime : chrome.extension;
	}


	// ngeload dataUrl
	focuson.storage.loadBlockedUrls(function(data){
		var blockedUrls = data;

		// ngedetect url di tab
		chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function(tabs) {
			var tabUrl = tabs[0].url;
			var tabDomain = focuson.util.extractsDomain(tabUrl);

			// check kalo misal,
			// tabDomain === data yang ada di blockedUrls
			function findMatchingBlockedUrl(prop) {
				return prop.url === tabDomain;
			}
			
			var isMatch = blockedUrls.find(findMatchingBlockedUrl);

			// kalo misal url di tabnya "chrome-extension://"+id+"/options.html" (maka can't block)
			// (halaman options.html)
			if (typeof isMatch === "undefined" && tabUrl === "chrome-extension://"+id+"/options.html") {
				console.log("Can't block this site");
				$("#blockState").text("Can't block this site");
				$("#blockState").prepend("<i class='fa fa-warning'></i> ");
			}

			// kalo misal domain di tabnya "chrome-extension:" (maka unblock)
			// posisi di mana focuson aktif dan menampilkan block.html#domainnya
			else if (typeof isMatch === "undefined" && tabDomain === "chrome-extension:") {
				var blockedDomain = tabUrl.split('#')[1]; // get the blocked domain after # in the url

				// pertama cek apakah domain yang ingin diakses itu masih ada di daftar blocked sites atau tidak
				var blockedUrls_array = [];
				$.map(blockedUrls, function(obj, index){
					var blockedUrl = obj.url;
					blockedUrls_array.push(blockedUrl);
				});

				if ($.inArray(blockedDomain, blockedUrls_array) < 0) {
					// kalo ngga ada, ngga ngapus data tapi redirect ke domain yang ingin dituju
					$("#blockState").text("Already unblocked. Go to "+blockedDomain);
					$("#blockState").prepend("<i class='fa fa-warning'></i> ");
					$("#blockState").click(function(){
						chrome.tabs.update({url: "http://"+blockedDomain});
            location.reload();
					});
					return;
				} 
				else {
					// kalo ada, ngapus data dulu baru redirect ke domain yang ingin dituju
					$("#blockState").text("Unblock this site");
					$("#blockState").prepend("<i class='fa fa-remove'></i> ");
					$("#blockState").click(function(){
						// nyari key/index array di blockedUrls supaya bisa displice/dihapus dari array tersebut
						var indexes = $.map(blockedUrls, function(obj, index){
							if (obj.url === blockedDomain) {							
								return index; // ngereturn indexnya
							}
						});					
						var indexOfUrl = indexes[0]; // supaya get key nya
	          var remove = blockedUrls.splice(indexOfUrl,1);
	          if (remove) {
	            chrome.storage.sync.set({dataUrl: blockedUrls}, function(){
	            	// removed
	            	chrome.tabs.update({url: "http://"+blockedDomain});
	            	// balikin jadi "block this site"
	            	location.reload();
	            });
	          }
					}); // end of unblock click function
					return;
				}
			}

			// kalo misal domain di tabnya chrome: (maka can't block)
			else if (typeof isMatch === "undefined" && tabDomain === "chrome:") {
				console.log("Can't block this site");
				$("#blockState").text("Can't block this site");
				$("#blockState").prepend("<i class='fa fa-warning'></i> ");
			}

			// kalo misal url itu belum diblock atau tidak masuk ke blocked sites (maka block)
			// pengen ngeblock site
			else if (typeof isMatch === "undefined") {
				console.log("Block this site");
				$("#blockState").text("Block this site");
        $("#blockState").prepend("<i class='fa fa-ban'></i> ");

				// saving button to block url in active tab
				$("#blockState").click(function(){
          var push = blockedUrls.push({url: tabDomain});
          if (push) {
          	chrome.storage.sync.set({dataUrl: blockedUrls}, function(){    
	            // added
	            // ubah ke "unblock this site"
	            location.reload();
	            chrome.tabs.update({url: chrome.extension.getURL("block.html") + "#" + tabDomain});
	          });	
          }
				}); // end add to block
			}

			// kalo misal data yang ada diblok site property urlnya === tab domain nya (maka unblock)
			// posisi di mana focuson ga aktif
			else if (isMatch.url === tabDomain) {
				console.log("Unblock this site");
				$("#blockState").text("Unblock this site");
        $("#blockState").prepend("<i class='fa fa-remove'></i> ");

				$("#blockState").click(function(){
					// nyari key/index array di blockedUrls supaya bisa displice/dihapus dari array tersebut
					var indexes = $.map(blockedUrls, function(obj, index){
						if (obj.url === tabDomain) {							
							return index; // ngereturn indexnya
						}
					});					
					var indexOfUrl = indexes[0]; // supaya get key nya
          var remove = blockedUrls.splice(indexOfUrl,1);
          if (remove) {
            chrome.storage.sync.set({dataUrl: blockedUrls}, function(){
            	// removed
            	location.reload();
            });
          }
				}); // end of unblock click function
			}

		}); // end of chrome.tabs.query
	}); // end of focuson.storage.loadBlockedUrls
	

  function toggleFocusButtons(disabled) {
  	if (disabled) {		
      console.log('off---');
  	} else {
      console.log('on---');
    }
  }

  // ngeinisiasi ketika popup itu dibuka
  function checkFocusPreference() {
    getRuntime().sendMessage({type: "getFocusPreference"}, function(response){
      var disabled = response.off; // keadaan mati (true/false?)
      toggleFocusButtons(disabled);
      if (disabled) {
      	$("#focus-switch-button").bootstrapToggle('off');
        // console.log('mati');
      } else {
      	$("#focus-switch-button").bootstrapToggle('on');
        // console.log('nyala');
      }

      var toggleButton = $("#focus-switch-button");

		  toggleButton.on("change", function(){
		    var disabled = !$(this).prop("checked");
		    getRuntime().sendMessage({
		      type: "toggleFocusPreference",
		      disabled: disabled
		    });
		    toggleFocusButtons(disabled);
		  });
    });
  }
  checkFocusPreference();

});
  
