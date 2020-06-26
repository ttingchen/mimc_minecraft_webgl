import * as glm from 'gl-matrix';
import * as Stats from 'stats-js';
import * as Dat from 'dat.gui';
import * as Perlin from './perlin';

// global variable
var gl = window.WebGL2RenderingContext.prototype; // specify type for code snippet
var stats = null;
var gui = null;
var perlin = null;

var global = {
    program: null,
    start: null,
};
var matrix = {
    m: null,
    v: null,
    p: null,
};
var uniform = {
    mvp: null,
    m: null,
    eye: null,
    light: null,
    co: null,
    nm: null,
    use: null,
};
var model = {
    vao: null,
    ctr: null,
    tex: [],
};
var flag = {
    normal: false,
    shadow: false,
    ssao: false,
};

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
var skybox = {
    program: null,
    vao: null,
    u_pvm: null,
}
var land = {
    landProg: null,
    vao:null,
    indexCount:null,
    u_v:null,
    u_p:null,
    u_trans: null,
    u_eyepos: null,
    u_light_pos: null,
    u_shadow_matrix: null,
    u_offset:null,
    trans:null,
    shadow_matrix:null,
    offset:null,
    tex:[],
    data:[],
    u_isN:false,
    u_isSH:false,
    u_isSsao:false,
}
var depth = {
    program: null,
    u_vp: null,
    u_trans: null,
    u_offset: null,
    fbo: null,
    tex: null,  
};
var ssao = {
    program: null,
    fbo: null,
    norm_tex: null,   
    depth_tex: null,   
    noise_map: null,   
    u_v: null,
    u_p: null,
    u_trans: null,
    u_offset: null,
};
var test = {
    program: null,
    fbo: null,
    vao: null,
    u_p: null,
    u_noise_scale: null,
    ao_tex: null,
    kernel_ubo: null,
}
var light_pos = glm.vec3.fromValues(0, 100, 150);
var lightvp = glm.mat4.create();
var depth_size = 4096;
var worldWidth = 100;
var worldDepth = 100;
var worldHalfWidth = worldWidth / 2;
var worldHalfDepth = worldDepth / 2;
function initWebGL() {
    let canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.querySelector('body').appendChild(canvas);

    gl = canvas.getContext('webgl2');
    if (!gl) {
        alert('WebGL 2 not available');
    }

    // webgl setting
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    // gl.depthFunc(gl.LEQUAL);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // fps
    stats = new Stats();
    stats.domElement.classList.add('navbar')
    document.body.appendChild(stats.domElement);

    // gui
    gui = new Dat.GUI();
    gui.domElement.classList.add('navbar');
    let nmFolder = gui.addFolder('Normal');
    nmFolder.add(flag, 'normal').onChange((val) => {
        gl.uniform1i(land.u_isN, val);
    });
    nmFolder.add(flag, 'shadow').onChange((val) => {
        gl.uniform1i(land.u_isSH, val);
    });
    nmFolder.add(flag, 'ssao').onChange((val) => {
        gl.uniform1i(land.u_isSsao, val);
    });
    nmFolder.open();

    //perlin
    perlin = new Perlin.default();


    
    //init trackball
    trackball_init(0.001, 0.05);
    
    // matrix
    matrix.m = glm.mat4.create();
    matrix.v = glm.mat4.create();
    matrix.p = glm.mat4.create();
    glm.mat4.lookAt(matrix.v, trackball.camPos, trackball.camFront, trackball.camUp);

    glm.mat4.perspective(matrix.p, radians(60), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000.0);
    
    //init skybox->createshader

    //init land->createshader

}



function trackball_init(sens, sp){
    trackball.x_yaw = -90.0;
	trackball.y_pitch = 0.0;
	trackball.degree_x = 0.0;
	trackball.degree_y = 0.0;
    trackball.lfront = glm.vec3.create();
    glm.vec3.set(trackball.lfront, 0, 0, 0);

	trackball.sensitivity = sens;
    trackball.speed = sp;

    trackball.camPos = glm.vec3.create();
    glm.vec3.set(trackball.camPos, 0, 1, 5);

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
        mouse.diff_x = e.clientX  - mouse.last_x;
        mouse.diff_y = mouse.last_y - e.clientY;
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

function createShader() {
    //init skybox
    skybox_createShader();
    //init depth map
    depthMap_createShader();
    //init land
    land_createShader();
    //init ssao
    ssao_createShader();
    //init test
    test_createShader();

}

function test_createShader(){
    let vsSrc = document.getElementById('test.vs').innerText.trim();
    let fsSrc = document.getElementById('test.fs').innerText.trim();

    test.program = create_program(vsSrc, fsSrc);

    test.u_p = gl.getUniformLocation(test.program, 'ssao_um4p');
    test.u_noise_scale = gl.getUniformLocation(test.program, "noise_scale");

    test.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, test.fbo);

    test.ao_tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, test.ao_tex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, window.innerWidth, window.innerHeight);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    var dep = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, dep);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT32F, window.innerWidth, window.innerHeight);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, test.ao_tex, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, dep, 0);
    
    test.vao = gl.createVertexArray();
    gl.bindVertexArray(test.vao);

    test.kernel_ubo = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, test.kernel_ubo);
    let kernels = new Float32Array(128);
    let tmp = glm.vec3.create();
    let out = glm.vec3.create();
	for (let i = 0; i < 32; i++)
	{
		glm.vec3.normalize(tmp ,glm.vec3.fromValues(
			Math.random() * 2 - 1,
			Math.random() * 2 - 1,
			Math.random() * 0.85 + 0.15
        ));
        let sca = i / 32;
        sca = 0.1 + 0.9 * sca * sca;
        glm.vec3.mul(out, tmp, glm.vec3.fromValues(sca, sca, sca));
        kernels[4*i] =   tmp[0] * sca;//out[0];
        kernels[4*i+1] = tmp[1] * sca;//out[1];
        kernels[4*i+2] = tmp[2] * sca;//out[2];
        kernels[4*i+3] = 0;
    }
    gl.bufferData(gl.UNIFORM_BUFFER, kernels, gl.STATIC_DRAW);

    let t0 = gl.getUniformLocation(test.program, 'gDepth_tex');
    let t1 = gl.getUniformLocation(test.program, 'gNorm_tex');
    let t2 = gl.getUniformLocation(test.program, 'gNoise');

    gl.useProgram(test.program);
    gl.uniform1i(t0, 0);
    gl.uniform1i(t1, 1);
    gl.uniform1i(t2, 2);

    let blockIdx = gl.getUniformBlockIndex(test.program, "Kernals");
    gl.uniformBlockBinding(test.program, blockIdx, 0);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);



}

function ssao_createShader(){
    let vsSrc = document.getElementById('ssao.vs').innerText.trim();
    let fsSrc = document.getElementById('ssao.fs').innerText.trim();

    ssao.program = create_program(vsSrc, fsSrc);

    ssao.u_trans = gl.getUniformLocation(ssao.program, 'trans');
    ssao.u_v = gl.getUniformLocation(ssao.program, 'um4v');
    ssao.u_p = gl.getUniformLocation(ssao.program, 'um4p');
    ssao.u_offset = gl.getUniformLocation(ssao.program, 'offset');
    ssao.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, ssao.fbo);
    
    ssao.norm_tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, ssao.norm_tex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, window.innerWidth, window.innerHeight);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


    ssao.depth_tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, ssao.depth_tex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT32F, window.innerWidth, window.innerHeight);

    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ssao.norm_tex, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, ssao.depth_tex, 0);

    	// noise map
	ssao.noise_map = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, ssao.noise_map);

    let noiseData = new Float32Array(48);
    let out = glm.vec3.create();
	for (let i = 0; i < 16; i++)
	{
		glm.vec3.normalize(out ,glm.vec3.fromValues(
			Math.random(), // 0.0 ~ 1.0
			Math.random(), // 0.0 ~ 1.0
			0.0
        ));
        noiseData[3*i] = out[0];
        noiseData[3*i+1] = out[1];
        noiseData[3*i+2] = out[2];
	}
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, 4, 4, 0, gl.RGB, gl.FLOAT, noiseData);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	////
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

}

function depthMap_createShader(){
    let vsSrc = document.getElementById('depth.vs').innerText.trim();
    let fsSrc = document.getElementById('depth.fs').innerText.trim();

    depth.program = create_program(vsSrc, fsSrc);
    //uniform todo
    depth.u_trans = gl.getUniformLocation(depth.program, 'trans');
    depth.u_vp = gl.getUniformLocation(depth.program, 'um4vp');
    depth.u_offset = gl.getUniformLocation(depth.program, 'offset');

    //init tex
    depth.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, depth.fbo);
    depth.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depth.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, depth_size, depth_size, 0,
        gl.DEPTH_COMPONENT, gl.FLOAT, null);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth.tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    let range = 150;
    let light_p = glm.mat4.create();
    glm.mat4.ortho(light_p, -range, range, -range, range, 0, 500);
    let light_v = glm.mat4.create();
    glm.mat4.lookAt(light_v, light_pos, glm.vec3.fromValues(0, 0, 0),
        glm.vec3.fromValues(0, 1, 0));
    glm.mat4.multiply(lightvp, light_p, light_v);

}


function land_createShader(){
    // get shader string
    let vsSrc = document.getElementById('land.vs').innerText.trim();
    let fsSrc = document.getElementById('land.fs').innerText.trim();

    land.landProg = create_program(vsSrc, fsSrc);
    //uniform todo
    land.u_v = gl.getUniformLocation(land.landProg, 'um4v');
    land.u_p = gl.getUniformLocation(land.landProg, 'um4p');
    land.u_trans = gl.getUniformLocation(land.landProg, 'trans');
    land.u_eyepos= gl.getUniformLocation(land.landProg, 'eyepos');
    land.u_light_pos= gl.getUniformLocation(land.landProg, 'light_pos');
    land.u_shadow_matrix= gl.getUniformLocation(land.landProg, 'shadow_matrix');
    land.u_offset= gl.getUniformLocation(land.landProg, 'offset');
    land.u_isN= gl.getUniformLocation(land.landProg, 'isN');
    land.u_isSH= gl.getUniformLocation(land.landProg, 'isSH');
    land.u_isSsao= gl.getUniformLocation(land.landProg, 'isSsao');
    let t0 = gl.getUniformLocation(land.landProg, 'tex');
    let t1 = gl.getUniformLocation(land.landProg, 'sand_tex');
    let t2 = gl.getUniformLocation(land.landProg, 'tex_norm');
    let t3 = gl.getUniformLocation(land.landProg, 'sand_tex_norm');
    let t4 = gl.getUniformLocation(land.landProg, 'shadow_tex');
    let t5 = gl.getUniformLocation(land.landProg, 'ao_tex');
    gl.useProgram(land.landProg);
    gl.uniform1i(land.u_isN, flag.normal);
    gl.uniform1i(land.u_isSH, flag.shadow);
    gl.uniform1i(land.u_isSsao, flag.ssao);

    gl.uniform1i(t0, 0);
    gl.uniform1i(t1, 1);
    gl.uniform1i(t2, 2);
    gl.uniform1i(t3, 3);
    gl.uniform1i(t4, 4);
    gl.uniform1i(t5, 5);

    land.trans = glm.mat4.create();
    land.shadow_matrix = glm.mat4.create();
    //shadow matrix
    glm.mat4.fromTranslation(land.shadow_matrix, glm.vec3.fromValues(0.5, 0.5, 0.5));
    glm.mat4.scale(land.shadow_matrix, land.shadow_matrix, glm.vec3.fromValues(0.5, 0.5, 0.5));
    glm.mat4.multiply(land.shadow_matrix,land.shadow_matrix,lightvp);

    gl.uniform3fv(land.u_eyepos, trackball.camPos);
    gl.uniform3fv(land.u_light_pos, light_pos);
    gl.uniformMatrix4fv(land.u_shadow_matrix, false, land.shadow_matrix);//todo

    //generate map 
    land.data.length = worldWidth * worldDepth;
    land.offset = new Float32Array( worldWidth * worldDepth * 3);
    land_genHeight();
    land_genMap();
}

function land_genHeight(){
	let	size = worldWidth * worldDepth;
	
    let	quality = 2;
	let z = Math.random() * 100;

    for (let j = 0; j < 4; j++) {

		if (j == 0) 
			for (let i = 0; i < size; i++) land.data[i] = 0;

		for (let i = 0; i < size; i++) {

			let x = i % worldWidth, y = (i / worldWidth) | 0;
			land.data[i] += perlin.noise(x / quality, y / quality, z) * quality;
		}

		quality *= 4;

	}

}

function getY(x, z){
	return Math.floor( land.data[x + z * worldWidth] * 0.2);
}

function land_genMap(){
    console.log("land_genMap");
    let i = 0;
    let max = 0;
    let min = Infinity;

	for (let z = 0; z < worldDepth; z++) {
		for (let x = 0; x < worldWidth; x++) {

			let h = getY(x, z);
			if (h > max) max = h;
			if (h < min) min = h;
            //printf("h = %f\n", h);
            var newpos = glm.vec3.fromValues(
                x - worldHalfWidth,
				h,
				z - worldHalfDepth);
            // land.offset.push(newpos);
            land.offset[i * 3] = newpos[0];
            land.offset[i * 3 + 1] = newpos[1];
            land.offset[i * 3 + 2] = newpos[2];
            
			i++;

		}
    }
   
}

function skybox_createShader(){
    // get shader string
    let vsSrc = document.getElementById('skybox.vs').innerText.trim();
    let fsSrc = document.getElementById('skybox.fs').innerText.trim();

    skybox.program = create_program(vsSrc, fsSrc);
    skybox.u_pvm = gl.getUniformLocation(skybox.program, 'pvm');
    
}

function create_program(vsSrc,fsSrc){
    // create vertex shader
    let vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSrc);
    gl.compileShader(vs);

    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vs));
    }

    // create fragment shader
    let fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSrc);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fs));
    }

    // create shader program
    let prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(prog));
    }
    return prog;
}

function _loadFile(url) {
    let fr = new FileReader();
    return new Promise((resolve, reject) => {
        let req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.responseType = 'blob';
        req.onload = () => {
            fr.readAsText(req.response);
            fr.onload = (e) => {
                let f = e.target.result;
                let ls = f.split(/\r?\n/);
                resolve(ls);
            };
        }
        req.onerror = () => {
            reject(new Error(`Failed to load file's url: ${url}`));
        };
        req.send();
    });
}

async function loadObj(url) {
    // read file
    let lines = await _loadFile(url);

    // parse obj format
    let v = [];
    let vt = [];
    let vn = [];
    let idx = [];

    for (let line of lines) {
        line = line.split(' ');
        // console.log(line);
        if (line[0] == 'v') {
            v.push(parseFloat(line[1]));
            v.push(parseFloat(line[2]));
            v.push(parseFloat(line[3]));
        }
        else if (line[0] == 'vn') {
            vn.push(parseFloat(line[1]));
            vn.push(parseFloat(line[2]));
            vn.push(parseFloat(line[3]));
        }
        else if (line[0] == 'vt') {
            vt.push(parseFloat(line[1]));
            // flip vertically
            vt.push(1.0 - parseFloat(line[2]));
        }
        else if (line[0] == 'f') {
            // start from zero
            idx.push(parseInt(line[1].split('/')[0]) - 1);
            idx.push(parseInt(line[2].split('/')[0]) - 1);
            idx.push(parseInt(line[3].split('/')[0]) - 1);
        }
    }

    // compute tangent
    let tn = [];
    for (let i = 0; i < idx.length; i+=3) {
        let idx1 = idx[i];
        let idx2 = idx[i + 1];
        let idx3 = idx[i + 2];

        let p1 = glm.vec3.fromValues(v[idx1 * 3 + 0], v[idx1 * 3 + 1], v[idx1 * 3 + 2]);
        let p2 = glm.vec3.fromValues(v[idx2 * 3 + 0], v[idx2 * 3 + 1], v[idx2 * 3 + 2]);
        let p3 = glm.vec3.fromValues(v[idx3 * 3 + 0], v[idx3 * 3 + 1], v[idx3 * 3 + 2]);

        let n1 = glm.vec3.fromValues(vn[idx1 * 3 + 0], vn[idx1 * 3 + 1], vn[idx1 * 3 + 2]);
        let n2 = glm.vec3.fromValues(vn[idx2 * 3 + 0], vn[idx2 * 3 + 1], vn[idx2 * 3 + 2]);
        let n3 = glm.vec3.fromValues(vn[idx3 * 3 + 0], vn[idx3 * 3 + 1], vn[idx3 * 3 + 2]);

        let uv1 = glm.vec2.fromValues(vt[idx1 * 2 + 0], vt[idx1 * 2 + 1]);
        let uv2 = glm.vec2.fromValues(vt[idx2 * 2 + 0], vt[idx2 * 2 + 1]);
        let uv3 = glm.vec2.fromValues(vt[idx3 * 2 + 0], vt[idx3 * 2 + 1]);

        let dp1 = glm.vec3.create(); glm.vec3.sub(dp1, p2, p1);
        let dp2 = glm.vec3.create(); glm.vec3.sub(dp2, p3, p1);

        let duv1 = glm.vec2.create(); glm.vec2.sub(duv1, uv2, uv1);
        let duv2 = glm.vec2.create(); glm.vec2.sub(duv2, uv3, uv1);

        let r = 1.0 / (duv1[0] * duv2[1] - duv1[1] * duv2[0]);

        let t = glm.vec3.fromValues(
            (dp1[0] * duv2[1] - dp2[0] * duv1[1]) * r,
            (dp1[1] * duv2[1] - dp2[1] * duv1[1]) * r,
            (dp1[2] * duv2[1] - dp2[2] * duv1[1]) * r
        );

        let t1 = glm.vec3.create(); glm.vec3.cross(t1, n1, t);
        let t2 = glm.vec3.create(); glm.vec3.cross(t2, n2, t);
        let t3 = glm.vec3.create(); glm.vec3.cross(t3, n3, t);

        tn[idx1 * 3 + 0] = t1[0];
        tn[idx1 * 3 + 1] = t1[1];
        tn[idx1 * 3 + 2] = t1[2];

        tn[idx2 * 3 + 0] = t2[0];
        tn[idx2 * 3 + 1] = t2[1];
        tn[idx2 * 3 + 2] = t2[2];

        tn[idx3 * 3 + 0] = t3[0];
        tn[idx3 * 3 + 1] = t3[1];
        tn[idx3 * 3 + 2] = t3[2];
    }

    // stats
    console.log(`Load ${url}: ${v.length} vertices, ${vt.length} texcoords, ${vn.length} normals ` +
                `${tn.length} tangents ${idx.length / 3} faces`);
    
    // vao
    land.vao = gl.createVertexArray();
    gl.bindVertexArray(land.vao);

    // vbo
    let positions = new Float32Array(v);
    let normals = new Float32Array(vn);
    let texcoords = new Float32Array(vt);
    let tangents = new Float32Array(tn);

    let vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, positions.byteLength + normals.byteLength + texcoords.byteLength + tangents.byteLength, gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions);
    gl.bufferSubData(gl.ARRAY_BUFFER, positions.byteLength, normals);
    gl.bufferSubData(gl.ARRAY_BUFFER, positions.byteLength + normals.byteLength, texcoords);
    gl.bufferSubData(gl.ARRAY_BUFFER, positions.byteLength + normals.byteLength + texcoords.byteLength, tangents);

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, positions.byteLength);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, positions.byteLength + normals.byteLength);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 0, positions.byteLength + normals.byteLength + texcoords.byteLength);
    gl.enableVertexAttribArray(3);


    // ebo
    let indices  = new Uint32Array(idx);
    let ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    land.indexCount = idx.length;
    
    // free array
    v.length = 0;
    vt.length = 0;
    vn.length = 0;
    idx.length = 0;
    tn.length = 0;

    gl.bindVertexArray(null);
    return true;
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = () => {
            resolve(img);
        };
        img.onerror = () => {
            reject(new Error(`Failed to load image's url: ${url}`));
        }
        img.src = url;
        img.crossOrigin = 'anonymous';
    });
}

async function loadAsset() {
    // // obj
    let ret = await loadObj('./asset/plane.obj');
    
    //load land texture todo
    let land_promises = [];
    land_promises.push(loadImage('./asset/grass_side.png'));//0
    land_promises.push(loadImage('./asset/grass_top.png'));//1
    land_promises.push(loadImage('./asset/sand.png'));//2
    land_promises.push(loadImage('./asset/grass_side_n.png'));//3
    land_promises.push(loadImage('./asset/grass_top_n.png'));//4
    land_promises.push(loadImage('./asset/sand_n.png'));//5
    let land_res = await Promise.all(land_promises);
    for (let i=0; i<6; i++) {
        land.tex[i] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, land.tex[i]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, land_res[i]);
            console.log(land_res[i]);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);//gl.REPEAT
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    land_res.length = 0;

    //load skybox
    let promises = [];
    promises.push(loadImage('./asset/face-r.png'));
    promises.push(loadImage('./asset/face-l.png'));
    promises.push(loadImage('./asset/face-t.png'));
    promises.push(loadImage('./asset/face-bot.png'));
    promises.push(loadImage('./asset/face-fr.png'));
    promises.push(loadImage('./asset/face-ba.png'));
    let results = await Promise.all(promises);
    let sky_tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, sky_tex);
    
    for (let i=0; i<6; i++) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 
            0, gl.RGBA,results[i].width, results[i].height,0, gl.RGBA, gl.UNSIGNED_BYTE, results[i]);
    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    skybox.vao = gl.createVertexArray();

    results.length = 0;

}

function render(delta, time) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    skybox_render();
    depth_render();
    ssao_render();
    test_render();
    land_render();
}

function test_render(){
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(test.program);

    gl.bindFramebuffer(gl.FRAMEBUFFER, test.fbo);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, ssao.depth_tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, ssao.norm_tex);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, ssao.noise_map);

    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, test.kernel_ubo);
    gl.uniform2fv(test.u_noise_scale, glm.vec2.fromValues(window.innerWidth/4, window.innerHeight/4));
    gl.uniformMatrix4fv(test.u_p, false, matrix.p);

    gl.bindVertexArray(test.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function ssao_render(){
    gl.enable(gl.DEPTH_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, ssao.fbo);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

    gl.enable(gl.POLYGON_OFFSET_FILL);
    //gl.polygonOffset(4, 4);

    gl.useProgram(ssao.program);
    gl.uniformMatrix4fv(ssao.u_v, false, matrix.v);
    gl.uniformMatrix4fv(ssao.u_p, false, matrix.p);
    rendervao('ssao');
    gl.disable(gl.POLYGON_OFFSET_FILL);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function depth_render(){
    gl.viewport(0, 0, depth_size, depth_size);
    gl.enable(gl.DEPTH_TEST);
   
    gl.useProgram(depth.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, depth.fbo);
    
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(4, 4);

    gl.uniformMatrix4fv(depth.u_vp, false, lightvp);//todo
    rendervao('depth');
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function land_render(){
    //todo
    gl.useProgram(land.landProg);
    gl.uniformMatrix4fv(land.u_v, false, matrix.v);
    gl.uniformMatrix4fv(land.u_p, false, matrix.p);

    gl.activeTexture(gl.TEXTURE0);//tex_top
    gl.bindTexture(gl.TEXTURE_2D, land.tex[1]);
    gl.activeTexture(gl.TEXTURE1);//tex_sand
    gl.bindTexture(gl.TEXTURE_2D, land.tex[2]);
    gl.activeTexture(gl.TEXTURE2);//tex_top_norm
    gl.bindTexture(gl.TEXTURE_2D, land.tex[4]);
    gl.activeTexture(gl.TEXTURE3);//tex_sand_norm
    gl.bindTexture(gl.TEXTURE_2D, land.tex[5]);
    gl.activeTexture(gl.TEXTURE4);//shadow
    gl.bindTexture(gl.TEXTURE_2D, depth.tex);
    gl.activeTexture(gl.TEXTURE5);//ao_tes
    gl.bindTexture(gl.TEXTURE_2D, test.ao_tex);
    //gl.bindTexture(gl.TEXTURE_2D, ssao.noise_map);    
    rendervao('land');

}
function deg2rad(x){
    return x * Math.PI / 180;
}
function rendervao(mode){
    let size = worldDepth * worldWidth;
    gl.bindVertexArray(land.vao);
    let r1 = glm.mat4.create();
    glm.mat4.fromXRotation(r1, deg2rad(0));
    let r2 = glm.mat4.create();
    glm.mat4.fromYRotation(r2, deg2rad(0));
    let tr = glm.mat4.create();
    glm.mat4.fromTranslation(tr, glm.vec3.fromValues(0, 0.5, 0));
    glm.mat4.multiply(land.trans, r1, r2);
    glm.mat4.multiply(land.trans, land.trans, tr);
    for(let j=0; j<5; j++){
        if(j===1){//front
            if(mode === 'land'){
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, land.tex[0]);
                gl.activeTexture(gl.TEXTURE2);
                gl.bindTexture(gl.TEXTURE_2D, land.tex[3]);
            }
            glm.mat4.fromXRotation(r2, deg2rad(90));
            glm.mat4.fromYRotation(r1, deg2rad(0));
            glm.mat4.fromTranslation(tr, glm.vec3.fromValues(0, 0, 0.5));
        }
        else if(j===2){//left
            glm.mat4.fromXRotation(r2, deg2rad(90));
            glm.mat4.fromYRotation(r1, deg2rad(-90));
            glm.mat4.fromTranslation(tr, glm.vec3.fromValues(-0.5, 0, 0));
        }
        else if(j===3){//back
            glm.mat4.fromXRotation(r2, deg2rad(90));
            glm.mat4.fromYRotation(r1, deg2rad(180));
            glm.mat4.fromTranslation(tr, glm.vec3.fromValues(0, 0, -0.5));
        }
        else if(j===4){//right
            glm.mat4.fromXRotation(r2, deg2rad(90));
            glm.mat4.fromYRotation(r1, deg2rad(90));
            glm.mat4.fromTranslation(tr, glm.vec3.fromValues(0.5, 0, 0));
        }
        glm.mat4.multiply(land.trans, tr, r1);
        glm.mat4.multiply(land.trans, land.trans, r2);
        
        let num = 300;
        if(mode === 'land'){
            gl.uniformMatrix4fv(land.u_trans, false, land.trans);
            for (let i = 0; i < size; i += 300) {
                if (i + 300 > size) num = size - i;
                gl.uniform3fv(land.u_offset, land.offset.subarray(i * 3));       
                gl.drawElementsInstanced(gl.TRIANGLES, land.indexCount,
                    gl.UNSIGNED_INT, 0, num);
            }
        }
        else if(mode === 'depth'){
            gl.uniformMatrix4fv(depth.u_trans, false, land.trans);
            for (let i = 0; i < size; i += 300) {
                if (i + 300 > size) num = size - i;
                gl.uniform3fv(depth.u_offset, land.offset.subarray(i * 3));         
                gl.drawElementsInstanced(gl.TRIANGLES, land.indexCount,
                    gl.UNSIGNED_INT, 0, num);
            }

        }
        else if(mode === 'ssao'){
            gl.uniformMatrix4fv(ssao.u_trans, false, land.trans);
            for (let i = 0; i < size; i += 300) {
                if (i + 300 > size) num = size - i;
                gl.uniform3fv(ssao.u_offset, land.offset.subarray(i * 3));       
                gl.drawElementsInstanced(gl.TRIANGLES, land.indexCount,
                    gl.UNSIGNED_INT, 0, num);
            }
        }
    
    }
}

function skybox_render(){
    gl.useProgram(skybox.program);

    // set uniform
    let pvm = glm.mat4.create();
    glm.mat4.multiply(pvm, matrix.p, matrix.v);
    gl.uniformMatrix4fv(skybox.u_pvm, false, pvm);

    // drawing command
    gl.bindVertexArray(skybox.vao);
    gl.disable(gl.DEPTH_TEST);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.enable(gl.DEPTH_TEST);

}

function trackball_update(type){
    let sp_vec = glm.vec3.fromValues( 0, trackball.speed, 0);//updown
    let fr_vec = glm.vec3.create();//frontback
    glm.vec3.scale(fr_vec, trackball.camFront, trackball.speed);
    let lr_vec = glm.vec3.create();//leftright
    glm.vec3.normalize(lr_vec, glm.vec3.cross(lr_vec, trackball.camFront, trackball.camUp));
    glm.vec3.scale(lr_vec, lr_vec, trackball.speed);
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
        let x = Math.cos(radians(trackball.y_pitch)) * Math.cos(radians(trackball.x_yaw));
        let y =Math.sin(radians(trackball.y_pitch));
        let z =  Math.cos(radians(trackball.y_pitch)) * Math.sin(radians(trackball.x_yaw));
        glm.vec3.set(trackball.lfront, x, y, z);
        
		glm.vec3.normalize(trackball.camFront, trackball.lfront);
    }
    let out = glm.vec3.create();
    glm.vec3.add(out,trackball.camPos ,trackball.camFront);
    glm.mat4.lookAt(matrix.v, trackball.camPos, out, trackball.camUp);
}

function radians(num){
    return  num * Math.PI / 180;
}

function animate(time) {
    if (!global.start) {
        global.start = time;
    }
    // in milliseconds
    let delta = time - global.start;
    global.start = time;

    stats.update();

    //trackball
    if(keyPress.on === true){
        trackball_update('Tpress');
    }
    if(mouse.down ===true){
        trackball_update('Tlook');
    }

    render(delta, time);

    window.requestAnimationFrame(animate);
}

window.onresize = () => {
    let canvas = document.querySelector('canvas');

    if (gl && canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        glm.mat4.perspective(matrix.p, radians(60), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000.0);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
}

window.onload = () => {
    initWebGL();
    createShader();
    loadAsset().then(() => {
        // rendering loop
        window.requestAnimationFrame(animate);
    });
}

