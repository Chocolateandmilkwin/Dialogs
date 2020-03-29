//WIP
//Missing
//Add snapping to sides
var dialog = {
    standardTemplates: function () {
        this.dialogs = {};
        //This is an example of how to add a dialog template
        //If data needs to be saved, do so in dialog.userdata
        this.addTemplate({
            name: 'dismiss', //This will be the name of the function in dialog.dialogs
            settings: { //These are the default settings for the dialog
                closeable: true, //Wether the dialog can be closed
                maximizable: false, //Wether the dialog is maximizable
                moveable: false, //Wether the dialog is movable
                resizeable: false, //Wether the dialog is resizeable by the user
                snappable: false, //Wether the dialog can snap to the sides
                width: 400, //The starting width of the dialog
                height: 250, //The starting height of the dialog
                minWidth: 400, //Minimum width when resizing, 0 means no minimum
                minHeight: 250, //Minimum height when resizing, 0 means no minimum
                maxWidth: 400, //Maximum width when resizing, 0 means no maximum
                maxHeight: 250, //Maximum height when resizing, 0 means no maximum
                modal: false, //Wether the dialog is modal
                noHeader: false, //If set true, the dialog will not have a title bar only content, and can only be closed from code
                parentDialog: 0, //The parent dialog of this dialog, when the parent is closed, this one is too
                startMaximized: '', //This tells the dialog to start maximized, the following modes are available, 'full' = fullscreen
                //If set, the at close function is run the the dialog is closed the parameter is the dialog node
                atClose: function (dialogNode) {
                    return 0;
                },
                //The openfunction is run when the dialog is called for opening, the parameters set in params key are passed to the openfunction
                //The header node is available from node.header
                //The content node is available from node.content
                //If you don't want a thing inside the header or the conten to move the dialog add the following code to it
                //contentBuffer.addEventListener("mousedown", function (e) {
                //    e.dontMove = true;
                //});
                openFunction: function (node, params) {
                    node.header.innerHTML = params.title;
                }
            },
            //This is the default settings of the dialog box, these can be overwritten when calling the dialog,
            fixedSettings: {
                singleInstance: false //Wether the dialog is single instance or multi, single instance will not get an id number, and can only be opened one at a time
            }
            //When the dialog is opened, it returns the node of the dialog, this node has some functions which can be used to adapt the dialog on the fly
            //The close function closes the dialog
            //The doMove function can move the dialog around, resize it, maximize, unmaximize it, focus it
            //Moveparam can have the following parameters, {left: x location to set,top: y location to set,width:width to set,height:height to set,focus:set true to focus,maximize:mode to maximize}
        });
    },
    //This function is used to add a dialog template
    addTemplate: function (template) {
        if (!('name' in template)) {
            console.warn('Dialog template needs name key');
            return;
        }
        if (!('openFunction' in template.settings)) {
            console.warn('Dialog template needs an open function');
            return;
        } else if (!(template.settings.openFunction instanceof Function)) {
            console.warn('Dialog template openFunction is not a function');
            return;
        }
        this.dialogs[template.name] = function (params) {
            if ( typeof(params) == "undefined" || params == null ) {
                params = {};
            }
            openBuffer = {
                name: template.name,
                params:{...params.params},
                //This makes sure the settings object has all the correct keys
                settings: {
                    ...{
                        closeable: false,
                        maximizable: false,
                        moveable: false,
                        resizeable: false,
                        snappable: false,
                        width: 0,
                        height: 0,
                        minWidth: 220,
                        minHeight: 100,
                        maxWidth: 0,
                        maxHeight: 0,
                        modal: false,
                        noHeader: false,
                        parentDialog: 0,
                        startMaximized: '',
                        atClose: function () {
                            return 0;
                        },
                        openFunction: function () {
                            return 0;
                        }
                    },
                    ...template.settings,
                    ...params.settings
                },
                fixedSettings: {
                    ...{
                        singleInstance: false
                    },
                    ...template.fixedSettings
                }
            };
            //This makes sure that a single instance dialog doesn't open twice
            if (openBuffer.fixedSettings.singleInstance) {
                for (key in dialog.openDialogs) {
                    if (dialog.openDialogs[key].id == template.name) {
                        return null;
                    }
                }
            }
            return dialog.openDialog(openBuffer);
        };
    },
    init: function () {
        //This creates the dialog node where all dialog related stuff happens
        this.dialogGroup = document.createElement('div');
        this.dialogGroup.id = 'dialogGroup';
        document.documentElement.appendChild(this.dialogGroup);
        //The modal node is added
        this.modal = document.createElement('div');
        this.modal.classList.add('dialogModal');
        this.modal.style.display = 'none';
        this.dialogGroup.appendChild(this.modal);
        //The snap corners group
        //Needed variables are added to the object
        this.openDialogs = [];
        this.selectedDialog = 0;
        this.dialogID = 0;
        //This event moves the dialogs when the window is resized
        window.addEventListener("resize", function () {
            for (key in dialog.openDialogs) {
                dialogBuffer = dialog.openDialogs[key];
                dialog.refitToScreen(dialogBuffer);
            }
        });
        //This event moves the dialog when the mouse is moved
        document.addEventListener('mousemove', function (event) {
            if (dialog.selectedDialog != 0) {
                dialogBuffer = dialog.selectedDialog;
                settingsBuffer = dialogBuffer.settings;
                dialogSize = dialogBuffer.getBoundingClientRect();
                //When moving window
                if (dialogBuffer.move && settingsBuffer.moveable) {
                    dialog.moveCheckX(dialogBuffer, event.clientX + dialogBuffer.offset[0]);
                    dialog.moveCheckY(dialogBuffer, event.clientY + dialogBuffer.offset[1]);
                }
                //When resizing width
                if (dialogBuffer.resizeX) {
                    if (settingsBuffer.moveable) {
                        dialogSize.width = dialogBuffer.resize[0] + event.clientX - dialogBuffer.resize[2]
                    } else {
                        dialogSize.width = dialogBuffer.resize[0] + (event.clientX - dialogBuffer.resize[2]) * 2
                    }
                    dialog.resizeCheckX(dialogBuffer, dialogSize.width)
                }
                //When resizing height
                if (dialogBuffer.resizeY) {
                    dialogSize.height = dialogBuffer.resize[1] + event.clientY - dialogBuffer.resize[3];
                    dialog.resizeCheckY(dialogBuffer, dialogSize.height);
                }
            }
        }, true);
        //This event moves the dialog when the mouse is moved
        document.addEventListener('touchmove', function (event) {
            if (dialog.selectedDialog != 0) {
                dialogBuffer = dialog.selectedDialog;
                settingsBuffer = dialogBuffer.settings;
                dialogSize = dialogBuffer.getBoundingClientRect();
                //When moving window
                if (dialogBuffer.move && settingsBuffer.moveable) {
                    dialog.moveCheckX(dialogBuffer, event.touches[0].clientX + dialogBuffer.offset[0]);
                    dialog.moveCheckY(dialogBuffer, event.touches[0].clientY + dialogBuffer.offset[1]);
                }
                //When resizing width
                if (dialogBuffer.resizeX) {
                    if (settingsBuffer.moveable) {
                        dialogSize.width = dialogBuffer.resize[0] + event.touches[0].clientX - dialogBuffer.resize[2]
                    } else {
                        dialogSize.width = dialogBuffer.resize[0] + (event.touches[0].clientX - dialogBuffer.resize[2]) * 2
                    }
                    dialog.resizeCheckX(dialogBuffer, dialogSize.width)
                }
                //When resizing height
                if (dialogBuffer.resizeY) {
                    dialogSize.height = dialogBuffer.resize[1] + event.touches[0].clientY - dialogBuffer.resize[3];
                    dialog.resizeCheckY(dialogBuffer, dialogSize.height);
                }
            }
        }, true);
        //This event stops moving the dialog when the mouse is not pressed anymore
        document.addEventListener("mouseup", function () {
            dialog.selectedDialog.move = false;
            dialog.selectedDialog.resizeX = false;
            dialog.selectedDialog.resizeY = false;
            dialog.selectedDialog = 0;
        });
        document.addEventListener("touchend", function () {
            dialog.selectedDialog.move = false;
            dialog.selectedDialog.resizeX = false;
            dialog.selectedDialog.resizeY = false;
            dialog.selectedDialog = 0;
        });
    },
    openDialog: function (openParams) {
        //Root dialog node is added
        dialogNode = document.createElement('diam');
        dialogNode.classList.add('dialog', 'd-flex', 'flex-column');
        //Settings are localized and saved to node 
        dialogNode.settings = openParams.settings;
        dialogNode.fixedSettings = openParams.fixedSettings;
        settings = dialogNode.settings;
        fixedSettings = dialogNode.fixedSettings;
        //Dialog is put in front
        dialogNode.style['z-index'] = 2000 + this.openDialogs.length;
        //Dialog id is set
        if (fixedSettings.singleInstance) {
            dialogNode.id = openParams.name;
        } else {
            dialogNode.id = openParams.name + this.dialogID++;
        }
        //Default data is set
        dialogNode.maximized = '';
        dialogNode.offset = [];
        dialogNode.move = false;
        dialogNode.savedSize = {};
        //Dialog Movement
        if (settings.moveable) {
            dialogNode.classList.add('dialogMove');
            dialogNode.addEventListener("mousedown", function (e) {
                e.stopPropagation()
                dialog.focusDialog(this);
                if (!this.maximized) {
                    this.move = true;
                    this.offset = [
                        this.offsetLeft - e.clientX,
                        this.offsetTop - e.clientY
                    ];
                }
            });
        }
        //This sets the width and height of the dialog
        clientWidth = document.documentElement.clientWidth;
        if (settings.minWidth < clientWidth) {
            if (settings.width < clientWidth) {
                dialogNode.style.width = settings.width + 'px';
                dialogNode.style.left = window.innerWidth / 2 - settings.width / 2 + 'px';
            } else {
                dialogNode.style.width = clientWidth + 'px';
                dialogNode.style.left = '0px';
            }
        } else {
            dialogNode.style.width = settings.minWidth + 'px';
            dialogNode.style.left = '0px';
        }
        dialogNode.style.height = settings.height + 'px';
        if (settings.height < window.innerHeight - window.innerHeight / 10) {
            dialogNode.style.top = window.innerHeight / 10 + 'px';
        } else {
            dialogNode.style.top = '0px';
        }
        //Header Node
        if (!settings.noHeader) {
            dialogHeaderNode = document.createElement('div');
            dialogHeaderNode.classList.add('dialogHeader', 'd-flex', 'flex-row');
            dialogNode.headerNode = dialogHeaderNode;
            dialogNode.appendChild(dialogHeaderNode);
            dialogHeaderNode.addEventListener('touchstart', function (e) {
                e.preventDefault();
                e.stopPropagation()
                dialogBuffer = this.parentElement;
                dialog.focusDialog(dialogBuffer);
                if (!dialogBuffer.maximized) {
                    dialogBuffer.move = true;
                    dialogBuffer.offset = [
                        dialogBuffer.offsetLeft - e.touches[0].clientX,
                        dialogBuffer.offsetTop - e.touches[0].clientY
                    ];
                }
            });
            //Dialog Header Mover Node
            if (settings.moveable) {
                dialogHeaderMoverNode = document.createElement('img');
                dialogHeaderMoverNode.setAttribute('src', 'neededIcons/move.svg')
                dialogHeaderMoverNode.setAttribute('draggable', 'false')
                dialogHeaderMoverNode.classList.add('p-1', 'dialogMoveButton', 'dialogMove');
                dialogHeaderNode.moveNode = dialogHeaderMoverNode;
                dialogHeaderNode.appendChild(dialogHeaderMoverNode);
            }
            //Dialog Header Text Node
            dialogHeaderTextNode = document.createElement('div');
            dialogHeaderTextNode.classList.add('m-2');
            dialogHeaderNode.appendChild(dialogHeaderTextNode);
            dialogNode.header = dialogHeaderTextNode;
            //Dialog Maximize
            if (settings.maximizable) {
                dialogMaximizeNode = document.createElement('img');
                dialogMaximizeNode.setAttribute('src', 'neededIcons/maximize.svg')
                dialogMaximizeNode.setAttribute('draggable', 'false')
                dialogMaximizeNode.classList.add('ml-auto', 'p-1', 'dialogButton');
                dialogHeaderNode.maxNode = dialogMaximizeNode;
                dialogHeaderNode.appendChild(dialogMaximizeNode);
                addclickEvent(dialogMaximizeNode,function () {
                    dialogNodeBuffer = this.parentElement.parentElement;
                    if (dialogNodeBuffer.maximized != '') {
                        dialog.maximizeDialog(dialogNodeBuffer, '');
                    } else {
                        dialog.maximizeDialog(dialogNodeBuffer, 'full');
                    }
                    dialog.focusDialog(this.parentElement.parentElement);
                });
                dialogMaximizeNode.addEventListener("mousedown", function () {
                    event.stopPropagation()
                });
            }
            //Dialog Closing
            if (settings.closeable) {
                dialogCloseNode = document.createElement('img');
                dialogCloseNode.setAttribute('src', 'neededIcons/x.svg')
                dialogCloseNode.setAttribute('draggable', 'false')
                dialogCloseNode.classList.add('p-1', 'dialogButton');
                if (!settings.maximizable) {
                    dialogCloseNode.classList.add('ml-auto');
                }
                dialogHeaderNode.appendChild(dialogCloseNode);
                addclickEvent(dialogCloseNode,function () {
                    dialog.closeDialog(this.parentElement.parentElement);
                });
                dialogCloseNode.addEventListener("mousedown", function () {
                    event.stopPropagation()
                    dialog.focusDialog(this.parentElement.parentElement);
                });
            }
        }
        //Dialog Resize
        if (settings.resizeable) {
            dialogResizeNode = document.createElement('div');
            dialogResizeNode.classList.add('dialogResize');
            dialogNode.appendChild(dialogResizeNode);
            dialogResizeNode.addEventListener("mousedown", function (e) {
                e.stopPropagation()
                dialogNodeBuffer = this.parentElement;
                dialog.focusDialog(dialogNodeBuffer);
                dialogNodeBuffer.resizeX = true;
                dialogNodeBuffer.resizeY = true;
                dialogSize = dialogNodeBuffer.getBoundingClientRect();
                dialogNodeBuffer.resize = [
                    dialogSize.width,
                    dialogSize.height,
                    e.clientX,
                    e.clientY
                ];
            });
            dialogResizeNode.addEventListener('touchstart', function (e) {
                e.stopPropagation()
                dialogNodeBuffer = this.parentElement;
                dialog.focusDialog(dialogNodeBuffer);
                dialogNodeBuffer.resizeX = true;
                dialogNodeBuffer.resizeY = true;
                dialogSize = dialogNodeBuffer.getBoundingClientRect();
                dialogNodeBuffer.resize = [
                    dialogSize.width,
                    dialogSize.height,
                    e.touches[0].clientX,
                    e.touches[0].clientY
                ];
            });
        }
        //Content Div
        dialogContentNode = document.createElement('div');
        dialogContentNode.classList.add('dialogContent');
        dialogContentNode.addEventListener("mousedown", function (e) {
            if (e.dontMove) {
                event.stopPropagation()
            }
            dialog.focusDialog(this.parentElement);
        });
        dialogNode.appendChild(dialogContentNode);
        dialogNode.content = dialogContentNode;
        //Close function is added to node
        dialogNode.close = function () {
            dialog.closeDialog(this);
        }
        //Move function is added to node
        //{left: x location to set,top: y location to set,width:width to set,height:height to set,focus:set true to focus,maximize:mode to maximize}
        dialogNode.doMove = function (moveParam) {
            if ('maximize' in moveParam) {
                dialog.maximizeDialog(this, moveParam.maximize);
            }
            if ('focus' in moveParam) {
                if (moveParam.focus) {
                    dialog.focusDialog(this);
                }
            }
            if ('width' in moveParam) {
                dialog.resizeCheckX(this, moveParam.width);
            }
            if ('height' in moveParam) {
                dialog.resizeCheckY(this, moveParam.height);
            }
            if ('left' in moveParam) {
                dialog.moveCheckX(this, moveParam.left);
            }
            if ('top' in moveParam) {
                dialog.moveCheckY(this, moveParam.top);
            }
        };
        //Modal is handled
        if (settings.modal) {
            this.modal.style.display = 'block';
            this.modal.style['z-index'] = dialogNode.style['z-index'];
        }
        //Start maximized setting is handled
        if (settings.startMaximized != '') {
            dialog.maximizeDialog(dialogNode, settings.startMaximized);
        }
        //If dialog has a parent
        if (settings.parentDialog instanceof Object) {
            if (!('dialogChildren' in settings.parentDialog)) {
                settings.parentDialog.dialogChildren = {}
            }
            settings.parentDialog.dialogChildren[dialogNode.id] = dialogNode;
        }
        //The openfunction is run
        settings.openFunction(dialogNode, openParams.params);
        //Adding dialog to array
        this.dialogGroup.appendChild(dialogNode);
        dialogNode.index = this.openDialogs.length;
        this.openDialogs.push(dialogNode);
        //Setting dialog as selected
        this.selectedDialog = dialogNode;
        return dialogNode;
    },
    //This handles when a dialog is closed
    closeDialog: function (dialogNode, notTop) {
        if ('dialogChildren' in dialogNode) {
            for (key in dialogNode.dialogChildren) {
                dialog.closeDialog(dialogNode.dialogChildren[key], true)
            }
        }
        if (settings.parentDialog instanceof Object) {
            delete settings.parentDialog.dialogChildren[dialogNode.id];
        }
        dialogNode.settings.atClose(dialogNode);
        dialogNode.parentNode.removeChild(dialogNode);
        this.openDialogs.pop();
        if (!notTop) {
            if (this.openDialogs.length > 0) {
                lastDialog = this.openDialogs[this.openDialogs.length - 1];
                if (lastDialog.settings.modal) {
                    this.focusDialog(lastDialog);
                    this.modal.style['z-index'] = lastDialog.style['z-index'];
                } else {
                    dialog.modal.style.display = 'none';
                }
                this.selectedDialog = lastDialog;
            } else {
                dialog.modal.style.display = 'none';
                this.selectedDialog = 0;
            }
        }
    },
    //This handles when the focus is changed to the dialog
    focusDialog: function (dialogNode) {
        this.openDialogs.push(this.openDialogs.splice(dialogNode.index, 1)[0]);
        this.selectedDialog = dialogNode;
        zIndex = 2000;
        for (key in dialog.openDialogs) {
            dialog.openDialogs[key].style['z-index'] = zIndex++;
            dialog.openDialogs[key].index = key;
        }
        if (dialogNode.maximized != '' && 'dialogChildren' in dialogNode) {
            for (key in dialogNode.dialogChildren) {
                dialogNode.dialogChildren[key].style['z-index'] = zIndex++;
            }
        }
    },
    //This handles when the dialog is maximized and unmaximized
    maximizeDialog: function (dialogNode, mode) {
        settingsBuffer = dialogNode.settings;
        if (dialogNode.maximized == mode) {
            return;
        }
        switch (dialogNode.maximized) {
            case '':
                dialogNode.savedSize.width = dialogNode.style.width;
                dialogNode.savedSize.height = dialogNode.style.height;
                dialogNode.savedSize.top = dialogNode.style.top;
                dialogNode.savedSize.left = dialogNode.style.left;
                break;
        }
        switch (mode) {
            case '':
                dialogNode.headerNode.maxNode.setAttribute('src', 'neededIcons/maximize.svg')
                dialogNode.maximized = '';
                dialogNode.style.width = dialogNode.savedSize.width;
                dialogNode.style.height = dialogNode.savedSize.height;
                dialogNode.style.top = dialogNode.savedSize.top;
                dialogNode.style.left = dialogNode.savedSize.left;
                if (settingsBuffer.moveable) {
                    dialogNode.classList.add('dialogMove');
                }
                document.documentElement.style['overflow'] = null;
                dialog.refitToScreen(dialogNode);
                return;
            case 'full':
                dialogNode.style.width = '100%';
                dialogNode.style.height = '100%';
                dialogNode.style.top = '0px';
                dialogNode.style.left = '0px';
                break;
            case 'w':
                dialogNode.style.width = '50%';
                dialogNode.style.height = '100%';
                dialogNode.style.top = '0px';
                dialogNode.style.left = '0px';
                break;
            case 'e':
                dialogNode.style.width = '50%';
                dialogNode.style.height = '100%';
                dialogNode.style.top = '0px';
                dialogNode.style.left = '50%';
                break;
            case 'n':
                dialogNode.style.width = '100%';
                dialogNode.style.height = '50%';
                dialogNode.style.top = '0px';
                dialogNode.style.left = '0px';
                break;
            case 's':
                dialogNode.style.width = '100%';
                dialogNode.style.height = '100%';
                dialogNode.style.top = '50%';
                dialogNode.style.left = '0px';
                break;
            case 'nw':
                dialogNode.style.width = '50%';
                dialogNode.style.height = '50%';
                dialogNode.style.top = '0px';
                dialogNode.style.left = '0px';
                break;
            case 'ne':
                dialogNode.style.width = '50%';
                dialogNode.style.height = '50%';
                dialogNode.style.top = '0px';
                dialogNode.style.left = '50%';
                break;
            case 'sw':
                dialogNode.style.width = '50%';
                dialogNode.style.height = '50%';
                dialogNode.style.top = '50%';
                dialogNode.style.left = '0px';
                break;
            case 'se':
                dialogNode.style.width = '50%';
                dialogNode.style.height = '50%';
                dialogNode.style.top = '50%';
                dialogNode.style.left = '50%';
                break;
            default:
                return;
        }
        dialogNode.headerNode.maxNode.setAttribute('src', 'neededIcons/minimize.svg')
        dialogNode.maximized = mode;
        dialogNode.classList.remove('dialogMove');
        document.documentElement.style['overflow'] = 'hidden';

    },
    //This method can be called on a dialog node to refit to the screen so it is inside the viewport
    refitToScreen: function (dialogNode) {
        settingsBuffer = dialogNode.settings;
        switch (dialogNode.maximized) {
            case '':
                dialogSize = dialogNode.getBoundingClientRect();
                clientWidth = document.documentElement.clientWidth;
                if (dialogSize.left + dialogSize.width > clientWidth) {
                    if (dialogSize.width > clientWidth) {
                        if (dialogSize.width > settingsBuffer.minWidth && clientWidth > settingsBuffer.minWidth) {
                            dialogNode.style.width = clientWidth + 'px';
                        } else {
                            dialogNode.style.width = settingsBuffer.minWidth + 'px';
                            dialogNode.style.left = '0px';
                        }
                    } else {
                        dialogNode.style.left = (clientWidth - dialogSize.width) + 'px';
                    }
                } else {
                    if (!settingsBuffer.moveable) {
                        dialogNode.style.left = clientWidth / 2 - dialogSize.width / 2 + 'px';
                    }
                }
                break;
        }
    },
    //This method checks if a desired move is valid, and limits it to within the borders of the viewport
    moveCheckX: function (dialogNode, moveX) {
        if (dialogNode.maximized == '') {
            clientWidth = document.documentElement.clientWidth;
            if (moveX >= 0 && dialogSize.width < clientWidth) {
                if (moveX + dialogSize.width <= clientWidth) {
                    dialogNode.style.left = moveX + 'px';
                } else {
                    dialogNode.style.left = clientWidth - dialogSize.width + 'px';
                }
            } else {
                dialogNode.style.left = '0px';
            }
        }
    },
    //This method checks if a desired move is valid, and limits it to within the borders of the viewport
    moveCheckY: function (dialogNode, moveY) {
        if (dialogNode.maximized == '') {
            if (typeof moveY !== 'undefined') {
                if (moveY >= 0) {
                    dialogNode.style.top = moveY + 'px';
                } else {
                    dialogNode.style.top = '0px';
                }
            }
        }
    },
    //This method checks if a desired resize is valid, and limits it to the given settings
    resizeCheckX: function (dialogNode, width) {
        if (dialogNode.maximized == '') {
            settingsBuffer = dialogNode.settings;
            clientWidth = document.documentElement.clientWidth;
            dialogSize = dialogNode.getBoundingClientRect();
            if (width > clientWidth) {
                width = clientWidth;
            }
            if (width > settingsBuffer.minWidth) {
                if (width < settingsBuffer.maxWidth) {
                    if (width + dialogSize.left < clientWidth) {
                        if (!settingsBuffer.moveable) {
                            dialogNode.style.left = window.innerWidth / 2 - width / 2 + 'px';
                        }
                        dialogNode.style.width = width + 'px';
                    } else {
                        dialogNode.style.width = clientWidth - dialogSize.left + 'px';
                    }
                } else {
                    if (settingsBuffer.maxWidth < clientWidth - dialogSize.left) {
                        dialogNode.style.width = settingsBuffer.maxWidth + 'px';
                    } else {
                        dialogNode.style.width = clientWidth - dialogSize.left + 'px';
                    }
                }
            } else {
                dialogNode.style.width = settingsBuffer.minWidth + 'px';
            }
        }
    },
    //This method checks if a desired resize is valid, and limits it to the given settings
    resizeCheckY: function (dialogNode, height) {
        if (dialogNode.maximized == '') {
            settingsBuffer = dialogNode.settings;
            if (height > settingsBuffer.minHeight) {
                if (height < settingsBuffer.maxHeight) {
                    dialogNode.style.height = height + 'px';
                } else {
                    dialogNode.style.height = settingsBuffer.maxHeight + 'px';
                }
            } else {
                dialogNode.style.height = settingsBuffer.minHeight + 'px';
            }
        }
    }
}
dialog.standardTemplates();
docReady(function () {
    dialog.init();
});