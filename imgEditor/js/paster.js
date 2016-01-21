var Paster = {
  init: function(callback) {
    this.callback = callback;
    if (!window.Clipboard) {
      this.createContentEditable();
    }
    window.addEventListener("paste", this.pasteHandler.bind(this));
  },
  createContentEditable: function() {
    var pasteCatcher = document.createElement("div");  
    pasteCatcher.setAttribute("contenteditable", "");
    pasteCatcher.style.cssText = 'position: fixed; top: 0; left: -9999px;';
    document.body.appendChild(pasteCatcher);
    pasteCatcher.focus();
    document.addEventListener("click", function() {
      pasteCatcher.focus();
    });
  },
  pasteHandler: function(e) {
    if (e.clipboardData) {
      console.log(e.clipboardData);
      var items = e.clipboardData.items;
      if (items) {
        this.checkItems(items);
      }
    } else {
      setTimeout(this.checkInput.bind(this), 1);
    }
  },
  checkItems: function(items) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") > -1) {
        this.handleImageItem(items[i]);
      }
      if (items[i].type.indexOf("text/plain") > -1) {
        this.handleTextItem(items[i]);
      }
    }
  },
  handleImageItem: function(item) {
    var blob = item.getAsFile();
    var URLObj = window.URL || window.webkitURL;
    if (!URLObj) return;
    var source = URLObj.createObjectURL(blob);
    this.createImage(source);
  },
  handleTextItem: function(item) {
    console.log('handleTextItem');
    var _this = this;
    item.getAsString(function(str) {
      _this.callback(str);
    });
  },
  checkInput: function() {
    var child = pasteCatcher.childNodes[0];
    pasteCatcher.innerHTML = ""; 
    if (!child) return; 
    if (child.tagName === "IMG") {
      this.createImage(child.src);
    }
    console.log('child', child);
  },
   
  createImage: function(source) {
    var pastedImage = new Image();
    var _this = this;
    pastedImage.onload = function() {
      _this.callback(pastedImage);
    };
    pastedImage.src = source;
  }
};
