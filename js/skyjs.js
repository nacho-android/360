/* list all images for sky */
var LDimages = [
"./images/Coral-Sea-20200223_FH_q60_30MAY2023-LD.jpg",
"./images/Gamcheon_228_PSFH_q60_30MAY2023-LD.jpg",
"./images/Gwangalli_185_PSFH_q60_30MAY2023-LD.jpg",
"./images/LJM_751_FH_q60_30MAY2023-LD.jpg",
"./images/Maroubra-20221109_FH_q60_30MAY2023-LD.jpg",
"./images/Mashibayashi_143_PSFH_q60_30MAY2023-LD.jpg",
"./images/NZ-Clyde_498_FH_q60_30MAY2023-LD.jpg",
"./images/Owakudani_066_PSFH_q60_23MAY2023-LD.jpg",
"./images/SLC_817_FH_q60_30MAY2023-LD.jpg",
"./images/SLC_840_FH_q60_30MAY2023-LD.jpg",
"./images/SLC-Jordanelle-Reservoir_854_FH_q60_30MAY2023-LD.jpg",
"./images/SLC-Willow-Creek_891_FH_q60_30MAY2023-LD.jpg",
"./images/Carrs-Park_340_PSFH_q60_03JUN2023-LD.jpg"
]

var images = [
"./images/Coral-Sea-20200223_FH_q60_30MAY2023.jpg",
"./images/Gamcheon_228_PSFH_q60_30MAY2023.jpg",
"./images/Gwangalli_185_PSFH_q60_30MAY2023.jpg",
"./images/LJM_751_FH_q60_30MAY2023.jpg",
"./images/Maroubra-20221109_FH_q60_30MAY2023.jpg",
"./images/Mashibayashi_143_PSFH_q60_30MAY2023.jpg",
"./images/NZ-Clyde_498_FH_q60_30MAY2023.jpg",
"./images/Owakudani_066_PSFH_q60_23MAY2023.jpg",
"./images/SLC_817_FH_q60_30MAY2023.jpg",
"./images/SLC_840_FH_q60_30MAY2023.jpg",
"./images/SLC-Jordanelle-Reservoir_854_FH_q60_30MAY2023.jpg",
"./images/SLC-Willow-Creek_891_FH_q60_30MAY2023.jpg",
"./images/Carrs-Park_340_PSFH_q60_03JUN2023.jpg"
]

/* list corresponding sky labels */
var labels = [
"Holmes Reef, Great Barrier Reef, Queensland, Coral Sea, Australia",
"Gamcheon Culture Village, Busan, South Gyeongsang, South Korea",
"Gwangalli Beach, Busan, South Gyeongsang, South Korea",
"Lake Johnson, Raleigh, North Carolina, USA",
"Maroubra Beach, Maroubra, New South Wales, Australia",
"Mashibayashi, Koshigaya, Saitama, Japan",
"Clutha River, Clyde, Otago, New Zealand",
"Owakudani, Hakone, Kanagawa, Japan",
"University of Utah, Salt Lake City, Utah, USA", 
"Little Dell Reservoir, Salt Lake City, Utah, USA",
"Jordanelle Reservoir, Heber City, Utah, USA",
"Willow Creek Park, Park City, Utah, USA",
"Carss Park, Carss Park, New South Wales, Australia"
]

/* gets sky from URL, drops trailing zero. If invalid or blank, returns null */
var rawskyURL = new URLSearchParams(window.location.search).get('sky');
if (rawskyURL == "") {var skyURL = null}
else if (rawskyURL == null) {var skyURL = null}
else {var skyURL = +rawskyURL}
console.log(rawskyURL);
console.log(skyURL);

var skysrcprev = -1
var skysrc = -1

/* returns a random integer up to length of images variable list, corresponding to a sky that is not the previously selected sky, then calls SkySelect to change the sky and label */
function randomSky() {
  while (skysrc == skysrcprev) {skysrc = Math.floor(Math.random() * images.length)}
  SkySelect(skysrc)
}

/* Changes to user-selected sky and label, clears the URL */
function SkySelect(x) {
  skysrc = x
  console.log(skysrc)
  skysrcprev = skysrc
  $("#sky").attr("src", LDimages[skysrc])
  setTimeout(() => {$("#sky").attr("src", images[skysrc])},500)
  document.getElementById("toplabel").innerHTML = labels[skysrc]
  document.getElementById("copyLink").value = "https://www.360worlds.org/index.html?sky=" + skysrc
  resetZoom()
  history.pushState(null, null, "index.html")
}

/* checks for a valid sky request in the URL and loads it, else loads a randomsky on first load */
function firstSky() {
  if (skyURL == null) {randomSky()}
  else if ((skyURL <= (images.length-1)) && (skyURL > -1)) {SkySelect(skyURL)}
  else {randomSky()}
}

/* copies URL to clipboard */
function copyURL() {
  // Get the text field
  var copyText = document.getElementById("copyLink");

  // Select the text field
  copyText.select();
  copyText.setSelectionRange(0, 99999); // For mobile devices

   // Copy the text inside the text field
  navigator.clipboard.writeText(copyText.value);
}