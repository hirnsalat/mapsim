// import kaboom lib
import kaboom from "kaboom";

// initialize kaboom context
kaboom({
    crisp : false,
    letterbox : true,
    width : 640,
    height : 480,
});

// load shit
loadSprite("tile", "tile.png")

// globals
let curDraggin = null
let justStartedDraggin = true
let curScale = 2
let camDragStartWorld = null
let camDragStartScreen = null
let drawName = false

// A custom component for handling drag & drop behavior
function drag() {

    // The displacement between object pos and mouse pos
    let offset = vec2(0)

    return {
        // Name of the component
        id: "drag",
        // This component requires the "pos" and "area" component to work
        require: [ "pos", "area", ],
        // "add" is a lifecycle method gets called when the obj is added to scene
        add() {
            // TODO: these need to be checked in reverse order
            // "this" in all methods refer to the obj
            this.onClick(() => {
                if (curDraggin) {
                    return
                }
                curDraggin = this
                offset = toWorld(mousePos()).sub(this.pos)
                // Remove the object and re-add it, so it'll be drawn on top
                readd(this)
            })
        },
        // "update" is a lifecycle method gets called every frame the obj is in scene
        update() {
            if (curDraggin === this) {
                // cursor("move")
                this.pos = toWorld(mousePos()).sub(offset)
            }
        },
    }

}

function slot() {
    return {
        add() {
            // TODO: these need to be checked in reverse order
            // "this" in all methods refer to the obj
            this.onClick(() => {
                if (curDraggin != null && ! justStartedDraggin) {
                    curDraggin.pos = this.pos
                    curDraggin = null
                }
            })
        },
    }
}

function hexToIndex(q, r) {
    let s = -q-r
    let dist = Math.max(Math.abs(q), Math.abs(r), Math.abs(s))
    let distOffset = 1+ 3 * dist * (dist-1)

    if(dist == 0) return 0

    if(q == dist) {
        return distOffset -s
    } else if(s == -dist) {
        return distOffset + dist + r
    } else if(r == dist) {
        return distOffset + 2*dist -q
    } else if(q == -dist) {
        return distOffset + 3*dist +s
    } else if(s == dist) {
        return distOffset + 4*dist -r
    } else if(r == -dist) {
        return distOffset + 5*dist +q
    }
}

function hexgrid(hexh, hexw, initHexes) {
    let shiftx = hexw
    let shifty = hexh * 3/4


    function inithex(n) {
        let hue = rand()

        return {
            color :  hsl2rgb(hue,0.2,0.9),
            shade1 : hsl2rgb(hue,0.2,0.6),
            shade2 : hsl2rgb(hue,0.2,0.7),
            shift :  randi(hexh/8),
            name : n,
        }
    }

    function worldToHex(pos) {
        let fr = pos.y / shifty
        let fq = pos.x / shiftx - fr / 2
        let fs = -fq - fr
    
        let q = Math.round(fq)
        let r = Math.round(fr)
        let s = Math.round(fs)
    
        let q_diff = Math.abs(q - fq)
        let r_diff = Math.abs(r - fr)
        let s_diff = Math.abs(s - fs)
    
        if (q_diff > r_diff && q_diff > s_diff) {
            q = -r-s
        } else if (r_diff > s_diff) {
            r = -q-s
        } else {
            s = -q-r
        }
    
        return vec2(q,r)
    }

    function screenToHex(pos) {
        return worldToHex(toWorld(pos))
    }
    
    function hexToWorld(q, r) {
        let y = r * shifty
        let x = q * shiftx + r * shiftx/2
        return vec2(x,y)
    }


    let hexes = []
    for(let i = 0; i < initHexes; i++) {
        hexes[i] = inithex(i)
    }


    return {
        getCoords(pos) {
            return worldToHex(pos)
        },

        draw() {
            let screenStartInHex = screenToHex(vec2(0,0))
            let screenEndInHex = screenToHex(vec2(width(),0))
            let screenEndInHex2 = screenToHex(vec2(width(),height()))
            let qstart = screenStartInHex.x
            let qend = screenEndInHex.x + 2 // todo: improve with fractional coords
            let rstart = screenStartInHex.y -1
            let rend = screenEndInHex2.y
            let hexpos = null
            let hexidx = 0
            let r = rstart

            for(let r = rstart; r <= rend; r++) {
                if(r % 2) {
                    qstart--; qend--;
                }
                for(let q = qstart; q <= qend; q++) {
                    hexidx = hexToIndex(q,r)
                    if(hexes[hexidx]) {
                        hexpos = hexToWorld(q,r)
                        this.drawHex(hexpos.x, hexpos.y, hexes[hexidx])
                    }
                }
            }

        }
    }
}

function hexSprites(spriteName) {
    return {
        drawHex(x,y,hex) {
            let hexpos = vec2(x,y + hex.shift)
            drawSprite({
                pos : hexpos,
                sprite : spriteName,
                origin : "center",
                color : hex.color,
            })
            if(drawName) {
                drawText({
                    pos : hexpos,
                    text : hex.name,
                    size : 12,
                    origin : "center",
                })
            }
        }
    }
}

function hexPolys(hexh, hexw) {
    let hexpts = [
            vec2(0,-hexh/2),
            vec2(hexw/2, -hexh/4),
            vec2(hexw/2, hexh/4),
            vec2(0, hexh/2),
            vec2(-hexw/2, hexh/4),
            vec2(-hexw/2, -hexh/4),
        ]
    let side1points = [
            vec2(0, hexh/2),
            vec2(-hexw/2, hexh/4),
            vec2(-hexw/2, hexh/2),
            vec2(0, hexh/2 + hexh/4),
        ]
    let side2points = [
            vec2(hexw/2, hexh/4),
            vec2(0, hexh/2),
            vec2(0, hexh/2 + hexh/4),
            vec2(hexw/2, hexh/2),
        ]
    let outline = {
            width: 1,
            color: rgb(0, 0, 0),
        }
    return {
        drawHex(x, y, hex) {
            let shift = wave(0,hexh/8,time() + hex.shift)
            let hexpos = vec2(x,y + shift)

            drawPolygon({
                pos : hexpos,
                pts : side1points,
                outline,
                color: hex.shade1,
            })
            drawPolygon({
                pos : hexpos,
                pts : side2points,
                outline,
                color: hex.shade2,
            })
            drawPolygon({
                pos : hexpos,
                pts : hexpts,
                outline,
                color: hex.color,
            })
            if(drawName) {
                drawText({
                    pos : hexpos,
                    text : hex.name,
                    size : hexh/3,
                    origin : "center",
                })
            }
        }
    }
}


//// fullscreen mode breaks mouse :(
//// toggle fullscreen mode on "f"
//onKeyPress("f", (c) => {
//    fullscreen(!isFullscreen())
//})

onKeyPress("n", (c) => {
    drawName = ! drawName
})

onMouseRelease((mousePos) => {
    justStartedDraggin = curDraggin == null
})

camScale(curScale);

//// doesn't work, don't know why
// onMousePress("forward", () => {
//     curScale += 0.5;
//     camScale(curScale);
// })

onMousePress("middle", () => {
    camDragStartWorld = mousePos()
    camDragStartScreen = camPos()
})

onMouseDown("middle", () => {
    let newMousePos = mousePos()
    let worldOffset = newMousePos.sub(camDragStartWorld).scale(1 / curScale) //.scale(camScale())
    camPos(camDragStartScreen.sub(worldOffset))
})

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
    hexgrid(32,32, 169), // for radius 30: 2791
    //hexPolys(32,32),
    hexSprites("tile"),
//    layer("map"),
]);


onMouseMove((mousePos) => {
    let posInHex = daGrid.getCoords(toWorld(mousePos))

    let q = posInHex.x
    let r = posInHex.y
    let s = -q-r

    infotext.text = q + "," + r + "," + s + ":" + hexToIndex(q,r)
})

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

