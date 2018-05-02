app.controller('BorrarPacienteController', function ($scope, $timeout, $log) {
  "use strict";
  let database = firebase.database();
  let pacientesRef = database.ref('pacientes');
  let self = this;

  self.pacientes = cargarPacientes();
  self.querySearch = querySearch;
  self.selectedItemChange = selectedItemChange;
  self.searchTextChange = searchTextChange;
  $scope.pacienteSeleccionado = null;
  $scope.algoSeleccionado = false;

  function newState(state) {
    alert("Sorry! You'll need to create a Constitution for " + state + " first!");
  }

  // ******************************
  // Internal methods
  // ******************************

  /**
   * Search for pacientes... use $timeout to simulate
   * remote dataservice call.
   */
  function querySearch(query) {
    let results = query ? self.pacientes.filter(createFilterFor(query)) : self.pacientes;
    return results;
  }

  function searchTextChange(text) {
    $log.info('Text changed to ' + text);
  }

  function selectedItemChange(item) {
    $scope.pacienteSeleccionado = item;
    if (item !== undefined) {
      $scope.algoSeleccionado = true;
    } else {
      $scope.algoSeleccionado = false;
    }
    $log.info('Item changed to ' + JSON.stringify(item));
  }

  /**
   * Create filter function for a query string
   */
  function createFilterFor(query) {
    let lowercaseQuery = angular.lowercase(query);

    return function filterFn(paciente) {
      return (paciente.value.indexOf(lowercaseQuery) === 0);
    };

  }

  function cargarPacientes() {
    let pacientes = [];
    pacientesRef.once('value', function (paciente) {
      paciente.forEach(function (pacienteHijo) {
        let childData = pacienteHijo.val();
        childData['key'] = pacienteHijo.key;
        pacientes.push({
          id: childData.key,
          fecha: childData.fechaNacimiento,
          value: (childData.nombre + " " + childData.apellido).toLowerCase(),
          display: childData.nombre + " " + childData.apellido
        })
      });
    });
    return pacientes;
  }


   $scope.borrarPaciente = function() {
    pacientesRef.child($scope.pacienteSeleccionado.id).remove().then(snap => {
      showToast("Paciente borrado correctamente");
      self.pacientes = cargarPacientes();
      $scope.algoSeleccionado = false;
    }).catch(err =>{
      showToast("Problema borrando usuario");
    });
  };

});


