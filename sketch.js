//screen dimensions
let fullscreenwidth = document.getElementById("jscode").clientWidth;//myscreen:1366;
let fullscreenheight = document.getElementById('jscode').clientHeight;//myscreen:657;
let animationwidth = fullscreenwidth;
let animationheight = fullscreenheight*0.7;
let sensitivityZoom = 0.06;
let perspectiveScale = 0.8;

//animation parameters (change at your own risk)
let emfx;
let generated = 0;
let itime = 0;
let pi = 3.1415;
let forceStrength = 30;
let forceCoefficient = 100000/100;
let frictionCoefficient = 1;
let voltageStrength = 0.8;
let voltageActive = false;
let colissionElasticity = 0.8;

//electrons
let particles = [];
let particlesNumber;
let particleRadius = animationheight/100;
let particleDiameter = particleRadius*2;
let velocity = 20;
let speedlimit = 20;

//conductor 
let boxwidth = 700;
let boxheight = 100;
let boxdepth = 700;
let innerboxwidth = 500;
let innerboxheight = 100;
let innerboxdepth = 500;
let innerDiameter = 700;
let outerDiameter = 900;
let sphereDiameter = 300;
let cylinderHeight = 800;
let cylinderDiameter = 150;
let batteryLength = 2*boxheight;
let batteryDepth = boxdepth-innerboxdepth;
let batteryz = boxdepth/4+innerboxdepth/4;
let batteryRadius = 70;
let batteryStrength = 0.1;
let x0 = 0;
let y0 = 0;
let z0 = 0;
let shape = 1;

//html elements
let mycanvas;
let sliderScale;
let sliderRotateX;
let sliderRotateY;
let sliderRotateZ;



function setup() {
	//create html elements
	header = createElement('h2',"Επιφανειακά Φορτία σε Κύκλωμα");
	header.style('text-align','center');
	header.style('padding','10px');
	header.style('padding-bottom','0px');
	header.parent('jscode');

	par = createP('Όταν η μπαταρία δουλεύει, μεταφέρει φορτία στην επιφάνεια των καλωδίων. Τα φορτία αυτά, είναι εκείνα που τελικά σπρώχνουν τα ελεύθερα ηλεκτρόνια και δημιουργούν το ηλεκτρικό ρεύμα στο εσωτερικό του καλωδίου.');
	par.style('padding-left','10px');
	par.parent('jscode');

	setAttributes('antialias', true);
	mycanvas = createCanvas(animationwidth, animationheight, WEBGL);
	mycanvas.parent("jscode");

	buttonReset = createButton("Επαναφορά Φορτίων");
	buttonReset.parent("jscode");
	buttonReset.style('width', '150px');
	buttonReset.style('margin','20px');
	buttonReset.class('mybutton');
	buttonReset.mousePressed(resetSketch);

	buttonResetCam = createButton("Επαναφορά Κάμερας");
	buttonResetCam.parent("jscode");
	buttonResetCam.style('width', '150px');
	buttonResetCam.style('margin','20px');
	buttonResetCam.class('mybutton');
	buttonResetCam.mousePressed(resetCamera);

	camera(0,0,2*(height/2.0)/tan(PI*30.0/180.0),  0,0,0,  0,1,0);
	perspective(perspectiveScale);
	resetSketch();
}



function draw() {
	//set the scene
	background(0, 60, 70);
	orbitControl();
	ambientLight(255, 255, 255);
	//debugMode();

	//create particles if needed
//	if (sliderParticles.value()+generated!=particles.length){
//		resetSketch();
//	}
	emfx = 0;
	for (var ind = 0; ind < particles.length; ind++) {
		emfx += particles[ind].emf();
	}
	if (batteryStrength>-emfx){
		particles.push(
			new BouncingBall(batteryLength/2+particleDiameter,0,batteryz,0,0,0,particleDiameter,-1))
		particles.push(
			new BouncingBall(-batteryLength/2-particleDiameter,0,batteryz,0,0,0,particleDiameter,1))
		generated += 2;
	}

	//show and move 
	for (var ind = 0; ind < particles.length; ind++) {
		particles[ind].show();
		particles[ind].move();
	}

	//calculate forces
	for (var ind = 0; ind < particles.length; ind++) {
		//colissions with conductor walls
		if (shape == 1){
			particles[ind].boxColission();
		} else if (shape == 2){
			particles[ind].sphereColission();
		} else if (shape == 3){
			particles[ind].cylinderColission();
		} else if (shape >= 4){
			particles[ind].ringColission();
			particles[ind].batteryColission();
		}

		//first, repulsion between balls
		for (let indother = 0; indother <particles.length; indother++) {
			if (indother!=ind){
				particles[ind].repulsion(particles[indother]);
			}	
		}

		//next, colission between balls
		for (let indother = 0; indother < ind; indother++) {
			particles[ind].ballcolission(particles[indother]);
		}

		//other forces
		particles[ind].friction();
		if (voltageActive){
			particles[ind].potential();
		}	

		//speed check
		particles[ind].speedCheck();
	}

	//draw conductor
	fill(72,45,20,100);
	stroke(18,11,5);
	strokeWeight(0.8);
	translate(x0,y0,z0);
	if (shape == 1){	
		box(boxwidth,boxheight,boxdepth);
		box(innerboxwidth,innerboxheight,innerboxdepth);
		//battery
		push()
		translate(0,0,batteryz);
		normalMaterial();
		rotateZ(pi/2);
		cylinder(batteryRadius,batteryLength);
		translate(0,-60,0);
		cylinder(batteryRadius/5,batteryLength/2);
		pop()
	} else if (shape == 2){
		sphere(sphereDiameter);
	} else if (shape == 3){
		push();
		rotateZ(PI/2);
		cylinder(cylinderDiameter,cylinderHeight);
		pop();
	} else if (shape == 4){
		cylinder(outerDiameter/2,boxheight);
		cylinder(innerDiameter/2,boxheight);

	}
	translate(-x0,-y0,-z0);
}



function nextShape() {
	shape += 1;
	if (shape > 4){
		shape = 1;
	}
	if (shape==1){
		buttonChangeShape.html('Κουτί');
	}else if (shape == 2){
		buttonChangeShape.html('Σφαίρα');
	}else if (shape ==3){
		buttonChangeShape.html('Κύλινδρος');
	}else if (shape ==4){
		buttonChangeShape.html('Δαχτυλίδι');
	}
}



function resetCamera(){
	camera(0,0,2*(height/2.0)/tan(PI*30.0/180.0),  0,0,0,  0,1,0);
}



function resetSketch() {
	//delete previous particles
	generated = 0;
	particles = [];
	particlesNumber = 1;
	forceStrength = 30;

	//create new particles
	for (let ip=0; ip<particlesNumber; ip++){	
		let x = x0 + random(-boxwidth/2 + particleRadius, -innerboxwidth/2-particleRadius);
		let y = y0 + random(-boxheight/2 + particleRadius, boxheight/2-particleRadius);
		let z = z0 + random(-boxdepth/2 + particleRadius, boxdepth/2-particleRadius);	
		let vx = random(-velocity, velocity)/Math.sqrt(3);
		let vy = random(-velocity, velocity)/Math.sqrt(3);
		let vz = random(-velocity, velocity)/Math.sqrt(3);
		let rand = random(-1,1);
		let charge = rand/Math.abs(rand);
		particles.push(new BouncingBall(x,y,z,vx,vy,vz,particleDiameter,1));
	}

}