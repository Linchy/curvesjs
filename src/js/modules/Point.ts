class Point {
	
    x: number;
    y: number;
    z: number;
    r: number;
    color: any; 
    ctx: any;

    constructor(x: number, y: number, z: number, color: any, size: number, context: any) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.r = size/2;
		this.color = color;
		this.ctx = context;
	}

	SubtractPoint(point: any) {
		this.x -= point.x;
		this.y -= point.y;
		this.z -= point.z;
	}

	DistanceToPoint(p2: Point) : number {
		var distance = Math.sqrt(
			((p2.x - this.x) * (p2.x - this.x)) + 
			((p2.y - this.y) * (p2.y - this.y)) + 
			((p2.z - this.z) * (p2.z - this.z))
			);
		return distance;
	}

	DistanceToXY(c1: string, c2: string, x2: number, y2: number) : number {

		var distance = Math.sqrt(
			((x2 - this[c1]) * (x2 - this[c1])) + 
			((y2 - this[c2]) * (y2 - this[c2]))
			);
			
		// var distance = Math.sqrt(
		// 	((x2 - this.x) * (x2 - this.x)) + 
		// 	((y2 - this.y) * (y2 - this.y)) + 
		// 	((z2 - this.z) * (z2 - this.z))
		// 	);

		return distance;
	}
	
	SetScale(prevScale: number, newScale: number) {
		this.x = (((this.x) / prevScale) * newScale);
		this.y = (((this.y) / prevScale) * newScale);
		this.z = (((this.z) / prevScale) * newScale);
	}

	draw(c1: string, c2: string, origin1: number, origin2: number) {
		this.ctx.fillStyle = this.color;
		this.ctx.beginPath();
		this.ctx.arc(this[c1] + origin1, this[c2] + origin2, this.r, 0, Math.PI*2, false);
		this.ctx.closePath();
		this.ctx.fill();
	}
}