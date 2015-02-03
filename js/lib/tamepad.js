define(
[],
function() {


var browserGamepads;
var gamepads = {};
var gamepadTypes = ["Xbox 360"];
var connectMethod;


function addGamepad(gamepad) {
	for (var lcv = 0; lcv < gamepadTypes.length; lcv++) {
		if (gamepad.id.toLowerCase().indexOf(gamepadTypes[lcv].toLowerCase()) !== -1) {
			// Modify Gamepad object
			gamepad.type = gamepadTypes[lcv];
		}
	}
	if (!gamepad.type) { gamepad.type = "default"; }
	
	gamepads[gamepad.index] = gamepad;
	console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
	gamepad.index, gamepad.id,
	gamepad.buttons.length, gamepad.axes.length);
	
	console.log(gamepads);
}

function removeGamepad(gamepad) {
	delete gamepads[gamepad.index];
}

function connectHandler(e) {
	addGamepad(e.gamepad);
}

function disconnectHandler(e) {
	removeGamepad(e.gamepad);
}

function scanGamepads() {
	browserGamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
	for (var i = 0; i < browserGamepads.length; i++) {
		if (browserGamepads[i]) {
			if (!(browserGamepads[i].index in gamepads)) {
				addGamepad(browserGamepads[i]);
			} else {
				gamepads[browserGamepads[i].index] = browserGamepads[i];
			}
		}
	}
}

function setupGamepadSupport() {
	// Chrome doesn't implement Gamepad events (yet?).
	connectMethod = (navigator.webkitGetGamepads) ? "poll" : "event";
	
	if (connectMethod === "event") {
		window.addEventListener("gamepadconnected", connectHandler);
		window.addEventListener("gamepaddisconnected", disconnectHandler);
	}
}

function updateGamepads() {
	if (connectMethod === "poll") {
		scanGamepads();
	}
}

	
/** @private
 * Start listening for gamepads.
 */


setupGamepadSupport();


var Tamepad = function () {
	
	this.inputMap = {
		"default": {
			"joysticks": {
				"left" : { x: 0, y: 1 },
				"right": { x: 2, y: 3 }
			}
		},
		"Xbox 360": {
			"joysticks": {
				"left" : { x: 0, y: 1 },
				"right": { x: 2, y: 3 }
			}
		}
	};
	
	// Account for inputs that are mapped incorrectly by the browser.
	if (navigator.userAgent.indexOf('Firefox') !== -1) {
		this.inputMap["Xbox 360"].joysticks = {
			"left" : { x: 1, y: 0 },
			"right": { x: 3, y: 2 }
		};
	}
	
	scanGamepads();
	
	// TODO: Register gamepad index with this Tamepad instance.
	this.gamepad = gamepads[0]; // Debug: hardocded to first gamepad.
	
	this.buttonsPressedWithoutRepeat = {};
};

Tamepad.prototype.update = function() {
	for (var btnKey in this.buttonsPressedWithoutRepeat) {
		if (!this.pressed(Number(btnKey))) {
			delete this.buttonsPressedWithoutRepeat[btnKey];
		}
	}
};

Tamepad.prototype.pressed = function(button) {
	updateGamepads();
	if (typeof(this.gamepad.buttons[button]) == "object") {
		return this.gamepad.buttons[button].pressed;
	}
	return this.gamepad.buttons[button] == 1.0;
};

Tamepad.prototype.pressedWithoutRepeat = function(button) {
	// False if not pressed currently.
	if (!this.pressed(button)) {
		return false; 
	}
	// False if already in hash of pressed buttons.
	if (this.buttonsPressedWithoutRepeat[button]) {
		return false;
	}
	this.buttonsPressedWithoutRepeat[button] = true;
	return true;
};

Tamepad.prototype.readJoystick = function(joystick) {
	updateGamepads();
	var mappings = this.inputMap[this.gamepad.type].joysticks[joystick];
	var analogX = this.gamepad.axes[mappings.x];
	var analogY = this.gamepad.axes[mappings.y];
	
	var angle = Math.atan2(analogX, analogY);
	var magnitude = Math.sqrt(analogX*analogX+analogY*analogY);
	
	return {
		analogX: analogX,
		analogY: analogY,
		angle: angle,
		magnitude: magnitude
	};
};

Tamepad.prototype.gamepads = gamepads;

return Tamepad;
});