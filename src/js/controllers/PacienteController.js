app.controller('PacienteController', ['$mdEditDialog', '$q', '$scope', '$timeout', '$mdDialog', '$location', '$mdToast', function ($mdEditDialog, $q, $scope, $timeout, $mdDialog, $location, $mdToast) {
  'use strict';
  //Gestión sesión usuarios
  $scope.user = false;
  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      $mdToast.show($mdToast.simple()
        .content("Inicia sesión para poder acceder")
        .position('bottom right')
        .hideDelay(3000));
      $location.path("/");
    } else {
      $scope.user = true;
    }
  });

  let bookmark;
  $scope.selected = [];
  $scope.limitOptions = [10, 15, 20];
  $scope.pacientes = null;
  $scope.options = {
    rowSelection: true,
    multiSelect: true,
    autoSelect: false,
    decapitate: false,
    largeEditDialog: false,
    boundaryLinks: true,
    limitSelect: true,
    pageSelect: true
  };

  $scope.query = {
    filter: '',
    order: 'nombre',
    limit: 10,
    page: 1
  };


  function cargarPacientes() {
    let pacientesMostrar = {};
    let pacientes = [];
    let database = firebase.database();
    let pacientesRef = database.ref('pacientes');
    $scope.promise = pacientesRef.once('value', function (paciente) {
      paciente.forEach(function (pacienteHijo) {
        let childData = pacienteHijo.val();
        if ($scope.filter === '' || ((childData['nombre'] + childData['apellido']).toLowerCase().indexOf($scope.query.filter.toLowerCase()) > -1)) { //En caso de haber filtro solo se muestran los pacientes que lo cumplen
          childData['key'] = pacienteHijo.key;
          pacientes.push(childData);
        }
      });
      pacientesMostrar['count'] = pacientes.length;
      pacientesMostrar['data'] = pacientes;
      return pacientesMostrar;
    });
    return pacientesMostrar;
  }

  //Añadir nuevo paciente
  $scope.addItem = function (event) {
    $mdDialog.show({
      clickOutsideToClose: false,
      controller: 'CrearPacienteController',
      controllerAs: 'ctrl',
      focusOnOpen: true,
      parent: angular.element(document.body),
      targetEvent: event,
      templateUrl: 'paciente-dialog.template.html',
    }).then(function (pacienteCreado) {
      if (pacienteCreado.creado) {
        $scope.loadStuff();
      }
    })
  };

  //Ver atributos extra del paciente
  $scope.verAtributosExtra = function (event, paciente) {
    $mdDialog.show({
      parent: angular.element(document.body),
      // language=HTML
      template:
      '<md-dialog aria-label="List dialog">' +
      '  <md-dialog-content>' +
      '    <md-list>' +
      '      <md-list-item ng-repeat="(key, value) in items">' +
      '       <p><b>{{key}}:</b> {{value}}</p>' +
      '      ' +
      '    </md-list-item></md-list>' +
      '  </md-dialog-content>' +
      '  <md-dialog-actions>' +
      '    <md-button ng-click="closeDialog()" class="md-primary">' +
      '      Cerrar' +
      '    </md-button>' +
      '  </md-dialog-actions>' +
      '</md-dialog>',
      targetEvent: event,
      locals: {
        items: paciente.extra
      },
      controller: DialogController
    });

    function DialogController($scope, $mdDialog, items) {
      $scope.items = items;
      $scope.closeDialog = function () {
        $mdDialog.hide();
      }
    }
  };

  $scope.borrarPacientes = function (event) {
    $scope.mostrarConfirmarBorrado(event);
  };

  $scope.mostrarConfirmarBorrado = function (ev) {
    // Appending dialog to document.body to cover sidenav in docs app
    let confirm = $mdDialog.confirm()
      .title('Desea eliminar ' + ($scope.selected.length > 1 ? 'los pacientes seleccionados?' : 'el paciente seleccionado?'))
      .textContent('Esta acción no se podrá deshacer.')
      .ariaLabel('Lucky day')
      .targetEvent(ev)
      .ok('Continuar')
      .cancel('Cancelar');

    $mdDialog.show(confirm).then(function () {
      let database = firebase.database();
      let pacientesRef = database.ref('pacientes');
      for (let i = 0; i < $scope.selected.length; i++) {//Borramos todos los pacientes seleccionados
        if ($scope.selected[i].grabaciones !== undefined) {
          let grabaciones = Object.keys($scope.selected[i].grabaciones);
          for (let j = 0; j < grabaciones.length; j++) {
            firebase.database().ref('grabaciones/').child(grabaciones[j]).update({'paciente': '', 'pacienteKey': ''})
          }
        }
        pacientesRef.child($scope.selected[i].key).remove()
          .catch(err => {
            showToast("Problema borrando usuario");
          });
      }

      if ($scope.selected.length === 1) {
        showToast("Paciente borrado correctamente");
      } else {
        showToast("Pacientes borrados correctamente");
      }
      $scope.selected = [];
      $scope.loadStuff();
    }, function () {
      showToast("Borrado de pacientes cancelado")
    });
  };


  //----------Gestión tabla----------//

  $scope.toggleLimitOptions = function () {
    $scope.limitOptions = $scope.limitOptions ? undefined : [5, 10, 15];
  };

  $scope.getTypes = function () {
    return ['Candy', 'Ice cream', 'Other', 'Pastry'];
  };

  $scope.loadStuff = function () {
    $scope.promise = $timeout(function () {
      $scope.pacientes = cargarPacientes();
    }, 1000);
  };

  $scope.logItem = function (item) {
    console.log(item.nombre, 'was selected');
  };

  $scope.logOrder = function (order) {
    console.log('orden: ', order);
  };

  $scope.logPagination = function (page, limit) {
    console.log('página: ', page);
    console.log('límite: ', limit);
  };

  $scope.removeFilter = function () {
    $scope.filter.show = false;
    $scope.query.filter = '';

    if ($scope.filter.form.$dirty) {
      $scope.filter.form.$setPristine();
    }
  };

  $scope.$watch('query.filter', function (newValue, oldValue) {
    if (!oldValue) {
      bookmark = $scope.query.page;
    }

    if (newValue !== oldValue) {
      $scope.query.page = 1;
    }

    if (!newValue) {
      $scope.query.page = bookmark;
    }
    $scope.loadStuff();
  });

//----------Funciones Auxiliares----------//
  $scope.redirect = function (direction) {
    $location.path("/" + direction);
  };

  function showToast(content) {
    $mdToast.show($mdToast.simple()
      .content(content)
      .position('bottom right')
      .hideDelay(3000));
  }

}]);
