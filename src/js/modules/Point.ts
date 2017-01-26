class Point {
	
    x: number;
    y: number;
    r: number;
    color: any; 
    ctx: any;

    constructor(x: number, y: number, color: any, size: number, context: any) {
		this.x = x;
		this.y = y;
		this.r = size/2;
		this.color = color;
		this.ctx = context;
	}

	DistanceToPoint(p2: Point) : number {
		var distance = Math.sqrt(((p2.x - this.x) * (p2.x - this.x)) + ((p2.y - this.y) * (p2.y - this.y)));
		return distance;
	}

	DistanceToXY(x2: number, y2: number) : number {
		var distance = Math.sqrt(((x2 - this.x) * (x2 - this.x)) + ((y2 - this.y) * (y2 - this.y)));
		return distance;
	}
	
	SetScale(originPoint: Point, prevScale: number, newScale: number) {
		this.x = (((this.x - originPoint.x) / prevScale) * newScale) + originPoint.x;
		this.y = (((this.y - originPoint.y) / prevScale) * newScale) + originPoint.y;
	}

	draw() {
		this.ctx.fillStyle = this.color;
		this.ctx.beginPath();
		this.ctx.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
		this.ctx.closePath();
		this.ctx.fill();
	}
}