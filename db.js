var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'finalyearproject.ciuvmz7j1xtl.ap-northeast-1.rds.amazonaws.com',
  user: 'root',
  password: 'rootroot',
  database: 'FinalYearProject'
});

// sign in
var isValidPassword = data => {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT * FROM Player WHERE name = '" + data.username + "' AND password = '" + data.password + "'",
      (err, rows) => {
        //console.log(rows);
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

var isUsernameTaken = data => {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT name FROM Player WHERE name = '" + data + "'",
      (err, rows) => {
        //console.log(rows);
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

// sign up
var addPlayer = (data) => {
  var last_login = getCurrentDate();
  var ranNum = Math.floor(Math.random() * 100);
  connection.query("INSERT INTO Player (player_id, name, password, level, current_exp, coin, last_login) VALUES (" + ranNum + ", '" + data.username + "', '" + data.password + "', 1, 0, 100, '" + last_login + "')", function (err, results) {
    if (err) throw err;
    console.log(data.username + ' inserted');
    console.log('Rows affected:', results.affectedRows);
  });
};

var updatePlayerLastLoginDate = (player_id) => {
  var last_login = getCurrentDate();
  connection.query("UPDATE Player SET last_login = '" + last_login + "' WHERE player_id = " + player_id, function (err, results) {
    if (err) throw err;
    console.log('Rows affected:', results.affectedRows);
  });
};

// init player
var queryPlayerByName = data => {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT * FROM Player WHERE name = '" + data + "'",
      (err, rows) => {
        //console.log(rows);
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

// summon
var summonPet = () => {
  var rarity = getRarity();
  //console.log(rarity);
  return new Promise((resolve, reject) => {
    connection.query("select * from Pet where rarity = " + rarity + " order by rand() limit 1", function (err, rows, fields) {
      if (err) reject(err);
      else resolve({
        pet_id: rows[0].pet_id,
        name: rows[0].name,
        rarity: rows[0].rarity,
        max_hp: rows[0].max_hp,
        max_level: rows[0].max_level,
        skill_id: rows[0].skill_id,
      });
    });
  });
}


// update question
var randomQueryQuestionByStageId = (data) => {
  return new Promise((resolve, reject) => {
    connection.query(
      "select * from Question where stage_id = " + data + " order by rand() limit 1",
      (err, rows, fields) => {
        //console.log(rows[0])
        if (err) reject(err);
        else resolve({
          qusetion_id: rows[0].question_id,
          module_id: rows[0].module_id,
          stage_id: rows[0].stage_id,
          content: rows[0].content,
          ans_a: rows[0].ans_a,
          ans_b: rows[0].ans_b,
          ans_c: rows[0].ans_c,
          ans_d: rows[0].ans_d,
          corrent_ans: rows[0].correct_ans,
        });
      }
    );
  });
};

// game clear
var updatePlayerStatus = (data) => {
  connection.query("UPDATE Player SET level = " + data.level + ", current_exp = " + data.current_exp + ", coin = " + data.coin + " WHERE player_id = " + data.player_id, function (err, results) {
    if (err) throw err;
    console.log(data.name + ' updated')
    console.log('Rows affected:', results.affectedRows);
  });
};

var getCurrentDate = () => {
  var d = new Date();
  var month = '' + (d.getMonth() + 1);
  var day = '' + d.getDate();
  var year = d.getFullYear();
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

var getRarity = () => {
  var ranNum = Math.floor(Math.random() * 100);
  if (ranNum === 0) {
    getRarity();
  } else if (ranNum < 10) {
    return 3;
  } else if (ranNum < 40) {
    return 2;
  } else {
    return 1;
  }
}

module.exports = {
  test: function () {
    connection.connect((err) => {
      if (err) throw err;

      connection.query("SELECT * FROM Pet", function (err, result) {
        if (err) throw err;

        console.log(result);

        result.forEach(function (element) {
          console.log(element.name);
        });
      });
    });
  },

  testConnection: function () {
    connection.connect((err) => {
      if (err) throw err;
      console.log("Database connected")
    });
  },

  isValidPassword: isValidPassword,
  isUsernameTaken: isUsernameTaken,
  queryPlayerByName: queryPlayerByName,
  randomQueryQuestionByStageId: randomQueryQuestionByStageId,
  updatePlayerStatus: updatePlayerStatus,
  addPlayer: addPlayer,
  updatePlayerLastLoginDate: updatePlayerLastLoginDate,
  summonPet: summonPet,
}