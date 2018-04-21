var Draw = {
    cacheCanvas:false,
    cacheCTX:false,
    cacheCTX1:false,
    cacheAsCanvas: function (process) {
        var cvs = document.createElement('canvas');
        Draw.cacheCTX1 = cvs.getContext('2d');
        process.call(this, Draw.cacheCTX1, cvs);
        return cvs;
    },
    cacheAsImage: function (process) {
        if (Draw.cacheCTX === false) {
            Draw.cacheCanvas = document.createElement('canvas');
            Draw.cacheCTX = Draw.cacheCanvas.getContext('2d');
        }
        Draw.cacheCanvas.width = 0;
        process.call(this, Draw.cacheCTX, Draw.cacheCanvas);
        var savedImage = new Image();
        savedImage.width = Draw.cacheCanvas.width;
        savedImage.height = Draw.cacheCanvas.height;
        savedImage.src = Draw.cacheCanvas.toDataURL("image/png")
        return savedImage;
    },
    connection: function (ctx, sx, sy, ex, ey, highlighted, fadeDirection) {
        var d = Math.max(Math.abs(ex-sx),Math.abs(ey-sy));
        var cx = Math.min(20,(ex-sx)/8);
        var cy = Math.min(100,d/6);
        ctx.beginPath();
        var color = '#333';
        if (highlighted) {
            color = '#ccc';
        }
        if (fadeDirection==0) {
            ctx.strokeStyle = color;
        } else {
            var colors = [];
            if (fadeDirection == -1) {
                colors = [Desktop_View_File.backgroundColor,Desktop_View_File.backgroundColor,color];
            } else {
                colors = [color,Desktop_View_File.backgroundColor,Desktop_View_File.backgroundColor];
            }
            var gradient = ctx.createLinearGradient(sx, sy, ex, ey);
            gradient.addColorStop("0",colors[0]);
            gradient.addColorStop("0.5",colors[1]);
            gradient.addColorStop("1",colors[2]);
            ctx.strokeStyle = gradient;
        }
        ctx.moveTo(sx,sy);
        ctx.quadraticCurveTo(sx+cx,sy+cy,(ex+sx)/2,(ey+sy)/2);
        ctx.quadraticCurveTo(ex-cx,ey-cy,ex,ey);
        ctx.stroke();
        //debug.log('test');
    },
    link: function (p) {
        //var d = Math.max(Math.abs(p.ex-p.sx),Math.abs(p.ey-p.sy));
        //var cx = Math.min(20,(p.ex-p.sx)/8);
        //var cy = Math.min(100,d/6);
        p.ctx.beginPath();
        var color = '#333';
        if (p.highlighted) {
            color = '#ccc';
        }
        if (p.fadeDirection==0) {
            p.ctx.strokeStyle = color;
        } else {
            var colors = [];
            if (p.fadeDirection == -1) {
                colors = [Desktop_View_File.backgroundColor,Desktop_View_File.backgroundColor,color];
            } else {
                colors = [color,Desktop_View_File.backgroundColor,Desktop_View_File.backgroundColor];
            }
            var gradient = p.ctx.createLinearGradient(p.sx, p.sy, p.ex, p.ey);
            gradient.addColorStop("0",colors[0]);
            gradient.addColorStop("0.5",colors[1]);
            gradient.addColorStop("1",colors[2]);
            p.ctx.strokeStyle = gradient;
        }
        p.ctx.moveTo(p.sx,p.sy);
        p.ctx.bezierCurveTo(p.scx,p.scy,p.ecx,p.ecy,p.ex,p.ey)
        //p.ctx.quadraticCurveTo(p.scx,p.scy,(p.ex+p.sx)/2,(p.ey+p.sy)/2);
        //p.ctx.quadraticCurveTo(p.ecx,p.ecy,p.ex,p.ey);
        p.ctx.stroke();
        //debug.log('test');
    },
    /**
     * Draws a rounded rectangle using the current state of the canvas. 
     * If you omit the last three params, it will draw a rectangle 
     * outline with a 5 pixel border radius 
     * @param {CanvasRenderingContext2D} ctx
     * @param {Number} x The top left x coordinate
     * @param {Number} y The top left y coordinate 
     * @param {Number} width The width of the rectangle 
     * @param {Number} height The height of the rectangle
     * @param {Number} radius The corner radius. Defaults to 5;
     * @param {Boolean} fill Whether to fill the rectangle. Defaults to false.
     * @param {Boolean} stroke Whether to stroke the rectangle. Defaults to true.
     */
    roundRect: function (ctx, x, y, width, height, radius, fill, stroke) {
        if (typeof fill == "undefined" ) {
            fill = true;
        }
        if (typeof stroke == "undefined" ) {
            stroke = true;
        }
        if (typeof radius === "undefined") {
            radius = 10;
        }
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (fill) {
            ctx.fill();
        }        
        if (stroke) {
            ctx.stroke();
        }
    },
    randColors:{},
    randHitmapColor:function() {
        function getRandColor() {
            var clr = '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
            if (Draw.randColors[clr]) {
                return getRandColor();
            }
            Draw.randColors[clr] = 1;
            return clr;
        }
        return getRandColor();
    },
    rgbToHex: function(r, g, b) {
        return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
}