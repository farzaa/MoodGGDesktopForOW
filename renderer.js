const fs = require('fs');
var tf = require('@tensorflow/tfjs');
var Jimp = require("jimp");
const screenshot = require('screenshot-desktop')
const remote = require('electron').remote;
const path = remote.getGlobal('curr_path')
var {ipcRenderer} = require('electron');

let classes = {
6: "Doomfist",
1: "Genji",
11: "McCree",
16: "Pharah",
2: "Reaper",
0: "Soldier: 76",
19: "Sombra",
22: "Tracer",
4: "Bastion",
8: "Hanzo",
9: "Junkrat",
12: "Mei",
21: "Torbjorn",
23: "Widowmaker",
7: "D.Va",
15: "Orisa",
17: "Reinhardt",
18: "Roadhog",
24: "Winston",
25: "Zarya",
3: "Ana",
13: "Mercy",
10: "Lucio",
14: "Moira",
20: "Symmetra",
26: "Zenyatta",
5: "Brigitte"
}

let model;

let curr = null;
let heroClassPredictions = [];
let heroProbabilityValues =[]

let potgScreenIsOn = false;

// Load model from AWS, and than start taking screenshots.
const loadModel = async () => {
    console.log("Loading Model...");
    model =  await tf.loadModel('https://s3-us-west-2.amazonaws.com/mood1995/neural_net_all_heroes/model.json');
    console.log("Model loaded!");
    setInterval(startScreen, 250)
}

loadModel();

async function predict(imgElement) {
    const logits = tf.tidy(() => {
        const b = tf.scalar(255);
        const img = tf.fromPixels(imgElement).toFloat().div(b);
        // img.print();
        const batched = img.reshape([1, 40, 85, 3]);
        return model.predict(batched);
    });

    const classes = await getTopKClasses(logits, 1);

    let prob = classes[0].probability;
    let pred = classes[0].className;

    console.log(pred);
    console.log(prob);


    if(prob < 0.97) {
        console.log("Not a high enough probability");
        return;
    }

    // check last 5 predictions, and only then switch playlists.
    if (heroClassPredictions.length == 4) {
        // remove oldest prediction to keep array at constant size < 5.
        heroClassPredictions.shift();
        heroProbabilityValues.shift()
        // push newest prediction.
        heroClassPredictions.push(pred);
        heroProbabilityValues.push(prob);
    } else {
        console.log("Need more examples!");
        heroClassPredictions.push(pred);
        heroProbabilityValues.push(prob);
        return;
    }

    console.log(heroClassPredictions);
    console.log(heroProbabilityValues);

    let newH = checkChamp(heroClassPredictions, heroProbabilityValues);
    // not sure about current champ at all, backout!
    if (newH == null) {
        return
    }

    if (curr == null || newH != curr) {
        webview.removeEventListener('did-start-loading', loadstart)
        webview.removeEventListener('did-stop-loading', loadstop)
        webview.addEventListener('did-start-loading', loadstart)
        webview.addEventListener('did-stop-loading', loadstop)

        webview.loadURL('http://localhost:3000/owchoosechampspecial?championname=' + newH);

        curr = newH;
    }
}

function startScreen() {
    screenshot().then((fullImage) => {
        // path + "/screenshot.png"
        // /Users/flynn/Downloads/Two/Screenshot (5)/Screenshot (22).png
        fs.writeFile(path + "/screenshot.png", fullImage, function(err) {
            if(err) {
                return console.log(err);
            }
            // Once every second, check if we are on the POTG screen.
            Jimp.read("my_screen.jpg", function (err, jimpImage) {
                if (err) throw err;
                jimpImage.crop(35, 35, 210, 35)
                     .quality(100)
                     .write(path + "/screenshot-potg-cropped.jpg", function(err) {
                         if (err) throw err;
                         var image = new Image();
                         image.onload = function () {
                             checkPlayOfTheGame(image);
                         };
                         image.src = path + '/screenshot-potg-cropped.jpg?' + new Date().getTime();
                     });
            });

            Jimp.read("my_screen.jpg", function (err, jimpImage) {
                if (err) throw err;
                jimpImage.crop(1650, 920, 170, 80)
                     .resize(85, 40)
                     .quality(100)
                     .write(path + "/screenshot-cropped.jpg", function(err) {
                         if (err) throw err;
                         var image = new Image();
                         image.onload = function () {
                             predict(image)
                         };
                         image.src = path + '/screenshot-cropped.jpg?' + new Date().getTime();
                     });
            });

        });
    }).catch((err) => {
          console.log("Screenshot failed", err);
    });
}

// Simply takes an array of predictions and makes sure we predicted the same thing 5 times.
// Otherwise, just return null.
function checkChamp(arr, arrTwo) {
     // First we check that all the predictions beleive they found the SAME hero.
     let s = new Set(arr)
     if(s.size == 1) {
        var it = s.values();
        var first = it.next();
        // Lastly, we do a quick check to make sure we had a "100%" prediction at least once.
        if (arrTwo.filter(item => item == 1).length >= 2) {
            return first.value;
        } else {
            return null;
        }
     } else {
         return null;
     }
}

async function getTopKClasses(logits, topK) {
  const values = await logits.data();

  const valuesAndIndices = [];
  for (let i = 0; i < values.length; i++) {
    valuesAndIndices.push({value: values[i], index: i});
  }
  valuesAndIndices.sort((a, b) => {
    return b.value - a.value;
  });
  const topkValues = new Float32Array(topK);
  const topkIndices = new Int32Array(topK);
  for (let i = 0; i < topK; i++) {
    topkValues[i] = valuesAndIndices[i].value;
    topkIndices[i] = valuesAndIndices[i].index;
  }

  const topClassesAndProbs = [];
  for (let i = 0; i < topkIndices.length; i++) {
    topClassesAndProbs.push({
      className: classes[topkIndices[i]],
      probability: topkValues[i]
    })
  }
  return topClassesAndProbs;
}

// function loadTemplate() {
//     var image = new Image();
//     image.onload = function () {
//         template = image;
//         template = cv.imread(template);
//
//     };
//     image.src = path + '/template.jpg?' + new Date().getTime();
// }
//
// loadTemplate();

function checkPlayOfTheGame(imgElement) {
    if (!(openCVReady)) {
        console.log("OpenCV still not ready!");
        return false;
    }

    if(template == null) {
        console.log("Template still null");
        return false;
    }

    let src = cv.imread(imgElement);
    let dst = new cv.Mat();
    let mask = new cv.Mat();
    cv.matchTemplate(src, template, dst, cv.TM_CCOEFF_NORMED, mask);

    // sq_diff normed 1 - minVal
    // coeff_normed max_val

    let result = cv.minMaxLoc(dst, mask);
    console.log("template match gave us probability ... ", result.maxVal);
    if(result.maxVal < 0.90) {
        console.log("Didn't detect play of the game screen!");
    }

    // let maxPoint = result.maxLoc;
    // let color = new cv.Scalar(255, 0, 0, 255);
    // let point = new cv.Point(maxPoint.x + templ.cols, maxPoint.y + templ.rows);
    // cv.rectangle(src, maxPoint, point, color, 2, cv.LINE_8, 0);
    // cv.imshow('canvasOutput', src);
    src.delete(); dst.delete(); mask.delete();
    console.log("Loaded image as mat!");
}
