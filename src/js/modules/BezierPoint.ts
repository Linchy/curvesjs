class BezierPoint {

	cpDist: number;

	color: any;
	size: number;

	isSurfacePoint: boolean;

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
	isUVSeamInput: boolean;
	uvNameInput: string;

	constructor(x: number, y: number, context: any, color: any, size: number, cpDist: number, reverseCpX?: boolean, isSurfacePoint?: boolean) {

		this.cpDist = cpDist;

		this.color = color;
		this.size = size;

		this.isSurfacePoint = isSurfacePoint || false;

		this.position = new Point(x, y, this.color, this.size, context);
		this.cp1 = new Point(x + ((reverseCpX ? 1 : -1) * this.cpDist), y, 'red', this.size, context);
		this.cp2 = new Point(x + ((reverseCpX ? -1 : 1) * this.cpDist), y, 'blue', this.size, context);

		this.ctx = context;
		this.r = 2;

		this.active = false;

		//this.collapsed = false;

		this.markerData = "";
		this.isUVSeamInput = false;
		this.uvNameInput = "";
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

	pushRelativeControlPoints() {
		//if (!this.collapsed) {
		this.v1x = this.cp1.x - this.position.x;
		this.v1y = this.cp1.y - this.position.y;
		this.v2x = this.cp2.x - this.position.x;
		this.v2y = this.cp2.y - this.position.y;
		//} else {
		//	this.v1x = this.v1y = this.v2x = this.v2y = 0;
		//}

	};

	popRelativeControlPoints() {
		this.cp1.x = this.v1x + this.position.x;
		this.cp1.y = this.v1y + this.position.y;
		this.cp2.x = this.v2x + this.position.x;
		this.cp2.y = this.v2y + this.position.y;
	};

	setPointStyle(color: any, size: number) {
		this.position.color = color;
		//this.cp1.color = color;
		//this.cp2.color = color;
		this.position.r = size / 2;
		this.cp1.r = size / 2;
		this.cp2.r = size / 2;
	};

	SetScale(originPoint: Point, prevScale: number, newScale: number) {
		this.position.SetScale(originPoint, prevScale, newScale);
		this.cp1.SetScale(originPoint, prevScale, newScale);
		this.cp2.SetScale(originPoint, prevScale, newScale);
	}

	draw() {

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
	}

	SetPointOnCanvasBorder(evt: any, dragCP: string, canvasWidth: number, canvasHeight: number, shiftKeyDown: boolean, mX: number, mY: number) {
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
		// RIGHT
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
		// TOP
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
		// BOTTOM
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
	}
}