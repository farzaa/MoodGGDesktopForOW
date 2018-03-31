const fs = require('fs');

var tf = require('@tensorflow/tfjs');

let model;


let classes = {0: 'solider', 1: 'genji', 2: 'reaper'}

const loadModel = async () => {
    console.log("Loading Model...")
    model =  await tf.loadModel('https://s3-us-west-2.amazonaws.com/mood1995/neural_net/model.json');
    console.log("Model loaded!")
}


async function predict(imgElement) {

    const logits = tf.tidy(() => {
        const img = tf.fromPixels(imgElement).toFloat()
        const batched = img.reshape([1, 40, 85, 3]);
        return model.predict(batched);
    });



    const classes = await getTopKClasses(logits, 1);
    console.log(classes[0].className)


}

loadModel()

var Jimp = require("jimp");

const screenshot = require('screenshot-desktop')

const remote = require('electron').remote;
const path = remote.getGlobal('curr_path')

var {ipcRenderer} = require('electron');

console.log("Hello, from the renderer!");
setInterval(startScreen, 5000)


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

                             var preview = document.getElementById('preview_img');

                             predict(image)


                             preview.src = image.src;
                             //$('#preview_img').attr('src', image.src)
                             $("#img_holder").append("<img src=" + image.src + ">")

                             // ipcRenderer.send('HEROUPDATE', 'The current hero is...');
                         };

                         image.src = path + '/screenshot-cropped.jpg?' + new Date().getTime();
                     });
            });
        });
    }).catch((err) => {
          console.log("Screenshot failed", err);
    });
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
