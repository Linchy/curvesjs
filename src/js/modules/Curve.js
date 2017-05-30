var Curve = (function () {
    function Curve(context, //htmlParent: HTMLElement, pointsJson: string, args: any, 
        curveEditor) {
        this.shiftKeyDown = false; // 16
        this.ctrlKeyDown = false; // 17
        this.altKeyDown = false; // 18
        this.ActivePoint = null;
        this.CloseLoop = true;
        this.gridCellSize = 20;
        this.scaleFactor = 1;
        this.origScaleFactor = 1;
        this.ReverseBones = false;
        // the two coordinates to show on render
        this.c1 = 'x';
        this.c2 = 'y';
        // list of json strings, which can be used to restore the workspace
        this.undoStack = [];
        this.ctx = context;
        this.cw = context.canvas.width;
        this.ch = context.canvas.height;
        //this.htmlParent = htmlParent;
        this.curveEditor = curveEditor;
        this.args = {}; //(args === undefined ? {} : args);
        this.points = [];
        this.cpDist = 40;
        this.pointColor = '#222';
        this.pointSize = 8;
        this.lineColor = 'lightblue';
        this.lineWidth = 2;
        this.originPoint = new Point((this.cw / 2), // - (this.pointSize / 2), 
        (this.ch / 2), // - (this.pointSize / 2), 
        0, 'white', this.pointSize, context);
        this.events = {};
        this.canvasEvents();
        this.draw();
        var self = this;
        window.addEventListener('keydown', function (e) {
            self.shiftKeyDown = e.shiftKey;
            self.ctrlKeyDown = e.ctrlKey;
            self.altKeyDown = e.altKey;
        });
        window.addEventListener('keyup', function (e) {
            self.shiftKeyDown = e.shiftKey;
            self.ctrlKeyDown = e.ctrlKey;
            self.altKeyDown = e.altKey;
            // undo
            if (e.ctrlKey && e.key.toLowerCase() == "z")
                self.popUndoStack();
        });
    }
    Curve.prototype.setBlock = function (block) {
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
                    new BezierPoint(offsetX, offsetY, 0, this.ctx, this.pointColor, this.pointSize, this.cpDist, false),
                    new BezierPoint(offsetX, offsetY * -1, 0, this.ctx, this.pointColor, this.pointSize, this.cpDist, true),
                    new BezierPoint(offsetX * -1, offsetY * -1, 0, this.ctx, this.pointColor, this.pointSize, this.cpDist, true),
                    new BezierPoint(offsetX * -1, offsetY, 0, this.ctx, this.pointColor, this.pointSize, this.cpDist, false),
                ];
            }
            else {
                // add straight line 
                this.points = [
                    new BezierPoint(0, 0, 0, this.ctx, this.pointColor, this.pointSize, this.cpDist, false),
                    new BezierPoint(320, 0, 0, this.ctx, this.pointColor, this.pointSize, this.cpDist, false)
                ];
            }
        }
    };
    Curve.prototype.setPoints = function (pointsJson) {
        if (pointsJson.length == 0)
            return;
        this.originalJson = pointsJson;
        this.origScaleFactor = this.scaleFactor;
        this.points = [];
        var dataObj = JSON.parse(pointsJson);
        this.CloseLoop = dataObj.closeLoop;
        this.ReverseBones = dataObj.reverseBones ? dataObj.reverseBones : false;
        this.curveEditor.reverseBonesCheckbox.prop("checked", this.ReverseBones);
        var jsonOrigin = dataObj.origin;
        if (!jsonOrigin.z)
            jsonOrigin.z = 0;
        for (var i = 0; i < dataObj.points.length; i++) {
            var point = new BezierPoint(dataObj.points[i].x, dataObj.points[i].y, dataObj.points[i].z || 0, this.ctx, this.pointColor, this.pointSize, this.cpDist, false);
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
            if (typeof dataObj.points[i].uvEnabled !== 'undefined')
                point.uvEnabled = dataObj.points[i].uvEnabled;
            if (dataObj.points[i].uvRangesInput)
                point.uvRangesInput = dataObj.points[i].uvRangesInput.join(';');
            // move surface so its origin is in center of canvas
            if (jsonOrigin != null) {
                point.SubtractPoint(jsonOrigin);
            }
            this.points.push(point);
        }
        this.setPointsAttr();
    };
    Curve.prototype.getPointsJson = function () {
        var self = this;
        var unscaleFunc = function (coord) {
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
                markerData: point.markerData.split(';'),
                uvName: point.uvNameInput,
                boneName: point.boneNameInput,
                uvEnabled: point.uvEnabled,
                uvRangesInput: point.uvRangesInput.split(';')
            };
        });
        var dataObj = {
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
    };
    Curve.prototype.setPointsAttr = function () {
        this.block.valueDiv.setAttribute('points', this.getPointsJson());
    };
    Curve.prototype.setPointsAttrToDefaultJson = function () {
        if (this.originalJson) {
            this.scaleFactor = this.origScaleFactor;
            this.setPoints(this.originalJson);
        }
    };
    Curve.prototype.on = function (event, func) {
        this.events['on' + event] = func.bind(this);
    };
    ;
    Curve.prototype.setActivePoint = function (point) {
        if (this.ActivePoint != null)
            this.ActivePoint.active = false;
        this.ActivePoint = point;
        if (this.ActivePoint) {
            this.ActivePoint.active = true;
            this.curveEditor.markerNameInput.val(this.ActivePoint.markerData);
            this.curveEditor.uvNameInput.val(this.ActivePoint.uvNameInput);
            this.curveEditor.boneNameInput.val(this.ActivePoint.boneNameInput);
            this.curveEditor.uvEnabledCheckbox.prop("checked", this.ActivePoint.uvEnabled);
            this.curveEditor.uvRangesInput.val(this.ActivePoint.uvRangesInput);
            this.events.onselectpoint();
        }
        else
            this.events.ondeselectpoint();
        this.draw();
    };
    ;
    Curve.prototype.addPoint = function (x, y, nearestInfo) {
        this.pushUndoJson();
        var point = null;
        //if (nearestInfo.realPointIndex) {
        var insertIndex = nearestInfo.realPointIndex;
        point = this.SliceBezier(insertIndex == 0 ? this.points.length - 1 : insertIndex - 1, insertIndex, nearestInfo.t);
        //} 
        // else if (!this.args.curveOnly)   // don't allow adding after last point
        // {
        //     var px = (this.c1 == 'x' ? x : (this.c2 == 'x' ? y : 0));
        //     var py = (this.c1 == 'y' ? x : (this.c2 == 'y' ? y : 0));
        //     var pz = (this.c1 == 'z' ? x : (this.c2 == 'z' ? y : 0));
        //     point = new BezierPoint(px, py, pz, this.ctx, this.pointColor, this.pointSize, this.cpDist);
        //     this.points.push(point);
        // }
        this.setPointsAttr();
        return point;
    };
    ;
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
    Curve.prototype.MarkerNameOnChange = function (value) {
        if (this.ActivePoint) {
            this.ActivePoint.markerData = value;
            this.setPointsAttr();
            this.events.onPointDataChanged(); // raise event so json is sent to c#
        }
    };
    Curve.prototype.reverseBonesOnChange = function (value) {
        //this.pushUndoJson();
        this.ReverseBones = value;
        this.setPointsAttr();
        this.events.onPointDataChanged(); // raise event so json is sent to c#
    };
    Curve.prototype.UVNameOnChange = function (value) {
        if (this.ActivePoint) {
            this.ActivePoint.uvNameInput = value;
            this.setPointsAttr();
            this.events.onPointDataChanged(); // raise event so json is sent to c#
        }
    };
    Curve.prototype.BoneNameOnChange = function (value) {
        if (this.ActivePoint) {
            this.ActivePoint.boneNameInput = value;
            this.setPointsAttr();
            this.events.onPointDataChanged(); // raise event so json is sent to c#
        }
    };
    Curve.prototype.uvEnabledOnChange = function (value) {
        if (this.ActivePoint) {
            this.ActivePoint.uvEnabled = value;
            this.setPointsAttr();
            this.events.onPointDataChanged(); // raise event so json is sent to c#
        }
    };
    Curve.prototype.UVRangesOnChange = function (value) {
        if (this.ActivePoint) {
            this.ActivePoint.uvRangesInput = value;
            this.setPointsAttr();
            this.events.onPointDataChanged(); // raise event so json is sent to c#
        }
    };
    Curve.prototype.SetScale = function (newScaleStr) {
        var newScale = parseFloat(newScaleStr);
        if (newScale > 0) {
            for (var i = 0; i < this.points.length; i++) {
                this.points[i].SetScale(this.scaleFactor, newScale);
            }
            this.scaleFactor = newScale;
            this.draw();
        }
    };
    Curve.prototype.ReversePoints = function () {
        this.points.reverse();
        // need to swap control points too
        for (var i = 0; i < this.points.length; i++) {
            var cache = this.points[i].cp1;
            this.points[i].cp1 = this.points[i].cp2;
            this.points[i].cp2 = cache;
        }
        this.draw();
        this.setPointsAttr();
        this.events.onPointDataChanged(); // raise event so json is sent to c#
    };
    Curve.prototype.onResize = function () {
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
    };
    Curve.prototype.set2dView = function (c1, c2) {
        this.c1 = c1.toLowerCase();
        this.c2 = c2.toLowerCase();
        this.originPoint[this.c1] = (this.cw / 2);
        this.originPoint[this.c2] = (this.ch / 2);
        this.draw();
    };
    Curve.prototype.draw = function () {
        this.ctx.clearRect(0, 0, this.cw, this.ch);
        // Grid
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 0.5;
        {
            // get col offset, so always lines up with origin
            var colsUpToOrigin = this.originPoint[this.c1] / this.gridCellSize;
            var fullColsUpToOrigin = Math.ceil(colsUpToOrigin) * this.gridCellSize;
            this.gridColOffsetX = this.originPoint[this.c1] - fullColsUpToOrigin;
            var rowsUpToOrigin = this.originPoint[this.c2] / this.gridCellSize;
            var fullRowsUpToOrigin = Math.ceil(rowsUpToOrigin) * this.gridCellSize;
            this.gridColOffsetY = this.originPoint[this.c2] - fullRowsUpToOrigin;
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
            var cellSize = this.gridCellSize * 5;
            // get col offset, so always lines up with origin
            var colsUpToOrigin = this.originPoint[this.c1] / cellSize;
            var fullColsUpToOrigin = Math.ceil(colsUpToOrigin) * cellSize;
            var largeGridColOffsetX = this.originPoint[this.c1] - fullColsUpToOrigin;
            var rowsUpToOrigin = this.originPoint[this.c2] / cellSize;
            var fullRowsUpToOrigin = Math.ceil(rowsUpToOrigin) * cellSize;
            var largeGridColOffsetY = this.originPoint[this.c2] - fullRowsUpToOrigin;
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
            }
            else {
                this.ctx.strokeStyle = this.lineColor;
            }
            var p1 = this.points[(i - 1)];
            var p2 = this.points[i % this.points.length];
            this.ctx.beginPath();
            this.ctx.moveTo(p1.position[this.c1] + this.originPoint[this.c1], p1.position[this.c2] + this.originPoint[this.c2]);
            this.ctx.bezierCurveTo(p1.cp2[this.c1] + this.originPoint[this.c1], p1.cp2[this.c2] + this.originPoint[this.c2], p2.cp1[this.c1] + this.originPoint[this.c1], p2.cp1[this.c2] + this.originPoint[this.c2], p2.position[this.c1] + this.originPoint[this.c1], p2.position[this.c2] + this.originPoint[this.c2]);
            this.ctx.stroke();
        }
        // draw points that user can click and drag
        for (var i = 0; i < this.points.length; i++) {
            this.points[i].draw(this.c1, this.c2, this.originPoint[this.c1], this.originPoint[this.c2]);
        }
    };
    ;
    // creates lookup table of points.
    // note these poitns do not have origin added
    Curve.prototype.createLUT = function () {
        var lookup = [];
        //Percent Based Tesselation
        var count = this.points.length - (this.CloseLoop ? 0 : 1);
        for (var i = 0; i < count; i++) {
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
            lookup.push({ x: p1.position[this.c1], y: p1.position[this.c2], realPointIndex: realPointIndex, t: 0 });
            // push middle points
            for (var j = 1; j < sampleCount; j++) {
                var t = j / sampleCount;
                var x = this.Sample(t, p1.position[this.c1], p1.cp2[this.c1], p2.cp1[this.c1], p2.position[this.c1]);
                var y = this.Sample(t, p1.position[this.c2], p1.cp2[this.c2], p2.cp1[this.c2], p2.position[this.c2]);
                lookup.push({ x: x, y: y, realPointIndex: realPointIndex, t: t });
            }
        }
        return lookup;
    };
    ;
    Curve.prototype.Sample = function (t, c0, c1, c2, c3) {
        var sample = (c0 * (Math.pow((1 - t), 3))) +
            (c1 * 3 * t * Math.pow((1 - t), 2)) +
            (c2 * 3 * (1 - t) * Math.pow(t, 2)) +
            (c3 * Math.pow(t, 3));
        return sample;
    };
    ;
    Curve.prototype.SliceBezier = function (p1Index, p2Index, t) {
        var p1 = this.points[p1Index].position;
        var line_cp1 = this.points[p1Index].cp2;
        var line_cp2 = this.points[p2Index].cp1;
        var p2 = this.points[p2Index].position;
        // ---
        var x12 = (line_cp1.x - p1.x) * t + p1.x;
        var y12 = (line_cp1.y - p1.y) * t + p1.y;
        var z12 = (line_cp1.z - p1.z) * t + p1.z;
        var x23 = (line_cp2.x - line_cp1.x) * t + line_cp1.x;
        var y23 = (line_cp2.y - line_cp1.y) * t + line_cp1.y;
        var z23 = (line_cp2.z - line_cp1.z) * t + line_cp1.z;
        var x34 = (p2.x - line_cp2.x) * t + line_cp2.x;
        var y34 = (p2.y - line_cp2.y) * t + line_cp2.y;
        var z34 = (p2.z - line_cp2.z) * t + line_cp2.z;
        var x123 = (x23 - x12) * t + x12;
        var y123 = (y23 - y12) * t + y12;
        var z123 = (z23 - z12) * t + z12;
        var x234 = (x34 - x23) * t + x23;
        var y234 = (y34 - y23) * t + y23;
        var z234 = (z34 - z23) * t + z23;
        var x1234 = (x234 - x123) * t + x123;
        var y1234 = (y234 - y123) * t + y123;
        var z1234 = (z234 - z123) * t + z123;
        // ---
        line_cp1.x = x12;
        line_cp1.y = y12;
        line_cp1.z = z12;
        line_cp2.x = x34;
        line_cp2.y = y34;
        line_cp2.z = z34;
        var insertedPoint = new BezierPoint(0, 0, 0, this.ctx, this.pointColor, this.pointSize, this.cpDist);
        insertedPoint.position.x = x1234;
        insertedPoint.position.y = y1234;
        insertedPoint.position.z = z1234;
        insertedPoint.cp1.x = x123;
        insertedPoint.cp1.y = y123;
        insertedPoint.cp1.z = z123;
        insertedPoint.cp2.x = x234;
        insertedPoint.cp2.y = y234;
        insertedPoint.cp2.z = z234;
        this.points.splice(p2Index, 0, insertedPoint);
    };
    Curve.prototype.canvasEvents = function () {
        var x, y, mDownOffsetX, mDownOffsetY, nearestPoint, nearestPointIndex, nearestPointDist, hoverPoint, dragCP, isDragging, draggingOrigin;
        var curve = this;
        var beforeDragJson;
        var hasDragged;
        var setNearestPoint = function () {
            nearestPoint = null;
            nearestPointIndex = -1;
            nearestPointDist = Number.MAX_VALUE;
            hoverPoint = null;
            dragCP = null;
            isDragging = false;
            // if holding down ctrl, we select the nearest point,
            // and ignore control points
            var enableHoverSelect = curve.ctrlKeyDown;
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
                if (p.active && !enableHoverSelect) {
                    // cp1
                    dist = p.cp1.DistanceToXY(curve.c1, curve.c2, x, y);
                    if (dist < nearestPointDist) {
                        nearestPointIndex = i;
                        nearestPointDist = dist;
                        dragCP = 'cp1';
                    }
                    else {
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
                if (enableHoverSelect) {
                    curve.setActivePoint(nearestPoint);
                }
                curve.ctx.canvas.style.cursor = 'pointer';
            }
            else {
                curve.ctx.canvas.style.cursor = 'initial';
            }
        };
        this.ctx.canvas.addEventListener('mousemove', function (evt) {
            var gridScaleFunc = function (x, y) {
                return {
                    x: (Math.round((x) / curve.gridCellSize) * curve.gridCellSize),
                    y: (Math.round((y) / curve.gridCellSize) * curve.gridCellSize) //+ curve.gridColOffsetY
                };
            };
            var removeMouseOffsetFunc = function (x, y) {
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
                hasDragged = true;
                curve.setPointsAttr();
                if (curve.events.ondrag1 != null)
                    curve.events.ondrag1();
                curve.draw();
            }
            else {
                if (curve.shiftKeyDown) {
                    x = (Math.round((x) / curve.gridCellSize) * curve.gridCellSize) + curve.gridColOffsetX;
                    y = (Math.round((y) / curve.gridCellSize) * curve.gridCellSize) + curve.gridColOffsetY;
                }
                else if (isDragging) {
                    x -= mDownOffsetX;
                    y -= mDownOffsetY;
                }
                curve.mouseX = Math.round(x - curve.originPoint[curve.c1]);
                curve.mouseY = Math.round((y - curve.originPoint[curve.c2]) * -1);
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
        this.ctx.canvas.addEventListener('mousedown', function (evt) {
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
                    var nearestInfo = null;
                    var nearestDist = Number.MAX_VALUE;
                    // find closest point
                    for (var i = 0; i < lookup.length; i++) {
                        var dist = ((x - lookup[i].x) * (x - lookup[i].x)) + ((y - lookup[i].y) * (y - lookup[i].y));
                        if (dist < (5 * 5) && dist < nearestDist) {
                            nearestInfo = lookup[i];
                            nearestDist = dist;
                        }
                    }
                    var isInvalid = nearestInfo == null ||
                        nearestDist > 25 ||
                        (nearestInfo.realPointIndex == 0 && !curve.CloseLoop);
                    if (!isInvalid) {
                        curve.selectedLine = new Line(curve.points, nearestInfo.realPointIndex == 0 ? curve.points.length - 1 : nearestInfo.realPointIndex - 1, nearestInfo.realPointIndex);
                        curve.selectedLine.getRelativeCoordFromToXY(curve.c1, curve.c2, x, y);
                        isDragging = true;
                    }
                }
            }
            // drag origin point
            if (!isDragging) {
                mDownOffsetX = x; // + curve.originPoint[curve.c1];
                mDownOffsetY = y; // + curve.originPoint[curve.c2];
                draggingOrigin = true;
                isDragging = true;
            }
            beforeDragJson = curve.getPointsJson();
            curve.draw();
        });
        this.ctx.canvas.addEventListener('mouseup', function (evt) {
            if (isDragging && hasDragged)
                curve.pushUndoJson(beforeDragJson);
            dragCP = null;
            isDragging = false;
            draggingOrigin = false;
            hasDragged = false;
        });
        this.ctx.canvas.addEventListener('mouseleave', function (evt) {
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
        this.ctx.canvas.addEventListener('dblclick', function (evt) {
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
                // make sure we are a min away from a line
                if (nearestDist > 25)
                    return;
                // insert after point index
                var newPoint = curve.addPoint(x, y, nearestInfo);
                curve.setActivePoint(newPoint);
                this.style.cursor = 'pointer';
                // raise event
                if (newPoint != null && curve.events.onnewpoint != null)
                    curve.events.onnewpoint();
            }
            else if ((curve.CloseLoop && curve.points.length > 3) ||
                (!curve.CloseLoop && curve.points.length > 2)) {
                curve.pushUndoJson();
                curve.points.splice(nearestPointIndex, 1);
                this.style.cursor = 'initial';
                // raise event
                curve.setPointsAttr();
                if (curve.events.onremovepoint != null)
                    curve.events.onremovepoint();
            }
            curve.draw();
        });
    };
    Curve.prototype.mousedrag = function (evt, x, y, dragCP) {
        var handledDrag = false;
        if (dragCP == 'cp1') {
            if (this.ActivePoint.UpdateCP1Position(this.c1, this.c2, x, y))
                handledDrag = true;
        }
        else if (dragCP == 'cp2') {
            if (this.ActivePoint.UpdateCP2Position(this.c1, this.c2, x, y))
                handledDrag = true;
        }
        else {
            if (this.ActivePoint.UpdatePosition(this.c1, this.c2, x, y))
                handledDrag = true;
        }
        if (handledDrag) {
            this.setPointsAttr();
            // raise event
            if (this.events.ondrag2 != null)
                this.events.ondrag2();
            this.draw();
        }
    };
    ;
    Curve.prototype.pushUndoJson = function (json) {
        if (!json)
            json = this.getPointsJson();
        this.undoStack.push(json);
    };
    Curve.prototype.popUndoStack = function () {
        if (this.undoStack.length <= 0)
            return;
        var json = this.undoStack.pop();
        this.setPoints(json);
        this.setActivePoint(this.ActivePoint);
        this.events.onPointDataChanged(); // raise event so json is sent to c#
        this.draw();
    };
    return Curve;
}());
;
//# sourceMappingURL=Curve.js.map