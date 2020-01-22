//screen dimensions
let fullscreenwidth = document.getElementById("jscode").clientWidth;//myscreen:1366;
let fullscreenheight = document.getElementById('jscode').clientHeight;//myscreen:657;
let animationwidth = fullscreenwidth;
let animationheight = fullscreenheight*0.7;
let sensitivityZoom = 0.06;
let perspectiveScale = 0.8;

//animation parameters (change at your own risk)
let pi = 3.1415;
let forceStrength;
let forceCoefficient = 100000/10;
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
let innerboxwidth = 600;
let innerboxheight = 100;
let innerboxdepth = 600;
let innerDiameter = 700;
let outerDiameter = 900;
let sphereDiameter = 300;
let cylinderHeight = 800;
let cylinderDiameter = 150;
let batteryLength = 2*boxheight;
let batteryz = outerDiameter/4+innerDiameter/4;
let batteryRadius = outerDiameter/4-innerDiameter/4+ 40;
let x0 = 0;
let y0 = 0;
let z0 = 0;
let shape = 4;

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

	par = createP('Η μπαταρία μεταφέρει φορτία στην επιφάνεια των καλωδίων. Τα φορτία αυτά, σπρώχνουν τα ελεύθερα ηλεκτρόνια και δημιουργούν το ηλεκτρικό ρεύμα στο εσωτερικό του καλωδίου.');
	par.style('padding-left','10px');
	par.parent('jscode');

	setAttributes('antialias', true);
	mycanvas = createCanvas(animationwidth, animationheight, WEBGL);
	mycanvas.parent("jscode");

	sliderParticles = createSlider(1, 300, 50);
	sliderParticles.parent('jscode');
	sliderParticles.style('width', '250px');
	sliderParticles.style('margin','20px');
	sliderParticles.class('slider sliderNumber');

	labelParticles = createElement('label','Αριθμός φορτίων: ');
	labelParticles.parent('jscode');
	labelParticles.position(sliderParticles.position().x,sliderParticles.position().y+2.4*sliderParticles.height);


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

//	buttonChangeShape = createButton("Άλλαξε Σχήμα");
//	buttonChangeShape.parent("jscode");
//	buttonChangeShape.style('width', '120px');
//	buttonChangeShape.style('margin','20px');
//	buttonChangeShape.class('mybutton');
//	buttonChangeShape.mousePressed(nextShape);
//
//	buttonPotential = createButton("Εφαρμογή Τάσης");
//	buttonPotential.parent("jscode");
//	buttonPotential.style('width', '130px');
//	buttonPotential.style('margin','20px');
//	buttonPotential.class('mybutton');
//	buttonPotential.mousePressed(toggleVoltage);


	camera(0,0,2*(height/2.0)/tan(PI*30.0/180.0),  0,0,0,  0,1,0);
	perspective(perspectiveScale);
	resetSketch();
}

let generated = 0;
let itime = 0;
function draw() {
	itime += 1;
	
	//set the scene
	background(0, 60, 70);
	orbitControl();
	ambientLight(255, 255, 255);
	//pointLight(255,255,255, mouseX,-1000,mouseY);	
	//debugMode();
	
	if (itime%20 == 0){
		particles.push(new BouncingBall(batteryLength/2,0,batteryz,0,0,0,10,-1))
		particles.push(new BouncingBall(-batteryLength/2,0,batteryz,0,0,0,10,1))
		generated += 2;
	}
	
	//create particles if needed
	if (sliderParticles.value()+generated!=particles.length){
		resetSketch();
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

		//last, speed check
		particles[ind].speedCheck();
	}

	//draw conductor
	fill(72,45,20,100);
	stroke(18,11,5);
	strokeWeight(0.8);


	translate(x0,y0,z0);
	if (shape == 1){	
		box(boxwidth,boxheight,boxdepth);
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
		
		push()
		translate(0,0,batteryz);
		normalMaterial();
		rotateZ(pi/2);
		cylinder(batteryRadius/1.5,batteryLength/1.2);
		translate(0,-60,0);
		cylinder(batteryRadius/5,batteryLength/2.3);
		//translate(0,60,0);
		//translate(0,0,-batteryz);
		pop()
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

function toggleVoltage(){
	voltageActive = !voltageActive;
	if (voltageActive){
		buttonPotential.html("Τάση: On");
	} else {
		buttonPotential.html("Τάση: Off");
	}
}


function resetCamera(){
	camera(0,0,2*(height/2.0)/tan(PI*30.0/180.0),  0,0,0,  0,1,0);
}


function resetSketch() {
	//delete previous particles
	generated = 0;
	particles = [];
	particlesNumber = sliderParticles.value();
	labelParticles.html("Αριθμός φορτίων: " + particlesNumber);

	forceStrength = forceCoefficient/particlesNumber;

	//create new particles
	for (let ip=0; ip<particlesNumber; ip++){	
		let x = x0 + random(-boxwidth/2 + particleRadius, boxwidth/2-particleRadius);
		let y = y0 + random(-boxheight/2 + particleRadius, boxheight/2-particleRadius);
		let z = z0 + random(-boxdepth/2 + particleRadius, boxdepth/2-particleRadius);	
		let vx = random(-velocity, velocity)/Math.sqrt(3);
		let vy = random(-velocity, velocity)/Math.sqrt(3);
		let vz = random(-velocity, velocity)/Math.sqrt(3);
		let rand = random(-1,1);
		let charge = rand/Math.abs(rand);
		particles.push(new BouncingBall(x,y,z,vx,vy,vz,particleDiameter,charge));
	}

}


