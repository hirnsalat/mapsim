// import kaboom lib
import kaboom from "kaboom";
import hexMapPlugin from "./hexMap";

// initialize kaboom context
kaboom({
  crisp: false,
  //    letterbox : true,
  width: 640,
  height: 480,
});

plug(hexMapPlugin);

// load shit
loadSprite("tile", "tile.png");

// globals
let curDraggin = null;
let justStartedDraggin = true;
let curScale = 1;
let camDragStartWorld = null;
let camDragStartScreen = null;

// A custom component for handling drag & drop behavior
function drag() {
  // The displacement between object pos and mouse pos
  let offset = vec2(0);

  return {
    // Name of the component
    id: "drag",
    // This component requires the "pos" and "area" component to work
    require: ["pos", "area"],
    // "add" is a lifecycle method gets called when the obj is added to scene
    add() {
      // TODO: these need to be checked in reverse order
      // "this" in all methods refer to the obj
      this.onClick(() => {
        if (curDraggin) {
          return;
        }
        curDraggin = this;
        offset = toWorld(mousePos()).sub(this.pos);
        // Remove the object and re-add it, so it'll be drawn on top
        readd(this);
      });
    },
    // "update" is a lifecycle method gets called every frame the obj is in scene
    update() {
      if (curDraggin === this) {
        // cursor("move")
        this.pos = toWorld(mousePos()).sub(offset);
      }
    },
  };
}

function slot() {
  return {
    add() {
      // TODO: these need to be checked in reverse order
      // "this" in all methods refer to the obj
      this.onClick(() => {
        if (curDraggin != null && !justStartedDraggin) {
          curDraggin.pos = this.pos;
          curDraggin = null;
        }
      });
    },
  };
}

onMouseRelease((mousePos) => {
  justStartedDraggin = curDraggin == null;
});

camScale(curScale);

//// doesn't work, don't know why
// onMousePress("forward", () => {
//     curScale += 0.5;
//     camScale(curScale);
// })

onMousePress("middle", () => {
  camDragStartWorld = mousePos();
  camDragStartScreen = camPos();
});

onMouseDown("middle", () => {
  let newMousePos = mousePos();
  let worldOffset = newMousePos.sub(camDragStartWorld).scale(1 / curScale); //.scale(camScale())
  camPos(camDragStartScreen.sub(worldOffset));
});

//layers([
//    "map",
//    "objects",
//])

let infotext = add([
  //    layer("objects"),
  pos(0, 0),
  fixed(),
  text("hi"),
  z(9000),
]);

let daGrid = add([
  hexgrid(32, 32, 169), // for radius 30: 2791
  //hexPolys(32,32),
  hexSprites("tile"),
  //    layer("map"),
]);

onMouseMove((mousePos) => {
  let posInHex = daGrid.getCoords(toWorld(mousePos));

  let q = posInHex.x;
  let r = posInHex.y;
  let s = -q - r;

  infotext.text = q + "," + r + "," + s + ":" + hexToIndex(q, r);
});

//add([
//    sprite("lich"),
//    area(),
//    drag(),
//    scale(0.2),
//    pos(60, 160),
////    origin("bot"),
//    origin(vec2(0,0.75)),
//    layer("objects"),
//    hidden(),
//]);

camPos(0, 0);
