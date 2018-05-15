app.controller('CrearGrabacionController', function ($scope, $compile, $window, $timeout, $mdDialog, $mdToast) {
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
  $scope.pacientes = cargarPacientes();
  $scope.paciente = null;
  $scope.searchTerm = '';


  $scope.crearGrabacion = function () {
    let rootRef = firebase.database().ref('grabaciones/');
    let newStoreRef = rootRef.push();
    let atributosExtraRef = newStoreRef.child("extra");
    let atributosExtra = {};
    let fechaString = Date.parse($scope.grabacion.fecha.toString());
    let fecha = new Date(fechaString);

    let atributosObligatorios = {
      "id": $scope.grabacion.id,
      "lugar": $scope.grabacion.lugar,
      "fechaGrabacion": fecha.getDate() + "/" + (fecha.getMonth() + 1) + "/" + fecha.getFullYear()
    };

    for (let i = 1; i < $scope.nCampoExtra; i++) {
      if ($scope.selectedItem[i] !== null && $scope.paciente.atributosExtraValor[i] !== "") {
        atributosExtra[$scope.selectedItem[i].display] = $scope.paciente.atributosExtraValor[i];
      }
    }
    atributosExtraRef.push(atributosExtra);

    if ($scope.files[0]) {//Si se ha seleccionado un fichero
      let reader = new FileReader();
      let fileId = $scope.files[0].name.split(".")[0] + "-" + guid() + ".csv";
      almacenarFicheroGrabacion($scope.files[0], fileId);
      reader.onload = function () {
        let file = reader.result;
        subirFicheroConvertidoJSON(file, fileId);
      };
      atributosObligatorios['grabacion'] = fileId;
      reader.readAsText($scope.files[0]);
    }

    if ($scope.grabacion.paciente) {//Si se ha asignado la grabacion a un paciente
      atributosObligatorios['pacienteKey'] = $scope.grabacion.paciente.key;
      atributosObligatorios['paciente'] = $scope.grabacion.paciente.nombre + " " + $scope.grabacion.paciente.apellido;
    } else {
      atributosObligatorios['pacienteKey'] = '';
      atributosObligatorios['paciente'] = '';
    }

    atributosObligatorios["extra"] = atributosExtra;
    newStoreRef.set(atributosObligatorios).then(fun => {
      showToast('Grabacion creada correctamente');
      $scope.close(true);
    }).catch(er => {
      console.log(er);
      showToast('Error creando la grabación');
    })
  };

  function almacenarFicheroGrabacion(file, id) {
    // let storageRef = firebase.storage().ref('grabaciones/' + $scope.files[0].name);
    let storageRef = firebase.storage().ref('grabaciones/' + id);
    let metadata = {
      contentType: 'text/csv',
      name: file.name
    };
    let task = storageRef.put(file, metadata);
    task.on('state_changed', function progress(snapshot) {
    }, function error(err) {
      console.log(err);
    }, function complete() {
      console.log("fichero subido");
    });
  }

  function subirFicheroConvertidoJSON(file, fileId) {
    let grabacion = Papa.parse(file);
    let camara = {};
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

    let rootRef = firebase.database().ref('grabacionesJSON').child(fileId.split(".")[0]);
    rootRef.set(camara).then(fun => {
      console.log("fichero subido");
    }).catch(err => {
      console.log("Error subiendo fichero");
    })
  }


  //Limpiar buscador pacientes
  $scope.limpiarBuscador = function () {
    $scope.searchTerm = '';
  };

  //Cargar los pacientes para mostrar en Select
  function cargarPacientes() {
    let pacientes = [];
    let database = firebase.database();
    let pacientesRef = database.ref('pacientes');
    $scope.promise = pacientesRef.once('value', function (paciente) {
      paciente.forEach(function (pacienteHijo) {
        let childData = pacienteHijo.val();
        childData['key'] = pacienteHijo.key;
        pacientes.push(childData);
      });
      return pacientes;
    });
    return pacientes;
  }

//Navegar por los elementos del select con las flechas
  window.mdSelectOnKeyDownOverride = function (event) {
    event.stopPropagation();
  };

  // ----------------Gestión campos extra---------------//
  $scope.simulateQuery = false;
  $scope.isDisabled = false;
  $scope.extraCreado = false;
  $scope.nombreAtributosExtra = loadAll();
  $scope.querySearch = querySearch;
  $scope.selectedItemChange = selectedItemChange;
  $scope.searchTextChange = searchTextChange;
  $scope.crearCampoExtra = crearCampoExtra;


  //Crear campo extra al final
  $scope.crearCampo = function () {
    let template = `<div id='campoExtra${$scope.nCampoExtra}' style="max-height: 95px;"><md-input-container flex="50"><md-autocomplete md-no-cache="noCache" md-input-name="campoExtra" md-input-id="searchinput" md-selected-item="selectedItem[${$scope.nCampoExtra}]" md-search-text-change="searchTextChange(searchText[${$scope.nCampoExtra}])" md-search-text="searchText[${$scope.nCampoExtra}]" md-selected-item-change="selectedItemChange(item)" md-items="item in querySearch(searchText[${$scope.nCampoExtra}])" md-item-text="item.display" md-min-length="0" md-floating-label="Atributo extra ${$scope.nCampoExtra}"><md-item-template style="color: #9ea1a4;"><span md-highlight-text="searchText[${$scope.nCampoExtra}]" md-highlight-flags="^i">{{item.display}}</span></md-item-template><md-not-found ng-hide="extraCreado"><md-button ng-hide="extraCreado" ng-click="crearCampoExtra(searchText[${$scope.nCampoExtra}], ${$scope.nCampoExtra})" style="width: 100%; text-align: center;">Crear!</md-button></md-not-found><div ng-messages="formPaciente.atributoExtra${$scope.nCampoExtra}.$error" ng-if="formPaciente.atributoExtra${$scope.nCampoExtra}.$touched"><div ng-message="required">Campo requerido</div></div></md-autocomplete></md-input-container><md-input-container flex='50'><label>Valor atributo extra ${$scope.nCampoExtra}</label><input id='valorCampoExtra' name='atributosExtraValor[${$scope.nCampoExtra}]' ng-model='paciente.atributosExtraValor[${$scope.nCampoExtra}]'><div ng-messages="formPaciente.atributosExtraValor[${$scope.nCampoExtra}].$error"><div ng-message="required">Campo requerido</div></div></md-input-container></div>`;
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
    }
    $scope.abc += 1;
  };

  function crearCampoExtra(campoExtra, n) {
    console.log($scope.extraCreado);
    firebase.database().ref('camposExtraGrabaciones/').push(campoExtra).then(function (snapshot) {
      $scope.nombreAtributosExtra = loadAll();
      showToast("Campo extra " + campoExtra + " creado");
      $scope.$apply(function () {
        $scope.searchText[n] = "";
      });
    }).catch(function (error) {
      console.error(error);
    });
  }

  // *************************************** //
  // Metodos internos Buscador Campos Extra  //
  // *************************************** //

  function querySearch(query) {
    return query ? $scope.nombreAtributosExtra.filter(createFilterFor(query)) : $scope.nombreAtributosExtra;
  }

  //Cambio de texto en buscador
  function searchTextChange(text) {
    formGrabacion.campoExtra.missing = true;
  }

  //Cambio de Item seleccionado
  function selectedItemChange(item) {
  }

//Carga inicial campos extra grabaciones
  function loadAll() {
    let nombreAtributosExtra = [];
    let database = firebase.database();
    let camposExtraRef = database.ref('camposExtraGrabaciones');
    $scope.promise = camposExtraRef.once('value', function (campos) {
      campos.forEach(function (campo) {
        let childData = campo.val();
        let campoMostrar = {
          value: childData.toLowerCase(),
          display: childData
        };
        nombreAtributosExtra.push(campoMostrar);
      });
      return nombreAtributosExtra;
    });
    return nombreAtributosExtra;
  }

  //Crear funcion de filtrado para un string
  function createFilterFor(query) {
    let lowercaseQuery = angular.lowercase(query);

    return function filterFn(state) {
      return (state.value.indexOf(lowercaseQuery) !== -1);
    };
  }

  //----------Funciones auxiliares------------//

  function showToast(content) {
    $mdToast.show($mdToast.simple()
      .content(content)
      .position('bottom right')
      .hideDelay(3000));
  }

  function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  $scope.close = function (creado) {
    if (creado) {
      $mdDialog.hide({creado: true});
    } else {
      $mdDialog.hide({creado: false});
    }
  };


}).directive('apsUploadFile', apsUploadFile);

//Etiqueta nueva para subir archivos
function apsUploadFile() {
  return {
    restrict: 'E',
    // language=HTML
    template: '<input id="fileInput" type="file" class="ng-hide" ng-model="files"> <md-button id="uploadButton" class="md-raised md-primary" aria-label="attach_file"> Elegir fichero </md-button><md-input-container  md-no-float><input required="" name="fileName" id="textInput" ng-model="fileName" type="text" placeholder="Fichero no seleccionado" ng-readonly="true"> <div ng-messages="formGrabacion.fileName.$error"><div ng-message="required">Campo requerido.</div></div></md-input-container>',
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
      console.log("click");
    });
    textInput.click(function () {
      input.click();
    });
  }

  //Cuando se selecciona un fichero se guarda en $scope.files y se actualiza el input con su nombre
  input.on('change', function (e) {
      let files = e.target.files;
      scope.files = files;
      if (files[0]) {
        scope.fileName = files[0].name;
        if (files[0].name.split(".")[1].localeCompare("csv") !== 0) {
          almacenarFicheroGrabacionVideo(files[0]);
        }
      }
      scope.$apply();
    }
  );

  function almacenarFicheroGrabacionVideo(file) {
    // let storageRef = firebase.storage().ref('grabaciones/' + $scope.files[0].name);
    let storageRef = firebase.storage().ref('videos/' + file.name);
    let task = storageRef.put(file);
    task.on('state_changed', function progress(snapshot) {
    }, function error(err) {
      console.log(err);
    }, function complete() {
      console.log("fichero subido");
    });
  }
}


