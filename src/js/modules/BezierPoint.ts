class BezierPoint {

	cpDist: number;

	color: any;
	size: number;

	position: Point;
	cp1: Point;
	cp2: Point;

	ctx: any;
	r: number;

	active: boolean;

	//collapsed: boolean;

	v1x: number;
	v1y: number;

	v2x: number;
	v2y: number;

	markerData: string;
	uvNameInput: string;
	boneNameInput: string;
	uvEnabled: boolean;
	uvRangesInput: string;

	constructor(x: number, y: number, z: number, context: any, color: any, size: number, cpDist: number, reverseCpX?: boolean) {

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

	SubtractPoint(point: any) {
		this.position.SubtractPoint(point);
		this.cp1.SubtractPoint(point);
		this.cp2.SubtractPoint(point);
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



	pushRelativeControlPoints(c1: string, c2: string) {
		//if (!this.collapsed) {
		this.v1x = this.cp1[c1] - this.position[c1];
		this.v1y = this.cp1[c2] - this.position[c2];

		this.v2x = this.cp2[c1] - this.position[c1];
		this.v2y = this.cp2[c2] - this.position[c2];

	};

	popRelativeControlPoints(c1: string, c2: string) {
		this.cp1[c1] = this.v1x + this.position[c1];
		this.cp1[c2] = this.v1y + this.position[c2];

		this.cp2[c1] = this.v2x + this.position[c1];
		this.cp2[c2] = this.v2y + this.position[c2];
	};

	setPointStyle(color: any, size: number) {
		this.position.color = color;
		//this.cp1.color = color;
		//this.cp2.color = color;
		this.position.r = size / 2;
		this.cp1.r = size / 2;
		this.cp2.r = size / 2;
	};

	SetScale(prevScale: number, newScale: number) {
		this.position.SetScale(prevScale, newScale);
		this.cp1.SetScale(prevScale, newScale);
		this.cp2.SetScale(prevScale, newScale);
	}

	UpdatePosition(c1: string, c2: string, p1: number, p2: number) {
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
	}

	UpdateCP1Position(c1: string, c2: string, p1: number, p2: number) {
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
	}

	UpdateCP2Position(c1: string, c2: string, p1: number, p2: number) {
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
	}

	draw(c1: string, c2: string, origin1: number, origin2: number) {

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

		this.position.color = (this.active ? 'orange' :  'blue');
		this.position.draw(c1, c2, origin1, origin2);

		if (this.active) {
			this.cp1.draw(c1, c2, origin1, origin2);
			this.cp2.draw(c1, c2, origin1, origin2);
		}
	}

	SetPointOnCanvasBorder(c1: string, c2: string, evt: any, dragCP: string, origin: Point, canvasWidth: number, canvasHeight: number, shiftKeyDown: boolean, mX: number, mY: number) {

		var leftSide = -origin.x;
		var rightSide = canvasWidth - origin.x;

		var topSide = -origin.y;
		var bottomSide = canvasHeight - origin.y;

		// LEFT
		if (evt.offsetX < leftSide) {
			if (dragCP == 'cp1') {
				this.cp1[c1] = leftSide;

				this.pushRelativeControlPoints(c1, c2);

				if (!shiftKeyDown) {
					this.cp2[c1] = leftSide - this.v1x * 2;
					this.cp2[c2] = mY - this.v1y * 2;
				}
			}
			else if (dragCP == 'cp2') {
				this.cp2[c1] = 0;

				this.pushRelativeControlPoints(c1, c2);

				if (!shiftKeyDown) {
					this.cp1[c1] = leftSide - this.v2x * 2;
					this.cp1[c2] = mY - this.v2y * 2;
				}
			}
			else {
				this.position[c1] = leftSide;
				this.cp1[c1] = leftSide + this.v1x;
				this.cp2[c1] = leftSide + this.v2x;
			}
		}
		// RIGHT
		else if (evt.offsetX > rightSide) {
			if (dragCP == 'cp1') {
				this.cp1[c1] = rightSide;

				this.pushRelativeControlPoints(c1, c2);

				if (!shiftKeyDown) {
					this.cp2[c1] = rightSide - this.v1x * 2;
					this.cp2[c2] = mY - this.v1y * 2;
				}
			}
			else if (dragCP == 'cp2') {
				this.cp2[c1] = rightSide;

				this.pushRelativeControlPoints(c1, c2);

				if (!shiftKeyDown) {
					this.cp1[c1] = rightSide - this.v2x * 2;
					this.cp1[c2] = mY - this.v2y * 2;
				}
			}
			else {
				this.position[c1] = rightSide;
				this.cp1[c1] = rightSide + this.v1x;
				this.cp2[c1] = rightSide + this.v2x;
			}
		}
		// TOP
		else if (evt.offsetY < topSide) {
			if (dragCP == 'cp1') {
				this.cp1[c2] = topSide;

				this.pushRelativeControlPoints(c1, c2);

				if (!shiftKeyDown) {
					this.cp2[c1] = mX - this.v1x * 2;
					this.cp2[c2] = topSide - this.v1y * 2;
				}
			}
			else if (dragCP == 'cp2') {
				this.cp2[c2] = topSide;

				this.pushRelativeControlPoints(c1, c2);

				if (!shiftKeyDown) {
					this.cp1[c1] = mX - this.v2x * 2;
					this.cp1[c2] = topSide - this.v2y * 2;
				}
			}
			else {
				this.position[c2] = topSide;
				this.cp1[c2] = topSide + this.v1y;
				this.cp2[c2] = topSide + this.v2y;
			}
		}
		// BOTTOM
		else if (evt.offsetY > bottomSide) {
			if (dragCP == 'cp1') {
				this.cp1[c2] = bottomSide;

				this.pushRelativeControlPoints(c1, c2);
				if (!shiftKeyDown) {
					this.cp2[c1] = mX - this.v1x * 2;
					this.cp2[c2] = bottomSide - this.v1y * 2;
				}
			}
			else if (dragCP == 'cp2') {
				this.cp2[c2] = bottomSide;

				this.pushRelativeControlPoints(c1, c2);

				if (!shiftKeyDown) {
					this.cp1[c1] = mX - this.v2x * 2;
					this.cp1[c2] = bottomSide - this.v2y * 2;
				}
			}
			else {
				this.position[c2] = bottomSide;
				this.cp1[c2] = bottomSide + this.v1y;
				this.cp2[c2] = bottomSide + this.v2y;
			}
		}
	}
}