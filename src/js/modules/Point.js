var Point = (function () {
    function Point(x, y, color, size, context) {
        this.x = x;
        this.y = y;
        this.r = size / 2;
        this.color = color;
        this.ctx = context;
    }
    Point.prototype.DistanceToPoint = function (p2) {
        var distance = Math.sqrt(((p2.x - this.x) * (p2.x - this.x)) + ((p2.y - this.y) * (p2.y - this.y)));
        return distance;
    };
    Point.prototype.DistanceToXY = function (x2, y2) {
        var distance = Math.sqrt(((x2 - this.x) * (x2 - this.x)) + ((y2 - this.y) * (y2 - this.y)));
        return distance;
    };
    Point.prototype.draw = function () {
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
        this.ctx.closePath();
        this.ctx.fill();
    };
    return Point;
}());
//# sourceMappingURL=Point.js.map