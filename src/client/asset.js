
// load images
function loadImage(filename) {
    const img = new Image()
    img.src = filename
    return img
}

export const ship_mats = loadImage('./assets/scifitiles-sheet.png')