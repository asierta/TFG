app.controller('CrearGrabacionController', function ($scope, $compile, $window, $timeout) {
  var database = firebase.database();
  var input = angular.element(document.getElementById('fileInput'));

  $scope.grabacion = {
    id: '',
    fecha: '',
    lugar: '',
    paciente: '',
    atributosExtraNombre: [],
    atributosExtraValor: []
  };
  $scope.nCampoExtra = 1;
  $scope.files = "";
  $scope.fileName = "";
  $scope.pacientes = null;
  $scope.paciente = null;
  $scope.searchTerm = '';

  $scope.limpiarBuscador = function() {
    $scope.searchTerm = '';
  };

  $scope.cargarPacientes = function(){
    return $timeout(function() {
      var pacientesRef = database.ref('pacientes');
      var pacientes = [];
      pacientesRef.on('value', function (paciente) {
        paciente.forEach(function (pacienteHijo) {
          var childData = pacienteHijo.val();
          pacientes.push({
            "nombre": childData.nombre + " " + childData.apellido
          });
        });
        $scope.pacientes = $scope.pacientes || pacientes;
      });
    }, 150);
  };

  window.mdSelectOnKeyDownOverride = function(event) { event.stopPropagation(); };

  //Cuando se selecciona un fichero se guarda en $scope.files y se actualiza el input con su nombre
  input.on('change', function (e) {
      var files = e.target.files;
      $scope.files = files;
      if (files[0]) {
        $scope.fileName = files[0].name;
      }
      $scope.$apply();
    }
  );

  //Crear un campo extra al final
  $scope.crearCampo = function () {
    var template = "<div layout='row' id='campoExtra"+$scope.nCampoExtra+"'><md-input-container flex='50'><label>Atributo extra "+$scope.nCampoExtra+"</label><input required name='Atributo extra "+$scope.nCampoExtra+"' ng-model='paciente.atributosExtraNombre["+$scope.nCampoExtra+"]'>" +
      "<div ng-messages='paciente.atributosExtraNombre["+$scope.nCampoExtra+"].$error'><div ng-message='required'>Campo requerido.</div></div>" +
      "</md-input-container><md-input-container flex='50'><label>Valor atributo extra "+$scope.nCampoExtra+"</label><input required name='Valor atributo extra "+$scope.nCampoExtra+"' ng-model='paciente.atributosExtraValor["+$scope.nCampoExtra+"]'><div ng-messages='paciente.atributosExtraValor["+$scope.nCampoExtra+"].$error'>" +
      "<div ng-message='required'>Campo requerido.</div></div></md-input-container></div>";
    var html = $compile(template)($scope);
    angular.element(document.getElementById("camposExtra")).append(html);
    $scope.nCampoExtra++;
  };

  //Eliminar ultima compo extra creado
  $scope.quitarCampo = function () {
    if($scope.nCampoExtra > 1) {
      var nCampoExtra = $scope.nCampoExtra - 1;
      angular.element(document.getElementById("campoExtra" + nCampoExtra)).remove();
      $scope.nCampoExtra--;
      $scope.grabacion.atributosExtraNombre[nCampoExtra] = '';
      $scope.grabacion.atributosExtraValor[nCampoExtra] = '';
    }else{
      console.log($scope.nCampoExtra);
    }
  };

  $scope.crearGrabacion = function () {
    var rootRef = firebase.database().ref('grabaciones/');
    var newStoreRef = rootRef.push();
    var i;
    var atributosObligatorios = {
      "id": $scope.grabacion.id,
      "lugar": $scope.grabacion.lugar,
      "fechaGrabacion": $scope.grabacion.fecha.toString()
    };

    for (i = 1; i < $scope.nCampoExtra; i++) {
      atributosObligatorios[$scope.grabacion.atributosExtraNombre[i]] = $scope.grabacion.atributosExtraValor[i];
    }

    if ($scope.files[0]) {
      var reader = new FileReader();
      reader.onload = function () {
        var file = reader.result;
        almacenarFicheroGrabacion(file);
      };
      atributosObligatorios['grabacion'] = $scope.files[0].name;
      reader.readAsText($scope.files[0]);
    }
    newStoreRef.set(atributosObligatorios);
    console.log('Grabacion creada correctamente');
    showToast('Grabacion creada correctamente');
  };

  function almacenarFicheroGrabacion(file) {
    var storageRef = firebase.storage().ref('grabaciones/'+ $scope.files[0].name);
    var task = storageRef.putString(file);
    task.on('state_changed', function progress(snapshot) {
      // var percentage = (snapshot.bytesTransferred/snapshot.totalBytes)*100;
      // uploader.value = percentage;
    }, function error(err) {
      console.log(err);
    },function complete() {
      console.log("fichero subido");
    });
  }

}).directive('apsUploadFile', apsUploadFile);
//Etiqueta nueva para subir archivos
function apsUploadFile() {
  return {
    restrict: 'E',
    template: '<input id="fileInput" type="file" class="ng-hide" ng-model="files"> <md-button id="uploadButton" class="md-raised md-primary" aria-label="attach_file"> Elegir fichero </md-button><md-input-container  md-no-float>    <input id="textInput" ng-model="fileName" type="text" placeholder="Fichero no seleccionado" ng-readonly="true"></md-input-container>',
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
}


