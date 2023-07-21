function hexMapPlugin(k) {
  return {
hexToIndex(q, r) {
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
},

hexgrid(hexh, hexw, initHexes) {
    let shiftx = hexw
    let shifty = hexh * 3/4


    function inithex(n) {
        let hue = k.rand()

        return {
            color :  k.hsl2rgb(hue,0.2,0.9),
            shade1 : k.hsl2rgb(hue,0.2,0.6),
            shade2 : k.hsl2rgb(hue,0.2,0.7),
            shift :  k.randi(hexh/8),
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
    
        return k.vec2(q,r)
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
},

hexSprites(spriteName) {
    return {
        drawHex(x,y,hex) {
            let hexpos = vec2(x,y + hex.shift)
            drawSprite({
                pos : hexpos,
                sprite : spriteName,
                origin : "center",
                color : hex.color,
            })
        }
    }
},

hexPolys(hexh, hexw) {
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
        }
    }
},
}
}

export default hexMapPlugin;
