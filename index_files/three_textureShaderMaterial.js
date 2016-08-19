
var textureShaderImage = THREE.ImageUtils.loadTexture('data/2dir_128.bmp');
textureShaderImage.wrapS = textureShaderImage.wrapT = THREE.RepeatWrapping;

var three_textureShadermaterial = function (scale) {
    var texture = textureShaderImage;

    var vertexShader = document.getElementById('vertexShader2').text;
    var fragmentShader = document.getElementById('fragmentShader2').text;
    var shaderUniforms = {
        transExp: { type: "f", value: 5.0, min: 0, max: 100 },
        textureImage: { type: 't', value: texture },
        textureScale2: { type: 'f', value: scale },
    };
    var mat = new THREE.ShaderMaterial({
        uniforms: shaderUniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.FrontSide,
        depthWrite: true
    });
    return mat;
}