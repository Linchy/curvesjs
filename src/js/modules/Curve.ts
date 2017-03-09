class Curve {

    //htmlParent: HTMLElement;

    args: any;

    cpDist: number;

    pointColor: string;
    pointSize: number;

    lineColor: string;
    lineWidth: number;

    ctx: CanvasRenderingContext2D;
    cw: number;
    ch: number;

    events: any;

    points: BezierPoint[];

    shiftKeyDown: boolean = false; // 16
    //var ctrlKeyDown: boolean = false; // 17
    altKeyDown: boolean = false; // 18

    ActivePoint: BezierPoint = null;

    CloseLoop: boolean = true;

    gridCellSize: number = 20;

    selectedLine: Line;

    originPoint: Point;

    scaleFactor: number = 1;

    mouseX: number;
    mouseY: number;

    curveEditor: any;
 
    // selected blockly block
    block: any;

    constructor(context: CanvasRenderingContext2D, //htmlParent: HTMLElement, pointsJson: string, args: any, 
        curveEditor: any) {

        this.ctx = context;
        this.cw = context.canvas.width;
        this.ch = context.canvas.height;

        //this.htmlParent = htmlParent;
        this.curveEditor = curveEditor;

        this.args = {};//(args === undefined ? {} : args);

        if (this.args.curveOnly)
            this.CloseLoop = false;

        this.cpDist = 40;

        this.pointColor = '#f00';
        this.pointSize = 3;

        this.lineColor = 'cornflowerblue';
        this.lineWidth = 1;

        this.originPoint = new Point(
            (this.cw / 2),// - (this.pointSize / 2), 
            (this.ch / 2),// - (this.pointSize / 2), 
            'red', this.pointSize * 2, context);

        //if (!pointsJson) 
        {
            var offsetX = 80;
            var offsetY = 80;

            if (this.args.curveOnly)
            {
                // add straight line
                this.points = [
                    new BezierPoint(this.originPoint.x, this.originPoint.y, context, this.pointColor, this.pointSize, this.cpDist, false, true),
                    new BezierPoint(this.originPoint.x + 320, this.originPoint.y, context, this.pointColor, this.pointSize, this.cpDist, false, true)
                ];
            }
            else
            {
                // add square
                this.points = [
                    new BezierPoint(offsetX, offsetY, context, this.pointColor, this.pointSize, this.cpDist, false, true),
                    new BezierPoint(context.canvas.width - offsetX, offsetY, context, this.pointColor, this.pointSize, this.cpDist, false, true),
                    new BezierPoint(context.canvas.width - offsetX, context.canvas.height - offsetY, context, this.pointColor, this.pointSize, this.cpDist, true, true),
                    new BezierPoint(offsetX, context.canvas.height - offsetY, context, this.pointColor, this.pointSize, this.cpDist, true, true),
                ];
            }
            //this.setPointsAttr();
        }
        // else {
        //     this.setPoints(pointsJson);
        // }

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

    setBlock(block: any) {
        this.block = block;
        if (block)
            this.setPoints(block.getValue());
    }

    setPoints(pointsJson: string) {
        if (pointsJson.length == 0)
            return;

        this.points = []

        var dataObj = JSON.parse(pointsJson);
        this.CloseLoop = dataObj.closeLoop;

        var jsonOrigin = dataObj.origin;
 
        for (var i = 0; i < dataObj.points.length; i++) {
            var point = new BezierPoint(dataObj.points[i].x, dataObj.points[i].y, this.ctx, this.pointColor, this.pointSize, this.cpDist, false, dataObj.points[i].isSurfacePoint);
            point.cp1.x = dataObj.points[i].cp1X;
            point.cp1.y = dataObj.points[i].cp1Y;
            point.cp2.x = dataObj.points[i].cp2X;
            point.cp2.y = dataObj.points[i].cp2Y;
            if (dataObj.points[i].markerData)
                point.markerData = dataObj.points[i].markerData.join(';');

            // move surface so its origin is in center of canvas
            if (jsonOrigin != null) {
                point.pushRelativeControlPoints();
                point.position.x = (point.position.x - jsonOrigin.x) + this.originPoint.x;
                point.position.y = (point.position.y - jsonOrigin.y) + this.originPoint.y;
                point.popRelativeControlPoints();
            }

            this.points.push(point);
        }
        this.setPointsAttr();
    }

    getPointsJson(): string {

        var self = this;

        var unscaleFunc = function(coord: number, coordOrigin: number){
            return ((coord - coordOrigin) / self.scaleFactor) + coordOrigin;
        };

        var pointMap = this.points.map(function (point) {
            return {
                x: unscaleFunc(point.position.x, self.originPoint.x),
                y: unscaleFunc(point.position.y, self.originPoint.y),
                cp1X: unscaleFunc(point.cp1.x, self.originPoint.x),
                cp1Y: unscaleFunc(point.cp1.y, self.originPoint.y),
                cp2X: unscaleFunc(point.cp2.x, self.originPoint.x),
                cp2Y: unscaleFunc(point.cp2.y, self.originPoint.y),
                isSurfacePoint: point.isSurfacePoint,
                markerData: point.markerData.split(';')
            };
        });

        var dataObj: any = {
            closeLoop: this.CloseLoop,
            origin: { x: this.originPoint.x, y: this.originPoint.y },
            points: pointMap 
        };

        if (this.args.closedSurfaceOnly) {
            dataObj.baseSurface = 'Square';
        }

        var pointsStr = JSON.stringify(dataObj);
        return pointsStr;
    }

    setPointsAttr() {
        this.block.valueDiv.setAttribute('points', this.getPointsJson());
    }

    on(event: any, func: any) {
        this.events['on' + event] = func.bind(this);
    };

    setActivePoint(point: BezierPoint) {
        if (this.ActivePoint != null)
            this.ActivePoint.active = false;

        this.ActivePoint = point;
        if (this.ActivePoint)
        {
            this.ActivePoint.active = true;
            this.curveEditor.markerNameInput.val(this.ActivePoint.markerData);
            this.curveEditor.isUVSeamInput.prop('checked', this.ActivePoint.isUVSeamInput);
            this.curveEditor.uvNameInput.val(this.ActivePoint.uvNameInput);
            this.events.onselectpoint();
        }
        else
            this.events.ondeselectpoint();

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
        else if (!this.args.curveOnly)   // don't allow adding after last point
        {
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

    MarkerNameOnChange(value: string) {
        if (this.ActivePoint)
            this.ActivePoint.markerData = value;
        this.setPointsAttr();
    }

    isUVSeamOnChange(value: boolean) {
        if (this.ActivePoint)
            this.ActivePoint.isUVSeamInput = value;
        this.setPointsAttr();
    }

    UVNameOnChange(value: string) {
        if (this.ActivePoint)
            this.ActivePoint.uvNameInput = value;
        this.setPointsAttr();
    }

    SetScale(newScaleStr: string) {
        var newScale: number = parseFloat(newScaleStr);
        if (newScale > 0) {
            for (var i = 0; i < this.points.length; i++) {
                this.points[i].SetScale(this.originPoint, this.scaleFactor, newScale);
            }
            this.scaleFactor = newScale;
            this.draw();
        }
    }

    onResize() {
        var curWidth = parseInt(this.ctx.canvas.style.width) || this.ctx.canvas.width;
        var curHeight = parseInt(this.ctx.canvas.style.height) || this.ctx.canvas.height;
        
        var sx = curWidth / this.cw;
        var sy = curHeight / this.ch;

        for (var i = 0; i < this.points.length; i++) {
            var p = this.points[i];
            p.position.x *= sx;
            p.position.y *= sy;
            p.cp1.x *= sx;
            p.cp1.y *= sy;
            p.cp2.x *= sx;
            p.cp2.y *= sy;
        }

        this.cw = this.ctx.canvas.width = curWidth;
        this.ch = this.ctx.canvas.height = curHeight;

        this.originPoint.x  = (this.cw / 2);
        this.originPoint.y  = (this.ch / 2);

        this.draw();
    }

    draw() {

        this.ctx.clearRect(0, 0, this.cw, this.ch);

        // Grid

        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 0.5;

        // small column lines
        for (var x = 0; x < this.cw; x += this.gridCellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.ch);
            this.ctx.stroke();
        }

        // small row lines
        for (var y = 0; y < this.ch; y += this.gridCellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.cw, y);
            this.ctx.stroke();
        }

        this.ctx.lineWidth = 0.6;

        // large column lines
        for (var x = 0; x < this.cw; x += (this.gridCellSize * 4)) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.ch);
            this.ctx.stroke();
        }

        // large row lines
        for (var y = 0; y < this.ch; y += (this.gridCellSize * 4)) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.cw, y);
            this.ctx.stroke();
        }

        // axis lines
        this.ctx.lineWidth = 0.8;
        // X
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.ch / 2);
        this.ctx.lineTo(this.cw, this.ch / 2);
        this.ctx.stroke();
        // Y
        this.ctx.beginPath();
        this.ctx.moveTo(this.cw / 2, 0);
        this.ctx.lineTo(this.cw / 2, this.ch);
        this.ctx.stroke();

        // origin
        this.originPoint.draw();

        // draw curve as path

        this.ctx.strokeStyle = this.lineColor;
        this.ctx.lineWidth = this.lineWidth;


        var endCount = this.points.length - (this.CloseLoop ? 0 : 1);

        for (i = 1; i <= endCount; i++) {

            if (this.selectedLine != null && i % this.points.length == this.selectedLine.EndPointIndex) {
                this.ctx.strokeStyle = 'orange';
            } else {
                this.ctx.strokeStyle = this.lineColor;
            }

            var p1 = this.points[(i - 1)];
            var p2 = this.points[i % this.points.length];

            this.ctx.beginPath();
            this.ctx.moveTo(p1.position.x, p1.position.y);
            this.ctx.bezierCurveTo(p1.cp2.x, p1.cp2.y, p2.cp1.x, p2.cp1.y, p2.position.x, p2.position.y);
            this.ctx.stroke();
        }

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
            mDownOffsetX: number,
            mDownOffsetY: number,
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
                    dragCP = null;
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

            curve.mouseX = x - curve.originPoint.x;
            curve.mouseY = (y - curve.originPoint.y) * -1;

            if (isDragging) {
                x -= mDownOffsetX;
                y -= mDownOffsetY;
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

            curve.selectedLine = null;

            if (hoverPoint != null) {
                curve.setActivePoint(hoverPoint);
                 if (dragCP == 'cp1') {
                    mDownOffsetX = x - hoverPoint.cp1.x;
                    mDownOffsetY = y - hoverPoint.cp1.y;
                }
                else if (dragCP == 'cp2') {
                    mDownOffsetX = x - hoverPoint.cp2.x;
                    mDownOffsetY = y - hoverPoint.cp2.y;
                }
                else {
                    mDownOffsetX = x - hoverPoint.position.x;
                    mDownOffsetY = y - hoverPoint.position.y;
                }
                isDragging = true;
            }
            else {
                curve.setActivePoint(null);
                mDownOffsetX = 0;
                mDownOffsetY = 0;
                isDragging = false;

                var lookup = curve.createLUT();
                if (lookup.length > 0) {

                    var nearestInfo: CurveSample = null;
                    var nearestDist = Number.MAX_VALUE;

                    // find closest point
                    for (var i = 0; i < lookup.length; i++) {
                        var dist = ((x - lookup[i].x) * (x - lookup[i].x)) + ((y - lookup[i].y) * (y - lookup[i].y));
                        if (dist < (5 * 5) && dist < nearestDist) {
                            nearestInfo = lookup[i];
                            nearestDist = dist;
                        }
                    }

                    if (nearestInfo != null) {
                        curve.selectedLine = new Line(curve.points,
                            nearestInfo.realPointIndex == 0 ? curve.points.length - 1 : nearestInfo.realPointIndex - 1,
                            nearestInfo.realPointIndex);
                        curve.selectedLine.getRelativeCoordFromToXY(x, y);
                        isDragging = true;
                    }
                }
            }

            curve.draw();
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
                var nearestInfoIndex = 0;
                for (var i = 0; i < lookup.length; i++) {
                    var dist = ((x - lookup[i].x) * (x - lookup[i].x)) + ((y - lookup[i].y) * (y - lookup[i].y));
                    if (dist < nearestDist) {
                        nearestInfo = lookup[i];
                        nearestDist = dist;
                        nearestInfoIndex = i;
                    }
                }

                // insert after point index
                var newPoint = curve.addPoint(x, y, nearestInfo);
                curve.setActivePoint(newPoint);
                this.style.cursor = 'pointer';

                // raise event
                if (newPoint != null && curve.events.onnewpoint != null)
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

        if (this.shiftKeyDown) {
            x = Math.round((x) / this.gridCellSize) * this.gridCellSize;
            y = Math.round((y) / this.gridCellSize) * this.gridCellSize;
        }

        if (this.selectedLine != null) {
            this.selectedLine.setCoordsFromRelativeXY(x, y);
        }
        else if (dragCP == 'cp1') {
            this.ActivePoint.cp1.x = x;
            this.ActivePoint.cp1.y = y;

            this.ActivePoint.pushRelativeControlPoints();

            // make other control point follow
            // if (!this.shiftKeyDown) {
            this.ActivePoint.cp2.x = x - this.ActivePoint.v1x * 2;
            this.ActivePoint.cp2.y = y - this.ActivePoint.v1y * 2;
            // }
        }
        else if (dragCP == 'cp2') {

            this.ActivePoint.cp2.x = x;
            this.ActivePoint.cp2.y = y;

            this.ActivePoint.pushRelativeControlPoints();

            // make other control point follow
            // if (!this.shiftKeyDown) {
            this.ActivePoint.cp1.x = x - this.ActivePoint.v2x * 2;
            this.ActivePoint.cp1.y = y - this.ActivePoint.v2y * 2;
            // }
        }
        else {
            this.ActivePoint.pushRelativeControlPoints();

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