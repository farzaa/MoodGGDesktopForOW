const electron = require('electron')
// Module to control application life.
const app = electron.app

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
require('electron-debug')({showDevTools: true});
const path = require('path')
const url = require('url')
const {globalShortcut} = require('electron')
const {ipcMain} = require('electron')
var gkm = require('gkm');

const storage = require('electron-json-storage');

global.curr_path = app.getAppPath()
ret = []

storage.get('DEFAULT', function(error, data) {
  if (error)
    throw error;
  if(data.PLAYSONGKEY == undefined) {
    console.log("Defualt doesn't exist! Lets make it")
    storage.set('DEFAULT', {PREVSONGKEY: "C",  PLAYSONGKEY: "V", NEXTSONGKEY: "B", VOLDOWNKEY: "N", VOLUPKEY: "M"}, function(error) {
      if (error)
        throw error;
    });
    ret[0] = "C"
    ret[1] = "V"
    ret[2] = "B"
    ret[3] = "N"
    ret[4] = "M"
  }

  else {
    ret[0] = data.PREVSONGKEY;
    ret[1] = data.PLAYSONGKEY;
    ret[2] = data.NEXTSONGKEY;
    ret[3] = data.VOLDOWNKEY;
    ret[4] = data.VOLUPKEY;
  }
});

 var shift = false;

gkm.events.on('key.pressed', function(data) {
  console.log(data);

  //console.log("Shift... " + shift)
  if(data == "Left Shift") {
    console.log("PRESSED SHIFT")
    shift = true;
  }
});

gkm.events.on('key.released', function(data) {
  console.log(ret);
  if(data == ret[0]) {
    if(shift) {
      mainWindow.webContents.send('PREVIOUSSONG', 'Pinging prev song from server!')
      console.log("PREVSONG ACTIVATED")
    }
  }

  if(data == ret[1]) {
    if(shift) {
      mainWindow.webContents.send('PLAYSONG', 'Pinging play song from server!')
      console.log("PLAYSONG ACTIVATED")
    }
  }

  if(data == ret[2]) {
    if(shift) {
      mainWindow.webContents.send('NEXTSONG', 'Pinging next song from server!')
      console.log("NEXT ACTIVATED")
    }
  }

  if(data == ret[3]) {
    if(shift) {
      mainWindow.webContents.send('VOLDOWN', 'Pinging volume down from server!')
      console.log("VOL DOWN ACTIVATED")
    }
  }

  if(data == ret[4]) {
    if(shift) {
      mainWindow.webContents.send('VOLUP', 'Pinging volume up from server!')
      console.log("VOL UP ACTIVATED")
    }
  }

  if(data == "Left Shift") {
    shift = false;
  }

});


ipcMain.on('SetButtons', (event, arg) => {
    console.log("Recevied request for keys binding change form UI");
    storage.clear(function(error) {
      if (error)
        throw error;
      storage.set('DEFAULT', {PREVSONGKEY: arg[0],  PLAYSONGKEY: arg[1], NEXTSONGKEY: arg[2], VOLDOWNKEY: arg[3], VOLUPKEY: arg[4]}, function(error) {
        if (error) throw error;
        ret[0] = arg[0];
        ret[1] = arg[1];
        ret[2] = arg[2];
        ret[3] = arg[3];
        ret[4] = arg[4];
      });
    });
});

ipcMain.on('ClearStorageButton', (event, arg) => {
  storage.clear(function(error) {
    if (error)
      throw error;
    console.log("Storage cleared!");
  });
});


ipcMain.on('READY', (event, arg) => {
  mainWindow.webContents.send('UPDATEBINDINGS', JSON.stringify({PREVSONGKEY: ret[0],  PLAYSONGKEY: ret[1], NEXTSONGKEY: ret[2], VOLDOWNKEY: ret[3], VOLUPKEY: ret[4]}))
});




// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {

  mainWindow = new BrowserWindow({width: 1200, height: 1000});
  // mainWindow.loadURL('https://www.youtube.com/watch?v=gQWavVwsCFU')

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app su pports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  //var send = JSON.stringify({PREVSONGKEY: ret[0], PLAYSONGKEY: ret[1], NEXTSONGKEY: ret[2]})
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
