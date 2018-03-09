// Process available to browser window.

//var screenshot = require('desktop-screenshot');
var Jimp = require("jimp");

const screenshot = require('screenshot-desktop')
var fs = require('fs');

const remote = require('electron').remote;
const path = remote.getGlobal('curr_path')
console.log(path)

console.log("Hello, from the renderer!");
setInterval(start_screen, 2000)

function start_screen() {
    screenshot().then((img) => {
        console.log("Screenshot succeeded");
        fs.writeFile(path + "/screenshot.png", img, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
            Jimp.read(path + "/screenshot.png", function (err, img) {
                if (err) throw err;
                img.crop(1650, 860, 170, 170)     // crop that shit baby
                     .resize(32,32)
                     .quality(100)                // always keep it a hunded'
                     .write(path + "/screenshot-cropped.jpg", function(err) {
                         if (err) throw err;
                         var image = new Image();
                         image.onload = function () {
                             console.log("Loaded image!")
                             var preview = document.getElementById('preview_img');
                             console.log("Changing image!")
                             preview.src = image.src;
                             //$('#preview_img').attr('src', image.src)
                             $("#img_holder").append("<img src=" + image.src + ">")
                             setTimeout(function() {
                                 testImage(document.getElementById('preview_img'))
                                 //$("#img_holder img:last-child").remove()
                             }, 200)
                         };
                         console.log(path +  '/screenshot-cropped.jpg')
                         image.src = path + '/screenshot-cropped.jpg?' + new Date().getTime();
                     });
            });
        });
    }).catch((err) => {
          console.log("Screenshot failed", err);
    });
    // screenshot(path + "/screenshot.png", function(error, complete) {
    //     if(error)
    //         console.log("Screenshot failed", error);
    //     // I include all the logic here to alter call the DOM.
    //     else {
    //         console.log("Screenshot succeeded");
            // Jimp.read(path + "/screenshot.png", function (err, img) {
            //     if (err) throw err;
            //     //img.crop(1650, 860, 170, 170)     // crop that shit baby
            //          img.resize(32,32)
            //          .quality(100)                // always keep it a hunded'
            //          .write(path + "/screenshot-cropped.jpg", function(err) {
            //              if (err) throw err;
            //              var image = new Image();
            //              image.onload = function () {
            //                  console.log("Loaded image!")
            //                  var preview = document.getElementById('preview_img');
            //                  console.log("Changing image!")
            //                  preview.src = image.src;
            //                  //$('#preview_img').attr('src', image.src)
            //                  $("#img_holder").append("<img src=" + image.src + ">")
            //                  setTimeout(function() {
            //                      testImage(document.getElementById('preview_img'))
            //                      //$("#img_holder img:last-child").remove()
            //                  }, 200)
            //              };
            //              console.log(path +  '/screenshot-cropped.jpg')
            //              image.src = path + '/screenshot-cropped.jpg?' + new Date().getTime();
            //
            //          });
            // });
    //     }
    // });
}
