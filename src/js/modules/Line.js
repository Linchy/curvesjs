var Line = (function () {
    function Line(points, startPointIndex, endPointIndex) {
        this.StartPointIndex = -1;
        this.EndPointIndex = -1;
        this.relativeStartPos = {};
        this.relativeEndPos = {};
        this.StartPointIndex = startPointIndex;
        this.EndPointIndex = endPointIndex;
        if (startPointIndex != -1) {
            this.StartPoint = points[startPointIndex];
        }
        if (endPointIndex != -1) {
            this.EndPoint = points[endPointIndex];
        }
    }
    Line.prototype.getRelativeCoordFromToXY = function (c1, c2, x, y) {
        this.relativeStartPos.x = this.StartPoint.position[c1] - x;
        this.relativeStartPos.y = this.StartPoint.position[c2] - y;
        this.relativeEndPos.x = this.EndPoint.position[c1] - x;
        this.relativeEndPos.y = this.EndPoint.position[c2] - y;
        this.StartPoint.pushRelativeControlPoints(c1, c2);
        this.EndPoint.pushRelativeControlPoints(c1, c2);
    };
    Line.prototype.setCoordsFromRelativeXY = function (c1, c2, x, y) {
        this.StartPoint.position[c1] = this.relativeStartPos.x + x;
        this.StartPoint.position[c2] = this.relativeStartPos.y + y;
        this.EndPoint.position[c1] = this.relativeEndPos.x + x;
        this.EndPoint.position[c2] = this.relativeEndPos.y + y;
        this.StartPoint.popRelativeControlPoints(c1, c2);
        this.EndPoint.popRelativeControlPoints(c1, c2);
    };
    return Line;
}());
//# sourceMappingURL=Line.js.map