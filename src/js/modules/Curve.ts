class Curve {

    htmlParent: HTMLElement;

    surfaceOnly: boolean;

    cpDist: number;

    pointColor: string;
    pointSize: number;

    lineColor: string;
    lineWidth: number;

    ctx: CanvasRenderingContext2D;
    cw: number;
    ch: number;

    mouseX: number;
    mouseY: number;

    events: any;

    points: BezierPoint[];

    shiftKeyDown: boolean = false; // 16
    //var ctrlKeyDown: boolean = false; // 17
    altKeyDown: boolean = false; // 18

    ActivePoint: BezierPoint = null;

    CloseLoop: boolean = true;

    constructor(context: CanvasRenderingContext2D, htmlParent: HTMLElement, pointsJson: string, surfaceOnly?: boolean) {

        this.ctx = context;
        this.cw = context.canvas.width;
        this.ch = context.canvas.height;

        this.htmlParent = htmlParent;

        this.surfaceOnly = (surfaceOnly === undefined ? false : surfaceOnly);

        this.cpDist = 40;

        this.pointColor = '#f00';
        this.pointSize = 3;

        this.lineColor = 'cornflowerblue';
        this.lineWidth = 1;

        if (!pointsJson) {
            var offsetX = 200;
            var offsetY = 80;

            this.points = [
                new BezierPoint(offsetX, offsetY, context, this.pointColor, this.pointSize, this.cpDist, false, true),
                new BezierPoint(context.canvas.width - offsetX, offsetY, context, this.pointColor, this.pointSize, this.cpDist, false, true),
                new BezierPoint(context.canvas.width - offsetX, context.canvas.height - offsetY, context, this.pointColor, this.pointSize, this.cpDist, true, true),
                new BezierPoint(offsetX, context.canvas.height - offsetY, context, this.pointColor, this.pointSize, this.cpDist, true, true),
            ];

            this.setPointsAttr();
        }
        else {
            this.setPoints(pointsJson);
        }


        this.mouseX = 0;
        this.mouseY = 0;

        this.events = {};

        this.canvasEvents();
        this.draw();

        var self = this;

        window.addEventListener('keydown', function (e) {
            self.shiftKeyDown = e.shiftKey;
            //self.ctrlKeyDown = e.ctrlKey;
            self.altKeyDown = e.altKey;
        });

        window.addEventListener('keyup', function (e) {
            self.shiftKeyDown = e.shiftKey;
            //self.ctrlKeyDown = e.ctrlKey;
            self.altKeyDown = e.altKey;
        }); 
    }

    setPoints(pointsJson: string) {
        var dataObj = JSON.parse(pointsJson);
        this.CloseLoop = dataObj.closeLoop;
        this.points = []
        for (var i = 0; i < dataObj.points.length; i++) {
            var point = new BezierPoint(dataObj.points[i].x, dataObj.points[i].y, this.ctx, this.pointColor, this.pointSize, this.cpDist, false, dataObj.points[i].isSurfacePoint);
            point.cp1.x = dataObj.points[i].cp1X;
            point.cp1.y = dataObj.points[i].cp1Y;
            point.cp2.x = dataObj.points[i].cp2X;
            point.cp2.y = dataObj.points[i].cp2Y;
            this.points.push(point);
        }
        this.setPointsAttr();
    }

    getPointsJson(): string {
        var pointMap = this.points.map(function (point) {
            return {
                x: point.position.x, 
                y: point.position.y, 
                cp1X: point.cp1.x, 
                cp1Y: point.cp1.y, 
                cp2X: point.cp2.x, 
                cp2Y: point.cp2.y,
                isSurfacePoint: point.isSurfacePoint
            };
        });

        var dataObj: any = {
            closeLoop: this.CloseLoop,
            points: pointMap
        };

        if (this.surfaceOnly) {
            dataObj.baseSurface = 'Square';
        }

        var pointsStr = JSON.stringify(dataObj);
        return pointsStr;
    }

    setPointsAttr() {
        this.htmlParent.setAttribute('points', this.getPointsJson());
    }

    on(event: any, func: any) {
        this.events['on' + event] = func.bind(this);
    };

    setActivePoint(point: BezierPoint) {
        if (this.ActivePoint != null)
            this.ActivePoint.active = false;

        this.ActivePoint = point;
        if (point)
            this.ActivePoint.active = true;

        this.draw();
    };

    addPoint(x: number, y: number, nearestInfo: CurveSample): BezierPoint {

        var point = null;
        if (nearestInfo.realPointIndex) {
            var insertIndex = nearestInfo.realPointIndex;
            point = this.SliceBezier(
                insertIndex == 0 ? this.points.length - 1 : insertIndex - 1,
                insertIndex,
                nearestInfo.t);
        }
        else {
            point = new BezierPoint(x, y, this.ctx, this.pointColor, this.pointSize, this.cpDist);
            this.points.push(point);
        }

        this.setPointsAttr();
        return point;
    };

    setPointStyle(color: any, size: number) {

        for (var i = 0; i < this.points.length; i++) {
            this.points[i].setPointStyle(color, size);
            this.pointColor = color;
            this.pointSize = size;
        }
        this.draw();

    };

    setLineStyle(color: any, width: number) {

        //this.lineColor = color;
        this.lineWidth = width;
        this.draw();

    };

    ToggleCloseLoop(close: boolean) {
        this.CloseLoop = close;
        this.draw();
        this.setPointsAttr();
    }

    draw() {

        this.ctx.clearRect(0, 0, this.cw, this.ch);

        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;

        // Grid

        /*for (i = 1; i < 10; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo((this.cw/10)*i-0.5, 0);
            this.ctx.lineTo((this.cw/10)*i-0.5, this.ch);
            this.ctx.stroke();
        }
        for (i = 1; i < 5; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, (this.ch/5)*i-0.5);
            this.ctx.lineTo(this.cw, (this.ch/5)*i-0.5);
            this.ctx.stroke();
        }*/

        this.ctx.lineWidth = 0.5;
        for (i = 1; i < 20; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo((this.cw / 20) * i - 0.5, 0);
            this.ctx.lineTo((this.cw / 20) * i - 0.5, this.ch);
            this.ctx.stroke();
        }
        for (i = 1; i < 10; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, (this.ch / 10) * i - 0.5);
            this.ctx.lineTo(this.cw, (this.ch / 10) * i - 0.5);
            this.ctx.stroke();
        }

        // draw curve as path

        this.ctx.strokeStyle = this.lineColor;
        this.ctx.lineWidth = this.lineWidth;

        this.ctx.beginPath();
        this.ctx.moveTo(this.points[0].position.x, this.points[0].position.y);

        var endCount = this.points.length - (this.CloseLoop ? 0 : 1);

        for (i = 1; i <= endCount; i++) {
            var p1 = this.points[(i - 1)];
            var p2 = this.points[i % this.points.length];
            this.ctx.bezierCurveTo(p1.cp2.x, p1.cp2.y, p2.cp1.x, p2.cp1.y, p2.position.x, p2.position.y);
        }
        this.ctx.stroke();

        // draw points that user can click and drag

        for (var i = 0; i < this.points.length; i++) {
            this.points[i].draw();
        }

    };

    createLUT(): CurveSample[] {

        var lookup: CurveSample[] = [];

        //Percent Based Tesselation
        for (var i = 0; i < this.points.length; i++) {
            var p1 = this.points[i];
            var p2 = this.points[(i + 1) % this.points.length];

            var linearDist = p1.position.DistanceToPoint(p2.position);
            if (linearDist <= 0)
                linearDist = 10;

            var sampleCount = linearDist * 10;
            if (sampleCount < 100)
                sampleCount = 100;
            else if (sampleCount > 200)
                sampleCount = 200;

            // push first point
            var realPointIndex = (i + 1) % this.points.length;
            lookup.push({ x: p1.position.x, y: p1.position.y, realPointIndex: realPointIndex, t: 0 })

            // push middle points
            for (var j = 1; j < sampleCount; j++) {
                var t = j / sampleCount;
                var x = this.Sample(t, p1.position.x, p1.cp2.x, p2.cp1.x, p2.position.x);
                var y = this.Sample(t, p1.position.y, p1.cp2.y, p2.cp1.y, p2.position.y);

                lookup.push({ x: x, y: y, realPointIndex: realPointIndex, t: t })
                //this.lookupX.push(x/this.cw);
                //this.lookupY.push(-y/this.ch+1);
            }

            // push last point
            //lookup.push({ x: p1.position.x, y: p1.position.y, pointIndex: (i + 1) % this.points.length })
        }

        return lookup;
    };

    Sample(t: number, c0: number, c1: number, c2: number, c3: number) {
        var sample =
            (c0 * (Math.pow((1 - t), 3))) +
            (c1 * 3 * t * Math.pow((1 - t), 2)) +
            (c2 * 3 * (1 - t) * Math.pow(t, 2)) +
            (c3 * Math.pow(t, 3));
        return sample;
    };

    SliceBezier(p1Index: number, p2Index: number, t: number) {

        var p1 = this.points[p1Index].position;
        var line_cp1 = this.points[p1Index].cp2;
        var line_cp2 = this.points[p2Index].cp1;
        var p2 = this.points[p2Index].position;

        // ---

        var x12 = (line_cp1.x - p1.x) * t + p1.x;
        var y12 = (line_cp1.y - p1.y) * t + p1.y;

        var x23 = (line_cp2.x - line_cp1.x) * t + line_cp1.x;
        var y23 = (line_cp2.y - line_cp1.y) * t + line_cp1.y;

        var x34 = (p2.x - line_cp2.x) * t + line_cp2.x;
        var y34 = (p2.y - line_cp2.y) * t + line_cp2.y;

        var x123 = (x23 - x12) * t + x12;
        var y123 = (y23 - y12) * t + y12;

        var x234 = (x34 - x23) * t + x23;
        var y234 = (y34 - y23) * t + y23;

        var x1234 = (x234 - x123) * t + x123;
        var y1234 = (y234 - y123) * t + y123;

        // ---

        line_cp1.x = x12;
        line_cp1.y = y12;

        line_cp2.x = x34;
        line_cp2.y = y34;

        var insertedPoint = new BezierPoint(x1234, y1234, this.ctx, this.pointColor, this.pointSize, this.cpDist);

        insertedPoint.cp1.x = x123;
        insertedPoint.cp1.y = y123;

        insertedPoint.cp2.x = x234;
        insertedPoint.cp2.y = y234;

        this.points.splice(p2Index, 0, insertedPoint);
    }

    canvasEvents() {

        var x: number,
            y: number,
            nearestPoint: BezierPoint,
            nearestPointIndex: number,
            nearestPointDist: number,
            hoverPoint: BezierPoint,
            dragCP: string,
            isDragging: boolean;

        var curve: Curve = this;

        var setNearestPoint = function () {
            nearestPoint = null;
            nearestPointIndex = -1;
            nearestPointDist = Number.MAX_VALUE;

            hoverPoint = null;
            dragCP = null;
            isDragging = false;

            for (var i = 0; i < curve.points.length; i++) {
                var p = curve.points[i];
                var dist = p.position.DistanceToXY(x, y);

                // check point
                if (dist < nearestPointDist) {
                    nearestPointIndex = i;
                    nearestPointDist = dist;
                }

                // check control points
                if (p.active) {
                    // cp1
                    dist = p.cp1.DistanceToXY(x, y);
                    if (dist < nearestPointDist) {
                        nearestPointIndex = i;
                        nearestPointDist = dist;
                        dragCP = 'cp1';
                    }
                    else // cp2
                    {
                        dist = p.cp2.DistanceToXY(x, y);
                        if (dist < nearestPointDist) {
                            nearestPointIndex = i;
                            nearestPointDist = dist;
                            dragCP = 'cp2';
                        }
                    }
                }
            }

            if (nearestPointIndex != -1) {
                nearestPoint = curve.points[nearestPointIndex];

                var minDist = curve.pointSize / 2 + 2;
                if (nearestPointDist <= minDist)
                    hoverPoint = nearestPoint;

                curve.ctx.canvas.style.cursor = 'pointer';
            }
            else {
                curve.ctx.canvas.style.cursor = 'initial';
            }

        };

        this.ctx.canvas.addEventListener('mousemove', function (evt: any) {

            var bbox = this.getBoundingClientRect();

            x = evt.clientX - bbox.left;
            y = evt.clientY - bbox.top;

            curve.mouseX = x;
            curve.mouseY = y;

            if (isDragging) {
                curve.mousedrag(evt, x, y, dragCP);
            }
            else {
                setNearestPoint();
            }

            // ?? grid thing ??
            if (curve.altKeyDown) {
                var deltaW = curve.cw / 20;
                var deltaH = curve.ch / 10;

                var posX = Math.floor((x + deltaW / 2) / deltaW);
                var posY = Math.floor((y + deltaH / 2) / deltaH);

                x = deltaW * posX;
                y = deltaH * posY;
            }

            // raise event
            if (curve.events.onmousemove != null)
                curve.events.onmousemove();

        });

        this.ctx.canvas.addEventListener('mousedown', function (evt: any) {
            evt.preventDefault();

            if (hoverPoint != null) {
                curve.setActivePoint(hoverPoint);
                isDragging = true;
            }
            else {
                curve.setActivePoint(null);
                isDragging = false;
            }
        });

        this.ctx.canvas.addEventListener('mouseup', function (evt: any) {
            dragCP = null;
            isDragging = false;
        });

        this.ctx.canvas.addEventListener('mouseleave', function (evt: any) {
            if (isDragging) {
                // dont let point get dragged outside canvas where we can't see it
                curve.ActivePoint.SetPointOnCanvasBorder(evt, dragCP, curve.cw, curve.ch, curve.shiftKeyDown, x, y);
                dragCP = null;
                isDragging = false;
            }
        });

        /*this.ctx.canvas.addEventListener('click', function (evt: any) {
            if (curve.shiftKeyDown && curve.ActivePoint != null && !dragCP) {
                curve.ActivePoint.collapse();

                // raise event
                if (curve.events.ontogglecontrol != null)
                    curve.events.ontogglecontrol();
            }
        });*/

        this.ctx.canvas.addEventListener('dblclick', function (evt: any) {
            // add point
            if (curve.ActivePoint == null) {
                var lookup = curve.createLUT();
                if (lookup.length == 0)
                    return;

                var nearestInfo = null;
                var nearestDist = Number.MAX_VALUE;

                // find closest point
                for (var i = 0; i < lookup.length; i++) {
                    var dist = ((x - lookup[i].x) * (x - lookup[i].x)) + ((y - lookup[i].y) * (y - lookup[i].y));
                    if (dist < nearestDist) {
                        nearestInfo = lookup[i];
                        nearestDist = dist;
                    }
                }

                // insert after point index
                var newPoint = curve.addPoint(x, y, nearestInfo);
                curve.setActivePoint(newPoint);
                this.style.cursor = 'pointer';

                // raise event
                if (curve.events.onnewpoint != null)
                    curve.events.onnewpoint();
            }
            else if (!curve.ActivePoint.isSurfacePoint) // remove point
            {
                curve.points.splice(nearestPointIndex, 1);
                this.style.cursor = 'initial';

                // raise event
                if (curve.events.onremovepoint != null)
                    curve.events.onremovepoint();
            }

            curve.draw();
        });
    }

    mousedrag(evt: any, x: number, y: number, dragCP: string) {
        if (dragCP == 'cp1') {
            this.ActivePoint.cp1.x = x;
            this.ActivePoint.cp1.y = y;

            this.ActivePoint.move();

            if (!this.shiftKeyDown) {
                this.ActivePoint.cp2.x = x - this.ActivePoint.v1x * 2;
                this.ActivePoint.cp2.y = y - this.ActivePoint.v1y * 2;
            }
        }
        else if (dragCP == 'cp2') {

            this.ActivePoint.cp2.x = x;
            this.ActivePoint.cp2.y = y;

            this.ActivePoint.move();

            if (!this.shiftKeyDown) {
                this.ActivePoint.cp1.x = x - this.ActivePoint.v2x * 2;
                this.ActivePoint.cp1.y = y - this.ActivePoint.v2y * 2;
            }
        }
        else {
            this.ActivePoint.move();

            this.ActivePoint.position.x = x;
            this.ActivePoint.position.y = y;

            // keep first and last point on sides
            /*if (this.ActivePointIndex === 0) {
                this.ActivePoint.position.x = 0;
            }
            if (this.ActivePointIndex == this.points.length-1) {
                this.ActivePoint.position.x = this.cw;
            }*/

            this.ActivePoint.cp1.x = this.ActivePoint.position.x + this.ActivePoint.v1x;
            this.ActivePoint.cp1.y = this.ActivePoint.position.y + this.ActivePoint.v1y;
            this.ActivePoint.cp2.x = this.ActivePoint.position.x + this.ActivePoint.v2x;
            this.ActivePoint.cp2.y = this.ActivePoint.position.y + this.ActivePoint.v2y;


            // swap point order
            /*var temp;

            if (this.points[this.ActivePointIndex-1] && this.points[this.ActivePointIndex+1]) {
                if (this.ActivePoint.position.x > this.points[this.ActivePointIndex+1].position.x) {
                    temp = this.ActivePoint;
                    this.ActivePoint = this.points[this.ActivePointIndex+1];
                    this.points[this.ActivePointIndex+1] = temp;
                    this.ActivePointIndex++;
                }
                if (this.points[this.ActivePointIndex-1].position.x > this.ActivePoint.position.x) {
                    temp = this.ActivePoint;
                    this.ActivePoint = this.points[this.ActivePointIndex-1];
                    this.points[this.ActivePointIndex-1] = temp;
                    nearestPointIndex--;
                }
            }*/

        }

        this.setPointsAttr();

        // raise event
        if (this.events.ondrag != null)
            this.events.ondrag();

        this.draw();
    };
}

interface CurveSample {
    x: number;
    y: number;
    realPointIndex: number;
    t: number;
};