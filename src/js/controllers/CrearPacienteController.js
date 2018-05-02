app.controller('CrearPacienteController', function ($scope, $compile,  $timeout) {
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
  $scope.grabaciones = null;
  $scope.grabacion = null;
  $scope.searchTerm = '';
  $scope.nCampoExtra = 1;

  $scope.limpiarBuscador = function () {
    $scope.searchTerm = '';
  };

  $scope.cargarGrabaciones = function () {
    let database = firebase.database();
    return $timeout(function () {
      let grabacionesRef = database.ref('grabaciones');
      let grabaciones = [];
      grabacionesRef.on('value', function (grabacion) {
        grabacion.forEach(function (grabacionHijo) {
          let childData = grabacionHijo.val();
          childData["key"] = grabacionHijo.key;
          grabaciones.push(childData);
        });
        $scope.grabaciones = $scope.grabaciones || grabaciones;
      });
    }, 150);
  };

  window.mdSelectOnKeyDownOverride = function (event) {
    event.stopPropagation();
  };

  $scope.crearPaciente = function () {
    let rootRef = firebase.database().ref('pacientes/');
    let newStoreRef = rootRef.push();
    let i;
    let fechaString = Date.parse($scope.paciente.fecha.toString());
    let fecha = new Date(fechaString);

    let atributosObligatorios = {
      "nombre": $scope.paciente.nombre,
      "apellido": $scope.paciente.apellido,
      "fechaNacimiento": fecha.getDate() + "/" + (fecha.getMonth()+1) + "/" + fecha.getFullYear(),
      "sexo": $scope.paciente.sexo,
      "grabacion": $scope.paciente.grabacion.key
    };

    for (i = 1; i < $scope.nCampoExtra; i++) {//Adjuntamos los campos extra añadidos
      atributosObligatorios[$scope.paciente.atributosExtraNombre[i]] = $scope.paciente.atributosExtraValor[i];
    }

    if ($scope.altura !== '') {
      atributosObligatorios["altura"] = $scope.paciente.altura;
    }

    newStoreRef.set(atributosObligatorios);
    showToast("Paciente creado correctamente");
  };

  $scope.crearCampo = function () {
    let template = `<div layout='row' id='campoExtra${$scope.nCampoExtra}'><md-input-container flex='50'><label>Atributo extra ${$scope.nCampoExtra}</label><input required name='Atributo extra ${$scope.nCampoExtra}' ng-model='paciente.atributosExtraNombre[${$scope.nCampoExtra}]'><div ng-messages='paciente.atributosExtraNombre[${$scope.nCampoExtra}].$error'><div ng-message='required'>Campo requerido.</div></div></md-input-container><md-input-container flex='50'><label>Valor atributo extra ${$scope.nCampoExtra}</label><input required name='Valor atributo extra ${$scope.nCampoExtra}' ng-model='paciente.atributosExtraValor[${$scope.nCampoExtra}]'><div ng-messages='paciente.atributosExtraValor[${$scope.nCampoExtra}].$error'><div ng-message='required'>Campo requerido.</div></div></md-input-container></div>`;
    let html = $compile(template)($scope);
    angular.element(document.getElementById("camposExtra")).append(html);
    $scope.nCampoExtra++;
  };

  $scope.quitarCampo = function () {
    if ($scope.nCampoExtra > 1) {
      let nCampoExtra = $scope.nCampoExtra - 1;
      angular.element(document.getElementById("campoExtra" + nCampoExtra)).remove();
      $scope.nCampoExtra--;
      $scope.paciente.atributosExtraNombre[nCampoExtra] = '';
      $scope.paciente.atributosExtraValor[nCampoExtra] = '';
    } else {
      console.log($scope.nCampoExtra);
    }
  };

}).config(function($mdDateLocaleProvider) {
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
  $mdDateLocaleProvider.weekNumberFormatter = function(weekNumber) {
    return 'Semana ' + weekNumber;
  };
  $mdDateLocaleProvider.msgCalendar = 'Calendario';
  $mdDateLocaleProvider.msgOpenCalendar = 'Abrir calendario';
  $mdDateLocaleProvider.formatDate = function(date) {
    return moment(date).format('DD/MM/YYYY');
  };
});


