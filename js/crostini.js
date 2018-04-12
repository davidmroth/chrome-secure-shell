// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';



hterm.PreferenceManager.categoryDefinitions.push({
  id: hterm.PreferenceManager.categories.Crostini,
  text: 'Crostini'
});

hterm.PreferenceManager.defaultPreferences = Object.assign(hterm.PreferenceManager.defaultPreferences, {
  'chroot-image-name':
  [hterm.PreferenceManager.categories.Crostini, 'development', 'string',
   'Name of the Crostini image.\n' +
   '\n' +
   'By default, this field will be set to \'devevlopment\'.'],

  'chroot-container-name':
  [hterm.PreferenceManager.categories.Crostini, 'stretch', 'string',
   'Name of Crostini container.\n' +
   '\n' +
   'By default, this field will be set to \'stretch\'.'],

  'chroot-user-name':
  [hterm.PreferenceManager.categories.Crostini, 'user', 'string',
   'User that will be logged into the container.\n' +
   '\n' +
   'By default, this field will be set to \'user\'.']
});

function CmdQueue(term) {
  this.cmdLength = 0;
  this.exec = term.io.sendString;
  this.running = false
  
  this.add = function(item) {
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
          setTimeout(check, 300);
        }
      }
  
      check();
      this.running = true;
    }
  };
  
  this.get = function() {
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
}

function Crostini() {
  this.init = function(term) {
    this.term = term;
    this.pref = term.io.terminal_.prefs_;
    this.cmdWithDelay = new CmdQueue(term);
    this.updateUI();
  };

  this.build_action_button = (document, items) => {
    let body = document.querySelector('body');
    let action_button = document.createElement('div');

    action_button.className = 'action_button-wrapper';

    let menu_button = document.createElement('div');
    menu_button.className = 'action_button-menu-loader';
    menu_button.innerHTML = '&#9776;';

    for (let i = items.length - 1; i >= 0; i--) {
      let child = document.createElement('div');

      child.className = 'action_button-menu-item';
      child.innerHTML = items[i].icon;

      if (items[i].callback) {
        child.onclick = items[i].callback
      }

      if (items[i].display) {
        for (var key in items[i].display) {
          if (!items[i].display.hasOwnProperty(key)) {
            continue;
          }

          child.style[key] = items[i].display[key]
        }
      }

      let label_wrapper = document.createElement('label');
      label_wrapper.className = 'action_button-menu-item-label-wrapper';

      let label = document.createElement('span');
      label.className = 'action_button-menu-item-label';
      label.innerHTML = items[i].label;
      label_wrapper.appendChild(label);
      child.appendChild(label_wrapper);
      
      action_button.appendChild(child);
    }

    action_button.appendChild(menu_button);
    body.appendChild(action_button)
  };

  this.updateUI = function(chroots) {
    let buildCommands = (cmdList) => {
      let commands = [];
    	
      for (let idx in cmdList) {
        let label = "Launch '" + cmdList[idx].name + "' container";
        let command = ()=> {
          for (let cmd in cmdList[idx].commands)
            this.cmdWithDelay.add(cmdList[idx].commands[cmd] + "\r");
            document.querySelector("#terminal").focus();
        };
    
        commands.push({
      		icon:'<i class="fa fa-desktop" aria-hidden="true"></i>',
      		label: label,
      		callback: command
      	});
      }
      
      return commands;
    };

    let cmds = buildCommands([{
      "name": this.pref.get('chroot-container-name'),
      "commands": [
        "vmc start " + this.pref.get('chroot-image-name'),
        "run_container.sh --container_name=" + this.pref.get('chroot-container-name') + " --user=" + this.pref.get('chroot-user-name') + " --shell",
        "reset"
      ]
    }]);

    this.build_action_button(document, cmds);
  }
}