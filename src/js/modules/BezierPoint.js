var BezierPoint = (function () {
    function BezierPoint(x, y, z, context, color, size, cpDist, reverseCpX) {
        this.cpDist = cpDist;
        this.color = color;
        this.size = size;
        this.position = new Point(x, y, z, this.color, this.size, context);
        this.cp1 = new Point(x + ((reverseCpX ? 1 : -1) * this.cpDist), y, z, 'red', this.size, context);
        this.cp2 = new Point(x + ((reverseCpX ? -1 : 1) * this.cpDist), y, z, 'lightgreen', this.size, context);
        this.ctx = context;
        this.r = 2;
        this.active = false;
        //this.collapsed = false;
        this.markerData = "";
        this.uvNameInput = "";
        this.boneNameInput = "";
        this.uvEnabled = true;
        this.uvRangesInput = "";
    }
    BezierPoint.prototype.SubtractPoint = function (point) {
        this.position.SubtractPoint(point);
        this.cp1.SubtractPoint(point);
        this.cp2.SubtractPoint(point);
    };
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
    BezierPoint.prototype.pushRelativeControlPoints = function (c1, c2) {
        //if (!this.collapsed) {
        this.v1x = this.cp1[c1] - this.position[c1];
        this.v1y = this.cp1[c2] - this.position[c2];
        this.v2x = this.cp2[c1] - this.position[c1];
        this.v2y = this.cp2[c2] - this.position[c2];
    };
    ;
    BezierPoint.prototype.popRelativeControlPoints = function (c1, c2) {
        this.cp1[c1] = this.v1x + this.position[c1];
        this.cp1[c2] = this.v1y + this.position[c2];
        this.cp2[c1] = this.v2x + this.position[c1];
        this.cp2[c2] = this.v2y + this.position[c2];
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
    BezierPoint.prototype.SetScale = function (prevScale, newScale) {
        this.position.SetScale(prevScale, newScale);
        this.cp1.SetScale(prevScale, newScale);
        this.cp2.SetScale(prevScale, newScale);
    };
    BezierPoint.prototype.UpdatePosition = function (c1, c2, p1, p2) {
        if (this.position[c1] == p1 && this.position[c2] == p2) {
            return false;
        }
        else {
            this.pushRelativeControlPoints(c1, c2);
            this.position[c1] = p1;
            this.position[c2] = p2;
            this.cp1[c1] = this.position[c1] + this.v1x;
            this.cp1[c2] = this.position[c2] + this.v1y;
            this.cp2[c1] = this.position[c1] + this.v2x;
            this.cp2[c2] = this.position[c2] + this.v2y;
            return true;
        }
    };
    BezierPoint.prototype.UpdateCP1Position = function (c1, c2, p1, p2) {
        if (this.cp1[c1] == p1 && this.cp1[c2] == p2) {
            return false;
        }
        else {
            this.cp1[c1] = p1;
            this.cp1[c2] = p2;
            this.pushRelativeControlPoints(c1, c2);
            // make other control point follow
            this.cp2[c1] = p1 - this.v1x * 2;
            this.cp2[c2] = p2 - this.v1y * 2;
            return true;
        }
    };
    BezierPoint.prototype.UpdateCP2Position = function (c1, c2, p1, p2) {
        if (this.cp2[c1] == p1 && this.cp2[c2] == p2) {
            return false;
        }
        else {
            this.cp2[c1] = p1;
            this.cp2[c2] = p2;
            this.pushRelativeControlPoints(c1, c2);
            // make other control point follow
            this.cp1[c1] = p1 - this.v2x * 2;
            this.cp1[c2] = p2 - this.v2y * 2;
            return true;
        }
    };
    BezierPoint.prototype.draw = function (c1, c2, origin1, origin2) {
        this.ctx.lineWidth = 0.2;
        // draw lines to control points
        if (this.active) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.position[c1] + origin1, this.position[c2] + origin2);
            this.ctx.lineTo(this.cp1[c1] + origin1, this.cp1[c2] + origin2);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(this.position[c1] + origin1, this.position[c2] + origin2);
            this.ctx.lineTo(this.cp2[c1] + origin1, this.cp2[c2] + origin2);
            this.ctx.stroke();
        }
        // draw points
        this.position.color = (this.active ? 'orange' : 'blue');
        this.position.draw(c1, c2, origin1, origin2);
        if (this.active) {
            this.cp1.draw(c1, c2, origin1, origin2);
            this.cp2.draw(c1, c2, origin1, origin2);
        }
    };
    BezierPoint.prototype.SetPointOnCanvasBorder = function (c1, c2, evt, dragCP, canvasWidth, canvasHeight, shiftKeyDown, mX, mY) {
        // LEFT
        if (evt.offsetX < 0) {
            if (dragCP == 'cp1') {
                this.cp1[c1] = 0;
                this.pushRelativeControlPoints(c1, c2);
                if (!shiftKeyDown) {
                    this.cp2[c1] = 0 - this.v1x * 2;
                    this.cp2[c2] = mY - this.v1y * 2;
                }
            }
            else if (dragCP == 'cp2') {
                this.cp2[c1] = 0;
                this.pushRelativeControlPoints(c1, c2);
                if (!shiftKeyDown) {
                    this.cp1[c1] = 0 - this.v2x * 2;
                    this.cp1[c2] = mY - this.v2y * 2;
                }
            }
            else {
                this.position[c1] = 0;
                this.cp1[c1] = 0 + this.v1x;
                this.cp2[c1] = 0 + this.v2x;
            }
        }
        else if (evt.offsetX > canvasWidth) {
            if (dragCP == 'cp1') {
                this.cp1[c1] = canvasWidth;
                this.pushRelativeControlPoints(c1, c2);
                if (!shiftKeyDown) {
                    this.cp2[c1] = canvasWidth - this.v1x * 2;
                    this.cp2[c2] = mY - this.v1y * 2;
                }
            }
            else if (dragCP == 'cp2') {
                this.cp2[c1] = canvasWidth;
                this.pushRelativeControlPoints(c1, c2);
                if (!shiftKeyDown) {
                    this.cp1[c1] = canvasWidth - this.v2x * 2;
                    this.cp1[c2] = mY - this.v2y * 2;
                }
            }
            else {
                this.position[c1] = canvasWidth;
                this.cp1[c1] = canvasWidth + this.v1x;
                this.cp2[c1] = canvasWidth + this.v2x;
            }
        }
        else if (evt.offsetY < 0) {
            if (dragCP == 'cp1') {
                this.cp1[c2] = 0;
                this.pushRelativeControlPoints(c1, c2);
                if (!shiftKeyDown) {
                    this.cp2[c1] = mX - this.v1x * 2;
                    this.cp2[c2] = 0 - this.v1y * 2;
                }
            }
            else if (dragCP == 'cp2') {
                this.cp2[c2] = 0;
                this.pushRelativeControlPoints(c1, c2);
                if (!shiftKeyDown) {
                    this.cp1[c1] = mX - this.v2x * 2;
                    this.cp1[c2] = 0 - this.v2y * 2;
                }
            }
            else {
                this.position[c2] = 0;
                this.cp1[c2] = 0 + this.v1y;
                this.cp2[c2] = 0 + this.v2y;
            }
        }
        else if (evt.offsetY > canvasHeight) {
            if (dragCP == 'cp1') {
                this.cp1[c2] = canvasHeight;
                this.pushRelativeControlPoints(c1, c2);
                if (!shiftKeyDown) {
                    this.cp2[c1] = mX - this.v1x * 2;
                    this.cp2[c2] = canvasHeight - this.v1y * 2;
                }
            }
            else if (dragCP == 'cp2') {
                this.cp2[c2] = canvasHeight;
                this.pushRelativeControlPoints(c1, c2);
                if (!shiftKeyDown) {
                    this.cp1[c1] = mX - this.v2x * 2;
                    this.cp1[c2] = canvasHeight - this.v2y * 2;
                }
            }
            else {
                this.position[c2] = canvasHeight;
                this.cp1[c2] = canvasHeight + this.v1y;
                this.cp2[c2] = canvasHeight + this.v2y;
            }
        }
    };
    return BezierPoint;
}());
//# sourceMappingURL=BezierPoint.js.map