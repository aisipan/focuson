;
'use strict';

var extension_id = chrome.runtime.id;
var FOCUSON_STATE_SETTING = "FOCUSON_STATE";
var TIME_MANAGEMENT_SETTING = "TIME_MANAGEMENT";
var TIMER_DATA_DATE_SETTING = "TIMER_DATA_DATE";
var TIMER_DATA_SETTING = "TIME_DATA";

var TIME_MANAGEMENT_TYPE;

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
      	chrome.browserAction.setIcon({path:"icons/icon-on.png"});
        // remove this setting, it's on by default
        chrome.storage.sync.remove(FOCUSON_STATE_SETTING);
      }
      else 
      {
      	chrome.browserAction.setIcon({path:"icons/icon-off.png"});
        // set it to off in settings
        var setting = {};
        setting[FOCUSON_STATE_SETTING] = "NO";
        chrome.storage.sync.set(setting);
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
			});
		},
		loadTodos: function(callback) {
			if (typeof callback === "undefined") {
				callback = function(){};
			}
			chrome.storage.sync.get({dataTodo: []}, function(result){
				var data = result.dataTodo;
				callback(data);
			});
		},
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
          callback(tabInfo[0]);
        });
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
