var loadFile = function(event) {
var reader = new FileReader();
reader.onload = function(event){
  var preview = document.getElementById('preview_img');
  preview.src = reader.result;
  console.log(preview.src)
  // HACK for now to account for time it takes to load image into div.
  setTimeout(function() {
      preview.src = resize(preview);
  }, 2000);

  //preview.src = resize(reader.result);
};
reader.readAsDataURL(event.target.files[0]);
};

function centerCrop(image){
    console.log("Width... ", image.width)
    console.log("Height... ", image.height)

    var max_width = Math.min(image.width, image.height);
    var max_height = Math.min(image.width, image.height);

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = max_width;
    canvas.height = max_height;
    console.log("Canvas width... ", canvas.width);
    console.log("Canvas height... ", canvas.height)
    ctx.drawImage(image, 0,0,32,32);
    return canvas.toDataURL("image/png");
}

function resize(image){
    var canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    console.log("Width (resize)... ", image.width)
    console.log("Height (resize)... ", image.height)

    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, image.width, image.height);

    var dst = document.createElement('canvas');
    dst.width = 32;
    dst.height = 32;

    window.pica.WW = false;
    window.pica.resizeCanvas(canvas, dst, {
    quality: 2,
    unsharpAmount: 500,
    unsharpThreshold: 100,
    transferable: false
  }, function (err) {  });
    window.pica.WW = true;
    return dst.toDataURL("image/png");
}
