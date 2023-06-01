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
"./images/SLC-Willow-Creek_891_FH_q60_30MAY2023-LD.jpg"
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
"./images/SLC-Willow-Creek_891_FH_q60_30MAY2023.jpg"
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
"Willow Creek Park, Park City, Utah, USA"
]

var skysrcprev = -1
var skysrc = -1


/* returns a random integer up to length of images variable list, logs it, then changes the sky and label */
function randomSky() {
  while (skysrc == skysrcprev) {
  skysrc = Math.floor(Math.random() * images.length);
   }
  console.log(skysrc)
  skysrcprev = skysrc
  $("#sky").attr("src", LDimages[skysrc])
  setTimeout(() => {$("#sky").attr("src", images[skysrc])},100)
  document.getElementById("toplabel").innerHTML = labels[skysrc]
  resetZoom()
}

/* Changes to user-selected sky and label */
function SkySelect(x) {
  skysrc = x
  console.log(skysrc)
  skysrcprev = skysrc
  $("#sky").attr("src", LDimages[skysrc])
  setTimeout(() => {$("#sky").attr("src", images[skysrc])},100)
  document.getElementById("toplabel").innerHTML = labels[skysrc]
  resetZoom()
}

