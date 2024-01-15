window.addEventListener("wheel", (event) => {
    // small increments for smoother zooming
    const delta = event.wheelDelta / 120/15;
    var mycam = document.getElementById("cam").getAttribute("camera");
    var finalZoom =
      document.getElementById("cam").getAttribute("camera").zoom + delta;

    // limiting the zoom
    if (finalZoom < 1) finalZoom = 1;
    if (finalZoom > 4.5) finalZoom = 4.5;
    mycam.zoom = finalZoom;

    document.getElementById("cam").setAttribute("camera", mycam);
  });

function resetZoom() {
  var mycam = document.getElementById("cam").getAttribute("camera")
  mycam.zoom = 1
  document.getElementById("cam").setAttribute("camera", mycam)
}

function includeHTML() {
  var z, i, elmnt, file, xhttp;
  /* Loop through a collection of all HTML elements: */
  z = document.getElementsByTagName("*");
  for (i = 0; i < z.length; i++) {
    elmnt = z[i];
    /*search for elements with a certain atrribute:*/
    file = elmnt.getAttribute("w3-include-html");
    if (file) {
      /* Make an HTTP request using the attribute value as the file name: */
      xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200) {elmnt.innerHTML = this.responseText;}
          if (this.status == 404) {elmnt.innerHTML = "Page not found.";}
          /* Remove the attribute, and call this function once more: */
          elmnt.removeAttribute("w3-include-html");
          includeHTML();
        }
      }
      xhttp.open("GET", file, true);
      xhttp.send();
      /* Exit the function: */
      return;
    }
  }
}