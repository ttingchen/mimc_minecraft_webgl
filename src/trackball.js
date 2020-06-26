import * as glm from 'gl-matrix';

var trackball = {
    x_yaw : null,
    y_pitch :  null,
	degree_x : null,
	degree_y : null,
	lfront :null,
    sensitivity : null,
	speed : null,
	camPos :null,
	camFront : null,
	camUp : null,
};

var keyPress = {
    W: false,
    A: false,
    S: false,
    D: false,
    Z: false,
    X: false,
    on:false,
}

var mouse = {
    down:false,
    diff_x:null,
    diff_y:null,
    last_x:null,
    last_y:null,
}


function trackball_init(sens, sp){
    trackball.x_yaw = 0.0;
	trackball.y_pitch = 0.0;
	trackball.degree_x = 0.0;
	trackball.degree_y = 0.0;
    trackball.lfront = glm.vec3.create();
    glm.vec3.set(trackball.lfront, 0, 0, -1);

	trackball.sensitivity = sens;
    trackball.speed = sp;

    trackball.camPos = glm.vec3.create();
    glm.vec3.set(trackball.camPos, 0, 1, 1);
    trackball.camFront = glm.vec3.create();
    glm.vec3.set(trackball.camFront, 0, 0, 0);
    trackball.camUp = glm.vec3.create();
    glm.vec3.set(trackball.camUp, 0, 1, 0);
    document.addEventListener( 'mousedown', onMouseDown );
    document.addEventListener( 'mousemove', onMouseMove );
    document.addEventListener( 'mouseup', onMouseUp );
    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );
}

function onMouseDown(e){
    mouse.down = true;
    mouse.last_x = e.clientX;
	mouse.last_y = e.clientY;
    console.log('down');
}
function onMouseMove(e){
    if(mouse.down === true){
        mouse.diff_x += e.clientX  - mouse.last_x;
        mouse.diff_y += mouse.last_y - e.clientY;
        //update view
        trackball_update('Tlook');
    }
}
function onMouseUp(e){
    mouse.down = false;
}

function onKeyDown(e){
    keyPress.on = true;
    switch(e.code){
        case 'KeyW':
            keyPress.W = true;
        break;
        case 'KeyA':
            keyPress.A = true;
        break;
        case 'KeyS':
            keyPress.S = true;
        break;
        case 'KeyD':
            keyPress.D = true;
        break;
        case 'KeyZ':
            keyPress.Z = true;
        break;
        case 'KeyX':
            keyPress.X = true;
        break;
        
    }
    
}

function onKeyUp(e){
    console.log(e.code + ' Up');
    keyPress.on = false;
    switch(e.code){
        case 'KeyW':
            keyPress.W = false;
        break;
        case 'KeyA':
            keyPress.A = false;
        break;
        case 'KeyS':
            keyPress.S = false;
        break;
        case 'KeyD':
            keyPress.D = false;
        break;
        case 'KeyZ':
            keyPress.Z = false;
        break;
        case 'KeyX':
            keyPress.X = false;
        break;
    }
}


function trackball_update(type){
    let sp_vec = glm.vec3.fromValues( 0, trackball.speed, 0);//updown
    let fr_vec = glm.vec3.create();//frontback
    glm.vec3.multiply(fr_vec, trackball.speed, trackball.camFront);
    let lr_vec = glm.vec3.create();//leftright
    glm.vec3.normalize(lr_vec, glm.vec3.cross(lr_vec, trackball.camFront, trackball.camUp));
    glm.vec3.multiply(lr_vec, trackball.speed, lr_vec);
    if(type === 'Tpress'){
        if(keyPress.Z === true) glm.vec3.add(trackball.camPos, trackball.camPos, sp_vec);
        if(keyPress.X === true) glm.vec3.subtract(trackball.camPos, trackball.camPos, sp_vec);
        if(keyPress.W === true) glm.vec3.add(trackball.camPos, trackball.camPos, fr_vec);
        if(keyPress.S === true) glm.vec3.subtract(trackball.camPos, trackball.camPos, fr_vec);
        if(keyPress.A === true) glm.vec3.subtract(trackball.camPos, trackball.camPos, lr_vec);
        if(keyPress.D === true) glm.vec3.add(trackball.camPos, trackball.camPos, lr_vec);
    }
    else{
		trackball.degree_x = mouse.diff_x * trackball.sensitivity;
		trackball.degree_y = mouse.diff_y * trackball.sensitivity;
		trackball.x_yaw += trackball.degree_x;
		trackball.y_pitch += trackball.degree_y;

		if (trackball.y_pitch > 89.0)
        trackball.y_pitch = 89.0;
		if (trackball.y_pitch < -89.0)
        trackball.y_pitch = -89.0;

		trackball.lfront.x = Math.cos(radians(trackball.y_pitch)) * Math.cos(radians(trackball.x_yaw));
		trackball.lfront.y = Math.sin(radians(trackball.y_pitch));
		trackball.lfront.z = Math.cos(radians(trackball.y_pitch)) * Math.sin(radians(trackball.x_yaw));
		glm.vec3.normalize(trackball.camFront, trackball.lfront);
    }
    let out = glm.vec3.create();
    glm.vec3.add(out,trackball.camPos ,trackball.camFront);
    glm.mat4.lookAt(matrix.v, trackball.camPos, out, trackball.camUp);
    //console.log(trackball.lfront.x);
}

function radians(num){
    return  num * Math.PI / 180;
}
