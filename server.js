var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use(express.static('client'));
app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);
console.log("Server started.");

var db = require('./db');
db.testConnection();

var SOCKET_LIST = {};
var interval = null;

// Entity class
var Entity = function () {
	var self = {
		id: "",
	}

	return self;
}

// Player class
var Player = function (param) {
	var self = Entity();
	self.id = param.id;
	self.player_id = param.player_id;
	self.name = param.name;
	self.level = param.level;
	self.current_exp = param.current_exp;
	self.max_exp = self.level * 200;
	self.coin = param.coin;
	self.last_login = param.last_login;

	Player.list[self.id] = self;
	return self;
}

Player.list = {};

Player.onConnect = function (socket, username) {
	db.queryPlayerByName(username)
		.then(results => {
			socket.emit('initPlayer', {
				status: Player({
					id: socket.id,
					player_id: results[0].player_id,
					name: results[0].name,
					level: results[0].level,
					current_exp: results[0].current_exp,
					max_exp: results[0].level * 200,
					coin: results[0].coin,
					last_login: results[0].last_login,
				})
			});
			db.updatePlayerLastLoginDate(results[0].player_id);
			console.log('User ' + results[0].name + ' logined');
		})
		.catch(err => {
			console.log(err);
		});

	socket.on('sendMsgToServer', function (data) {
		for (var i in SOCKET_LIST) {
			SOCKET_LIST[i].emit('addToChat', username + ': ' + data);
		}
	});
}

Player.onDisconnect = function (socket) {
	delete SOCKET_LIST[socket.id];
	delete Player.list[socket.id];
}

// Game class

var Game = function (player_id, stage_id) {
	var self = Entity();
	self.id = Math.random();
	self.player_id = player_id;
	self.stage_id = stage_id; //self.stage = Stage(stage_id);
	self.total_wave = 5; // select total wave from stage where stage id = 1
	self.current_wave = 1;
	self.enemy_max_hp = Math.floor(Math.random() * 5 + 5);
	self.enemy_current_hp = self.enemy_max_hp;
	self.player_max_hp = 10;
	self.player_current_hp = 10;
	self.timer = Timer();
	self.question = Game.initQuestion();
	self.score = 0;
	self.coin = 0;
	self.pet_list = {};

	Game.list[self.id] = self;
	return self;
}

Game.list = {};

Game.init = function (socket, player_id, stage_id) {

	var game = Game(player_id, stage_id);

	socket.emit('startGame', game);
}

Game.initQuestion = function () {
	return Question({
		question_id: 0,
		content: "",
		ans_a: 0,
		ans_b: 0,
		ans_c: 0,
		ans_d: 0,
		//correct_ans: 0,
	});
}

Game.updateQuestion = function (socket, data) {
	clearInterval(interval);
	data.timer.current_time = Timer.resetCurrent_Time(data.timer);

	db.randomQueryQuestionByStageId(data.stage_id)
		.then(function (result) {
			//console.log(result)
			data.question = Question(result);
			data.timer.current_time = Timer.resetCurrent_Time(data.timer);
			socket.emit('updateQuestionResponse', {
				question: data.question,
				current_time: data.timer.current_time,
			});
		});

	interval = setInterval(function () {
		if (data.timer.current_time !== data.timer.TIME_UP_TIME) {
			//console.log(data.timer.current_time)
			data.timer.current_time--;
			socket.emit('runTimerResponse', {
				current_time: data.timer.current_time,
				player_current_hp: data.player_current_hp,
				timeup: false,
			});

		} else if (data.timer.current_time === data.timer.TIME_UP_TIME) {
			data.timer.current_time = Timer.resetCurrent_Time(data.timer);
			data.player_current_hp--;
			socket.emit('runTimerResponse', {
				current_time: data.timer.current_time,
				player_current_hp: data.player_current_hp,
				timeup: true,
			});
			//console.log('Timer reseted2');
		}
	}, 1000);

}

// Question class
var Question = function (data) {
	var self = Entity();
	self.question_id = data.question_id;
	self.content = data.content;
	self.ans_list = {
		ans_a: data.ans_a,
		ans_b: data.ans_b,
		ans_c: data.ans_c,
		ans_d: data.ans_d,
		//correct_ans: data.correct_ans,
	};

	return self;
}

// Timer class
var Timer = function () {
	var self = Entity();
	self.TOTAL_TIME = 3;
	self.TIME_UP_TIME = 0;
	self.current_time = self.TOTAL_TIME;
	return self;
}

Timer.resetCurrent_Time = function (timer) {
	//TOTAL TIME = 3
	//TIME_UP_TIME = 0
	if (timer.current_time !== timer.TOTAL_TIME) { // current time != 3
		return timer.TOTAL_TIME;
	} else if (timer.current_time === timer.TIME_UP_TIME) { // current time = 0
		return timer.TOTAL_TIME;
	} else {
		return timer.TOTAL_TIME;
	}
}

// sign in
/*
var USERS = {
	//username:password
	"root": "root",
	"admin": "admin",
}
*/

var isValidPassword = function (data, cb) {
	db.isValidPassword({
			username: data.username,
			password: data.password
		})
		.then(results => {
			if (results[0].password == data.password)
				cb(true);
		})
		.catch(err => {
			cb(false);
		});
}

var isUsernameTaken = function (data, cb) {
	db.isUsernameTaken(data.username)
		.then(results => {
			if (results.length > 0)
				cb(true);
			else
				cb(false);
		})
		.catch(err => {
			cb(false);
		});
}
var addUser = function (data, cb) {
	db.addPlayer(data)
	cb();
}



// socket.io
var DEBUG = false;
var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
	console.log('socket connection');

	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	// chat   
	socket.on('evalServer', function (data) {
		if (!DEBUG)
			return;
		var res = eval(data);
		socket.emit('evalAnswer', res);
	});

	// sign
	socket.on('signIn', function (data) {
		isValidPassword(data, function (res) {
			if (res) {
				Player.onConnect(socket, data.username);
				socket.emit('signInResponse', {
					success: true
				});
			} else {
				socket.emit('signInResponse', {
					success: false
				});
			}
		});
	});

	socket.on('signUp', function (data) {
		isUsernameTaken(data, function (res) {
			if (res) {
				socket.emit('signUpResponse', {
					success: false
				});
			} else {
				addUser(data, function () {
					socket.emit('signUpResponse', {
						success: true
					});
				});
			}
		});
	});

	socket.on('disconnect', function () {
		Player.onDisconnect(socket);
	});

	// Player
	socket.on('updatePlayerStatus', function (player_status) {
		db.updatePlayerStatus(player_status)
		socket.emit('updatePlayerStatusResponse', player_status);
	});

	// Summon
	socket.on('summonPet', function() {
		db.summonPet()
		.then(results => {
			socket.emit('summonPetResponse', results);
		});
	});

	// PVE
	socket.on('initGame', function (data) {
		//console.log('player id: ' + data.player_id)
		//console.log('stage_id: ' + data.stage_id)
		console.log('Game initiation')
		Game.list[0] = Game.init(socket, data.player_id, data.stage_id);
	});

	socket.on('runTimer', function (data) {
		console.log('Start timer');
		clearInterval(interval);
		interval = setInterval(function () {
			if (data.timer.current_time !== data.timer.TIME_UP_TIME) {
				//console.log(data.timer.current_time)
				data.timer.current_time--;
				socket.emit('runTimerResponse', {
					current_time: data.timer.current_time,
					current_hp: data.player_current_hp,
					timeup: false,
				});

			} else if (data.timer.current_time === data.timer.TIME_UP_TIME) {
				
                //console.log(data)
				data.timer.current_time = Timer.resetCurrent_Time(data.timer);
				if(data.question.content !== "") {
					data.player_current_hp--;
				}
				socket.emit('runTimerResponse', {
					current_time: data.timer.current_time,
					player_current_hp: data.player_current_hp,
					timeup: true,
				});
				//console.log('Timer reseted1');
			}
		}, 1000);
	});

	socket.on('endTimer', () => {
		clearInterval(interval);
	})

	socket.on('updateQuestion', function (data) {
		Game.updateQuestion(socket, data);
	});

	// handling answer
	socket.on('checkAnswer', function (data) {
		data.game_status.timer.current_time = Timer.resetCurrent_Time(data.game_status.timer);
		Game.updateQuestion(socket, data.game_status); // update question

		//console.log(data.game_status);

		if (data.ans == 'gameDiv-ans_a') {
			data.game_status.enemy_current_hp--;
			data.game_status.score += data.game_status.timer.current_time * 100; // add score
			data.game_status.coin += Math.floor(Math.random() * 20 + 20); // add coin

			socket.emit('checkAnswerResponse', {
				enemy_current_hp: data.game_status.enemy_current_hp,
				score: data.game_status.score,
				coin: data.game_status.coin,
				correct: true,
			});

		} else {
			data.game_status.player_current_hp--;

			socket.emit('checkAnswerResponse', {
				player_current_hp: data.game_status.player_current_hp,
				correct: false,
			});
		}
	});

	socket.on('updateEnemyAndWave', function (data) {
		//if(data.current_wave === data.total_wave && data.)
		data.current_wave++;
		if (data.current_wave === data.total_wave) {
			socket.emit('gameClear', data);
		} else {
			data.enemy_max_hp = Math.floor(Math.random() * 5 + 5);
			data.enemy_current_hp = data.enemy_max_hp;
			socket.emit('updateEnemyAndWaveResponse', {
				current_wave: data.current_wave,
				enemy_max_hp: data.enemy_max_hp,
				enemy_current_hp: data.enemy_current_hp,
			});
		}
	});
});