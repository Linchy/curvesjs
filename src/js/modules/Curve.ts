class Curve {

    //htmlParent: HTMLElement;
    originalJson: string;

    args: any;

    cpDist: number;

    pointColor: string;
    pointSize: number;

    lineColor: string;
    lineWidth: number;

    ctx: CanvasRenderingContext2D;
    cw: number;
    ch: number;

    gridColOffsetX: number;
    gridColOffsetY: number;

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
    origScaleFactor: number = 1;

    mouseX: number;
    mouseY: number;

    ReverseBones: boolean = false;

    curveEditor: any;
 
    // selected blockly block
    block: any;

    // the two coordinates to show on render
    c1: string = 'x';
    c2: string = 'y';

    // list of json strings, which can be used to restore the workspace
    undoStack: string[] = [];

    constructor(context: CanvasRenderingContext2D, //htmlParent: HTMLElement, pointsJson: string, args: any, 
        curveEditor: any) {

        this.ctx = context;
        this.cw = context.canvas.width;
        this.ch = context.canvas.height;

        //this.htmlParent = htmlParent;
        this.curveEditor = curveEditor;

        this.args = {};//(args === undefined ? {} : args);

        this.points = [];

        this.cpDist = 40;

        this.pointColor = '#222';
        this.pointSize = 8;

        this.lineColor = 'lightblue';
        this.lineWidth = 2;

        this.originPoint = new Point(
            (this.cw / 2),// - (this.pointSize / 2), 
            (this.ch / 2),// - (this.pointSize / 2), 
            0,
            'white', this.pointSize, context);

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

            // undo
            if (e.ctrlKey && e.key.toLowerCase() == "z")
                self.popUndoStack();
        });
    }

    setBlock(block: any) {
        this.block = block;
        this.scaleFactor = 1;
        this.curveEditor.scaleInput.val(1);
        this.undoStack = [];
        this.CloseLoop = !block.args.curveOnly;
        if (block) {
            var json = block.getValue();
            if (json.length > 0) {
                this.setPoints(json);
            }
            else if (this.CloseLoop) {
                var offsetX = -20;
                var offsetY = -20;

                // add square
                this.points = [
                    new BezierPoint(offsetX, offsetY, 0, this.ctx, this.pointColor, this.pointSize, this.cpDist, false, true),
                    new BezierPoint(offsetX * -1, offsetY, 0,  this.ctx, this.pointColor, this.pointSize, this.cpDist, false, true),
                    new BezierPoint(offsetX * -1, offsetY * -1, 0,  this.ctx, this.pointColor, this.pointSize, this.cpDist, true, true),
                    new BezierPoint(offsetX, offsetY * -1, 0,  this.ctx, this.pointColor, this.pointSize, this.cpDist, true, true),
                ];
            }
            else {
                // add straight line 
                this.points = [
                    new BezierPoint(0, 0, 0,  this.ctx, this.pointColor, this.pointSize, this.cpDist, false, true),
                    new BezierPoint(320, 0, 0,  this.ctx, this.pointColor, this.pointSize, this.cpDist, false, true)
                ];
            }
        }
    }

    setPoints(pointsJson: string) {
        if (pointsJson.length == 0)
            return;

        this.originalJson = pointsJson;
        this.origScaleFactor = this.scaleFactor;

        this.points = []

        var dataObj = JSON.parse(pointsJson);
        this.CloseLoop = dataObj.closeLoop;

        this.ReverseBones = dataObj.reverseBones ? dataObj.reverseBones : false;
        this.curveEditor.reverseBonesCheckbox.prop("checked", this.ReverseBones);

        var jsonOrigin = dataObj.origin;
        if (!jsonOrigin.z)
            jsonOrigin.z = 0;
 
        for (var i = 0; i < dataObj.points.length; i++) {
            var point = new BezierPoint(dataObj.points[i].x, dataObj.points[i].y, dataObj.points[i].z || 0, this.ctx, this.pointColor, this.pointSize, this.cpDist, false, dataObj.points[i].isSurfacePoint);
            point.cp1.x = dataObj.points[i].cp1X;
            point.cp1.y = dataObj.points[i].cp1Y;
            point.cp1.z = dataObj.points[i].cp1Z || 0;
            point.cp2.x = dataObj.points[i].cp2X;
            point.cp2.y = dataObj.points[i].cp2Y;
            point.cp2.z = dataObj.points[i].cp2Z || 0;
            if (dataObj.points[i].markerData)
                point.markerData = dataObj.points[i].markerData.join(';');
            if (dataObj.points[i].uvName)
                point.uvNameInput = dataObj.points[i].uvName;
            if (dataObj.points[i].boneName)
                point.boneNameInput = dataObj.points[i].boneName;

            // move surface so its origin is in center of canvas
            if (jsonOrigin != null) {
                point.SubtractPoint(jsonOrigin);
            }

            this.points.push(point);
        }
        this.setPointsAttr();
    }

    getPointsJson(): string {

        var self = this;

        var unscaleFunc = function(coord: number){
            return (coord / self.scaleFactor);
        };

        var pointMap = this.points.map(function (point) {
            return {
                x: unscaleFunc(point.position.x),
                y: unscaleFunc(point.position.y),
                z: unscaleFunc(point.position.z),

                cp1X: unscaleFunc(point.cp1.x),
                cp1Y: unscaleFunc(point.cp1.y),
                cp1Z: unscaleFunc(point.cp1.z),

                cp2X: unscaleFunc(point.cp2.x),
                cp2Y: unscaleFunc(point.cp2.y),
                cp2Z: unscaleFunc(point.cp2.z),

                isSurfacePoint: point.isSurfacePoint,
                markerData: point.markerData.split(';'),
                uvName: point.uvNameInput,
                boneName: point.boneNameInput 
            };
        });

        var dataObj: any = {
            closeLoop: this.CloseLoop,
            reverseBones: this.ReverseBones,
            origin: { x: 0, y: 0, z: 0 },
            //origin: { x: this.originPoint.x, y: this.originPoint.y, z: this.originPoint.z },
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

    setPointsAttrToDefaultJson() {
        if (this.originalJson)
        {
            this.scaleFactor = this.origScaleFactor;
            this.setPoints(this.originalJson);
        }
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
            this.curveEditor.uvNameInput.val(this.ActivePoint.uvNameInput);
            this.curveEditor.boneNameInput.val(this.ActivePoint.boneNameInput);
            this.events.onselectpoint();
        }
        else
            this.events.ondeselectpoint();

        this.draw();
    };

    addPoint(x: number, y: number, nearestInfo: CurveSample): BezierPoint {

        this.pushUndoJson();

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
            var px = (this.c1 == 'x' ? x : (this.c2 == 'x' ? y : 0));
            var py = (this.c1 == 'y' ? x : (this.c2 == 'y' ? y : 0));
            var pz = (this.c1 == 'z' ? x : (this.c2 == 'z' ? y : 0));
            point = new BezierPoint(px, py, pz, this.ctx, this.pointColor, this.pointSize, this.cpDist);
            this.points.push(point);
        }

        this.setPointsAttr();
        return point;
    };

    /*setPointStyle(color: any, size: number) {

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
    }*/

    MarkerNameOnChange(value: string) {
        if (this.ActivePoint) {
            this.ActivePoint.markerData = value;
            this.setPointsAttr();
            this.events.ondrag(); // raise event so json is sent to c#
        }
    }

    reverseBonesOnChange(value: boolean) {
        //this.pushUndoJson();
        this.ReverseBones = value;
        this.setPointsAttr();
    }

    UVNameOnChange(value: string) {
        if (this.ActivePoint) {
            this.ActivePoint.uvNameInput = value;
            this.setPointsAttr();
            this.events.ondrag(); // raise event so json is sent to c#
        }
    }

    BoneNameOnChange(value: string) {
        if (this.ActivePoint) {
            this.ActivePoint.boneNameInput = value;
            this.setPointsAttr();
            this.events.ondrag(); // raise event so json is sent to c#
        }
    }

    SetScale(newScaleStr: string) {
        var newScale: number = parseFloat(newScaleStr);
        if (newScale > 0) {
            for (var i = 0; i < this.points.length; i++) {
                this.points[i].SetScale(this.scaleFactor, newScale);
            }
            this.scaleFactor = newScale;
            this.draw();
        }
    }

    onResize() {
        var curWidth = parseInt(this.ctx.canvas.style.width) || this.ctx.canvas.width;
        var curHeight = parseInt(this.ctx.canvas.style.height) || this.ctx.canvas.height;
        
        /*var sx = curWidth / this.cw;
        var sy = curHeight / this.ch;

        for (var i = 0; i < this.points.length; i++) {
            var p = this.points[i];
            p.position[this.c1] *= sx;
            p.position[this.c2] *= sy;
            p.cp1[this.c1] *= sx;
            p.cp1[this.c2] *= sy;
            p.cp2[this.c1] *= sx; 
            p.cp2[this.c2] *= sy;
        }*/

        this.cw = this.ctx.canvas.width = curWidth;
        this.ch = this.ctx.canvas.height = curHeight;

        //this.originPoint[this.c1]  = (this.cw / 2);
        //this.originPoint[this.c2]  = (this.ch / 2);

        this.draw(); 
    }

    set2dView(c1: string, c2: string) {
        this.c1 = c1.toLowerCase();
        this.c2 = c2.toLowerCase();
        this.originPoint[this.c1]  = (this.cw / 2);
        this.originPoint[this.c2]  = (this.ch / 2);
        this.draw();
    }

    draw() {

        this.ctx.clearRect(0, 0, this.cw, this.ch);

        // Grid

        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 0.5;

        {
            // get col offset, so always lines up with origin
            var colsUpToOrigin = this.originPoint[this.c1] / this.gridCellSize;
            var fullColsUpToOrigin = Math.ceil(colsUpToOrigin) * this.gridCellSize;
            this.gridColOffsetX =  this.originPoint[this.c1] - fullColsUpToOrigin;

            var rowsUpToOrigin = this.originPoint[this.c2] / this.gridCellSize;
            var fullRowsUpToOrigin = Math.ceil(rowsUpToOrigin) * this.gridCellSize;
            this.gridColOffsetY =  this.originPoint[this.c2] - fullRowsUpToOrigin;

            // small column lines
            for (var x = this.gridColOffsetX; x < this.cw; x += this.gridCellSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.ch);
                this.ctx.stroke();
            }

            // small row lines
            for (var y = this.gridColOffsetY; y < this.ch; y += this.gridCellSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.cw, y);
                this.ctx.stroke();
            }
        }

        this.ctx.lineWidth = 0.6;

        {
            var cellSize = this.gridCellSize * 4;

            // get col offset, so always lines up with origin
            var colsUpToOrigin = this.originPoint[this.c1] / cellSize;
            var fullColsUpToOrigin = Math.ceil(colsUpToOrigin) * cellSize;
            var largeGridColOffsetX =  this.originPoint[this.c1] - fullColsUpToOrigin;

            var rowsUpToOrigin = this.originPoint[this.c2] / cellSize;
            var fullRowsUpToOrigin = Math.ceil(rowsUpToOrigin) * cellSize;
            var largeGridColOffsetY =  this.originPoint[this.c2] - fullRowsUpToOrigin;

            // large column lines
            for (var x = largeGridColOffsetX; x < this.cw; x += cellSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.ch);
                this.ctx.stroke();
            }

            // large row lines
            for (var y = largeGridColOffsetY; y < this.ch; y += cellSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.cw, y);
                this.ctx.stroke();
            }
        }

        // axis lines
        this.ctx.lineWidth = 0.8;
        // X
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.originPoint[this.c2]);
        this.ctx.lineTo(this.cw, this.originPoint[this.c2]);
        this.ctx.stroke();
        // Y
        this.ctx.beginPath();
        this.ctx.moveTo(this.originPoint[this.c1], 0);
        this.ctx.lineTo(this.originPoint[this.c1], this.ch);
        this.ctx.stroke();

        // origin
        this.originPoint.draw(this.c1, this.c2, 0, 0);

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
            this.ctx.moveTo(p1.position[this.c1] + this.originPoint[this.c1], p1.position[this.c2] + this.originPoint[this.c2]);
            this.ctx.bezierCurveTo(
                p1.cp2[this.c1] + this.originPoint[this.c1], 
                p1.cp2[this.c2] + this.originPoint[this.c2], 
                p2.cp1[this.c1] + this.originPoint[this.c1], 
                p2.cp1[this.c2] + this.originPoint[this.c2], 
                p2.position[this.c1] + this.originPoint[this.c1], 
                p2.position[this.c2] + this.originPoint[this.c2]);
            this.ctx.stroke();
        }

        // draw points that user can click and drag

        for (var i = 0; i < this.points.length; i++) {
            this.points[i].draw(this.c1, this.c2, this.originPoint[this.c1], this.originPoint[this.c2]);
        }

    };

    // creates lookup table of points.
    // note these poitns do not have origin added
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
            lookup.push({ x: p1.position[this.c1], y: p1.position[this.c2], realPointIndex: realPointIndex, t: 0 })

            // push middle points
            for (var j = 1; j < sampleCount; j++) {
                var t = j / sampleCount;
                var x = this.Sample(t, p1.position[this.c1], p1.cp2[this.c1], p2.cp1[this.c1], p2.position[this.c1]);
                var y = this.Sample(t, p1.position[this.c2], p1.cp2[this.c2], p2.cp1[this.c2], p2.position[this.c2]);

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

        var x12 = (line_cp1[this.c1] - p1[this.c1]) * t + p1[this.c1];
        var y12 = (line_cp1[this.c2] - p1[this.c2]) * t + p1[this.c2];

        var x23 = (line_cp2[this.c1] - line_cp1[this.c1]) * t + line_cp1[this.c1];
        var y23 = (line_cp2[this.c2] - line_cp1[this.c2]) * t + line_cp1[this.c2];

        var x34 = (p2[this.c1] - line_cp2[this.c1]) * t + line_cp2[this.c1];
        var y34 = (p2[this.c2] - line_cp2[this.c2]) * t + line_cp2[this.c2];

        var x123 = (x23 - x12) * t + x12;
        var y123 = (y23 - y12) * t + y12;

        var x234 = (x34 - x23) * t + x23;
        var y234 = (y34 - y23) * t + y23;

        var x1234 = (x234 - x123) * t + x123;
        var y1234 = (y234 - y123) * t + y123;

        // ---

        line_cp1[this.c1] = x12;
        line_cp1[this.c2] = y12;

        line_cp2[this.c1] = x34;
        line_cp2[this.c2] = y34;

        var insertedPoint = new BezierPoint(0, 0, 0, this.ctx, this.pointColor, this.pointSize, this.cpDist);
        
        insertedPoint.position[this.c1] = x1234;
        insertedPoint.position[this.c2] = y1234;

        insertedPoint.cp1[this.c1] = x123;
        insertedPoint.cp1[this.c2] = y123;

        insertedPoint.cp2[this.c1] = x234;
        insertedPoint.cp2[this.c2] = y234;

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
            isDragging: boolean,
            draggingOrigin: boolean;

        var curve: Curve = this;

        var beforeDragJson: string;
        var hasDragged: boolean;

        var setNearestPoint = function () {
            nearestPoint = null;
            nearestPointIndex = -1;
            nearestPointDist = Number.MAX_VALUE;

            hoverPoint = null;
            dragCP = null;
            isDragging = false;

            for (var i = 0; i < curve.points.length; i++) {
                var p = curve.points[i];
                var dist = p.position.DistanceToXY(curve.c1, curve.c2, x, y);

                // check point
                if (dist < nearestPointDist) {
                    nearestPointIndex = i;
                    nearestPointDist = dist;
                    dragCP = null;
                }

                // check control points
                if (p.active) {
                    // cp1
                    dist = p.cp1.DistanceToXY(curve.c1, curve.c2, x, y);
                    if (dist < nearestPointDist) {
                        nearestPointIndex = i;
                        nearestPointDist = dist;
                        dragCP = 'cp1';
                    }
                    else // cp2
                    {
                        dist = p.cp2.DistanceToXY(curve.c1, curve.c2, x, y);
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

            var gridScaleFunc = function(x, y) {
                return {
                    x: (Math.round((x) / curve.gridCellSize) * curve.gridCellSize), //+ curve.gridColOffsetX,
                    y: (Math.round((y) / curve.gridCellSize) * curve.gridCellSize) //+ curve.gridColOffsetY
                };
            };
            
            var removeMouseOffsetFunc = function(x, y) {
                return {
                    x: x - mDownOffsetX,
                    y: y - mDownOffsetY
                };
            };

            var bbox = this.getBoundingClientRect();

            x = evt.clientX - bbox.left;
            y = evt.clientY - bbox.top;

            if (isDragging && curve.selectedLine != null) {
                x -= curve.originPoint[curve.c1];
                y -= curve.originPoint[curve.c2];
                curve.selectedLine.setCoordsFromRelativeXY(curve.c1, curve.c2, x, y, curve.shiftKeyDown ? gridScaleFunc : removeMouseOffsetFunc);
                
                curve.setPointsAttr();
                if (curve.events.ondrag != null)
                    curve.events.ondrag();
                curve.draw();
            }
            else {
                if (curve.shiftKeyDown) {
                    x = (Math.round((x) / curve.gridCellSize) * curve.gridCellSize)  + curve.gridColOffsetX;
                    y = (Math.round((y) / curve.gridCellSize) * curve.gridCellSize)  + curve.gridColOffsetY;
                }
                else if (isDragging) {
                    x -= mDownOffsetX;
                    y -= mDownOffsetY;
                }

                curve.mouseX = x - curve.originPoint[curve.c1];
                curve.mouseY = (y - curve.originPoint[curve.c2]) * -1;

                if (draggingOrigin) {
                    curve.originPoint[curve.c1] = x;
                    curve.originPoint[curve.c2] = y;
                    hasDragged = true;
                    curve.draw();
                }
                else {

                    x -= curve.originPoint[curve.c1];
                    y -= curve.originPoint[curve.c2];

                    if (isDragging) {
                        curve.mousedrag(evt, x, y, dragCP);
                        hasDragged = true;
                    }
                    else {
                        setNearestPoint();
                    }
                }
            }

            // grid line up
            /*if (curve.altKeyDown) {
                var deltaW = curve.cw / 20;
                var deltaH = curve.ch / 10;

                var posX = Math.floor((x + deltaW / 2) / deltaW);
                var posY = Math.floor((y + deltaH / 2) / deltaH);

                x = deltaW * posX;
                y = deltaH * posY;
            }*/

            // raise event
            if (curve.events.onmousemove != null)
                curve.events.onmousemove();

        });

        this.ctx.canvas.addEventListener('mousedown', function (evt: any) {
            evt.preventDefault();

            curve.selectedLine = null;
            hasDragged = false;

            if (hoverPoint != null) {
                curve.setActivePoint(hoverPoint);
                 if (dragCP == 'cp1') {
                    mDownOffsetX = x - hoverPoint.cp1[curve.c1];
                    mDownOffsetY = y - hoverPoint.cp1[curve.c2];
                }
                else if (dragCP == 'cp2') {
                    mDownOffsetX = x - hoverPoint.cp2[curve.c1];
                    mDownOffsetY = y - hoverPoint.cp2[curve.c2];
                }
                else {
                    mDownOffsetX = x - hoverPoint.position[curve.c1];
                    mDownOffsetY = y - hoverPoint.position[curve.c2];
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
                        curve.selectedLine.getRelativeCoordFromToXY(curve.c1, curve.c2, x, y);
                        isDragging = true;
                    }
                }
            }

            // drag origin point
            if (!isDragging) {
                
                mDownOffsetX = x;// + curve.originPoint[curve.c1];
                mDownOffsetY = y;// + curve.originPoint[curve.c2];
                draggingOrigin = true;
                isDragging=true;
            }

            beforeDragJson = curve.getPointsJson();
            curve.draw();
        });

        this.ctx.canvas.addEventListener('mouseup', function (evt: any) {

            if (isDragging && hasDragged)
                curve.pushUndoJson(beforeDragJson);

            dragCP = null;
            isDragging = false;
            draggingOrigin = false;
            hasDragged = false;
        });

        this.ctx.canvas.addEventListener('mouseleave', function (evt: any) {
            if (isDragging) {
                if (hasDragged)
                    curve.pushUndoJson(beforeDragJson);

                // dont let point get dragged outside canvas where we can't see it
                if (!draggingOrigin)
                    curve.ActivePoint.SetPointOnCanvasBorder(curve.c1, curve.c2, evt, dragCP, curve.cw, curve.ch, curve.shiftKeyDown, x, y);

                dragCP = null;
                isDragging = false;
                draggingOrigin = false;
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
                curve.pushUndoJson();

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
            this.ActivePoint.cp1[this.c1] = x;
            this.ActivePoint.cp1[this.c2] = y;

            this.ActivePoint.pushRelativeControlPoints(this.c1, this.c2);

            // make other control point follow
            // if (!this.shiftKeyDown) {
            this.ActivePoint.cp2[this.c1] = x - this.ActivePoint.v1x * 2;
            this.ActivePoint.cp2[this.c2] = y - this.ActivePoint.v1y * 2;
            // }
        }
        else if (dragCP == 'cp2') {

            this.ActivePoint.cp2[this.c1] = x;
            this.ActivePoint.cp2[this.c2] = y;

            this.ActivePoint.pushRelativeControlPoints(this.c1, this.c2);

            // make other control point follow
            // if (!this.shiftKeyDown) {
            this.ActivePoint.cp1[this.c1] = x - this.ActivePoint.v2x * 2;
            this.ActivePoint.cp1[this.c2] = y - this.ActivePoint.v2y * 2;
            // }
        }
        else {
            this.ActivePoint.pushRelativeControlPoints(this.c1, this.c2);

            this.ActivePoint.position[this.c1] = x;
            this.ActivePoint.position[this.c2] = y;

            // keep first and last point on sides
            /*if (this.ActivePointIndex === 0) {
                this.ActivePoint.position.x = 0;
            }
            if (this.ActivePointIndex == this.points.length-1) {
                this.ActivePoint.position.x = this.cw;
            }*/

            this.ActivePoint.cp1[this.c1] = this.ActivePoint.position[this.c1] + this.ActivePoint.v1x;
            this.ActivePoint.cp1[this.c2] = this.ActivePoint.position[this.c2] + this.ActivePoint.v1y;

            this.ActivePoint.cp2[this.c1] = this.ActivePoint.position[this.c1] + this.ActivePoint.v2x;
            this.ActivePoint.cp2[this.c2] = this.ActivePoint.position[this.c2] + this.ActivePoint.v2y;


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

    pushUndoJson(json? :string) {
        if (!json)
            json = this.getPointsJson();
        this.undoStack.push(json);
    }

    popUndoStack() {
        if (this.undoStack.length <= 0)
            return;

        var json = this.undoStack.pop();
        this.setPoints(json);
        this.setActivePoint(this.ActivePoint);
        this.draw();
    }
}

interface CurveSample {
    x: number;
    y: number;
    realPointIndex: number;
    t: number;
};