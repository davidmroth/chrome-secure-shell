// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';


function CmdQueue(term) {
  this.cmdLength = 0;
  this.exec = term.io.sendString;
  this.running = false
}

CmdQueue.prototype.add = function(item) {
  var node = {item: item};

  if (this.last) {
    this.last = this.last.next = node;
  } else {
    this.last = this.first = node;
  }

  this.cmdLength++;
  
  if (!this.running) {
    var check = ()=> {
      if (this.cmdLength) {
        this.exec(this.get());
        setTimeout(check, 200);
      }
    }

    check();
    this.running = true;
  }
};

CmdQueue.prototype.get = function() {
  var node = this.first;
  if (node) {
    this.first = node.next;
    if (!(--this.cmdLength)) {
      this.last = undefined;
      this.running = false;
    }

    return node.item;
  }
};

function Crostini() {
  this.init = function(term) {
    this.term = term;
    this.pref = term.io.terminal_.prefs_;
    this.cmdWithDelay = new CmdQueue(term);
    this.refreshUI();
  };

  this.buildCommandButtons = (toolBar, btn) => {
    let cmdList = {
      "container": [
        "vmc start " + this.pref.get('chroot-image-name'),
        "run_container.sh --container_name=" + this.pref.get('chroot-image-name') + " --user=" + this.pref.get('chroot-user-name') + " --shell"
      ]
    };

    for (let cmdName in cmdList) {
      btn.innerText = "Run " + cmdName;

      btn.onclick = ()=> {
        for (let cmd in cmdList[cmdName])
          this.cmdWithDelay.add(cmdList[cmdName][cmd] + "\r");
          document.querySelector("#terminal").focus();
      };

      toolBar.appendChild(btn);
    }
  };
  
  this.refreshUI = function(chroots) {
    let toolbar = document.createElement("div");
    let button = document.createElement("button");
    toolbar.id = "toolbar";

    /*
    Object.assign(toolbar.style, {
      position: "absolute",
      left: 0,
      top: 0,
      right: 0
    });
    */

    document.querySelector("#terminal").prepend(toolbar);
    document.querySelector("iframe").style.top = "25px";
    document.querySelector("iframe").style.height = "calc(100% - 30px)";

    this.buildCommandButtons(toolbar, button);
  }
}
