var Curve = (function () {
    function Curve(context, htmlParent, pointsJson, surfaceOnly) {
        this.shiftKeyDown = false; // 16
        //var ctrlKeyDown: boolean = false; // 17
        this.altKeyDown = false; // 18
        this.ActivePoint = null;
        this.CloseLoop = true;
        this.gridCellSize = 20;
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
    Curve.prototype.setPoints = function (pointsJson) {
        var dataObj = JSON.parse(pointsJson);
        this.CloseLoop = dataObj.closeLoop;
        this.points = [];
        for (var i = 0; i < dataObj.points.length; i++) {
            var point = new BezierPoint(dataObj.points[i].x, dataObj.points[i].y, this.ctx, this.pointColor, this.pointSize, this.cpDist, false, dataObj.points[i].isSurfacePoint);
            point.cp1.x = dataObj.points[i].cp1X;
            point.cp1.y = dataObj.points[i].cp1Y;
            point.cp2.x = dataObj.points[i].cp2X;
            point.cp2.y = dataObj.points[i].cp2Y;
            this.points.push(point);
        }
        this.setPointsAttr();
    };
    Curve.prototype.getPointsJson = function () {
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
        var dataObj = {
            closeLoop: this.CloseLoop,
            points: pointMap
        };
        if (this.surfaceOnly) {
            dataObj.baseSurface = 'Square';
        }
        var pointsStr = JSON.stringify(dataObj);
        return pointsStr;
    };
    Curve.prototype.setPointsAttr = function () {
        this.htmlParent.setAttribute('points', this.getPointsJson());
    };
    Curve.prototype.on = function (event, func) {
        this.events['on' + event] = func.bind(this);
    };
    ;
    Curve.prototype.setActivePoint = function (point) {
        if (this.ActivePoint != null)
            this.ActivePoint.active = false;
        this.ActivePoint = point;
        if (point)
            this.ActivePoint.active = true;
        this.draw();
    };
    ;
    Curve.prototype.addPoint = function (x, y, nearestInfo) {
        var point = null;
        if (nearestInfo.realPointIndex) {
            var insertIndex = nearestInfo.realPointIndex;
            point = this.SliceBezier(insertIndex == 0 ? this.points.length - 1 : insertIndex - 1, insertIndex, nearestInfo.t);
        }
        else {
            point = new BezierPoint(x, y, this.ctx, this.pointColor, this.pointSize, this.cpDist);
            this.points.push(point);
        }
        this.setPointsAttr();
        return point;
    };
    ;
    Curve.prototype.setPointStyle = function (color, size) {
        for (var i = 0; i < this.points.length; i++) {
            this.points[i].setPointStyle(color, size);
            this.pointColor = color;
            this.pointSize = size;
        }
        this.draw();
    };
    ;
    Curve.prototype.setLineStyle = function (color, width) {
        //this.lineColor = color;
        this.lineWidth = width;
        this.draw();
    };
    ;
    Curve.prototype.ToggleCloseLoop = function (close) {
        this.CloseLoop = close;
        this.draw();
        this.setPointsAttr();
    };
    Curve.prototype.draw = function () {
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
            this.ctx.moveTo(p1.position.x, p1.position.y);
            this.ctx.bezierCurveTo(p1.cp2.x, p1.cp2.y, p2.cp1.x, p2.cp1.y, p2.position.x, p2.position.y);
            this.ctx.stroke();
        }
        // draw points that user can click and drag
        for (var i = 0; i < this.points.length; i++) {
            this.points[i].draw();
        }
    };
    ;
    Curve.prototype.createLUT = function () {
        var lookup = [];
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
            lookup.push({ x: p1.position.x, y: p1.position.y, realPointIndex: realPointIndex, t: 0 });
            // push middle points
            for (var j = 1; j < sampleCount; j++) {
                var t = j / sampleCount;
                var x = this.Sample(t, p1.position.x, p1.cp2.x, p2.cp1.x, p2.position.x);
                var y = this.Sample(t, p1.position.y, p1.cp2.y, p2.cp1.y, p2.position.y);
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
    };
    Curve.prototype.canvasEvents = function () {
        var x, y, nearestPoint, nearestPointIndex, nearestPointDist, hoverPoint, dragCP, isDragging;
        var curve = this;
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
                    else {
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
        this.ctx.canvas.addEventListener('mousemove', function (evt) {
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
        this.ctx.canvas.addEventListener('mousedown', function (evt) {
            evt.preventDefault();
            curve.selectedLine = null;
            if (hoverPoint != null) {
                curve.setActivePoint(hoverPoint);
                isDragging = true;
            }
            else {
                curve.setActivePoint(null);
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
                    if (nearestInfo != null) {
                        curve.selectedLine = new Line(curve.points, nearestInfo.realPointIndex == 0 ? curve.points.length - 1 : nearestInfo.realPointIndex - 1, nearestInfo.realPointIndex);
                        curve.selectedLine.getRelativeCoordFromToXY(x, y);
                        isDragging = true;
                    }
                }
            }
            curve.draw();
        });
        this.ctx.canvas.addEventListener('mouseup', function (evt) {
            dragCP = null;
            isDragging = false;
        });
        this.ctx.canvas.addEventListener('mouseleave', function (evt) {
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
        this.ctx.canvas.addEventListener('dblclick', function (evt) {
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
            else if (!curve.ActivePoint.isSurfacePoint) {
                curve.points.splice(nearestPointIndex, 1);
                this.style.cursor = 'initial';
                // raise event
                if (curve.events.onremovepoint != null)
                    curve.events.onremovepoint();
            }
            curve.draw();
        });
    };
    Curve.prototype.mousedrag = function (evt, x, y, dragCP) {
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
            this.ActivePoint.getRelativeControlPoints();
            // make other control point follow
            // if (!this.shiftKeyDown) {
            this.ActivePoint.cp2.x = x - this.ActivePoint.v1x * 2;
            this.ActivePoint.cp2.y = y - this.ActivePoint.v1y * 2;
        }
        else if (dragCP == 'cp2') {
            this.ActivePoint.cp2.x = x;
            this.ActivePoint.cp2.y = y;
            this.ActivePoint.getRelativeControlPoints();
            // make other control point follow
            // if (!this.shiftKeyDown) {
            this.ActivePoint.cp1.x = x - this.ActivePoint.v2x * 2;
            this.ActivePoint.cp1.y = y - this.ActivePoint.v2y * 2;
        }
        else {
            this.ActivePoint.getRelativeControlPoints();
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
        }
        this.setPointsAttr();
        // raise event
        if (this.events.ondrag != null)
            this.events.ondrag();
        this.draw();
    };
    ;
    return Curve;
}());
;
//# sourceMappingURL=Curve.js.map