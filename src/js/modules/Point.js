var Point = (function () {
    function Point(x, y, z, color, size, context) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.r = size / 2;
        this.color = color;
        this.ctx = context;
    }
    Point.prototype.SubtractPoint = function (point) {
        this.x -= point.x;
        this.y -= point.y;
        this.z -= point.z;
    };
    Point.prototype.DistanceToPoint = function (p2) {
        var distance = Math.sqrt(((p2.x - this.x) * (p2.x - this.x)) +
            ((p2.y - this.y) * (p2.y - this.y)) +
            ((p2.z - this.z) * (p2.z - this.z)));
        return distance;
    };
    Point.prototype.DistanceToXY = function (c1, c2, x2, y2) {
        var distance = Math.sqrt(((x2 - this[c1]) * (x2 - this[c1])) +
            ((y2 - this[c2]) * (y2 - this[c2])));
        // var distance = Math.sqrt(
        // 	((x2 - this.x) * (x2 - this.x)) + 
        // 	((y2 - this.y) * (y2 - this.y)) + 
        // 	((z2 - this.z) * (z2 - this.z))
        // 	);
        return distance;
    };
    Point.prototype.SetScale = function (prevScale, newScale) {
        this.x = (((this.x) / prevScale) * newScale);
        this.y = (((this.y) / prevScale) * newScale);
        this.z = (((this.z) / prevScale) * newScale);
    };
    Point.prototype.draw = function (c1, c2, origin1, origin2) {
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(this[c1] + origin1, this[c2] + origin2, this.r, 0, Math.PI * 2, false);
        this.ctx.closePath();
        this.ctx.fill();
    };
    return Point;
}());
//# sourceMappingURL=Point.js.map