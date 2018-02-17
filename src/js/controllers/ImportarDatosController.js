app.controller('importarDatosController', function ($scope, $window) {
  var user = firebase.auth().currentUser;
  if (!user) {
    console.log("No login");
    //$window.location.href = '/'; //Online si funciona, en local no
  }
  var pacientes;
  $scope.pacientes = "";
  $scope.files = "";
  $scope.crearPaciente = function () {
    firebase.database().ref('paciente/' + 6).set({
      "cam1": {
        "0:00:00": {
          "hora": "15:40:28.0434075",
          "0": {
            "esq0Inf": "-",
            "esq0X": "-",
            "esq0Y": "-",
            "esq0Z": "-"
          },
          "1": {
            "esq1Inf": "-",
            "esq1X": "-",
            "esq1Y": "-",
            "esq1Z": "-"
          }
        }
      }
    }).then(function () {
      console.log("OK");
    }, function (error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorCode + " " + errorMessage);
    });
  };

  $scope.verPacientes = function () {
    if (pacientes != null) {
      pacientes.off();
    }
    console.log("verPacientes");
    firebase.database().ref('/paciente/').once('value').then(function (snapshot) {
      $scope.$apply(function () {
        $scope.pacientes = snapshot.val();
      });
    })
  };

  $scope.verCambiosPacientes = function () {
    pacientes = firebase.database().ref('/paciente/');
    pacientes.on('value', function (snapshot) {
      $scope.$apply(function () {
        $scope.pacientes = snapshot.val();
      });
    });
  };

  $scope.subir = function () {
    console.log($scope.files[0]);
  }
}).directive('apsUploadFile', apsUploadFile);

function apsUploadFile() {
  return {
    restrict: 'E',
    template: '<input id="fileInput" type="file" class="ng-hide" ng-model="files"> <md-button id="uploadButton" class="md-raised md-primary" aria-label="attach_file">    Choose file </md-button><md-input-container  md-no-float>    <input id="textInput" ng-model="fileName" type="text" placeholder="No file chosen" ng-readonly="true"></md-input-container><md-button id="SubirButton" class="md-raised md-primary" ng-click="subir()"> Subir </md-button>',
    link: apsUploadFileLink
  };
}

function apsUploadFileLink(scope, element) {
  var input = $(element[0].querySelector('#fileInput'));
  var button = $(element[0].querySelector('#uploadButton'));
  var textInput = $(element[0].querySelector('#textInput'));

  if (input.length && button.length && textInput.length) {
    button.click(function () {
      input.click();
    });
    textInput.click(function () {
      input.click();
    });
  }

  input.on('change', function (e) {
    var files = e.target.files;
    if (files[0]) {
      scope.fileName = files[0].name;
      var reader = new FileReader();
      reader.onload = function () {
        var text = reader.result;
        var JSON = csvJSON(text);
        console.log(JSON);
        uploadJSON(JSON);
      };
      reader.readAsText(files[0]);
    } else {
      scope.fileName = null;
    }
    scope.$apply();
  });
}

function csvJSON(csv) {

  var lines = csv.split("\n");

  var result = {};

  var cam = {};

  var headers = lines[0].split(";");
//lines.length -1 porque hay una linea vacia al final del fichero
  for (var i = 1; i < lines.length -1; i++) {
    var joints = {};
    var joint = {};
    var headersline = lines[0].split(";");
    var currentline = lines[i].split(";");
    var ms = encodeURIComponent(currentline[0]).replace(/\./g, '%2E');
    //console.log(decodeURIComponent(ms).replace('%2E', '.'));
    joints[headers[1]] = currentline[1];
    currentline.splice(0,2);
    headersline.splice(0,2);
    var c = 0;
    while(currentline.length){
      var currentJointHeader = headersline.splice(0,4);
      var currentJointData = currentline.splice(0,4);

      joint = {};
      for (var j = 0; j < currentJointData.length && c!==26; j++) {
        joint[currentJointHeader[j]] = currentJointData[j];
      }
      if (c === 26){ //Si es el ultimo Joint tenemos que quitar el \r del header y del dato
        for (var k = 0; k < currentJointData.length -1; k++) {
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

showToast = function (content) {
  $mdToast.show({
    content: content,
    position: 'bottom right',
    hideDelay   : 3000
  });
};
