actions = [];

actions[0] = {
    // close the active tab and all others at its right
    process: function(chromeDOM) {
	chromeDOM.find("window[focused='true']").each(function() {
	    var activeTab = $(this).find("tab[active='true']");
	    var index = parseInt(activeTab.index());
	    $(this).find("tab:gt(" + index + ")").remove();
	    activeTab.remove();
	});
    }
}

actions[1] = {
    // Duplicate the active tab
    process: function(chromeDOM) {
	chromeDOM.find("window").filter("[focused='true']").each(function() {
	    var activeTab = $(this).find("tab[active='true']");
	    var newTab = $("<tab></tab>").insertAfter(activeTab);
	    newTab.attr({url : activeTab.attr("url")});
	});
    }
}

actions[2] = {
    // Duplicate all the highlighted tabs
    process: function(chromeDOM) {
	chromeDOM.find("window").filter("[focused='true']").each(function() {
	    $(this).find("tab[highlighted='true']").each(function() {
		var tab = $(this);
		var newTab = $("<tab></tab>").insertAfter(tab);
		newTab.attr({url : tab.attr("url")});
	    });
	});
    }
}

actions[3] = {
    // Close Github tabs
    process: function(chromeDOM) {
	var urlPrefix = "https://github.com";
	chromeDOM.find("window").filter("[focused='true']").each(function() {
	    $(this).find("tab[url^='" + urlPrefix + "']").remove();
	});
    }
}

actions[4] = {
    // open two new windows, with particular urls
    process: function(chromeDOM) {
	var newWindow1 = $("<window></windows>").appendTo(chromeDOM);
	var newTab1 = $("<tab></tab>").appendTo(newWindow1);
	newTab1.attr({url : "http://www.boost.org"});
	var newWindow2 = $("<window></windows>").appendTo(chromeDOM);
	var newTab2 = $("<tab></tab>").appendTo(newWindow2);
	newTab2.attr({url : "https://jquery.com"});
	var newTab3 = $("<tab></tab>").appendTo(newWindow2);
	newTab3.attr({url : "http://github.com"});
    }
}

actions[5] = {
    // swap the current tab with the following
    process: function(chromeDOM) {
	chromeDOM.find("window").filter("[focused='true']").each(function() {
	    var activeTab = $(this).find("tab[active='true']");
	    var index = parseInt(activeTab.index());
	    var length = $(this).find("tab").length;
	    if (index + 1 < length) {
		var followingTab = $(this).find("tab:eq(" + (index + 1) + ")");
		activeTab.detach();
		activeTab.insertAfter(followingTab);
	    }
	});
    }
}

actions[6] = {
    // reverse the tabs
    process: function(chromeDOM) {
	chromeDOM.find("window[focused='true']").each(function() {
	    var window = $(this);
	    var tabs = [];
	    window.find("tab").each(function() {
		tabs.push($(this));
		$(this).detach();
	    });
	    for (var iTab = tabs.length - 1; iTab >= 0; iTab--) {
		window.append(tabs[iTab]);
	    }
	});
    }
}

