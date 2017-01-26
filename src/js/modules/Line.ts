class Line {

    StartPointIndex: number = -1;
    EndPointIndex: number = -1;

    StartPoint: BezierPoint;
    EndPoint: BezierPoint;

    relativeStartPos: any = {};
    relativeEndPos: any = {};

    constructor(points: BezierPoint[], startPointIndex: number, endPointIndex: number) {

        this.StartPointIndex = startPointIndex;
        this.EndPointIndex = endPointIndex;

        if (startPointIndex != -1) {
            this.StartPoint = points[startPointIndex];
        }

        if (endPointIndex != -1) {
            this.EndPoint = points[endPointIndex];
        }
    }

    getRelativeCoordFromToXY(x: number, y: number) {
        this.relativeStartPos.x = this.StartPoint.position.x - x;
        this.relativeStartPos.y = this.StartPoint.position.y  -y;

        this.relativeEndPos.x = this.EndPoint.position.x - x;
        this.relativeEndPos.y = this.EndPoint.position.y - y;

        this.StartPoint.pushRelativeControlPoints();
        this.EndPoint.pushRelativeControlPoints();
    }

    setCoordsFromRelativeXY(x: number, y: number) {
        this.StartPoint.position.x = this.relativeStartPos.x + x;
        this.StartPoint.position.y = this.relativeStartPos.y + y;

        this.EndPoint.position.x = this.relativeEndPos.x + x;
        this.EndPoint.position.y = this.relativeEndPos.y + y;

        this.StartPoint.popRelativeControlPoints();
        this.EndPoint.popRelativeControlPoints();
    }
}