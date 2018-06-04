app.controller('PacienteController', ['$mdEditDialog', '$q', '$scope', '$timeout', '$mdDialog', '$location', '$mdToast', '$rootScope', function ($mdEditDialog, $q, $scope, $timeout, $mdDialog, $location, $mdToast, $rootScope) {
  'use strict';

  // Gestión sesión usuarios
  $scope.user = false;
  $scope.configuracion = true;
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
  let grupo = getCookie('grupo');
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
    order: 'id',
    limit: 10,
    page: 1
  };

  $scope.fechaTimestamp = function () {
    let fecha = grabacion.fechaGrabacion.split("/");
    let time = new Date(fecha[2] + "-" + fecha[1] + "-" + fecha[0]).getTime();
  };

  $scope.tabla = ['Fecha nacimiento', 'Edad', 'Sexo', 'Altura', 'Peso', 'Inicio enfermedad', 'Clasificación', 'Grabaciones', 'Atributos extra'];
  $scope.seleccionado = ['Fecha nacimiento', 'Edad', 'Sexo', 'Altura', 'Peso', 'Inicio enfermedad', 'Clasificación', 'Grabaciones', 'Atributos extra'];
  $scope.toggle = function (item, list) {
    var idx = list.indexOf(item);
    if (idx > -1) {
      list.splice(idx, 1);
    }
    else {
      list.push(item);
    }
  };

  $scope.exists = function (item, list) {
    return list.indexOf(item) > -1;
  };

  $scope.isIndeterminate = function () {
    return ($scope.seleccionado.length !== 0 &&
      $scope.seleccionado.length !== $scope.tabla.length);
  };

  $scope.isChecked = function () {
    return $scope.seleccionado.length === $scope.tabla.length;
  };

  $scope.toggleAll = function () {
    if ($scope.seleccionado.length === $scope.tabla.length) {
      $scope.seleccionado = [];
    } else if ($scope.seleccionado.length === 0 || $scope.seleccionado.length > 0) {
      $scope.seleccionado = $scope.tabla.slice(0);
    }
  };

  function cargarPacientes() {
    let pacientesMostrar = {};
    let pacientes = [];
    let database = firebase.database();
    let pacientesRef = database.ref('pacientes/' + getCookie('grupo'));
    let error = false;
    $scope.promise = pacientesRef.once('value', function (paciente) {
      paciente.forEach(function (pacienteHijo) {
        let childData = pacienteHijo.val();
        try {
          if (($scope.filter === '' || ((CryptoJS.AES.decrypt(childData['id'], getCookie('clave')).toString(CryptoJS.enc.Utf8)).toLowerCase().indexOf($scope.query.filter.toLowerCase()) > -1))) { //En caso de haber filtro solo se muestran los pacientes que lo cumplen
            for (let clave in childData) {
              if (childData.hasOwnProperty(clave) && clave === 'fechaNacimiento') {
                let dateString = CryptoJS.AES.decrypt(childData[clave], getCookie('clave')).toString(CryptoJS.enc.Utf8);
                let dateParts = dateString.split("/");
                let dateObject = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
                childData['edad'] = calcularEdad(dateObject);
                childData[clave] = {'value': dateString, 'ts': dateObject.getTime()};
              } else if (clave === 'extra' || clave === 'grabaciones') {
                for (let claveExtra in childData[clave]) {
                  childData[clave][claveExtra] = CryptoJS.AES.decrypt(childData[clave][claveExtra], getCookie('clave')).toString(CryptoJS.enc.Utf8);
                }
              } else {
                if (clave === 'peso' || clave === 'altura' || clave === 'inicioEnfermedad') {
                  childData[clave] = Number(CryptoJS.AES.decrypt(childData[clave], getCookie('clave')).toString(CryptoJS.enc.Utf8));
                } else {
                  childData[clave] = CryptoJS.AES.decrypt(childData[clave], getCookie('clave')).toString(CryptoJS.enc.Utf8);
                }
              }
            }
            childData['key'] = pacienteHijo.key;
            pacientes.push(childData);
          }
        }
        catch (err) {
          error = true;
        }
      });
      if (error){
        showToast("La clave de encriptación introducida es incorrecta, inicie sesión de nuevo");
      }
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
      '<md-dialog aria-label="List dialog" >' +
      '<md-toolbar>' +
      '          <div class="md-toolbar-tools">' +
      '            <h2>Atributos extra {{paciente.id}}</h2>' +
      '            <span flex></span>' +
      '            <md-button class="md-icon-button" ng-click="closeDialog(false)">' +
      '              <md-icon md-svg-src="img/icons/ic_close_24px.svg" aria-label="Close dialog"></md-icon>' +
      '            </md-button>' +
      '          </div>' +
      '</md-toolbar>' +
      '<md-dialog-content style="max-width:80%; max-height:80%; min-width: 425px; min-height: 400px;" layout-align="center center">' +
      '<div class="md-dialog-content">' +
      '<form name="formAtributosExtra" ng-submit="actualizarAtributos()" >' +
      '<div layout="row">' +
      '<md-button class="md-fab md-mini" aria-label="Añadir campo" ng-click="crearCampo()" >' +
      '<md-icon md-svg-src="img/icons/add.svg"></md-icon>' +
      '</md-button>' +
      '<md-button class="md-fab md-mini" aria-label="Quitar campo" ng-click="quitarCampo()" >' +
      '<md-icon md-svg-src="img/icons/remove.svg"></md-icon>' +
      '</md-button>' +
      '</div>' +
      '<div ng-repeat="atributo in numeroAtributos" style="max-height: 95px; color: #9e9e9e;">' +
      '<md-input-container flex="50">' +
      '<md-autocomplete required="required" md-no-cache="noCache" md-input-name="atributoExtraNombre{{atributo}}" md-input-id="searchinputMdAutocomplete" md-selected-item="selectedItem[$index]" md-search-text-change="searchTextChange(searchText[$index])" md-search-text="searchText[$index]" md-selected-item-change="selectedItemChange(item)" md-items="item in querySearch(searchText[$index])" md-item-text="item.display" md-min-length="0" md-floating-label="Atributo extra {{$index + 1 }}">' +
      '<md-item-template>' +
      '<span md-highlight-text="searchText[$index]" md-highlight-flags="^i">{{item.display}}</span>' +
      '</md-item-template>' +
      '<md-not-found ng-hide="extraCreado">' +
      '<md-button ng-hide="extraCreado" ng-click="crearCampoExtra(atributo)" style="width: 100%; text-align: center;">Crear!</md-button></md-not-found>' +
      '<div ng-messages="formAtributosExtra[\'atributoExtraNombre\' +atributo].$error" ng-if="formAtributosExtra[\'atributoExtraNombre\' +atributo].$touched">' +
      '<div ng-message="required">Campo requerido</div>' +
      '</div>' +
      '</md-autocomplete>' +
      '</md-input-container>' +
      '<md-input-container flex="50">' +
      '<label>Valor atributo extra {{$index + 1}}</label>' +
      '<input name="atributosExtraValor{{$index}}" ng-model="atributosExtraValor[$index]" required>' +
      '<div ng-messages="formAtributosExtra[\'atributosExtraValor\'+$index].$error" ng-show="formAtributosExtra[\'atributosExtraValor\'+$index].$touched">' +
      '<div ng-message="required">Campo requerido</div>' +
      '</div>' +
      '</md-input-container>' +
      '</div>' +
      '</form>' +
      '</div>' +
      '  </md-dialog-content>' +
      '  <md-dialog-actions>' +
      '    <md-button ng-click="closeDialog(false)" class="md-primary">' +
      '      Cerrar' +
      '    </md-button>' +
      '<md-button type="submit" class="md-raised md-primary" ng-disabled="formAtributosExtra.$invalid" ng-click="actualizarAtributos()" class="md-primary">' +
      '      Guardar' +
      '    </md-button>' +
      '  </md-dialog-actions>' +
      '</md-dialog>',
      targetEvent: event,
      locals: {
        paciente: paciente
      },
      controller: DialogController
    });

    function DialogController($scope, $mdDialog, paciente) {
      $scope.paciente = paciente;
      $scope.atributosExtraNombre = [];
      $scope.atributosExtraValor = [];
      $scope.selectedItem = [];
      $scope.searchText = [];
      $scope.searchTerm = '';
      $scope.nCampoExtra = 0;
      $scope.simulateQuery = false;
      $scope.isDisabled = false;
      $scope.extraCreado = false;
      $scope.nombreAtributosExtra = loadAll();
      $scope.querySearch = querySearch;
      $scope.selectedItemChange = selectedItemChange;
      $scope.searchTextChange = searchTextChange;
      $scope.crearCampoExtra = crearCampoExtra;
      $scope.numeroAtributos = [];
      $scope.nombre = '';

      event.preventDefault();
      $timeout(function () {

        for (let clave in paciente.extra) {
          $scope.atributosExtraNombre[$scope.nCampoExtra] = clave;
          $scope.selectedItem[$scope.nCampoExtra] = {value: clave, display: clave};
          $scope.searchText[$scope.nCampoExtra] = clave;
          $scope.atributosExtraValor[$scope.nCampoExtra] = paciente.extra[clave];
          $scope.numeroAtributos[$scope.nCampoExtra] = $scope.nCampoExtra;
          $scope.nCampoExtra++;
        }
      });

      //Crear campo extra al final
      $scope.crearCampo = function () {
        $scope.atributosExtraValor[$scope.nCampoExtra] = '';
        $scope.numeroAtributos[$scope.nCampoExtra] = $scope.nCampoExtra;
        $scope.nCampoExtra++;
      };

      //Eliminar ultimo campo extra creado
      $scope.quitarCampo = function () {
        if ($scope.nCampoExtra > 0) {
          $scope.atributosExtraNombre[$scope.nCampoExtra] = '';
          $scope.atributosExtraValor[$scope.nCampoExtra] = '';
          $scope.numeroAtributos.pop();
          $scope.nCampoExtra--;
        }
      };

      function crearCampoExtra(n) {
        firebase.database().ref('camposExtraPacientes/').push($scope.searchText[n]).then(function (snapshot) {
          $scope.nombreAtributosExtra = loadAll();
          showToast("Campo extra " + $scope.searchText[n] + " creado");
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

      function createFilterFor(query) {
        let lowercaseQuery = angular.lowercase(query);

        return function filterFn(state) {
          return (state.value.indexOf(lowercaseQuery) !== -1);
        };
      }

      //Cambio de texto en buscador
      function searchTextChange(text) {
        // formAtributosExtra.campoExtra.missing = true;
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

      $scope.closeDialog = function (update) {
        $mdDialog.hide({updated: update});
      };

      $scope.actualizarAtributos = function () {
        let atributosExtraFirebase = {};
        let atributosExtraLocal = {};
        for (let i = 0; i < $scope.nCampoExtra; i++) {//Adjuntamos los campos extra añadidos
          if ($scope.selectedItem[i] !== null && $scope.atributosExtraValor[i] !== "") {
            atributosExtraLocal[$scope.selectedItem[i].display] = $scope.atributosExtraValor[i].toString();
            atributosExtraFirebase[$scope.selectedItem[i].display] = CryptoJS.AES.encrypt($scope.atributosExtraValor[i].toString(), getCookie('clave')).toString();
          }
        }
        if ($scope.nCampoExtra === 0) {
          delete paciente['extra'];
        } else {
          paciente.extra = atributosExtraLocal;
        }

        firebase.database().ref('pacientes/' + getCookie('grupo')).child(paciente.key).child('extra').set(atributosExtraFirebase).then(function () {
          $scope.closeDialog(true);
        })
      };
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
      let pacientesRef = database.ref('pacientes/' + getCookie('grupo'));
      for (let i = 0; i < $scope.selected.length; i++) {//Borramos todos los pacientes seleccionados
        if ($scope.selected[i].grabaciones !== undefined) {
          let grabaciones = Object.keys($scope.selected[i].grabaciones);
          for (let j = 0; j < grabaciones.length; j++) {
            firebase.database().ref('grabaciones/' + getCookie('grupo')).child(grabaciones[j]).update({
              'paciente': '',
              'pacienteKey': '',
              'edadPaciente': '',
              'edadGrabacion': ''
            })
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
  };

  $scope.logOrder = function (order) {
  };

  $scope.logPagination = function (page, limit) {
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

  $scope.editarCampo = function (event, paciente, campo) {
    event.stopPropagation(); // in case autoselect is enabled
    let editDialog = {
      modelValue: campo === 'identificador' ? paciente.id : Number(paciente.altura),
      placeholder: campo === 'identificador' ? 'Identificador' : 'Altura',
      save: function (input) {
        if (campo === 'identificador') {
          paciente.id = input.$modelValue;
          let newId = CryptoJS.AES.encrypt(paciente.id, getCookie('clave')).toString()
          firebase.database().ref('pacientes/' + getCookie('grupo')).child(paciente.key).update({
            'id': newId
          });

          for (var key in paciente.grabaciones) {
            firebase.database().ref('grabaciones/' + getCookie('grupo')).child(key).update({
              'paciente': newId
            });
          }

        } else {
          if (!isNaN(input.$modelValue) && input.$modelValue !== null) {
            paciente.altura = input.$modelValue;
            firebase.database().ref('pacientes/' + getCookie('grupo')).child(paciente.key).update({
              'altura': CryptoJS.AES.encrypt(paciente.altura.toString(), getCookie('clave')).toString()
            });
          } else {
            delete paciente.altura;
            firebase.database().ref('pacientes/' + getCookie('grupo')).child(paciente.key).child('altura').remove();
          }
        }
      },
      targetEvent: event,
      title: campo === 'identificador' ? 'Identificador' : 'Altura',
      cancel: "cancelar",
      ok: "guardar",
      type: campo === 'identificador' ? 'text' : 'number',
    };

    if (campo === 'identificador') {
      editDialog['validators'] = {
        'md-maxlength': 30,
        'md-minlength': 3,
        'aria-label': "identificador"
      };
    } else {
      editDialog['validators'] = {
        'min': 100,
        'max': 220,
        'aria-label': "altura"
      };
    }

    let promise;
    promise = $mdEditDialog.large(editDialog);

    promise.then(function (ctrl) {
      let input = ctrl.getInput();
      input.$viewChangeListeners.push(function () {
        input.$setValidity('test', input.$modelValue !== 'test');
      });
    });
  };

  $scope.editarPeso = function (event, paciente) {
    event.stopPropagation(); // in case autoselect is enabled
    let editDialog = {
      modelValue: Number(paciente.peso),
      placeholder: 'Peso',
      save: function (input) {
        if (!isNaN(input.$modelValue) && input.$modelValue !== null) {
          paciente.peso = input.$modelValue;
          firebase.database().ref('pacientes/' + getCookie('grupo')).child(paciente.key).update({
            'peso': CryptoJS.AES.encrypt(paciente.peso.toString(), getCookie('clave')).toString()
          });
        } else {
          firebase.database().ref('pacientes/' + getCookie('grupo')).child(paciente.key).child('peso').remove();
          delete paciente.peso;
        }
      },
      targetEvent: event,
      title: 'Peso',
      cancel: "cancelar",
      ok: "guardar",
      type: 'number',
    };

    editDialog['validators'] = {
      'min': 0,
      'max': 220,
      'aria-label': "peso"
    };

    let promise;
    promise = $mdEditDialog.large(editDialog);
    promise.then(function (ctrl) {
      let input = ctrl.getInput();
      input.$viewChangeListeners.push(function () {
        input.$setValidity('test', input.$modelValue !== 'test');
      });
    });
  };

  $scope.editarInicioEnfermedad = function (event, paciente) {
    event.stopPropagation(); // in case autoselect is enabled
    let editDialog = {
      modelValue: Number(paciente.inicioEnfermedad),
      placeholder: 'Inicio enfermedad',
      save: function (input) {
        if (!isNaN(input.$modelValue)) {
          paciente.inicioEnfermedad = input.$modelValue;
          firebase.database().ref('pacientes/' + getCookie('grupo')).child(paciente.key).update({
            'inicioEnfermedad': CryptoJS.AES.encrypt(paciente.inicioEnfermedad.toString(), getCookie('clave')).toString()
          });
        }
      },
      targetEvent: event,
      title: 'Inicio Enfermedad',
      cancel: "cancelar",
      ok: "guardar",
      type: 'number',
    };

    editDialog['validators'] = {
      'min': 0,
      'aria-label': "inicioEnfermedad"
    };


    let promise;
    promise = $mdEditDialog.large(editDialog);

    promise.then(function (ctrl) {
      let input = ctrl.getInput();
      input.$viewChangeListeners.push(function () {
        input.$setValidity('test', input.$modelValue !== 'test');
      });
    });
  };

  $scope.editarFecha = function (event, paciente) {
    event.stopPropagation(); // in case autoselect is enabled
    $mdEditDialog.show({
      targetEvent: event,
      tableCell: event.currentTarget,
      title: 'Fecha nacimiento',
      cancel: "cancelar",
      ok: "guardar",
      controller: editarFechaController,
      template: '<md-edit-dialog style="left: 52px; top: 228.391px; min-width: 149px;" class="ng-scope md-whiteframe-1dp"><div layout="column" class="md-content layout-column"><div class="md-title ng-binding ng-scope" style="">Fecha nacimiento</div>' +
      '<md-datepicker name="fecha" required ng-model="fechaNacimiento" md-current-view="year" md-hide-icons="calendar" autocomplete=\'bday\'>' +
      '</md-datepicker>' +
      '<div layout="row" layout-align="end" class="md-actions ng-scope layout-align-end-stretch layout-row" style="color: blue;">' +
      '<button class="md-primary md-button md-ink-ripple" type="button" ng-click="close()">cancelar</button>' +
      '<button class="md-primary md-button md-ink-ripple" type="button" ng-click="guardarFecha()">guardar</button>' +
      '</div>' +
      '</md-edit-dialog>',
      locals: {
        paciente: paciente
      }
    });

    function editarFechaController($scope, $mdEditDialog, paciente, $element) {
      let fecha = paciente.fechaNacimiento.value.split("/");
      $scope.fechaNacimiento = new Date(fecha[2] + "-" + fecha[1] + "-" + fecha[0]);
      $scope.close = function () {
        $element.remove();
      };

      $scope.guardarFecha = function () {
        let fechaFormateada = moment($scope.fechaNacimiento).format('DD/MM/YYYY');
        paciente.fechaNacimiento.value = fechaFormateada;
        paciente.fechaNacimiento.ts = $scope.fechaNacimiento.getTime();
        paciente.edad = calcularEdad($scope.fechaNacimiento);
        firebase.database().ref('pacientes/' + getCookie('grupo')).child(paciente.key).update({'fechaNacimiento': CryptoJS.AES.encrypt(fechaFormateada, getCookie('clave')).toString()});
        let fechaNacimientoPartida = paciente.fechaNacimiento.value.split("/");
        let fechaNacimiento = new Date(fechaNacimientoPartida[2], fechaNacimientoPartida[1] - 1, fechaNacimientoPartida[0]);
        for (let key in paciente.grabaciones) {
          firebase.database().ref('grabaciones/').child(getCookie('grupo')).child(key).once('value', function (grabacion) {
            let childData = grabacion.val();
            let fechaGrabacionPartida = CryptoJS.AES.decrypt(childData.fechaGrabacion, getCookie('clave')).toString(CryptoJS.enc.Utf8).split("/");
            let fechaGrabacion = new Date(fechaGrabacionPartida[2], fechaGrabacionPartida[1] - 1, fechaGrabacionPartida[0]);
            let edadGrabacion = calcularEdadEnFecha(fechaNacimiento, fechaGrabacion);
            let edadPaciente = calcularEdad(fechaNacimiento);

            firebase.database().ref('grabaciones/' + getCookie('grupo')).child(key).update({
              'edadPaciente': CryptoJS.AES.encrypt(edadPaciente.toString(), getCookie('clave')).toString(),
              'edadGrabacion': CryptoJS.AES.encrypt(edadGrabacion.toString(), getCookie('clave')).toString()
            }).then(function (fin) {
            })
          });

        }
        $scope.close();
      };
    }
  };

  $scope.editarClasificacion = function (paciente) {
    firebase.database().ref('pacientes/' + getCookie('grupo')).child(paciente.key).update({'clasificacion': CryptoJS.AES.encrypt(paciente.clasificacion, getCookie('clave')).toString()})
  };

  $scope.editarSexo = function (paciente) {
    firebase.database().ref('pacientes/' + getCookie('grupo')).child(paciente.key).update({'sexo': CryptoJS.AES.encrypt(paciente.sexo, getCookie('clave')).toString()})
  };

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

  function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  function calcularEdad(birthDate) {
    var today = new Date();
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  function calcularEdadEnFecha(birthDate, fecha) {
    var age = fecha.getFullYear() - birthDate.getFullYear();
    var m = fecha.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && fecha.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

}]);
