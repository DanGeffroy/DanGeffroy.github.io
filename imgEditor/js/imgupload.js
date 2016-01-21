document.getElementById('imgLoader').onchange = function handleImage(e) {
  var reader = new FileReader();
  reader.onload = function(event) {
    var imgObj = new Image();
    imgObj.src = event.target.result;
    imgObj.onload = function() {
      // start fabricJS stuff

      var image = new fabric.Image(imgObj);
      image.set({
        left: 0,
        top: 0,
        angle: 0,
        padding: 0,
        cornersize: 10
      });
      image.scale(0.2).setCoords();
      canvas.add(image);

      // end fabricJS stuff
    };

  };
  reader.readAsDataURL(e.target.files[0]);
};
