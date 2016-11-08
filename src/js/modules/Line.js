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
    Line.prototype.getRelativeCoordFromToXY = function (x, y) {
        this.relativeStartPos.x = this.StartPoint.position.x - x;
        this.relativeStartPos.y = this.StartPoint.position.y - y;
        this.relativeEndPos.x = this.EndPoint.position.x - x;
        this.relativeEndPos.y = this.EndPoint.position.y - y;
        this.StartPoint.getRelativeControlPoints();
        this.EndPoint.getRelativeControlPoints();
    };
    Line.prototype.setCoordsFromRelativeXY = function (x, y) {
        this.StartPoint.position.x = this.relativeStartPos.x + x;
        this.StartPoint.position.y = this.relativeStartPos.y + y;
        this.EndPoint.position.x = this.relativeEndPos.x + x;
        this.EndPoint.position.y = this.relativeEndPos.y + y;
        this.StartPoint.setRelativeControlPoints();
        this.EndPoint.setRelativeControlPoints();
    };
    return Line;
}());
//# sourceMappingURL=Line.js.map