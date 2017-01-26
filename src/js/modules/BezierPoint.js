var BezierPoint = (function () {
    function BezierPoint(x, y, context, color, size, cpDist, reverseCpX, isSurfacePoint) {
        this.cpDist = cpDist;
        this.color = color;
        this.size = size;
        this.isSurfacePoint = isSurfacePoint;
        this.position = new Point(x, y, this.color, this.size, context);
        this.cp1 = new Point(x + ((reverseCpX ? 1 : -1) * this.cpDist), y, 'red', this.size, context);
        this.cp2 = new Point(x + ((reverseCpX ? -1 : 1) * this.cpDist), y, 'blue', this.size, context);
        this.ctx = context;
        this.r = 2;
        this.active = false;
        //this.collapsed = false;
        this.markerData = "";
    }
    //collapse() {
    // if (!this.collapsed) {
    // 	this.collapsed = true;
    // 	this.cp1.x = this.cp2.x = this.position.x;
    // 	this.cp1.y = this.cp2.y = this.position.y;
    // } else {
    // 	this.collapsed = false;
    // 	this.cp1.x = this.position.x - this.cpDist;
    // 	this.cp2.x = this.position.x + this.cpDist;
    // }
    //}
    BezierPoint.prototype.pushRelativeControlPoints = function () {
        //if (!this.collapsed) {
        this.v1x = this.cp1.x - this.position.x;
        this.v1y = this.cp1.y - this.position.y;
        this.v2x = this.cp2.x - this.position.x;
        this.v2y = this.cp2.y - this.position.y;
        //} else {
        //	this.v1x = this.v1y = this.v2x = this.v2y = 0;
        //}
    };
    ;
    BezierPoint.prototype.popRelativeControlPoints = function () {
        this.cp1.x = this.v1x + this.position.x;
        this.cp1.y = this.v1y + this.position.y;
        this.cp2.x = this.v2x + this.position.x;
        this.cp2.y = this.v2y + this.position.y;
    };
    ;
    BezierPoint.prototype.setPointStyle = function (color, size) {
        this.position.color = color;
        //this.cp1.color = color;
        //this.cp2.color = color;
        this.position.r = size / 2;
        this.cp1.r = size / 2;
        this.cp2.r = size / 2;
    };
    ;
    BezierPoint.prototype.SetScale = function (originPoint, prevScale, newScale) {
        this.position.SetScale(originPoint, prevScale, newScale);
        this.cp1.SetScale(originPoint, prevScale, newScale);
        this.cp2.SetScale(originPoint, prevScale, newScale);
    };
    BezierPoint.prototype.draw = function () {
        this.ctx.lineWidth = 0.2;
        // draw lines to control points
        if (this.active) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.position.x, this.position.y);
            this.ctx.lineTo(this.cp1.x, this.cp1.y);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(this.position.x, this.position.y);
            this.ctx.lineTo(this.cp2.x, this.cp2.y);
            this.ctx.stroke();
        }
        // draw points
        this.position.color = (this.active ? 'orange' : (this.isSurfacePoint ? 'darkred' : 'black'));
        this.position.draw();
        if (this.active) {
            this.cp1.draw();
            this.cp2.draw();
        }
    };
    BezierPoint.prototype.SetPointOnCanvasBorder = function (evt, dragCP, canvasWidth, canvasHeight, shiftKeyDown, mX, mY) {
        // LEFT
        if (evt.offsetX < 0) {
            if (dragCP == 'cp1') {
                this.cp1.x = 0;
                this.pushRelativeControlPoints();
                if (!shiftKeyDown) {
                    this.cp2.x = 0 - this.v1x * 2;
                    this.cp2.y = mY - this.v1y * 2;
                }
            }
            else if (dragCP == 'cp2') {
                this.cp2.x = 0;
                this.pushRelativeControlPoints();
                if (!shiftKeyDown) {
                    this.cp1.x = 0 - this.v2x * 2;
                    this.cp1.y = mY - this.v2y * 2;
                }
            }
            else {
                this.position.x = 0;
                this.cp1.x = 0 + this.v1x;
                this.cp2.x = 0 + this.v2x;
            }
        }
        else if (evt.offsetX > canvasWidth) {
            if (dragCP == 'cp1') {
                this.cp1.x = canvasWidth;
                this.pushRelativeControlPoints();
                if (!shiftKeyDown) {
                    this.cp2.x = canvasWidth - this.v1x * 2;
                    this.cp2.y = mY - this.v1y * 2;
                }
            }
            else if (dragCP == 'cp2') {
                this.cp2.x = canvasWidth;
                this.pushRelativeControlPoints();
                if (!shiftKeyDown) {
                    this.cp1.x = canvasWidth - this.v2x * 2;
                    this.cp1.y = mY - this.v2y * 2;
                }
            }
            else {
                this.position.x = canvasWidth;
                this.cp1.x = canvasWidth + this.v1x;
                this.cp2.x = canvasWidth + this.v2x;
            }
        }
        else if (evt.offsetY < 0) {
            if (dragCP == 'cp1') {
                this.cp1.y = 0;
                this.pushRelativeControlPoints();
                if (!shiftKeyDown) {
                    this.cp2.x = mX - this.v1x * 2;
                    this.cp2.y = 0 - this.v1y * 2;
                }
            }
            else if (dragCP == 'cp2') {
                this.cp2.y = 0;
                this.pushRelativeControlPoints();
                if (!shiftKeyDown) {
                    this.cp1.x = mX - this.v2x * 2;
                    this.cp1.y = 0 - this.v2y * 2;
                }
            }
            else {
                this.position.y = 0;
                this.cp1.y = 0 + this.v1y;
                this.cp2.y = 0 + this.v2y;
            }
        }
        else if (evt.offsetY > canvasHeight) {
            if (dragCP == 'cp1') {
                this.cp1.y = canvasHeight;
                this.pushRelativeControlPoints();
                if (!shiftKeyDown) {
                    this.cp2.x = mX - this.v1x * 2;
                    this.cp2.y = canvasHeight - this.v1y * 2;
                }
            }
            else if (dragCP == 'cp2') {
                this.cp2.y = canvasHeight;
                this.pushRelativeControlPoints();
                if (!shiftKeyDown) {
                    this.cp1.x = mX - this.v2x * 2;
                    this.cp1.y = canvasHeight - this.v2y * 2;
                }
            }
            else {
                this.position.y = canvasHeight;
                this.cp1.y = canvasHeight + this.v1y;
                this.cp2.y = canvasHeight + this.v2y;
            }
        }
    };
    return BezierPoint;
}());
//# sourceMappingURL=BezierPoint.js.map