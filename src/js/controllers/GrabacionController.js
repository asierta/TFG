app.controller('GrabacionController', ['$mdEditDialog', '$q', '$scope', '$timeout', '$mdDialog', '$routeParams', '$location', '$mdToast', function ($mdEditDialog, $q, $scope, $timeout, $mdDialog, $routeParams, $location, $mdToast) {
  'use strict';
  $scope.user = false;
  firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
      $mdToast.show($mdToast.simple()
        .content("Inicia sesión para poder acceder")
        .position('bottom right')
        .hideDelay(3000));
      $location.path("/");
    }else{
      $scope.user = true;
    }
  });

  let bookmark;
  $scope.pacientes = cargarPacientes();
  $scope.searchTerm = '';
  $scope.selected = [];
  $scope.limitOptions = [10, 15, 20];
  $scope.grabaciones = null;

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
    filter: $routeParams.paciente === 'all' ? '': $routeParams.paciente ,
    filterRow: $routeParams.paciente === 'all' ? 'id': 'paciente',
    order: 'id',
    limit: 10,
    page: 1
  };

  function cargarGrabaciones() {
    let grabacionesMostrar = {};
    let grabaciones = [];
    let database = firebase.database();
    let grabacionesRef = database.ref('grabaciones');
    $scope.promise = grabacionesRef.once('value', function (grabacion) {
      grabacion.forEach(function (grabacionHija) {
        let childData = grabacionHija.val();
        if($scope.filter === '' || (childData[$scope.query.filterRow]!== undefined && childData[$scope.query.filterRow].toLowerCase().indexOf($scope.query.filter.toLowerCase()) > -1)) { //En caso de haber filtro solo se muestran las grabaciones que lo cumplen
          childData['key'] = grabacionHija.key;
          grabaciones.push(childData);
        }
      });
      grabacionesMostrar['count']= grabaciones.length;
      grabacionesMostrar['data'] = grabaciones;
      return grabacionesMostrar;
    });
    return grabacionesMostrar;
  }

  //Cargar pacientes para mostrar en cada grabación
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

  //Añadir nueva grabación
  $scope.addItem = function (event) {
    $mdDialog.show({
      clickOutsideToClose: false,
      controller: 'CrearGrabacionController',
      controllerAs: 'ctrl',
      focusOnOpen: true,
      parent: angular.element(document.body),
      targetEvent: event,
      templateUrl: 'grabacion-dialog.template.html',
    }).then(function (pacienteCreado) {
      console.log(pacienteCreado.creado);
      if (pacienteCreado.creado){
        $scope.loadStuff();
      }

    })
  };

  $scope.borrarGrabaciones = function(event) {
    $scope.mostrarConfirmarBorrado(event);
  };

  $scope.mostrarConfirmarBorrado = function(ev) {
    // Appending dialog to document.body to cover sidenav in docs app
    var confirm = $mdDialog.confirm()
      .title('Desea eliminar ' + ($scope.selected.length > 1 ? 'las grabaciones seleccionadas?' : 'la grabación seleccionada?'))
      .textContent('Esta acción no se podrá deshacer.')
      .targetEvent(ev)
      .ok('Continuar')
      .cancel('Cancelar');

    $mdDialog.show(confirm).then(function() {
      let database = firebase.database();
      let grabacionesRef = database.ref('grabaciones');
      for (let i = 0; i < $scope.selected.length; i++) {//Borramos todas las grabaciones seleccionadas
        firebase.database().ref('grabacionesJSON/').child($scope.selected[i].grabacion.split(".")[0]).remove();
        firebase.storage().ref('grabaciones/'+$scope.selected[i].grabacion).delete();
        grabacionesRef.child($scope.selected[i].key).remove()
          .catch(err => {
            showToast("Problema borrando grabación", err);
          });
      }
      showToast(($scope.selected.length > 1 ? 'Grabaciones borradas ' : 'Grabación borrada ')+"correctamente");

      $scope.selected = [];
      $scope.loadStuff();
    }, function() {
      showToast("Borrado de "+ ($scope.selected.length > 1 ? 'grabaciones' : 'grabación') +" cancelado")
    });

    function showToast(content) {
      $mdToast.show($mdToast.simple()
        .content(content)
        .position('bottom right')
        .hideDelay(3000));
    }
  };

  $scope.actualizarPaciente = function(paciente, grabacion){
    if (paciente === undefined){
      firebase.database().ref('grabaciones/').child(grabacion.key).update({'paciente': '', 'pacienteKey': ''}).then(function (actualizado) {
        if (grabacion.paciente !== ""){
          firebase.database().ref('pacientes/').child(grabacion.pacienteKey).child('grabaciones').child(grabacion.key).remove();
        }
        showToast("Grabación actualizada");
        $scope.loadStuff();
      });
    }else if((paciente.nombre + " " + paciente.apellido) !== grabacion.paciente){
      firebase.database().ref('grabaciones/').child(grabacion.key).update({'paciente': paciente.nombre + " " + paciente.apellido, 'pacienteKey': paciente.key}).then(function (actualizado) {
        firebase.database().ref('pacientes/').child(paciente.key).child('grabaciones').child(grabacion.key).set(true);
        if (grabacion.paciente !== ""){
          firebase.database().ref('pacientes/').child(grabacion.pacienteKey).child('grabaciones').child(grabacion.key).remove();
        }
          showToast("Grabación actualizada, paciente " + paciente.nombre + " " + paciente.apellido + " asignado");
        $scope.loadStuff();
      });
    }
  };

  $scope.limpiarBuscador = function () {
    $scope.searchTerm = '';
  };

  window.mdSelectOnKeyDownOverride = function (event) {
    event.stopPropagation();
  };

  $scope.verAtributosExtra = function(event, grabación){
    $mdDialog.show({
      parent: angular.element(document.body),
      template:
      '<md-dialog aria-label="List dialog">' +
      '  <md-dialog-content>'+
      '    <md-list>'+
      '      <md-list-item ng-repeat="(key, value) in items">'+
      '       <p><b>{{key}}:</b> {{value}}</p>' +
      '      '+
      '    </md-list-item></md-list>'+
      '  </md-dialog-content>' +
      '  <md-dialog-actions>' +
      '    <md-button ng-click="closeDialog()" class="md-primary">' +
      '      Cerrar' +
      '    </md-button>' +
      '  </md-dialog-actions>' +
      '</md-dialog>',
      targetEvent: event,
      locals: {
        items: grabación.extra
      },
      controller: DialogController
    });
    function DialogController($scope, $mdDialog, items) {
      $scope.items = items;
      $scope.closeDialog = function() {
        $mdDialog.hide();
      }
    }
  };

  $scope.previsualizarCSV = function(event, grabacion){
    $mdDialog.show({
      parent: angular.element(document.body),
      clickOutsideToClose: true,
      template:
      '<md-dialog id="csv-dialog" aria-label="VerGrabacion">'+
        ' <md-toolbar>' +
      '          <div class="md-toolbar-tools">' +
      '            <h2>Previsualizar CSV (primeras 200 líneas)</h2>' +
      '            <span flex></span>' +
      '            <md-button class="md-icon-button" ng-click="close()">' +
      '              <md-icon md-svg-src="img/icons/ic_close_24px.svg" aria-label="Close dialog"></md-icon>' +
      '            </md-button>' +
      '          </div>' +
      '        </md-toolbar>'+
        '<md-dialog-content>'+
        // '<div layout="row" layout-sm="column" layout-align="center center">'+
          '<md-progress-linear ng-disabled="!loading" ng-show="loading" md-mode="indeterminate"></md-progress-linear>'+
        // '</div>'+
          '<table class="prevCSVs">' +
            '<tr>' +
              '<th ng-repeat="c in fields">{{ c }}</th>' +
            '</tr>' +
          '<tr ng-repeat="r in results">' +
            '<td ng-repeat="c in getNumber(fieldsLength)">' +
              ' {{r[c]}}' +
            '</td>' +
          '</tr>' +
          '</table>'+
        '</md-dialog-content>'+
      '</md-dialog>',
      targetEvent: event,
      locals: {
        grabacion: grabacion.grabacion
      },
      controller: CSVController
    });

    function CSVController($scope, $mdDialog, grabacion) {
      $scope.grabacion = grabacion;
      $scope.loading = true;
      $scope.getNumber = function(num) {
        let arrayDeNumeros = new Array(num);
        for (let i = 0; i < num; i++){//Para iterar por cada una de las columnas del csv
          arrayDeNumeros[i]=i;
        }
        return arrayDeNumeros;
      };
      let storage = firebase.storage();
      let pathReference = storage.ref('grabaciones/');
      pathReference.child($scope.grabacion).getDownloadURL().then(function(url) {
        Papa.parse(url, {
          download: true,
          complete: function (results) {
            $scope.fields = results.data.shift();
            $scope.fieldsLength = $scope.fields.length;
            $scope.results = results.data.slice(0, 200);
            $scope.loading = false;
            $scope.$apply();
          }
        });
      });

      $scope.close = function() {
        $mdDialog.hide();
      }
    }
  };

  $scope.exportarCSV = function (grabacion) {
    firebase.storage().ref('grabaciones/').child(grabacion).getDownloadURL().then(function(url) {
      let a = document.createElement("a");
      a.download = grabacion;
      a.href = url;
      document.body.appendChild(a);
      a.click();
    }).catch(function(error) {
      // Handle any errors
      console.log(error);
    });
  };

  //----------Gestión tabla----------//
  $scope.toggleLimitOptions = function () {
    $scope.limitOptions = $scope.limitOptions ? undefined : [5, 10, 15];
  };

  $scope.loadStuff = function () {
    $scope.promise = $timeout(function () {
      $scope.grabaciones = cargarGrabaciones();
    }, 1000);
  };

  $scope.logItem = function (item) {
    console.log(item.id, 'was selected');
    console.log($scope.selected);
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

    if($scope.filter.form.$dirty) {
      $scope.filter.form.$setPristine();
    }
  };

  $scope.$watch('query.filter', function (newValue, oldValue) {
    if(!oldValue) {
      bookmark = $scope.query.page;
    }

    if(newValue !== oldValue) {
      $scope.query.page = 1;
    }

    if(!newValue) {
      $scope.query.page = bookmark;
    }

    $scope.loadStuff();
  });

  //----------Funciones Auxiliares----------//
  function showToast(content) {
    $mdToast.show($mdToast.simple()
      .content(content)
      .position('bottom right')
      .hideDelay(3000));
  }
}]);
