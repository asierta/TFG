app.controller('CrearGrabacionController', function ($scope, $compile, $window, $timeout) {
  let database = firebase.database();
  let input = angular.element(document.getElementById('fileInput'));

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

  $scope.limpiarBuscador = function () {
    $scope.searchTerm = '';
  };

  $scope.cargarPacientes = function () {
    return $timeout(function () {
      let pacientesRef = database.ref('pacientes');
      let pacientes = [];
      pacientesRef.on('value', function (paciente) {
        paciente.forEach(function (pacienteHijo) {
          let childData = pacienteHijo.val();
          pacientes.push(childData);
        });
        $scope.pacientes = $scope.pacientes || pacientes;
      });
    }, 150);
  };

  window.mdSelectOnKeyDownOverride = function (event) {
    event.stopPropagation();
  };

  //Cuando se selecciona un fichero se guarda en $scope.files y se actualiza el input con su nombre
  input.on('change', function (e) {
      let files = e.target.files;
      $scope.files = files;
      if (files[0]) {
        $scope.fileName = files[0].name;
      }
      $scope.$apply();
    }
  );

  //Crear un campo extra al final
  $scope.crearCampo = function () {
    let template = `<div layout='row' id='campoExtra${$scope.nCampoExtra}'><md-input-container flex='50'><label>Atributo extra ${$scope.nCampoExtra}</label><input required name='Atributo extra ${$scope.nCampoExtra}' ng-model='paciente.atributosExtraNombre[${$scope.nCampoExtra}]'><div ng-messages='paciente.atributosExtraNombre[${$scope.nCampoExtra}].$error'><div ng-message='required'>Campo requerido.</div></div></md-input-container><md-input-container flex='50'><label>Valor atributo extra ${$scope.nCampoExtra}</label><input required name='Valor atributo extra ${$scope.nCampoExtra}' ng-model='paciente.atributosExtraValor[${$scope.nCampoExtra}]'><div ng-messages='paciente.atributosExtraValor[${$scope.nCampoExtra}].$error'><div ng-message='required'>Campo requerido.</div></div></md-input-container></div>`;
    let html = $compile(template)($scope);
    angular.element(document.getElementById("camposExtra")).append(html);
    $scope.nCampoExtra++;
  };

  //Eliminar ultimo campo extra creado
  $scope.quitarCampo = function () {
    if ($scope.nCampoExtra > 1) {
      let nCampoExtra = $scope.nCampoExtra - 1;
      angular.element(document.getElementById("campoExtra" + nCampoExtra)).remove();
      $scope.nCampoExtra--;
      $scope.grabacion.atributosExtraNombre[nCampoExtra] = '';
      $scope.grabacion.atributosExtraValor[nCampoExtra] = '';
    } else {
      console.log($scope.nCampoExtra);
    }
  };

  $scope.crearGrabacion = function () {
    let rootRef = firebase.database().ref('grabaciones/');
    let newStoreRef = rootRef.push();
    let i;
    let fechaString = Date.parse($scope.grabacion.fecha.toString());
    let fecha = new Date(fechaString);

    let atributosObligatorios = {
      "id": $scope.grabacion.id,
      "lugar": $scope.grabacion.lugar,
      "fechaGrabacion": fecha.getDate() + "/" + (fecha.getMonth()+1) + "/" + fecha.getFullYear()
    };

    for (i = 1; i < $scope.nCampoExtra; i++) {
      atributosObligatorios[$scope.grabacion.atributosExtraNombre[i]] = $scope.grabacion.atributosExtraValor[i];
    }

    if ($scope.files[0]) {//Si se ha seleccionado un fichero
      let reader = new FileReader();
      reader.onload = function () {
        let file = reader.result;
        almacenarFicheroGrabacion(file);
        subirFicheroConvertidoJSON(file);
      };
      atributosObligatorios['grabacion'] = $scope.files[0].name;
      reader.readAsText($scope.files[0]);
    }

    if ($scope.grabacion.paciente) {//Si se ha asignado la grabacion a un paciente
      atributosObligatorios['paciente'] = $scope.grabacion.paciente.nombre + " " + $scope.grabacion.paciente.apellido;
    }
    newStoreRef.set(atributosObligatorios).then(fun => {
      showToast('Grabacion creada correctamente');
    }).catch(er =>{
      showToast('Error creando la grabación');
    })
  };

  function almacenarFicheroGrabacion(file) {
    let storageRef = firebase.storage().ref('grabaciones/' + $scope.files[0].name);
    let task = storageRef.putString(file);
    task.on('state_changed', function progress(snapshot) {
    }, function error(err) {
      console.log(err);
    }, function complete() {
      console.log("fichero subido");
    });
  }

  function subirFicheroConvertidoJSON(file) {
    let grabacion = Papa.parse(file);
    let cabeceras = grabacion.data[0];
    let camara = {};
    let grabacionJSON = {};
    for (let i = 2; i < grabacion.data.length - 1; i++) {//Para cada unidad de tiempo
      let joints = {};
      let joint = {};
      let linea = grabacion.data[i];
      let ms = encodeURIComponent(linea[0]).replace(/\./g, '%2E');//Reemplazamos los simbolos no aceptados como claves en Firebase
      for (let k = 1; k < (linea.length - 8); k = k + 4) {//Para cada uno de los joints
        joint = {};
        joint['x'] = linea[k + 1];
        joint['y'] = linea[k + 2];
        joint['z'] = linea[k + 3];
        joint['inf'] = linea[k];
        joints[(k - 1) / 4] = joint; //Añadimos el joint al conjunto de joints
      }
      camara[ms] = joints;//Añadimos los joints a la unidad de tiempo
    }

    let rootRef = firebase.database().ref('grabacionesJSON').child($scope.files[0].name.split('.')[0]);
    rootRef.set(camara).then(fun => {
      console.log("fichero subido");
    }).catch(err =>{
      console.log("Error subiendo fichero");
    })
  }

}).directive('apsUploadFile', apsUploadFile);

//Etiqueta nueva para subir archivos
function apsUploadFile() {
  return {
    restrict: 'E',
    // language=HTML
    template: '<input id="fileInput" type="file" class="ng-hide" ng-model="files"> <md-button id="uploadButton" class="md-raised md-primary" aria-label="attach_file"> Elegir fichero </md-button><md-input-container  md-no-float>    <input id="textInput" ng-model="fileName" type="text" placeholder="Fichero no seleccionado" ng-readonly="true"></md-input-container>',
    link: apsUploadFileLink
  };
}

function apsUploadFileLink(scope, element) {
  let input = $(element[0].querySelector('#fileInput'));
  let button = $(element[0].querySelector('#uploadButton'));
  let textInput = $(element[0].querySelector('#textInput'));

  if (input.length && button.length && textInput.length) {
    button.click(function () {
      input.click();
    });
    textInput.click(function () {
      input.click();
    });
  }
}


