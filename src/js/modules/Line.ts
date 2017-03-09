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

    getRelativeCoordFromToXY(c1: string, c2: string, x: number, y: number) {
        this.relativeStartPos.x = this.StartPoint.position[c1] - x;
        this.relativeStartPos.y = this.StartPoint.position[c2] - y;

        this.relativeEndPos.x = this.EndPoint.position[c1] - x;
        this.relativeEndPos.y = this.EndPoint.position[c2] - y;

        this.StartPoint.pushRelativeControlPoints(c1, c2);
        this.EndPoint.pushRelativeControlPoints(c1, c2);
    }

    setCoordsFromRelativeXY(c1: string, c2: string, x: number, y: number) {
        this.StartPoint.position[c1] = this.relativeStartPos.x + x;
        this.StartPoint.position[c2] = this.relativeStartPos.y + y;

        this.EndPoint.position[c1] = this.relativeEndPos.x + x;
        this.EndPoint.position[c2] = this.relativeEndPos.y + y;

        this.StartPoint.popRelativeControlPoints(c1, c2);
        this.EndPoint.popRelativeControlPoints(c1, c2);
    }
}