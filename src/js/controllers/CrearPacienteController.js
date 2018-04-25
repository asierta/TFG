app.controller('CrearPacienteController', function ($scope, $compile) {
  $scope.paciente = {
    nombre: '',
    apellido: '',
    fecha: '',
    altura: '',
    atributosExtraNombre: [],
    atributosExtraValor: []
  };

  $scope.nCampoExtra = 1;

  $scope.crearPaciente = function () {
    var rootRef = firebase.database().ref('pacientes/');
    var newStoreRef = rootRef.push();
    var i;
    var atributosObligatorios = {
      "nombre": $scope.paciente.nombre,
      "apellido": $scope.paciente.apellido,
      "fechaNacimiento": $scope.paciente.fecha
    };

    for (i = 1; i < $scope.nCampoExtra; i++) {//Adjuntamos los campos extra añadidos
      atributosObligatorios[$scope.paciente.atributosExtraNombre[i]] = $scope.paciente.atributosExtraValor[i];
    }

    if ($scope.altura !== 0) {
      atributosObligatorios["altura"] = $scope.paciente.altura;
    }

    newStoreRef.set(atributosObligatorios);
    showToast("Paciente creado correctamente");
  };

  $scope.crearCampo = function () {
    var template = "<div layout='row' id='campoExtra" + $scope.nCampoExtra + "'><md-input-container flex='50'><label>Atributo extra " + $scope.nCampoExtra + "</label><input required name='Atributo extra " + $scope.nCampoExtra + "' ng-model='paciente.atributosExtraNombre[" + $scope.nCampoExtra + "]'>" +
      "<div ng-messages='paciente.atributosExtraNombre[" + $scope.nCampoExtra + "].$error'><div ng-message='required'>Campo requerido.</div></div>" +
      "</md-input-container><md-input-container flex='50'><label>Valor atributo extra " + $scope.nCampoExtra + "</label><input required name='Valor atributo extra " + $scope.nCampoExtra + "' ng-model='paciente.atributosExtraValor[" + $scope.nCampoExtra + "]'><div ng-messages='paciente.atributosExtraValor[" + $scope.nCampoExtra + "].$error'>" +
      "<div ng-message='required'>Campo requerido.</div></div></md-input-container></div>";
    var html = $compile(template)($scope);
    angular.element(document.getElementById("camposExtra")).append(html);
    $scope.nCampoExtra++;
  };

  $scope.quitarCampo = function () {
    if ($scope.nCampoExtra > 1) {
      var nCampoExtra = $scope.nCampoExtra - 1;
      angular.element(document.getElementById("campoExtra" + nCampoExtra)).remove();
      $scope.nCampoExtra--;
      $scope.paciente.atributosExtraNombre[nCampoExtra] = '';
      $scope.paciente.atributosExtraValor[nCampoExtra] = '';
    } else {
      console.log($scope.nCampoExtra);
    }
  };

});


