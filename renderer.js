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

// Load model from AWS, and than start taking screenshots.
const loadModel = async () => {
    console.log("Loading Model...");
    model =  await tf.loadModel('https://s3-us-west-2.amazonaws.com/mood1995/neural_net_all_heroes/model.json');
    console.log("Model loaded!");
    setInterval(startScreen, 1000)
}

loadModel();

async function predict(imgElement) {
    const logits = tf.tidy(() => {
        const img = tf.fromPixels(imgElement).toFloat();
        const batched = img.reshape([1, 40, 85, 3]);
        return model.predict(batched);
    });

    const classes = await getTopKClasses(logits, 1);

    let prob = classes[0].probability;
    let pred = classes[0].className;
    // if(prob < 0.85) {
    //     console.log("Not sure what I'm loooking at!");
    //     return;
    // }

    // check last 5 predictions, and only then switch playlists.
    if (heroClassPredictions.length == 5) {
        // remove oldest prediction to keep array at constant size < 5.
        heroClassPredictions.shift();
        heroProbabilityValues.shift()
        // push newest prediction.
        heroClassPredictions.push(pred);
        heroProbabilityValues.push(prob);
    } else {
        heroClassPredictions.push(pred);
        heroProbabilityValues.push(prob);
        return;
    }

    let newH = checkChamp(heroClassPredictions);

    // not sure about current champ at all, backout!
    if (newH == null) {
        return
    }

    if (newH != curr || curr == null) {
        console.log(heroClassPredictions);
        console.log(heroProbabilityValues);



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
        fs.writeFile(path + "/screenshot.png", fullImage, function(err) {
            if(err) {
                return console.log(err);
            }

            Jimp.read(fullImage, function (err, jimpImage) {
                if (err) throw err;
                jimpImage.crop(1650, 920, 170, 80)     // crop that shit baby
                     .resize(85, 40)
                     .quality(100)
                                    // always keep it a hunded'
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
function checkChamp(arr) {
     let s = new Set(arr)
     if(s.size == 1) {
        var it = s.values();
        var first = it.next();
        return first.value;
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
