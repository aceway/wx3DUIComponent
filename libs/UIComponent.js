/*************************************************************************
 * File Name: UIComponent.js
 *
 *       Author: h53d
 *         Mail: h53d@qq.com
 *  Description: UIComponent
 *
 ************************************************************************
*/
'use strict';
let THREE = require('./three.min.js');
import CFG  from '../config/base.js';

let f_btnIdx = 0;
function Button(option, container) {
	this.opt = {};
	Object.assign(this.opt, option);
	if (typeof this.opt.id === 'undefined') {
		this.opt.id = "" + f_btnIdx;
		f_btnIdx++;
	}
	else{
		this.opt.id = "" + this.opt.id;
	}

	if (this.opt.id.indexOf('button_') !== 0){
		this.opt.id = `button_${this.opt.id}`;
	}

	//console.log('newed button opt: ', this.opt);
	this.container = container;
	this.opt.show = !!this.opt.show;
	this._enable = this.opt.show;
	this._changed = true;
	this.origin_font = this.opt.font;
	this.origin_style = this.opt.style;
};

Button.prototype.constructor = Button;

Button.prototype.setSelectedStatus = function() {
	this.opt.font = "italic bold 24px arial";
	this.opt.style = 'rgba(255, 0, 0, 1)';
	this._update();
}

Button.prototype.clearSelectedStatus = function() {
	this.opt.font = this.origin_font;
	this.opt.style = this.origin_style;
	this._update();
}

Button.prototype.createUI = function() {
	let self = this;
	this.labelCanvas  = document.createElement('canvas');
	this.labelContext = this.labelCanvas.getContext('2d');
	this.labelContext.font = this.opt.font || '24px Arial';
  this.labelContext.fillStyle = this.opt.style || 'rgba( 255, 0, 0, 1 )';
	
  this.labelCanvas.width = this.opt.width;
	this.labelCanvas.height = this.opt.height;

	if (!this.opt.transparent) {
		// 不透明背景
  	this.labelContext.fillStyle = this.opt.bgStyle || 'rgba(190, 190, 190, 0.8)';
		this.labelContext.fillRect(0, 0, this.labelCanvas.width, this.labelCanvas.height);
	}

	if (this.opt.image){
		// 单一图片，配置图片位置
		if (this.opt.imageObj){
			this.image = this.opt.imageObj;
			this.labelContext.drawImage(this.image,
																	0, 0,
																	this.image.width, this.image.height,
																	0, 0,
																	this.opt.width, this.opt.height);
			this.bg_drawed = true;
		}
		else{
			this.image = new wx.createImage();
			this.image.src = this.opt.image;
			this.image.onload = ()=>{
				self.opt.imageObj = self.image;
				self.labelContext.drawImage(self.image,
																		0, 0,
																		self.image.width, self.image.height,
																		0, 0,
																		//self.opt.x, self.opt.y, 
																		self.opt.width, self.opt.height);
				self.bg_drawed = true;
			};
		}
	}
	else if (this.opt.images && this.opt.images.url){
		// 复合图片，配置图片参数
		if (CFG.IMG_ASSET.misc.url == this.opt.images.url && CFG.IMG_ASSET.misc.images){
			this.images = CFG.IMG_ASSET.misc.images;
			this.labelContext.drawImage(this.images, 
																	this.opt.images.x, this.opt.images.y,
																	this.opt.images.width, this.opt.images.height, 
																	0, 0,
																	//self.opt.x, self.opt.y, 
																	this.opt.width, this.opt.height); 
			this.bg_drawed = true;
		}
		else{
			this.images = new wx.createImage();
			this.images.src = this.opt.images.url;
			this.images.onload = ()=>{
				self.labelContext.drawImage(self.images, 
																		self.opt.images.x, self.opt.images.y,
																		self.opt.images.width, self.opt.images.height, 
																		0, 0,
																		//self.opt.x, self.opt.y, 
																		self.opt.width, self.opt.height); 
				self.bg_drawed = true;
			};
		}
	}
	
	if (this.opt.text){
		let wPad = this.opt.wPad || this.opt.pad || 0;
		let hPad = this.opt.hPad || this.opt.pad || 0;
  	this.labelContext.fillText(this.opt.text, wPad, this.opt.height - hPad);
	}

	// 以上面的二维文字为基础创建纹理...
	this.labelTexture = new THREE.Texture( this.labelCanvas );
	this.labelTexture.magFilter = THREE.LinearFilter;
	this.labelTexture.minFilter = THREE.LinearFilter;
	this.labelTexture.needsUpdate = true;

	// 创建 3D 对象, 添加到 HUD 空间
	let labelMaterial = new THREE.MeshBasicMaterial( { map: this.labelTexture, transparent: true, opacity: this.opt.opacity || 0.80, color: 0xffffff} );
	let labelPlane = new THREE.PlaneBufferGeometry( this.labelCanvas.width, this.labelCanvas.height );
	this.labelMesh = new THREE.Mesh( labelPlane, labelMaterial );

	if (this.opt.show){
		this.container.scene.add( this.labelMesh );
	}

	this.id = this.labelMesh.id;

	this.orig_x = this.opt.x || 0;
	this.orig_y = this.opt.y || 0;
	this.orig_w = this.opt.width || window.innerWidth;
	this.orig_h = this.opt.height || window.innerHeight;
	this.labelMesh.position.set( - window.innerWidth / 2 + this.orig_w / 2 + this.orig_x,
                     					  window.innerHeight / 2 - this.orig_h / 2 - this.orig_y, 0 );
	this.prev_x = this.orig_x;
	this.prev_y = this.orig_y;
	this.prev_w = this.orig_w;
	this.prev_h = this.orig_h;
};

Button.prototype._update = function(){
	this.update(this.opt.text, this.opt.font, this.opt.style, this.opt.valign, this.opt.halign);
}

Button.prototype.update = function(new_text, new_font, new_style, valign, halign, transparent){
	let self = this;
	// 默认字体
	let text = new_text === undefined ? this.opt.text + "" : new_text + "";
	this.labelContext.font = new_font || this.opt.font || this.container.font;
	this.labelContext.fillStyle = new_style || this.opt.style || this.container.style;
	const usedV = valign || this.opt.valign || this.container.valign;
	const usedH = halign || this.opt.halign || this.container.halign;
	const trans = transparent || this.opt.transparent;

  this.labelContext.clearRect(0, 0, this.labelCanvas.width, this.labelCanvas.height);
	if (!trans) {
		// 不透明背景
  	this.labelContext.fillStyle = this.opt.bgStyle || 'rgba(190, 190, 190, 0.6)';
		this.labelContext.fillRect(0, 0, this.labelCanvas.width, this.labelCanvas.height);
	}

	// 背景图片
	if (this.image && this.image.width){
		// 单一图片，配置图片位置
		if (this.bg_drawed){
			this.labelContext.drawImage(this.image,
																	0, 0,
																	this.image.width, this.image.height,
																	0, 0,
																	this.opt.width, this.opt.height);
		}
		else{
			setTimeout(()=>{
				self.labelContext.drawImage(self.image,
																		0, 0,
																		self.image.width, self.image.height,
																		0, 0,
																		self.opt.width, self.opt.height);
			}, 90);
		}
	}
	else if (this.images && this.images.width){
		if (this.bg_drawed){
			this.labelContext.drawImage(this.images,
															this.opt.images.x, this.opt.images.y,
															this.opt.images.width, this.opt.images.height,
															0, 0,
															//this.opt.x, this.opt.y, 
															this.opt.width, this.opt.height);
		}
		else{
			setTimeout(()=>{
				self.labelContext.drawImage(self.images,
																self.opt.images.x, self.opt.images.y,
																self.opt.images.width, self.opt.images.height,
																0, 0,
																//self.opt.x, self.opt.y, 
																self.opt.width, self.opt.height);
			}, 90);
		}
	}

	let wPad = this.opt.wPad || this.opt.pad || 0;
	let hPad = this.opt.hPad || this.opt.pad || 0;

	let xPos = wPad;
	let yPos = this.opt.height - hPad;

	let txtList = [];
	const idx = text.indexOf('\n');
	if (0 < idx &&  idx < text.length - 1 ){
		txtList = text.split("\n");
	}
	else{
		txtList.push(text);
	}

	const cnt = txtList.length;
	this.opt.text_height = this.labelCanvas.height / cnt ;
	for(let i = 0; i < txtList.length; i++){
		const txt = txtList[i];
		if (usedH === 'center'){
			const txt_width = this.labelContext.measureText(txt)
													? this.labelContext.measureText(txt).width
													: this.labelCanvas.width / 32;
			xPos = this.labelCanvas.width / 2 - txt_width / 2;
			if (xPos <= 0) xPos = 2;
		}

		if (usedV === 'top'){
			yPos = hPad + i * this.opt.text_height + this.opt.text_height/2;
		}
		else if (usedV === 'bottom'){
			yPos = this.opt.height - (cnt - i) * this.opt.text_height / 2;
		}
		else{ // center
			yPos = hPad + this.opt.text_height/2 + i * this.opt.text_height;
		}
		this.labelContext.fillText(txt, xPos,  yPos, this.labelCanvas.width);
	}

	let x = this.opt.x;
	let y = this.opt.y;
	let w = this.opt.width;
	let h = this.opt.height;
	if (x === this.opt.x && y === this.opt.y && 
			w === this.opt.width && h === this.opt.height ){
		// do nothing
	}
	else{
		this.labelMesh.position.set( - window.innerWidth / 2 + w / 2 + x,
		                   			 			window.innerHeight / 2 - h / 2 - y, 0 );
	}

	this.labelTexture.needsUpdate = true;

	if (new_text !== undefined){
		this.opt.text = text;
	}
	this.opt.font = this.labelContext.font;
	this.opt.style = this.labelContext.fillStyle;
	this.opt.valign = usedV;
	this.opt.halign = usedH;

	this._changed = true;
};

Button.prototype.hitTest = function(touch){
	let self = this;
	//console.warn('Button.hitTest ...');
	if (!this._enable) return false;

	this.container.mouse.x = ( touch.clientX / window.innerWidth ) * 2 - 1;
	this.container.mouse.y = - ( touch.clientY / window.innerHeight ) * 2 + 1;
	this.container.raycaster.setFromCamera( this.container.mouse, this.container.camera );
	let intersects = this.container.raycaster.intersectObjects( this.container.scene.children );
	if ( intersects.length > 0 && intersects[0].object && this.opt.enableHit) {
		for(let i = 0; i < intersects.length; i++){
			let hittedObj = intersects[i].object;
			if (hittedObj && hittedObj.id === this.id && typeof this.opt.hittedCB === 'function') {
				//console.warn('hittedObj.uuid: ', hittedObj.uuid, ', this.leabelMesh.uuid: ', this.labelMesh.uuid);
				this.opt.hittedCB(touch, this.container.mouse, hittedObj, self);
				return true;
			}
		}
	}
	return false;
};

Button.prototype.hide = function(){
	this.disable();
	if (!this.opt.show) return;
	this.opt.show = false;
  this.container.scene.remove(this.labelMesh);
  this.labelMesh.needsUpdate = true;
};
Button.prototype.show = function(){
	this.enable();
	if (this.opt.show) {
  	this.labelMesh.needsUpdate = true;
		return;
	}
	this.opt.show = true;
  this.container.scene.add(this.labelMesh);
  this.labelMesh.needsUpdate = true;
};

Button.prototype.enable = function(){
	this._enable = true;
	return true;
};

Button.prototype.disable = function(){
	this._enable = false;
	return false;
}

THREE.UIComponent = function (option) {
	this.buttons = {};
	this.option = {};
	Object.assign(this.option, option);
	//console.log("new UIComponent: ", this.option);
	this.x = (this.option && this.option.x) ? this.option.x : 0;		// 加入控件默认位置
	this.y = (this.option && this.option.y) ? this.option.y : 0;		// 加入控件默认位置
	this.width = (this.option && this.option.width) ? this.option.width : window.innerWidth/20;			// 加入控件默认宽度
	this.height = (this.option && this.option.height) ? this.option.height : window.innerHeight/10;		// 加入控件默认高度
	this.style = (this.option && this.option.style) ? this.option.style : 'rgba(255, 0, 0, 0.6)';		// 加入控件默认位置
	this.font = (this.option && this.option.font) ? this.option.font : '24px Arial';		// 加入控件默认位置

	this.mouse = new THREE.Vector2(), 
	this.userAutoClearSetting = false;
	this.raycaster = new THREE.Raycaster();
	this.camera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, 
																						window.innerHeight / 2, window.innerHeight / - 2, 
																						0, 30 );
	this.camera.position.set( 0, 0, 30 );
  //this.camera.lookAt(0, 0, 0);
	this.scene = new THREE.Scene();
};

THREE.UIComponent.prototype.constructor = THREE.UIComponent;

THREE.UIComponent.prototype.updateForWindowResize = function () {
	this.camera.left  = window.innerWidth / - 2;
	this.camera.right = window.innerWidth / 2;
	this.camera.top   = window.innerHeight / 2;
	this.camera.bottom= window.innerHeight / - 2;
	this.camera.updateProjectionMatrix();
	this.resetPosition();
};

THREE.UIComponent.prototype.hitButtonTest = function(touches) {
	let self = this;
  if (touches.length > 0) {
		let tch = touches[0];
    if (tch.clientX === undefined) tch.clientX = tch.screenX;
    if (tch.clientY === undefined) tch.clientY = tch.screenY;

		for (let k in this.buttons){
			if (this.buttons[k] && this.buttons[k].enableHit && this.buttons[k].hitTest(tch) ) {
				return this.buttons[k];
			}
		}
	}
	return null;
}

THREE.UIComponent.prototype.setPosition = function(x, y) {
};

THREE.UIComponent.prototype.setSize = function(width, height) {
};

THREE.UIComponent.prototype.resetPosition = function() {
};

THREE.UIComponent.prototype.render = function ( renderer ) {
	this.userAutoClearSetting = renderer.autoClear;
	renderer.autoClear = false; // To allow render overlay
	renderer.clearDepth();
	for(let k in this.buttons){
		if (this.buttons[k] && this.buttons[k]._changed){
			this.buttons[k]._update();
			this.buttons[k]._changed = false;
		}
	}

	renderer.render( this.scene, this.camera );
	renderer.autoClear = this.userAutoClearSetting;	//Restore user's setting
};

let f_comIdx = 0;
THREE.UIComponent.prototype.addButton = function(option) {
	let btn = new Button(option, this);
	btn.createUI();
	setTimeout(()=>{
		btn.update();
	}, 15);
	btn.enableHit = option.enableHit;
	this.buttons[btn.opt.id] = btn;
	return btn;
};

THREE.UIComponent.prototype.getButtonByOptId = function(id) {
	id = "" + id;
	if (id.indexOf('button_') === 0){
		return this.buttons[id];
	}
	else{
		id = `button_${id}`;
		return this.buttons[id];
	}
};
