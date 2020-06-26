import * as glm from 'gl-matrix';
//var gl = window.WebGL2RenderingContext.prototype; // specify type for code snippet

export var Program = function(vsSrc, fsSrc,gl){
        ///////////////////////////
    
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
        this.ID = gl.createProgram();
        gl.attachShader(this.ID, vs);
        gl.attachShader(this.ID, fs);
        gl.linkProgram(this.ID);
    
        if (!gl.getProgramParameter(this.ID, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(this.ID));
        }
    
    

    this.getID = function(){ return this.ID; };
	this.useProg = function(){ gl.useProgram(this.ID); };
	this.unuseProg = function(){ };//gl.useProgram(0); 
	
    this.setBool = function(name, value)
    {
        gl.uniform1i(gl.getUniformLocation(this.ID, name), value);
    };
    this.setMat4 = function(name, mat) 
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(this.ID, name),false, mat);
        
    };
    // void setInt(const std::string &name, int value) const
    // {
    //     glUniform1i(glGetUniformLocation(ID, name.c_str()), value);
    // }
    // void setFloat(const std::string &name, float value) const
    // {
    //     glUniform1f(glGetUniformLocation(ID, name.c_str()), value);
    // }
    // void setVec2(const std::string &name, const glm::vec2 &vec) const
    // {
    //     glUniform2fv(glGetUniformLocation(ID, name.c_str()), 1, &vec[0]);
    // }
    // void setVec2(const std::string &name, float x, float y) const
    // {
    //     glUniform2f(glGetUniformLocation(ID, name.c_str()), x, y);
    // }
    // void setVec3(const std::string &name, const glm::vec3 &vec) const
    // {
    //     glUniform3fv(glGetUniformLocation(ID, name.c_str()), 1, &vec[0]);
    // }
    // void setVec3(const std::string &name, float x, float y, float z) const
    // {
    //     glUniform3f(glGetUniformLocation(ID, name.c_str()), x, y, z);
    // }
    // void setVec4(const std::string &name, const glm::vec4 &vec) const
    // {
    //     glUniform4fv(glGetUniformLocation(ID, name.c_str()), 1, &vec[0]);
    // }
    // void setVec4(const std::string &name, float x, float y, float z, float w)
    // {
    //     glUniform4f(glGetUniformLocation(ID, name.c_str()), x, y, z, w);
    // }
    // void setMat2(const std::string &name, const glm::mat2 &mat) const
    // {
    //     glUniformMatrix2fv(glGetUniformLocation(ID, name.c_str()), 1, GL_FALSE, &mat[0][0]);
    // }
    // void setMat3(const std::string &name, const glm::mat3 &mat) const
    // {
    //     glUniformMatrix3fv(glGetUniformLocation(ID, name.c_str()), 1, GL_FALSE, &mat[0][0]);
    // }
    // void setMat4(const std::string &name, const glm::mat4 &mat) const
    // {
    //     glUniformMatrix4fv(glGetUniformLocation(ID, name.c_str()), 1, GL_FALSE, &mat[0][0]);
    // }
	// void setVec3Array(const std::string &name, const glm::vec3 &vec, const int num) const
	// {
	// 	glUniform3fv(glGetUniformLocation(ID, name.c_str()), num, &vec[0]);
	// 	//glUniform3fv(offset_gluint, trees_arr[tree_id].num, value_ptr(trees_arr[tree_id].position[0]));
	// }
	
}
