app.controller('CrearPacienteController', function ($scope, $compile, $timeout, $mdDialog, $log, $mdToast) {
  let database = firebase.database();
  $scope.paciente = {
    nombre: '',
    apellido: '',
    fecha: '',
    altura: '',
    sexo: '',
    grabacion: '',
    atributosExtraNombre: [],
    atributosExtraValor: []
  };
  $scope.grabaciones = cargarGrabaciones();
  $scope.grabacion = null;
  $scope.searchTerm = '';
  $scope.nCampoExtra = 1;

  $scope.crearPaciente = function () {
    let rootRef = firebase.database().ref('pacientes/');
    let newStoreRef = rootRef.push();
    let fechaString = Date.parse($scope.paciente.fecha.toString());
    let fecha = new Date(fechaString);
    let atributosExtraRef = newStoreRef.child("extra");
    let grabacionesRef = newStoreRef.child("grabaciones");
    let atributosExtra = {};
    let grabacion = {};

    let atributosObligatorios = {
      "nombre": $scope.paciente.nombre,
      "apellido": $scope.paciente.apellido,
      "fechaNacimiento": fecha.getDate() + "/" + (fecha.getMonth() + 1) + "/" + fecha.getFullYear(),
      "sexo": $scope.paciente.sexo
    };

    for (let i = 1; i < $scope.nCampoExtra; i++) {//Adjuntamos los campos extra añadidos
      if ($scope.selectedItem[i] !== null && $scope.paciente.atributosExtraValor[i] !== "") {
        atributosExtra[$scope.selectedItem[i].display] = $scope.paciente.atributosExtraValor[i];
      }
    }
    atributosExtraRef.push(atributosExtra);

    if ($scope.altura !== '') {
      atributosObligatorios["altura"] = $scope.paciente.altura;
    }

    if ($scope.paciente.grabacion !== '') {
      grabacion[$scope.paciente.grabacion.key] = true;
      grabacionesRef.push(grabacion);
      firebase.database().ref('grabaciones/').child($scope.paciente.grabacion.key).update({
        'paciente': $scope.paciente.nombre + " " + $scope.paciente.apellido,
        'pacienteKey': newStoreRef.key
      });
    }

    atributosObligatorios["extra"] = atributosExtra;
    atributosObligatorios["grabaciones"] = grabacion;
    newStoreRef.set(atributosObligatorios);
    $scope.close(true);
    showToast("Paciente creado correctamente");
  };

  //Limpiar buscador Grabaciones
  $scope.limpiarBuscador = function () {
    $scope.searchTerm = '';
  };

  //Cargar las grabaciones para mostrar en Select
  function cargarGrabaciones() {
    let grabaciones = [];
    let database = firebase.database();
    let grabacionesRef = database.ref('grabaciones');
    $scope.promise = grabacionesRef.once('value', function (grabacion) {
      grabacion.forEach(function (grabacionHija) {
        let childData = grabacionHija.val();
        if (childData.paciente === undefined || childData.paciente === "") {
          childData['key'] = grabacionHija.key;
          grabaciones.push(childData);
        }
      });
      return grabaciones;
    });
    return grabaciones;
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
      $scope.paciente.atributosExtraNombre[nCampoExtra] = '';
      $scope.paciente.atributosExtraValor[nCampoExtra] = '';
    }
  };

  function crearCampoExtra(campoExtra, n) {
    console.log($scope.extraCreado);
    firebase.database().ref('camposExtraPacientes/').push(campoExtra).then(function (snapshot) {
      $scope.nombreAtributosExtra = loadAll();
      showToast("Campo extra " + campoExtra + " creado");
      $scope.$apply(function () {
        $scope.searchText[n] = ""; //Reiniciar texto de busqueda para eliminar el botón de CREAR
      });
    }).catch(function (error) {
      console.error(error);
    });
  }

  // *************************************** //
  // Metodos internos Buscador Campos Extra  //
  // *************************************** //

  //Filtra por nombre
  function querySearch(query) {
    return query ? $scope.nombreAtributosExtra.filter(createFilterFor(query)) : $scope.nombreAtributosExtra;
  }

  //Cambio de texto en buscador
  function searchTextChange(text) {
    formPaciente.campoExtra.missing = true;
  }

  //Cambio de Item seleccionado
  function selectedItemChange(item) {
  }

  //Carga inicial campos extra pacientes
  function loadAll() {
    let nombreAtributosExtra = [];
    let database = firebase.database();
    let camposExtraRef = database.ref('camposExtraPacientes');
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

  //Mostrar aviso
  function showToast(content) {
    $mdToast.show($mdToast.simple()
      .content(content)
      .position('bottom right')
      .hideDelay(3000));
  }

  //Para cerrar Dialog en sección Pacientes
  $scope.close = function (creado) {
    if (creado) {
      $mdDialog.hide({creado: true});
    } else {
      $mdDialog.hide({creado: false});
    }
  };


}).config(function ($mdDateLocaleProvider) {//Personalizar calendario en español
  // Example of a Spanish localization.
  $mdDateLocaleProvider.months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  $mdDateLocaleProvider.shortMonths = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  $mdDateLocaleProvider.days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sábado'];
  $mdDateLocaleProvider.shortDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
  // Can change week display to start on Monday.
  $mdDateLocaleProvider.firstDayOfWeek = 1;
  // Optional.
  //$mdDateLocaleProvider.dates = [1, 2, 3, 4, 5, 6, 7,8,9,10,11,12,13,14,15,16,17,18,19,
  //                               20,21,22,23,24,25,26,27,28,29,30,31];
  // In addition to date display, date components also need localized messages
  // for aria-labels for screen-reader users.
  $mdDateLocaleProvider.weekNumberFormatter = function (weekNumber) {
    return 'Semana ' + weekNumber;
  };
  $mdDateLocaleProvider.msgCalendar = 'Calendario';
  $mdDateLocaleProvider.msgOpenCalendar = 'Abrir calendario';
  $mdDateLocaleProvider.formatDate = function (date) {
    return moment(date).format('DD/MM/YYYY');
  };
});


