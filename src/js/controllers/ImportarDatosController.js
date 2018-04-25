app.controller('importarDatosController', function ($scope, $window) {
  var user = firebase.auth().currentUser;
  if (!user) {
    console.log("No login");
    //$window.location.href = '/'; //Online si funciona, en local no
  }
  var pacientes;
  $scope.pacientes = "";
  $scope.files = "";

})

function conversorJSON(csv, name) {

  var lines = csv.split("\n");
  name = name.split(".")[0];

  var data = {
    "geometries": [{
      "type": "Geometry",
      "uuid": "1",
      "data": {
        "animation": {
          "hierarchy": [],
          "length": 60,
          "fps": 30,
          "name": "walk"
        },
        "vertices": [-82.7588, 154.066, -6.12887, -82.4492, 153.856, -6.05159, -82.5568, 153.55, -5.68828, -82.9916, 153.713, -5.733, -83.0922, 154.039, -5.67994, -82.8739, 154.303, -5.97822, -83.7348, 154.092, -10.7645, -83.4159, 153.748, -10.9466, -84.1249, 153.161, -10.8895, -84.3922, 153.437, -10.739, -83.1504, 153.246, -10.6588, -83.7342, 152.875, -10.6539, -83.8577, 153.93, -9.34014, -83.8306, 153.975, -9.4925, -84.5083, 153.483, -9.84134, -84.5206, 153.327, -9.73692, -83.6265, 153.585, -9.21763, -84.3616, 152.99, -9.6934, -84.0368, 152.744, -9.81219, -83.3608, 153.033, -9.50074, -83.1543, 152.956, -10.0532, -83.9684, 152.642, -10.2795, -84.5083, 152.804, -10.3972, -84.6568, 153.153, -10.3434, -9.08298, 173.212, -0.912411],
        "normals": [],
        "bones": [{
          "parent": -1,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "0_Spine_Base"
        }, {
          "parent": 0,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "1_Spine_Mid"
        }, {
          "parent": 20,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "2_Neck"
        }, {
          "parent": 2,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "3_Head"
        }, {
          "parent": 20,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "4_Shoulder_L"
        }, {
          "parent": 4,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "5_Elbow_L"
        }, {
          "parent": 5,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "6_Wrist_L"
        }, {
          "parent": 6,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "7_Hand_L"
        }, {
          "parent": 20,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "8_Shoulder_R"
        }, {
          "parent": 8,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "9_Elbow_R"
        }, {
          "parent": 9,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "10_Wrist_R"
        }, {
          "parent": 10,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "11_Hand_R"
        }, {
          "parent": 0,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "12_Hip_L"
        }, {
          "parent": 12,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "13_Knee_L"
        }, {
          "parent": 13,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "14_Ankle_L"
        }, {
          "parent": 14,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "15_Foot_L"
        }, {
          "parent": 0,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "16_Hip_R"
        }, {
          "parent": 16,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "17_Knee_R"
        }, {
          "parent": 17,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "18_Ankle_R"
        }, {
          "parent": 18,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "19_Foot_R"
        }, {
          "parent": 1,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "20_Spine_Shoulder"
        }, {
          "parent": 7,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "21_Hand_Tip_L"
        }, {
          "parent": 7,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "22_Thumb_L"
        }, {
          "parent": 11,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "23_Hand_Tip_R"
        }, {
          "parent": 11,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "24_Thumb_R"
        }],
        "faces": []
      }
    }],
    "metadata": {
      "type": "Object"
    },
    "object": {
      "children": [{
        "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        "visible": false,
        "type": "Mesh",
        "castShadow": true,
        "receiveShadow": true,
        "geometry": "1"
      }],
      "type": "Scene",
      "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    }
  };

  var horaInicio = new Date();
  horaInicio.setHours(0, 0, 0);
  var jointKeys;
  jointKeys = new Array(25);
  for (var l = 0; l < jointKeys.length; l++) { //inicializar subarrays
    jointKeys[l] = [];
  }

  var tiempoFormatoHora;
  var tiempo;
  for (var i = 1; i < lines.length - 1; i++) {
    var headersline = lines[0].split(";");
    var currentline = lines[i].split(";");

    tiempoFormatoHora = currentline[0].split(":");
    if(tiempoFormatoHora[1] >= 1){
      tiempo = parseFloat(tiempoFormatoHora[2]) + (60*parseFloat(tiempoFormatoHora[1]));
    }else {
      tiempo = parseFloat(tiempoFormatoHora[2]);
    }

    //Eliminar las dos primeras columas: tiempo y hora
    currentline.splice(0, 2);
    headersline.splice(0, 2);

    var c = 0;
    while (currentline.length > 8) {
      var currentJointData = currentline.splice(0, 4);//Tomamos cada una de las articulaciones y las vamos añadiendo al JSON de una en una
      if (currentJointData[1] !== "-" && currentJointData[2] !== "-" || currentJointData[3] !== "-") {
        if (c === 0) {//Si es la articulación raiz
          jointKeys[c].push({
            pos: [parseFloat(currentJointData[1].replace(",", ".")), parseFloat(currentJointData[2].replace(",", ".")), parseFloat(currentJointData[3].replace(",", "."))],
            time: tiempo,
            scl: [50, 50, 50],
            inf: parseInt(currentJointData[0])
          });
        } else {
          jointKeys[c].push({
            pos: [parseFloat(currentJointData[1].replace(",", ".")), parseFloat(currentJointData[2].replace(",", ".")), parseFloat(currentJointData[3].replace(",", "."))],
            time: tiempo,
            scl: [1, 1, 1],
            inf: parseInt(currentJointData[0])
          });
        }
      } else {
        if (c === 0) {
          jointKeys[c].push({
            pos: [0, 0, 0],
            time: tiempo,
            scl: [50, 50, 50],
            inf: 0
          });
        } else {
          jointKeys[c].push({
            pos: [0, 0, 0],
            time: tiempo,
            scl: [1, 1, 1],
            inf: 0
          });
        }
      }
      c++;
    }
    data.geometries[0].data.animation.length = tiempo;
  }

  for (var i = 0; i < jointKeys.length; i++) {
    hierarchyData = {
      "parent": i,
      "keys": jointKeys[i]
    };
    data.geometries[0].data.animation.hierarchy.push(hierarchyData);
  }
  // console.log(JSON.stringify(data));
  download(JSON.stringify(data), name + '.json', 'text/json');
  // return JSON.stringify(result); //JSON
}

function conversorJSONReferenciaCamara(csv, name) {

  var lines = csv.split("\n");
  name = name.split(".")[0];

  var data = {
    "geometries": [{
      "type": "Geometry",
      "uuid": "1",
      "data": {
        "animation": {
          "hierarchy": [],
          "length": 60,
          "fps": 30,
          "name": "walk"
        },
        "vertices": [-82.7588, 154.066, -6.12887, -82.4492, 153.856, -6.05159, -82.5568, 153.55, -5.68828, -82.9916, 153.713, -5.733, -83.0922, 154.039, -5.67994, -82.8739, 154.303, -5.97822, -83.7348, 154.092, -10.7645, -83.4159, 153.748, -10.9466, -84.1249, 153.161, -10.8895, -84.3922, 153.437, -10.739, -83.1504, 153.246, -10.6588, -83.7342, 152.875, -10.6539, -83.8577, 153.93, -9.34014, -83.8306, 153.975, -9.4925, -84.5083, 153.483, -9.84134, -84.5206, 153.327, -9.73692, -83.6265, 153.585, -9.21763, -84.3616, 152.99, -9.6934, -84.0368, 152.744, -9.81219, -83.3608, 153.033, -9.50074, -83.1543, 152.956, -10.0532, -83.9684, 152.642, -10.2795, -84.5083, 152.804, -10.3972, -84.6568, 153.153, -10.3434, -9.08298, 173.212, -0.912411],
        "normals": [],
        "bones": [{
          "parent": -1,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "0_Spine_Base"
        }, {
          "parent": 0,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "1_Spine_Mid"
        }, {
          "parent": 20,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "2_Neck"
        }, {
          "parent": 2,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "3_Head"
        }, {
          "parent": 20,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "4_Shoulder_L"
        }, {
          "parent": 4,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "5_Elbow_L"
        }, {
          "parent": 5,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "6_Wrist_L"
        }, {
          "parent": 6,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "7_Hand_L"
        }, {
          "parent": 20,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "8_Shoulder_R"
        }, {
          "parent": 8,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "9_Elbow_R"
        }, {
          "parent": 9,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "10_Wrist_R"
        }, {
          "parent": 10,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "11_Hand_R"
        }, {
          "parent": 0,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "12_Hip_L"
        }, {
          "parent": 12,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "13_Knee_L"
        }, {
          "parent": 13,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "14_Ankle_L"
        }, {
          "parent": 14,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "15_Foot_L"
        }, {
          "parent": 0,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "16_Hip_R"
        }, {
          "parent": 16,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "17_Knee_R"
        }, {
          "parent": 17,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "18_Ankle_R"
        }, {
          "parent": 18,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "19_Foot_R"
        }, {
          "parent": 1,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "20_Spine_Shoulder"
        }, {
          "parent": 7,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "21_Hand_Tip_L"
        }, {
          "parent": 7,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "22_Thumb_L"
        }, {
          "parent": 11,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "23_Hand_Tip_R"
        }, {
          "parent": 11,
          "pos": [0, 0, 0],
          "rotq": [0, 0, 0, 0],
          "scl": [1, 1, 1],
          "name": "24_Thumb_R"
        }],
        "faces": []
      }
    }],
    "metadata": {
      "type": "Object"
    },
    "object": {
      "children": [{
        "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        "visible": false,
        "type": "Mesh",
        "castShadow": true,
        "receiveShadow": true,
        "geometry": "1"
      }],
      "type": "Scene",
      "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    }
  };

  var horaInicio = new Date();
  horaInicio.setHours(0, 0, 0);
  var jointKeys;
  jointKeys = new Array(25);
  for (var l = 0; l < jointKeys.length; l++) { //inicializar subarrays
    jointKeys[l] = [];
  }

  var tiempoFormatoHora;
  var tiempo;
  for (var i = 1; i < lines.length - 1; i++) {
    var headersline = lines[0].split(";");
    var currentline = lines[i].split(";");

    tiempoFormatoHora = currentline[0].split(":");
    tiempo = parseFloat(tiempoFormatoHora[2]);

    //Eliminar las dos primeras columas: tiempo y hora
    currentline.splice(0, 2);
    headersline.splice(0, 2);

    var c = 0;
    var camara = currentline.splice(104, 4);
    while (currentline.length > 4) {
      var currentJointData = currentline.splice(0, 4);//Tomamos cada una de las articulaciones y las vamos añadiendo al JSON de una en una
      if (currentJointData[1] !== "-" && currentJointData[2] !== "-" || currentJointData[3] !== "-") {
        if (c === 0) {//Si es la articulación raiz
          jointKeys[c].push({
            pos: [parseFloat(camara[1].replace(",", ".")) + parseFloat(currentJointData[1].replace(",", ".")), parseFloat(camara[2].replace(",", ".")) + parseFloat(currentJointData[2].replace(",", ".")), parseFloat(camara[3].replace(",", ".")) + parseFloat(currentJointData[3].replace(",", "."))],
            time: tiempo,
            scl: [50, 50, 50],
            inf: parseInt(currentJointData[0])
          });
        } else {
          jointKeys[c].push({
            pos: [parseFloat(camara[1].replace(",", ".")) + parseFloat(currentJointData[1].replace(",", ".")), parseFloat(camara[2].replace(",", ".")) + parseFloat(currentJointData[2].replace(",", ".")), parseFloat(camara[1].replace(",", ".")) + parseFloat(currentJointData[3].replace(",", "."))],
            time: tiempo,
            scl: [1, 1, 1],
            inf: parseInt(currentJointData[0])
          });
        }
      } else {
        if (c === 0) {
          jointKeys[c].push({
            pos: [0, 0, 0],
            time: tiempo,
            scl: [50, 50, 50],
            inf: 0
          });
        } else {
          jointKeys[c].push({
            pos: [0, 0, 0],
            time: tiempo,
            scl: [1, 1, 1],
            inf: 0
          });
        }
      }
      c++;
    }
    data.geometries[0].data.animation.length = tiempo;
  }

  for (var i = 0; i < jointKeys.length; i++) {
    hierarchyData = {
      "parent": i,
      "keys": jointKeys[i]
    };
    data.geometries[0].data.animation.hierarchy.push(hierarchyData);
  }
  // console.log(JSON.stringify(data));
  download(JSON.stringify(data), name + '.json', 'text/json');
  // return JSON.stringify(result); //JSON
}

function csvJSON(csv) {

  var lines = csv.split("\n");

  var result = {};

  var cam = {};

  var headers = lines[0].split(";");
//lines.length -1 porque hay una linea vacia al final del fichero
  for (var i = 1; i < lines.length - 1; i++) {
    var joints = {};
    var joint = {};
    var headersline = lines[0].split(";");
    var currentline = lines[i].split(";");
    var ms = encodeURIComponent(currentline[0]).replace(/\./g, '%2E');
    //console.log(decodeURIComponent(ms).replace('%2E', '.'));
    joints[headers[1]] = currentline[1];
    currentline.splice(0, 2);
    headersline.splice(0, 2);
    var c = 0;
    while (currentline.length) {
      var currentJointHeader = headersline.splice(0, 4);
      var currentJointData = currentline.splice(0, 4);

      joint = {};
      for (var j = 0; j < currentJointData.length && c !== 26; j++) {
        joint[currentJointHeader[j]] = currentJointData[j];
      }
      if (c === 26) { //Si es el ultimo Joint tenemos que quitar el \r del header y del dato
        for (var k = 0; k < currentJointData.length - 1; k++) {
          joint[currentJointHeader[k]] = currentJointData[k];
        }
        var headersinR = currentJointHeader[3].substr(0, currentJointHeader[3].length - 1);
        joint[headersinR] = currentJointData[3].substr(0, currentJointData[3].length - 1);
      }
      joints[c] = joint;
      c++;
    }

    cam[ms] = joints;
  }
  result.cam1 = cam;
//return result; //JavaScript object
  return JSON.stringify(result); //JSON
}


function uploadJSON(file) {
  firebase.database().ref('paciente/' + 7).set(
    JSON.parse(file)
  ).then(function () {
    console.log("OK");
    showToast("Fichero subido correctamente");
  }, function (error) {
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorCode + " " + errorMessage);
    showToast(errorMessage);
  });
}

function download(content, fileName, contentType) {
  var a = document.createElement("a");
  var file = new Blob([content], {type: contentType});
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}
