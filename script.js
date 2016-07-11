function chainCB(funcs) {
    if (funcs.length > 0) {
	var head = funcs[0];
	funcs.shift();
	head(function () {
	    chainCB(funcs);
	});
    }
}

function moveTabsAction(tabIds, window, index) {
    return function(cb) {
	var windowId = parseInt(window.attr("windowId"));
	var options = {windowId : windowId, index : index};
	chrome.tabs.move(tabIds, options, function() {
	    var curTime = new Date().getTime();
	    cb();
	});
    };
}

function addFakeTabAction(windowId, fakeTabIds) {
    return function(cb) {
	var options = {windowId : windowId, };
	chrome.tabs.create(options, function(tab) {
	    fakeTabIds.push(tab.id);
	    cb();
	});
    };
}

function createTabAction(window, index, url) {
    return function(cb) {
	var windowId = parseInt(window.attr("windowId"));
	var options = {windowId : windowId, index : index, url : url};
	chrome.tabs.create(options, function() {
	    cb();
	});
    };
}

function removeTabsAction(toBeRemoved) {
    return function(cb) {
	chrome.tabs.remove(toBeRemoved, function() {
	    cb();
	});
    };
}

function removeLastTab(window) {
    return function(cb) {
	var windowId = parseInt(window.attr("windowId"));
	chrome.windows.get(windowId, {populate:true}, function (w) {
	    var tabs = w.tabs;
	    var lastTabId = tabs[tabs.length-1].id;
	    chrome.tabs.remove([lastTabId], function() {
		cb();
	    });
	});
    };
}

function removeWindowAction(windowId) {
    return function(cb) {
	chrome.window.remove(windowId, function() {
	    cb();
	});
    };
}

function update(oldDOM, newDOM) {
    var actions = [];
    var fakeTabIds = [];

    // init windows
    var nbTabs = [];
    oldDOM.find("window").each(function() {
	var window = $(this);
	var windowId = parseInt(window.attr("windowId"));
	nbTabs[windowId] = window.find("tab").length;
    });
    
    // add windows
    newDOM.find("window").each(function() {
	var window = $(this);
	var windowId = window.attr("windowId");
	if (!windowId) {
	    actions.push((function (window) {
		return function(cb) {
		    chrome.windows.create({}, function(createdWindow) {
			var id = createdWindow.id;
			window.attr({windowId : id});
			cb();
		    });
		}
	    })(window));
	} 
    });

    // add/move tabs
    newDOM.find("window").each(function() {
	var window = $(this);
	window.find("tab").each(function() {
	    var tab = $(this);
	    var id = tab.attr("tabId");
	    if (window.attr("windowId")) {
		nbTabs[parseInt(window.attr("windowId"))]++;
	    }
	    if (id) {
		id = parseInt(id);
		var oldWindowId = parseInt(tab.attr("windowId"));
		nbTabs[oldWindowId]--;
		if (nbTabs[oldWindowId] == 0) {
		    nbTabs[oldWindowId]++;
		    actions.push(addFakeTabAction(oldWindowId, fakeTabIds));
		}
		actions.push(moveTabsAction([id], window, tab.index()));
	    } else {
		var url = tab.attr("url");
		actions.push(createTabAction(window, tab.index(), url));
	    }
	});
    });
    
    // remove tabs
    var newTabIds = [];
    newDOM.find("tab").each(function() {
	newTabIds[$(this).attr("tabId")] = true;
    });
    var toBeRemoved = [];
    oldDOM.find("tab").each(function() {
	var id = $(this).attr("tabId");
	if (!newTabIds[id]) {
	    toBeRemoved.push(parseInt(id));
	}
    });
    actions.push(removeTabsAction(toBeRemoved));

    // remove windows
    var newWindowIds = [];
    newDOM.find("window").each(function() {
	newWindowIds[$(this).attr("windowId")] = true;
    });
    oldDOM.find("window").each(function() {
	var id = $(this).attr("windowId");
	if (!newWindowIds[id]) {
	    actions.push(removeWindowAction(id));
	}
    });

    // remove the fake tabs
    actions.push(function(cb) {
	chrome.tabs.remove(fakeTabIds, function() {
	    cb();
	});
    });

    // remove last tabs of the created windows
    newDOM.find("window").each(function() {
	var window = $(this);
	var windowId = window.attr("windowId");
	if (!windowId) {
	    actions.push(removeLastTab(window));
	} 
    });

    
    // run the actions
    var startTime = new Date().getTime();
    actions.push(function (cb) {
	var endTime = new Date().getTime();
	console.log(endTime-startTime);
    });
    chainCB(actions);
}

function createVirtualDOM(cb) {
    chrome.windows.getAll({populate:true}, function (windows) {
	var res = $("<chrome></chrome>");
	for (var iWindow = 0; iWindow < windows.length; iWindow++) {
	    var window = windows[iWindow];
	    var windowNode = $("<window></window>").appendTo(res);
	    windowNode.attr({
		windowId : window.id,
		focused : window.focused,
	    });
	    for (var iTab = 0; iTab < window.tabs.length; iTab++) {
		var tab = window.tabs[iTab];
		var tabNode = $("<tab/>").appendTo(windowNode);
		tabNode.attr({
		    tabId : tab.id,
		    title : tab.title,
		    url : tab.url,
		    active : tab.active,
		    windowId : tab.windowId,
		    highlighted : tab.highlighted,
		    windowId : window.id, // do not modify it
		});
	    }
	}
	var old = res.clone();
	cb(res);
	update(old, res);
    });
}

function callActionIfDefined(num, activeTab) {
    if (actions[num]) {
	createVirtualDOM(function (virtualDOM) {
	    actions[num].process(virtualDOM);
	});
    } else {
	console.log("No action defined at index " + num);
    }
}

chrome.commands.onCommand.addListener(function(command) {
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
	var num = parseInt(command.substr(command.lastIndexOf("-") + 1));
	chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
	    var activeTab = tabs[0];
	    callActionIfDefined(num, tabs[0]);
	});
    });
});
