app.controller('GrabacionController', ['$mdEditDialog', '$q', '$scope', '$timeout', '$mdDialog', '$routeParams', '$location', '$mdToast', '$mdBottomSheet', function ($mdEditDialog, $q, $scope, $timeout, $mdDialog, $routeParams, $location, $mdToast, $mdBottomSheet) {
  'use strict';
  $scope.user = false;
  $scope.configuracion = true;
  $scope.editaCSV = false;
  $scope.editaVideo = false;
  $scope.formatos = "";
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
    filter: '',
    filterRow: 'id',
    order: 'id',
    limit: 10,
    page: 1
  };

  $scope.tabla = ['Fecha grabación', 'Lugar', 'Paciente', 'Edad', 'Edad grabación', 'Grabación', 'CSV', 'Video', 'Atributos extra', 'Notas'];
  $scope.seleccionado = ['Fecha grabación', 'Lugar', 'Paciente', 'Edad', 'Edad grabación', 'Grabación', 'CSV', 'Video', 'Atributos extra', 'Notas'];
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

  $scope.isIndeterminate = function() {
    return ($scope.seleccionado.length !== 0 &&
      $scope.seleccionado.length !== $scope.tabla.length);
  };

  $scope.isChecked = function() {
    return $scope.seleccionado.length === $scope.tabla.length;
  };

  $scope.toggleAll = function() {
    if ($scope.seleccionado.length === $scope.tabla.length) {
      $scope.seleccionado = [];
    } else if ($scope.seleccionado.length === 0 || $scope.seleccionado.length > 0) {
      $scope.seleccionado = $scope.tabla.slice(0);
    }
  };

  function cargarGrabaciones() {
    let grabacionesMostrar = {};
    let grabaciones = [];
    let database = firebase.database();
    let grabacionesRef = database.ref('grabaciones/' + getCookie('grupo'));
    let error = false;

    $scope.promise = grabacionesRef.once('value', function (grabacion) {
      grabacion.forEach(function (grabacionHija) {
        let childData = grabacionHija.val();
        try{
        if (($scope.filter === '' || (childData[$scope.query.filterRow] !== undefined && CryptoJS.AES.decrypt(childData[$scope.query.filterRow], getCookie('clave')).toString(CryptoJS.enc.Utf8).toLowerCase().indexOf($scope.query.filter.toLowerCase()) > -1))) { //En caso de haber filtro solo se muestran las grabaciones que lo cumplen
          if (($routeParams.paciente !== 'all' && (CryptoJS.AES.decrypt(childData['paciente'], getCookie('clave')).toString(CryptoJS.enc.Utf8).toLowerCase().indexOf($routeParams.paciente.toLowerCase()) > -1)) || $routeParams.paciente === 'all') {
            for (let clave in childData) {
              if (childData.hasOwnProperty(clave) && clave !== 'extra' && clave !== 'grabacion' && clave !== 'fechaGrabacion' && clave !== 'notasVideo' && clave !== 'video') {
                if ((clave === 'edadPaciente' || clave === 'edadGrabacion') && childData[clave] !== undefined  && childData[clave] !== '') {
                  childData[clave] = Number(CryptoJS.AES.decrypt(childData[clave], getCookie('clave')).toString(CryptoJS.enc.Utf8));
                } else {
                  childData[clave] = CryptoJS.AES.decrypt(childData[clave], getCookie('clave')).toString(CryptoJS.enc.Utf8);
                }
              } else if (clave === 'extra') {
                for (let claveExtra in childData[clave]) {
                  childData[clave][claveExtra] = CryptoJS.AES.decrypt(childData[clave][claveExtra], getCookie('clave')).toString(CryptoJS.enc.Utf8);
                }
              } else if (clave === 'fechaGrabacion') {
                let dateString = CryptoJS.AES.decrypt(childData[clave], getCookie('clave')).toString(CryptoJS.enc.Utf8);
                let dateParts = dateString.split("/");
                let dateObjectGrabacion = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
                childData[clave] = {'value': dateString, 'ts': dateObjectGrabacion.getTime()};
              } else if (clave === 'notasVideo') {
                for (let claveExtra in childData[clave]) {
                  for (let claveExtraExtra in childData[clave][claveExtra]) {
                    childData[clave][claveExtra][claveExtraExtra] = CryptoJS.AES.decrypt(childData[clave][claveExtra][claveExtraExtra], getCookie('clave')).toString(CryptoJS.enc.Utf8);
                  }
                }
              }else if (clave === 'video'){
                childData[clave] = childData[clave];
                childData['videoMostrar'] = childData[clave].split("-")[0] + "." + childData[clave].split(".")[1];
              }else if (clave === 'grabacion'){
                childData[clave] = childData[clave];
                childData['grabacionMostrar'] = childData[clave].split("-")[0] + "." + childData[clave].split(".")[1];
              }
            }
            childData['key'] = grabacionHija.key;
            grabaciones.push(childData);
          }

        }
        }
        catch (err) {
          console.log(err);
          error = true;
        }
      });
      if (error){
        showToast("La clave de encriptación introducida es incorrecta, inicie sesión de nuevo");
      }
      grabacionesMostrar['count'] = grabaciones.length;
      grabacionesMostrar['data'] = grabaciones;
      return grabacionesMostrar;
    });
    return grabacionesMostrar;
  }

  //Cargar pacientes para mostrar en cada grabación
  function cargarPacientes() {
    let pacientes = [];
    let database = firebase.database();
    let pacientesRef = database.ref('pacientes/' + getCookie('grupo'));
    $scope.promise = pacientesRef.once('value', function (paciente) {
      paciente.forEach(function (pacienteHijo) {
        let childData = pacienteHijo.val();
          for (let clave in childData) {
            if (childData.hasOwnProperty(clave) && clave !== 'extra') {
              childData[clave] = CryptoJS.AES.decrypt(childData[clave], getCookie('clave')).toString(CryptoJS.enc.Utf8);
            } else {
              for (let claveExtra in childData[clave]) {
                childData[clave][claveExtra] = CryptoJS.AES.decrypt(childData[clave][claveExtra], getCookie('clave')).toString(CryptoJS.enc.Utf8);
              }
            }
          }
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
      if (pacienteCreado.creado) {
        $scope.loadStuff();
      }

    })
  };

  $scope.borrarGrabaciones = function (event) {
    $scope.mostrarConfirmarBorrado(event);
  };

  $scope.mostrarConfirmarBorrado = function (ev) {
    // Appending dialog to document.body to cover sidenav in docs app
    var confirm = $mdDialog.confirm()
      .title('Desea eliminar ' + ($scope.selected.length > 1 ? 'las grabaciones seleccionadas?' : 'la grabación seleccionada?'))
      .textContent('Esta acción no se podrá deshacer.')
      .targetEvent(ev)
      .ok('Continuar')
      .cancel('Cancelar');

    $mdDialog.show(confirm).then(function () {
      let database = firebase.database();
      let grabacionesRef = database.ref('grabaciones/' + getCookie('grupo'));
      for (let i = 0; i < $scope.selected.length; i++) {//Borramos todas las grabaciones seleccionadas
        firebase.storage().ref('grabacionesJSON/' + getCookie('grupo') + "/" +$scope.selected[i].grabacion.split(".")[0] + ".json").delete();
        firebase.storage().ref('grabaciones/' + getCookie('grupo') + "/" + $scope.selected[i].grabacion).delete();
        if ($scope.selected[i].video !== undefined) {
          firebase.storage().ref('videos/' + getCookie('grupo') + "/" + $scope.selected[i].video).delete();
        }
        if ($scope.selected[i].paciente !== undefined) {
          firebase.database().ref('pacientes').child(getCookie('grupo')).child($scope.selected[i].pacienteKey).child('grabaciones').child($scope.selected[i].key).remove();
        }
        grabacionesRef.child($scope.selected[i].key).remove()
          .catch(err => {
            showToast("Problema borrando grabación", err);
          });
      }
      showToast(($scope.selected.length > 1 ? 'Grabaciones borradas ' : 'Grabación borrada ') + "correctamente");

      $scope.selected = [];
      $scope.loadStuff();
    }, function () {
      showToast("Borrado de " + ($scope.selected.length > 1 ? 'grabaciones' : 'grabación') + " cancelado")
    });

    function showToast(content) {
      $mdToast.show($mdToast.simple()
        .content(content)
        .position('bottom right')
        .hideDelay(3000));
    }
  };

  $scope.editarCampo = function (event, grabacion, campo) {
    event.stopPropagation(); // in case autoselect is enabled
    let editDialog = {
      modelValue: campo === 'identificador' ? grabacion.id : grabacion.lugar,
      placeholder: campo === 'identificador' ? 'Identificador' : 'Lugar',
      save: function (input) {
        if (campo === 'identificador') {
          grabacion.id = input.$modelValue;
          firebase.database().ref('grabaciones/' + getCookie('grupo')).child(grabacion.key).update({
            'id': CryptoJS.AES.encrypt(grabacion.id.toString(), getCookie('clave')).toString()
          });
        } else {
          grabacion.lugar = input.$modelValue;
          firebase.database().ref('grabaciones/' + getCookie('grupo')).child(grabacion.key).update({
            'lugar': CryptoJS.AES.encrypt(grabacion.lugar.toString(), getCookie('clave')).toString()
          });
        }
      },
      targetEvent: event,
      title: campo === 'identificador' ? 'Identificador' : 'Lugar',
      cancel: "cancelar",
      ok: "guardar",
      type: 'text',
      validators: {
        'md-maxlength': 40,
        'md-minlength': 3
      }
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

  $scope.editarFecha = function (event, grabacion) {
    event.stopPropagation(); // in case autoselect is enabled
    $mdEditDialog.show({
      targetEvent: event,
      tableCell: event.currentTarget,
      title: 'Fecha nacimiento',
      cancel: "cancelar",
      ok: "guardar",
      controller: editarFechaController,
      template: '<md-edit-dialog style="left: 52px; top: 228.391px; min-width: 149px;" class="ng-scope md-whiteframe-1dp"><div layout="column" class="md-content layout-column"><div class="md-title ng-binding ng-scope" style="">Fecha nacimiento</div>' +
      '<md-datepicker name="fecha" required ng-model="fechaGrabacion" md-current-view="year" md-hide-icons="calendar" autocomplete=\'bday\'>' +
      '</md-datepicker>' +
      '<div layout="row" layout-align="end" class="md-actions ng-scope layout-align-end-stretch layout-row" style="color: blue;">' +
      '<button class="md-primary md-button md-ink-ripple" type="button" ng-click="close()">cancelar</button>' +
      '<button class="md-primary md-button md-ink-ripple" type="button" ng-click="guardarFecha()">guardar</button>' +
      '</div>' +
      '</md-edit-dialog>',
      locals: {
        grabacion: grabacion,
        pacientes: $scope.pacientes
      }
    });

    function editarFechaController($scope, $mdEditDialog, grabacion, pacientes, $element) {
      let fecha = grabacion.fechaGrabacion.value.split("/");
      $scope.fechaGrabacion = new Date(fecha[2] + "-" + fecha[1] + "-" + fecha[0]);
      $scope.close = function () {
        $element.remove();
      };

      $scope.guardarFecha = function () {
        let fechaFormateada = moment($scope.fechaGrabacion).format('DD/MM/YYYY');
        grabacion.fechaGrabacion.value = fechaFormateada;
        grabacion.fechaGrabacion.ts = $scope.fechaGrabacion.getTime();
        if (grabacion.paciente !== undefined && grabacion.paciente !== ""){
          for (var paciente in pacientes)
          {
            if (pacientes[paciente].id === grabacion.paciente)
            {
              let fechaArray = pacientes[paciente].fechaNacimiento.split("/");
              let fecha = new Date(fechaArray[2] + "-" + fechaArray[1] + "-" + fechaArray[0]);
              let edadGrabacion = calcularEdadEnFecha(fecha, $scope.fechaGrabacion);
              grabacion.edadGrabacion = edadGrabacion;
              firebase.database().ref('grabaciones/' + getCookie('grupo')).child(grabacion.key).update({
                'fechaGrabacion': CryptoJS.AES.encrypt(fechaFormateada, getCookie('clave')).toString(),
                'edadGrabacion': CryptoJS.AES.encrypt(edadGrabacion.toString(), getCookie('clave')).toString()
              });
              break;
            }
          }
        }else{
          firebase.database().ref('grabaciones/' + getCookie('grupo')).child(grabacion.key).update({
            'fechaGrabacion': CryptoJS.AES.encrypt(fechaFormateada, getCookie('clave')).toString()
          });
        }

        $scope.close();
      };
    }
  };

  $scope.editarCSV = function (event, grabacion) {
    event.stopPropagation(); // in case autoselect is enabled
    $mdEditDialog.show({
      targetEvent: event,
      tableCell: event.currentTarget,
      title: 'CSV Grabación',
      cancel: "cancelar",
      ok: "guardar",
      controller: editarCSVController,
      template: '<md-edit-dialog style="left: 52px; top: 228.391px; min-width: 149px;" class="ng-scope md-whiteframe-1dp"><div layout="column" class="md-content layout-column"><div class="md-title ng-binding ng-scope" style="">CSV Grabación</div>' +
      '<form name="formEditar" ng-submit="guardar()">'+
      '<aps-edit-file></aps-edit-file>' +
      '<button class="md-primary md-button md-ink-ripple" type="button" ng-click="close()">cancelar</button>' +
      '<button  type="submit" class="md-primary md-button md-ink-ripple" ng-disabled="formEditar.$invalid">guardar</button>' +
        '</form>' +
      '</div>' +
      '</md-edit-dialog>',
      locals: {
        grabacion: grabacion
      }
    });

    function editarCSVController($scope, $mdEditDialog, grabacion, $element) {
      $scope.editaVideo = false;
      $scope.editaCSV = true;
      $scope.formatos = ".csv";
      $scope.guardar = function () {
       if ($scope.files[0]) {
         firebase.storage().ref('grabacionesJSON/' + getCookie('grupo') + "/" + grabacion.grabacion.split(".")[0] + ".json").delete();
         firebase.storage().ref('grabaciones/' + getCookie('grupo') + "/" + grabacion.grabacion).delete();
         let reader = new FileReader();
         let fileId = $scope.files[0].name.split(".")[0] + "-" + guid() + ".csv";
         reader.onload = function () {
           let file = reader.result;
           almacenarFicheroGrabacion(file, fileId);
           subirFicheroConvertidoJSON(file, fileId);
         };
         firebase.database().ref('grabaciones/' + getCookie('grupo')).child(grabacion.key).update({'grabacion': fileId});
         grabacion.grabacion = fileId;
         grabacion.grabacionMostrar =  $scope.files[0].name;
         reader.readAsText($scope.files[0]);
       }
        $scope.close();
      };

      $scope.close = function () {
        $element.remove();
      };
    }

    function almacenarFicheroGrabacion(file, id) {
      let storageRef = firebase.storage().ref('grabaciones/'+ getCookie('grupo') + "/" + id);
      let task = storageRef.putString(CryptoJS.AES.encrypt(file, getCookie('clave')).toString());
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
        camara[linea[0]] = joints;//Añadimos los joints a la unidad de tiempo
      }

      file = JSON.stringify(camara);
      firebase.storage().ref('grabacionesJSON/' + getCookie('grupo') + "/" + fileId.split(".")[0] + ".json").putString(CryptoJS.AES.encrypt(file, getCookie('clave')).toString());
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
  };

  $scope.editarVideo = function (event, grabacion) {
    event.stopPropagation(); // in case autoselect is enabled
    $mdEditDialog.show({
      targetEvent: event,
      tableCell: event.currentTarget,
      title: 'Video grabación',
      cancel: "cancelar",
      ok: "guardar",
      controller: editarVideoController,
      template: '<md-edit-dialog style="left: 52px; top: 228.391px; min-width: 149px;" class="ng-scope md-whiteframe-1dp"><div layout="column" class="md-content layout-column"><div class="md-title ng-binding ng-scope" style="">Video grabación</div>' +
      '<form>'+
      '<aps-edit-file></aps-edit-file>' +
      '<button class="md-primary md-button md-ink-ripple" type="button" ng-click="close()">cancelar</button>' +
      '<button class="md-primary md-button md-ink-ripple" ng-click="guardar()">guardar</button>' +
      '</form>' +
      '</div>' +
      '</md-edit-dialog>',
      locals: {
        grabacion: grabacion
      }
    });

    function editarVideoController($scope, $mdEditDialog, grabacion, $element) {
      $scope.editaVideo = true;
      $scope.editaCSV = false;
      $scope.formatos = "video/*";
      $scope.guardar = function () {
        if ($scope.files !== undefined && $scope.files[0]) {
          if (grabacion.video !== undefined && grabacion.video !== ""){
            firebase.storage().ref('videos/' + getCookie('grupo') + "/" + grabacion.video).delete();
          }
          let videoFile = $scope.files[0];
          let videoFileId = videoFile.name.split(".")[0] + "-" + guid() + "." + videoFile.name.split(".")[1];
          firebase.database().ref('grabaciones/' + getCookie('grupo')).child(grabacion.key).update({'video': videoFileId});
          almacenarFicheroGrabacionVideo(videoFile, videoFileId);
          grabacion.video = videoFileId;
          grabacion.videoMostrar = videoFile.name;
        }
        $scope.close();
      };

      $scope.close = function () {
        $element.remove();
      };
    }

    function almacenarFicheroGrabacionVideo(file, fileId) {

      let storageRef = firebase.storage().ref('videos/' + getCookie('grupo') + "/" + fileId);

      let reader = new FileReader();
      reader.onload = function (e) {
        let encriptado = CryptoJS.AES.encrypt(e.target.result, getCookie('clave'));
        let blobEncriptado = new Blob([encriptado], {type: "data:application/octet-stream"});
        let task = storageRef.put(blobEncriptado);
        task.on('state_changed', function progress(snapshot) {
        }, function error(err) {
          console.log(err);
        }, function complete() {
          console.log("fichero subido");
        });
      };
      reader.readAsDataURL(file);
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
  };

  $scope.actualizarPaciente = function (paciente, grabacion) {
    if (paciente === undefined) {//Si se deja sin asignar la grabacion
      delete grabacion.edadGrabacion;
      delete grabacion.edadPaciente;
      firebase.database().ref('grabaciones/' + getCookie('grupo')).child(grabacion.key).update({
        'paciente': '',
        'pacienteKey': '',
        'edadPaciente': '',
        'edadGrabacion': ''
      }).then(function (actualizado) {
        if (grabacion.paciente !== "") {
          firebase.database().ref('pacientes/' + getCookie('grupo')).child(grabacion.pacienteKey).child('grabaciones').child(grabacion.key).remove();
        }
        showToast("Grabación actualizada");
      });
    } else if ((paciente.id) !== grabacion.paciente) {
      let fechaNacimientoPartida = paciente.fechaNacimiento.split("/");
      let fechaNacimiento = new Date(fechaNacimientoPartida[2], fechaNacimientoPartida[1] - 1, fechaNacimientoPartida[0]);

      let fechaGrabacionPartida = grabacion.fechaGrabacion.value.split("/");
      let fechaGrabacion = new Date(fechaGrabacionPartida[2], fechaGrabacionPartida[1] - 1, fechaGrabacionPartida[0]);

      grabacion.edadGrabacion = calcularEdadEnFecha(fechaNacimiento, fechaGrabacion);
      grabacion.edadPaciente = calcularEdad(fechaNacimiento);
      firebase.database().ref('grabaciones/' + getCookie('grupo')).child(grabacion.key).update({
        'paciente': CryptoJS.AES.encrypt(paciente.id, getCookie('clave')).toString(),
        'pacienteKey': CryptoJS.AES.encrypt(paciente.key, getCookie('clave')).toString(),
        'edadPaciente': CryptoJS.AES.encrypt(calcularEdad(fechaNacimiento).toString(), getCookie('clave')).toString(),
        'edadGrabacion': CryptoJS.AES.encrypt(calcularEdadEnFecha(fechaNacimiento, fechaGrabacion).toString(), getCookie('clave')).toString()
      }).then(function (actualizado) {
        firebase.database().ref('pacientes/' + getCookie('grupo')).child(paciente.key).child('grabaciones').child(grabacion.key).set(true);
        if (grabacion.paciente !== "") {
          firebase.database().ref('pacientes/' + getCookie('grupo')).child(grabacion.pacienteKey).child('grabaciones').child(grabacion.key).remove();
        }
        showToast("Grabación actualizada, paciente " + paciente.id + " asignado");
      });
    }
  };

  $scope.limpiarBuscador = function () {
    $scope.searchTerm = '';
  };

  window.mdSelectOnKeyDownOverride = function (event) {
    event.stopPropagation();
  };

//Ver atributos extra de la grabación
  $scope.verAtributosExtra = function (event, grabacion) {
    $mdDialog.show({
      parent: angular.element(document.body),
      // language=HTML
      template:
      '<md-dialog aria-label="List dialog" >' +
      '<md-toolbar>' +
      '          <div class="md-toolbar-tools">' +
      '            <h2>Atributos extra {{grabacion.id}}</h2>' +
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
        grabacion: grabacion
      },
      controller: DialogController
    });

    function DialogController($scope, $mdDialog, grabacion) {
      $scope.grabacion = grabacion;
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

        for (let clave in grabacion.extra) {
          $scope.atributosExtraNombre[$scope.nCampoExtra] = clave;
          $scope.selectedItem[$scope.nCampoExtra] = {value: clave, display: clave};
          $scope.searchText[$scope.nCampoExtra] = clave;
          $scope.atributosExtraValor[$scope.nCampoExtra] = grabacion.extra[clave];
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
        firebase.database().ref('camposExtraGrabaciones/').push($scope.searchText[n]).then(function (snapshot) {
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
          delete grabacion['extra'];
        } else {
          grabacion.extra = atributosExtraLocal;
        }

        firebase.database().ref('grabaciones/' + getCookie('grupo')).child(grabacion.key).child('extra').set(atributosExtraFirebase).then(function () {
          $scope.closeDialog(true);
        })
      };
    }
  };

  $scope.gestionarNotas = function (event, grabacion) {
    $mdDialog.show({
      parent: angular.element(document.body),
      clickOutsideToClose: true,
      template:
      '<md-dialog id="csv-dialog" aria-label="VerGrabacion">' +
      '<md-toolbar>' +
      '          <div class="md-toolbar-tools">' +
      '            <h2>Gestión notas</h2>' +
      '            <span flex></span>' +
      '            <md-button class="md-icon-button" ng-click="closeDialog()">' +
      '              <md-icon md-svg-src="img/icons/ic_close_24px.svg" aria-label="Close dialog"></md-icon>' +
      '            </md-button>' +
      '          </div>' +
      '</md-toolbar>' +
      '<md-dialog-content>' +
      '    <md-toolbar class="md-table-toolbar md-default" ng-show="filter.show && !selected.length">\n' +
      '      <div class="md-toolbar-tools">\n' +
      '        <md-icon>search</md-icon>\n' +
      '        <form flex name="filter.form">\n' +
      '          <input type="text" ng-model="query.filter" ng-model-options="filter.options"\n' +
      '                 placeholder="Escriba el id de la grabación a buscar">\n' +
      '        </form>\n' +
      '        <md-button class="md-icon-button" ng-click="removeFilter()" title="Restaurar filtro">\n' +
      '          <md-icon>close</md-icon>\n' +
      '        </md-button>\n' +
      '      </div>\n' +
      '    </md-toolbar>\n' +
      '\n' +
      '    <md-toolbar class="md-table-toolbar alternate" ng-show="options.rowSelection && selected.length">\n' +
      '      <div class="md-toolbar-tools">\n' +
      '        {{selected.length}} {{selected.length > 1 ? \'notas seleccionadas\' : \'nota seleccionada\'}}\n' +
      '        <span flex></span>\n' +
      '        <md-button class="md-icon-button" ng-click="borrarGrabaciones($event)"\n' +
      '                   title="Borrar {{selected.length > 1 ? \'notas seleccionadas\' : \'nota seleccionada\'}}">\n' +
      '          <md-icon style="color: white">delete</md-icon>\n' +
      '        </md-button>\n' +
      '      </div>\n' +
      '\n' +
      '    </md-toolbar>\n' +
      '\n' +
      '    <md-table-container>\n' +
      '      <table md-table md-row-select="options.rowSelection" multiple="{{options.multiSelect}}" ng-model="selected"\n' +
      '             md-progress="promise">\n' +
      '        <thead md-head md-order="query.order" md-on-reorder="cargarNotas">\n' +
      '        <tr md-row>\n' +
      '          <th md-column md-order-by="segundo"><span>Minuto</span></th>\n' +
      '          <th md-column md-order-by="text"><span>Texto</span></th>\n' +
      '        </tr>\n' +
      '        </thead>\n' +
      '        <tbody md-body>\n' +
      '        <tr md-row md-select="nota" md-on-select="logItem" md-auto-select="options.autoSelect"\n' +
      '            ng-repeat="nota in notas.data | filter: filter.search | orderBy: query.order | limitTo: query.limit : (query.page -1) * query.limit">\n' +
      '          <td md-cell>\n' +
      '            {{nota.segundo}}\n' +
      '          </td>\n' +
      '          <td md-cell  ng-click="editarTexto($event, nota)" >\n' +
      '            {{nota.texto}}\n' +
      '          </td>\n' +
      '        </tr>\n' +
      '        </tbody>\n' +
      '      </table>\n' +
      '    </md-table-container>\n' +
      '    <md-table-pagination md-label="{page: \'Página:\', rowsPerPage: \'Filas por página:\', of: \'de\'}" md-limit="query.limit"\n' +
      '                         md-limit-options="limitOptions" md-page="query.page" md-total="{{notas.count}}"\n' +
      '                         md-page-select="options.pageSelect" md-boundary-links="options.boundaryLinks"\n' +
      '                         md-on-paginate="cargarNotas"></md-table-pagination>' +
      '</md-dialog-content>' +
      '</md-dialog>',
      targetEvent: event,
      multiple: true,
      locals: {
        grabacion: grabacion
      },
      controller: gestionNotasController
    });

    function gestionNotasController($scope, $mdDialog, grabacion) {
      $scope.searchTerm = '';
      $scope.selected = [];
      $scope.limitOptions = [10, 15, 20];
      $scope.notas = null;

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
        filterRow: 'segundo',
        order: 'segundo',
        limit: 10,
        page: 1
      };

      function cargarNotas() {
        let notasMostrar = {};
        let notas = [];
        let i = 0;
        for (let clave in grabacion.notasVideo) {
          grabacion.notasVideo[clave]['i'] = i;
          grabacion.notasVideo[clave]['key'] = clave;
          notas.push(grabacion.notasVideo[clave]);
          i++;
        }
        notasMostrar['data'] = notas;
        notasMostrar['count'] = notas.length;
        return notasMostrar;
      }

      $scope.borrarGrabaciones = function (event) {
        $scope.mostrarConfirmarBorrado(event);
      };

      $scope.mostrarConfirmarBorrado = function (ev) {
        // Appending dialog to document.body to cover sidenav in docs app
        var confirm = $mdDialog.confirm()
          .title('Desea eliminar ' + ($scope.selected.length > 1 ? 'las notas seleccionadas?' : 'la nota seleccionada?'))
          .textContent('Esta acción no se podrá deshacer.')
          .targetEvent(ev)
          .ok('Continuar')
          .cancel('Cancelar')
          .multiple(true);


        $mdDialog.show(confirm).then(function () {
          for (let i = 0; i < $scope.selected.length; i++) {//Borramos todas las grabaciones seleccionadas
            let keyNota = $scope.selected[i].key;
            firebase.database().ref('grabaciones/' + getCookie('grupo')).child(grabacion.key).child('notasVideo').child($scope.selected[i].key).remove().then(function () {
              delete grabacion.notasVideo[keyNota];
              showToast(($scope.selected.length > 1 ? 'Notas borradas ' : 'Nota borrada ') + "correctamente");
              $scope.selected = [];
              $scope.loadStuff();
            })
          }

        }, function () {
          showToast("Borrado de " + ($scope.selected.length > 1 ? 'notas' : 'nota') + " cancelado")
        });

        function showToast(content) {
          $mdToast.show($mdToast.simple()
            .content(content)
            .position('bottom right')
            .hideDelay(3000));
        }
      };

      //----------Gestión tabla----------//
      $scope.toggleLimitOptions = function () {
        $scope.limitOptions = $scope.limitOptions ? undefined : [5, 10, 15];
      };

      $scope.loadStuff = function () {
        $scope.promise = $timeout(function () {
          $scope.notas = cargarNotas();
          $scope.$apply;
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

      $scope.editarTexto = function (event, nota) {
        event.stopPropagation(); // in case autoselect is enabled
        let editDialog = {
          modelValue: nota.texto,
          placeholder: 'Texto',
          save: function (input) {
            if (input.$modelValue) {
              nota.texto = input.$modelValue;
              firebase.database().ref('grabaciones/' + getCookie('grupo')).child(grabacion.key).child('notasVideo').child(nota.key).update({
                'segundo': CryptoJS.AES.encrypt(nota.segundo.toString(), getCookie('clave')).toString(),
                'texto': CryptoJS.AES.encrypt(nota.texto.toString(), getCookie('clave')).toString(),
                'x': CryptoJS.AES.encrypt(nota.x.toString(), getCookie('clave')).toString(),
                'y': CryptoJS.AES.encrypt(nota.y.toString(), getCookie('clave')).toString()
              });
            }
          },
          targetEvent: event,
          title: 'Texto',
          cancel: "cancelar",
          ok: "guardar",
          type: 'text',
        };

        editDialog['validators'] = {
          'aria-label': "texto"
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

      $scope.closeDialog = function () {
        $mdDialog.hide();
      };
    }
  };

  $scope.previsualizarCSV = function (event, grabacion) {
    $mdDialog.show({
      parent: angular.element(document.body),
      clickOutsideToClose: true,
      template:
      '<md-dialog id="csv-dialog" aria-label="VerGrabacion">' +
      '<md-toolbar>' +
      '          <div class="md-toolbar-tools">' +
      '            <h2>Previsualizar CSV (primeras 200 líneas)</h2>' +
      '            <span flex></span>' +
      '            <md-button class="md-icon-button" ng-click="close()">' +
      '              <md-icon md-svg-src="img/icons/ic_close_24px.svg" aria-label="Close dialog"></md-icon>' +
      '            </md-button>' +
      '          </div>' +
      '</md-toolbar>' +
      '<md-dialog-content>' +
      '<md-progress-linear ng-disabled="!loading" ng-show="loading" md-mode="indeterminate"></md-progress-linear>' +
      '<div ng-show="loading" style="text-align: center; padding-top: 5%; padding-bottom: 5%; font-size: medium; font-weight: bold; color:#757575;" letter-spacing: .2px;>{{textoCarga}}</div>'+
      '<table class="prevCSVs">' +
      '<tr>' +
      '<th ng-repeat="c in fields">{{ c }}</th>' +
      '</tr>' +
      '<tr ng-repeat="r in results">' +
      '<td ng-repeat="c in getNumber(fieldsLength)">' +
      ' {{r[c]}}' +
      '</td>' +
      '</tr>' +
      '</table>' +
      '</md-dialog-content>' +
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
      $scope.textoCarga = "Cargando " + grabacion.split("-")[0] + "." + grabacion.split(".")[1];
      $scope.getNumber = function (num) {
        let arrayDeNumeros = new Array(num);
        for (let i = 0; i < num; i++) {//Para iterar por cada una de las columnas del csv
          arrayDeNumeros[i] = i;
        }
        return arrayDeNumeros;
      };
      let storage = firebase.storage();
      let pathReference = storage.ref('grabaciones/' + getCookie('grupo'));
      pathReference.child($scope.grabacion).getDownloadURL().then(function (url) {
        fetch(url)
          .then(res => res.blob()) // Gets the response and returns it as a blob
          .then(blob => {
            var reader = new FileReader();
            $scope.textoCarga = "Desencriptando " + grabacion.split("-")[0] + "." + grabacion.split(".")[1];
            $scope.$apply();
            reader.onload = function () {
              Papa.parse(CryptoJS.AES.decrypt(reader.result, getCookie('clave')).toString(CryptoJS.enc.Utf8), {
                complete: function (results) {
                  $scope.fields = results.data.shift();
                  $scope.fieldsLength = $scope.fields.length;
                  $scope.results = results.data.slice(0, 200);
                  $scope.loading = false;
                  $scope.$apply();
                }
              });
            };
            reader.readAsText(blob);
          });
      });

      $scope.close = function () {
        $mdDialog.hide();
      }
    }
  };

  $scope.verEsqueleto = function (event, grabacion) {
    $mdDialog.show({
      parent: angular.element(document.body),
      clickOutsideToClose: true,
      template:
      '<md-dialog aria-label="VerGrabacion" style="max-height: 90%; max-width: 90%; min-width: 50%; min-height: 50%;">' +
      ' <md-toolbar>' +
      '          <div class="md-toolbar-tools">' +
      '            <h2>Visualizar esqueleto</h2>' +
      '            <span flex></span>' +
      '            <md-button class="md-icon-button" ng-click="close()">' +
      '              <md-icon md-svg-src="img/icons/ic_close_24px.svg" aria-label="Close dialog"></md-icon>' +
      '            </md-button>' +
      '          </div>' +
      '        </md-toolbar>' +
      '<md-progress-linear ng-disabled="!loading" ng-show="loading" md-mode="indeterminate"></md-progress-linear>' +
      '<div ng-show="loading" style="text-align: center; padding-top: 5%; font-size: medium; font-weight: bold; color:#757575;" letter-spacing: .2px;>{{textoCarga}}</div>'+
      '<md-dialog-content ng-hide="loading">' +

      '<div flex-gt-sm="50" style="margin-left: 10px; margin-top: 10px;">' +
      'Visualizar: ' +
      '<md-checkbox ng-model="visualizarVideo" aria-label="visualizarVideo" ng-show="hayVideo">' +
      'Video' +
      '</md-checkbox>' +
      '<md-checkbox ng-model="visualizarEsqueleto" aria-label="visualizarEsqueleto">' +
      'Esqueleto Frontal' +
      '</md-checkbox>' +
      '<md-checkbox ng-model="visualizarEsqueletoLateral" aria-label="visualizarEsqueletoFrontal">' +
      'Esqueleto Lateral' +
      '</md-checkbox>' +
      '</div>' +
      ' <p style="margin-left: 10px; margin-top: 10px; font-size: 100%;"> Pulse en cualquier punto del esqueleto para añadir una nota.</p>' +
      '<div layout="row" ng-cloak="" layout-align="center center">' +
      '<div layout-align="center center" flex="65" style="margin-left: 10px; margin-right: 10px; margin-bottom: 10px;" ng-show="visualizarVideo">' +
      '<video layout-fill preload="auto" width="600;" id="videoEsqueleto" controls="false" onclick="this.paused?this.play():this.pause()">' +
      '</video>' +
      '</div>' +
      '<div flex="35" layout-align="center center" id="canvas-container" style="margin-right: 10px; margin-bottom: 10px;" ng-show="visualizarEsqueleto">' +
      '<canvas id="canvas" width="400" height="600" style="border:1px solid #d3d3d3; background-color: #f2f2f2;" title="Haz click en cualquier punto para añadir una nota"></canvas>' +
      '</div>' +
      '<div flex="35" layout-align="center center" id="canvas-container" style="margin-right: 10px; margin-bottom: 10px;" ng-show="visualizarEsqueletoLateral">' +
      '<canvas id="canvasLateral" width="400" height="600" style="border:1px solid #d3d3d3; background-color: #f2f2f2;" title="Haz click en cualquier punto para añadir una nota"></canvas>' +
      '</div>' +
      '</div>' +
      '<div layout="row" layout-align="center center" style="margin-bottom: 10px;">' +
      '<div class="preview-controls" id="controls">' +
      <!-- Seek Video Time Control  -->
      '<div class="time-bar">' +
      '<input id="time-seek" class="time-meter" type="range" min="0" max="100" value="0">' +
      '</div> ' +
      '<div class="control-bar">  ' +


      <!-- play / pause button -->
      '<div id="play/pause" class="preview-controls-main control">' +
      '	<i class="material-icons vid-icon">play_circle_outline</i>' +
      '</div>' +

      <!-- Current Time Display  -->
      '<div id="current-time" class="preview-controls-main time">' +
      '	0:00' +
      '</div>' +

      '<div class="right-side-controls">' +
      <!-- mute-unmute Control -->
      '<div class="volume-btn preview-controls-main control" id="mute/unmute">' +
      '	<i class="material-icons vid-icon">volume_up</i>' +
      '</div>' +
      '<!--change volume-->\n' +
      '<div id="volume-bar-holder" class="control">\n' +
      '<input id="volume-bar" type="range" value="0.5" min="0" max="1" step="0.1">\n' +
      '</div>' +
      '</div><!--end of right side controls div-->' +
      '</div><!--end of control bar div-->' +
      '</div><!--end of preview controls div-->' +
      '</div>' +
      '</md-dialog-content>' +
      '</md-dialog>',
      targetEvent: event,
      multiple: true,
      locals: {
        grabacion: grabacion
      },
      controller: EsqueletoController
    });

    function EsqueletoController($scope, $mdDialog, grabacion, $document) {
      $scope.grabacion = grabacion.grabacion;
      $scope.loading = true;
      $scope.visualizarEsqueleto = true;
      $scope.visualizarEsqueletoLateral = true;
      $scope.visualizarVideo = true;
      $scope.hayVideo = (grabacion.video !== undefined);
      $scope.tiempoActual = 0.0;
      $scope.duracion = 0;
      $scope.loading = true;
      $scope.textoCarga = "Cargando Video";

      let myTimer, data;
      let i;
      let j = 0;
      let x, y = 0;
      let hierarchy = [[1, 12, 16], [20], [3], [], [5], [6], [7], [21, 22], [9], [10], [11], [23, 24], [13], [14], [15], [], [17], [18], [19], [], [2, 4, 8], [], [], [], []];
      let pausa = false;
      let tiempoActual;
      let storage = firebase.storage();
      let pathReference = storage.ref('grabaciones/' + getCookie('grupo'));
      let notaEnPantalla = [];
      let tiemposEsqueleto = [0];
      let reinicioReproduccion = false;

      if ($scope.hayVideo) {
        $timeout(function () {
          let canvas = $document[0].getElementById("canvas");
          let canvasLateral = $document[0].getElementById("canvasLateral");
          let ctx = canvas.getContext('2d');
          let ctxLateral = canvasLateral.getContext('2d');
          let video = $document[0].getElementById("videoEsqueleto");
          video.controls = false;

          var oeplayPauseBtn = document.getElementById("play/pause");
          //current time holder
          var currentTimeView = document.getElementById("current-time");
          // time Slider
          var oeseekBar = document.getElementById("time-seek");
          var muteBtn = document.getElementById("mute/unmute");
          // volume Slider
          var volumeBar = document.getElementById("volume-bar");
          // current volume
          var currentVolume = volumeBar.value;

          //functionality
          //play-pause
          function playPause() {
            if (reinicioReproduccion === true) {
              reinicioReproduccion = false;
              myTimer = setInterval(pintarEsqueleto, 35);
              video.play();
              oeplayPauseBtn.innerHTML = '<i class="material-icons vid-icon">pause</i>';
            } else if (video.paused === true) {
              if (video.currentTime < video.duration) {
                video.play();
                oeplayPauseBtn.innerHTML = '<i class="material-icons vid-icon">pause</i>';
              } else if (pausa === false) {//Si el video es mas corto que el esqueleto y el video ya ha terminado
                pausa = true;
                oeplayPauseBtn.innerHTML = '<i class="material-icons vid-icon">play_circle_outline</i>';
              } else {
                pausa = false;
                oeplayPauseBtn.innerHTML = '<i class="material-icons vid-icon">pause</i>';
              }

            } else {
              video.pause();
              oeplayPauseBtn.innerHTML = '<i class="material-icons vid-icon">play_circle_outline</i>';
            }
          }

          oeplayPauseBtn.addEventListener('click', playPause);

          video.addEventListener('click', playPause);

          oeplayPauseBtn.addEventListener("mouseover", function () {
            $(this).css('cursor', 'pointer');
          });

          oeplayPauseBtn.addEventListener("mouseout", function () {
            $(this).css('cursor', 'auto');
          });

          muteBtn.addEventListener("mouseover", function () {
            $(this).css('cursor', 'pointer');
          });

          muteBtn.addEventListener("mouseout", function () {
            $(this).css('cursor', 'auto');
          });

          // update current time if seek bar for time changes
          oeseekBar.addEventListener('change', function () {
            var seekTo = $scope.duracion * (oeseekBar.value / 100);

            if (seekTo > video.duration) {
              video.currentTime = seekTo;
              let oldJ = j;
              j = closest(seekTo * 1000, tiemposEsqueleto);
              if ((j > (oldJ + 35)) || (j < (oldJ - 35))) {
                notaEnPantalla = [];
                for (let obj in grabacion.notasVideo) {
                  let t = closest(horasAMilisegundos(grabacion.notasVideo[obj].segundo), tiemposEsqueleto);
                  if ((j >= t) && (j <= (t + 100))) {
                    let nota = grabacion.notasVideo[obj];
                    nota['fila'] = t + 100;
                    notaEnPantalla.push(nota);
                  }
                }
              }
            } else {
              video.currentTime = seekTo;
              j = closest(seekTo * 1000, tiemposEsqueleto);
              video.play();
            }
            oeplayPauseBtn.innerHTML = '<i class="material-icons vid-icon">pause</i>';
          }, false);

          video.onpause = function () {
            pausa = true;
          };

          video.onplay = function () {
            pausa = false;
          };

          video.onended = function () {
            if ($scope.duracion > video.duration) {
              pausa = false;
            } else {
              j = 0;
              video.currentTime = 0;
              video.pause();
              pausa = true;
              oeplayPauseBtn.innerHTML = ' <i class="material-icons vid-icon">play_circle_outline</i>';
              reinicioReproduccion = true;
              oeseekBar.value = 0;
              clearInterval(myTimer);
            }
          };

          // mute-unmute
          muteBtn.addEventListener('click', function () {
            if (video.muted) {
              video.muted = false;
              muteBtn.innerHTML = '<i class="material-icons vid-icon">volume_up</i>';
              volumeBar.value = currentVolume;
            } else {
              video.muted = true;
              muteBtn.innerHTML = '<i class="material-icons vid-icon">volume_mute</i>';
              volumeBar.value = 0;
            }
          });

          // change volume
          volumeBar.addEventListener('change', function () {
            video.volume = volumeBar.value;
          });

          // Pause the video when the slider handle is being dragged
          oeseekBar.addEventListener("mousedown", function () {
            pausa = true;
          });

          // Play the video when the slider handle is dropped
          oeseekBar.addEventListener("mouseup", function () {
            pausa = false;
          });

          video.ontimeupdate = function () {
            if (video.currentTime === 0 && pausa === true) {
              video.pause();
            } else if (video.currentTime < video.duration) {
              oeseekBar.value = video.currentTime * (100 / $scope.duracion);

              let curMins = Math.floor(video.currentTime / 60);
              let curSecs = Math.floor(video.currentTime - curMins * 60);
              if (curSecs < 10) {
                curSecs = "0" + curSecs;
              }
              if (curMins < 10) {
                curMins = "0" + curMins;
              }

              let minsTotal = Math.floor($scope.duracion / 60);
              let secsTotal = Math.floor($scope.duracion - curMins * 60);
              if (secsTotal < 10) {
                secsTotal = "0" + secsTotal;
              }
              if (minsTotal < 10) {
                minsTotal = "0" + minsTotal;
              }
              currentTimeView.innerHTML = curMins + ":" + curSecs + "/" + minsTotal + ":" + secsTotal;

              let oldJ = j;
              j = closest(video.currentTime * 1000, tiemposEsqueleto);
              if ((j > (oldJ + 35)) || (j < (oldJ - 35))) {
                notaEnPantalla = [];
                for (let obj in grabacion.notasVideo) {
                  let t = closest(horasAMilisegundos(grabacion.notasVideo[obj].segundo), tiemposEsqueleto);
                  if ((j >= t) && (j <= (t + 100))) {
                    let nota = grabacion.notasVideo[obj];
                    nota['fila'] = t + 100;
                    notaEnPantalla.push(nota);
                  }
                }
              }
            }else{
              video.currentTime = video.duration;
            }
          };

          canvas.addEventListener("click", function (evt) {
            var mousePos = getMousePos(canvas, evt);
            // alert(mousePos.x + ',' + mousePos.y);
            showPrompt(evt, mousePos);
          }, false);

          canvas.addEventListener("mouseover", function () {
            $(this).css('cursor', 'pointer');
          });

          canvas.addEventListener("mouseout", function () {
            $(this).css('cursor', 'auto');
          });
          canvasLateral.addEventListener("click", function (evt) {
            var mousePos = getMousePos(canvasLateral, evt);
            // alert(mousePos.x + ',' + mousePos.y);
            showPrompt(evt, mousePos);
          }, false);

          canvasLateral.addEventListener("mouseover", function () {
            $(this).css('cursor', 'pointer');
          });

          canvasLateral.addEventListener("mouseout", function () {
            $(this).css('cursor', 'auto');
          });

          //Get Mouse Position
          function getMousePos(canvas, evt) {
            var rect = canvas.getBoundingClientRect();
            return {
              x: evt.clientX - rect.left,
              y: evt.clientY - rect.top
            };
          }

          function showPrompt(ev, posRaton) {
            // Appending dialog to document.body to cover sidenav in docs app
            var confirm = $mdDialog.prompt()
              .title('Tomar anotación')
              .placeholder('Anotación')
              .ariaLabel('Anotación')
              .targetEvent(ev)
              .multiple(true)
              .ok('Guardar!')
              .cancel('Cancelar');

            video.pause();
            pausa = true;

            $mdDialog.show(confirm).then(function (result) {
              if (result !== '' && result !== undefined) {
                let nota = {
                  x: CryptoJS.AES.encrypt(posRaton.x.toString(), getCookie('clave')).toString(),
                  y: CryptoJS.AES.encrypt(posRaton.y.toString(), getCookie('clave')).toString(),
                  segundo: CryptoJS.AES.encrypt(tiempoActual.toString(), getCookie('clave')).toString(),
                  texto: CryptoJS.AES.encrypt(result.toString(), getCookie('clave')).toString()
                };
                firebase.database().ref('grabaciones/' + getCookie('grupo')).child(grabacion.key).child('notasVideo').push(nota);
                nota = {x: posRaton.x, y: posRaton.y, segundo: tiempoActual.toString(), texto: result, fila: j + 100};
                if (grabacion.notasVideo === undefined) {//Si todavia no hay ninguna nota
                  grabacion['notasVideo'] = {result: nota};
                } else {
                  grabacion['notasVideo'][result] = nota;
                }
                notaEnPantalla.push(nota);
              }
              if ((video.duration < $scope.duracion && (video.currentTime < video.duration)) || (video.duration === $scope.duracion)) {

                video.play();
              }
              pausa = false;
            }, function () {
              if (video.duration < $scope.duracion && (video.currentTime < video.duration) || (video.duration === $scope.duracion)) {
                video.play();
              }
              pausa = false;
            });
          }

          firebase.storage().ref('videos/' + getCookie('grupo')).child(grabacion.video).getDownloadURL().then(function (url) {
            var xhr = new XMLHttpRequest();
            // xhr.responseType = 'application/octet-stream';
            $scope.textoCarga = "Desencriptando Video";
            $scope.$apply();
            xhr.onload = function (event) {
              var videoEncriptado = xhr.response;
              $scope.$apply();
              let videoDesencriptado = CryptoJS.AES.decrypt(videoEncriptado, getCookie('clave')).toString(CryptoJS.enc.Latin1);
              video.setAttribute('href', videoDesencriptado);
              addSourceToVideo(video, videoDesencriptado);
              $scope.textoCarga = "Cargando Esqueleto";
              $scope.$apply();
              pathReference.child($scope.grabacion).getDownloadURL().then(function (url) {
                fetch(url)
                  .then(res => res.blob()) // Gets the response and returns it as a blob
                  .then(blob => {
                    var reader = new FileReader();
                    $scope.textoCarga = "Desencriptando Esqueleto";
                    $scope.$apply();
                    reader.onload = function () {
                      Papa.parse(CryptoJS.AES.decrypt(reader.result, getCookie('clave')).toString(CryptoJS.enc.Utf8), {
                        complete: function (text) {
                          data = text;
                          for (let i = 1; i < (data.data.length - 2); i++) {
                            tiemposEsqueleto[i] = horasAMilisegundos(data.data[i][0]);
                          }
                          oeplayPauseBtn.innerHTML = '<i class="material-icons vid-icon">pause</i>';

                          if (video.duration < (tiemposEsqueleto[(tiemposEsqueleto.length - 2)] / 1000)) {
                            $scope.duracion = tiemposEsqueleto[(tiemposEsqueleto.length - 2)] / 1000;
                          } else {
                            $scope.duracion = video.duration;
                          }
                          $scope.loading = false;
                          $scope.$apply();
                          myTimer = setInterval(pintarEsqueleto, 35);
                        }
                      });
                    };
                    reader.readAsText(blob);
                  });
              });

            };
            xhr.open('GET', url);
            xhr.send();
          });


          function pintarEsqueleto() {
            if (!pausa) {
              j++;
              let x,y,z;
              if (video.duration < $scope.duracion && (video.currentTime === video.duration)) {
                oeseekBar.value = (tiemposEsqueleto[j] / 1000) * (100 / $scope.duracion);
                let curMins = Math.floor((tiemposEsqueleto[j] / 1000) / 60);
                let curSecs = Math.floor((tiemposEsqueleto[j] / 1000) - curMins * 60);
                if (curSecs < 10) {
                  curSecs = "0" + curSecs;
                }
                if (curMins < 10) {
                  curMins = "0" + curMins;
                }

                let minsTotal = Math.floor($scope.duracion / 60);
                let secsTotal = Math.floor($scope.duracion - minsTotal * 60);
                if (secsTotal < 10) {
                  secsTotal = "0" + secsTotal;
                }
                if (minsTotal < 10) {
                  minsTotal = "0" + minsTotal;
                }
                currentTimeView.innerHTML = curMins + ":" + curSecs + "/" + minsTotal + ":" + secsTotal;
              }
              if (j < (data.data.length - 2)) {//Para cada fila con datos
                let linea = data.data[j];
                tiempoActual = linea[0];
                for (let obj in grabacion.notasVideo) {
                  let nota = grabacion.notasVideo[obj];
                  if ((nota.segundo === tiempoActual) && !notaEnPantalla.includes(nota)) {
                    nota['fila'] = j + 100;
                    notaEnPantalla.push(nota);
                    break;
                  }
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.beginPath();
                ctxLateral.clearRect(0, 0, canvasLateral.width, canvasLateral.height);
                ctxLateral.beginPath();

                if (notaEnPantalla.length > 0) {
                  ctx.font = "22px Roboto";
                  ctx.fillStyle = "blue";
                  ctxLateral.font = "22px Roboto";
                  ctxLateral.fillStyle = "blue";
                  for (let n = 0; n < notaEnPantalla.length; n++) {
                    ctx.fillText(notaEnPantalla[n].texto, notaEnPantalla[n].x, notaEnPantalla[n].y);
                    ctxLateral.fillText(notaEnPantalla[n].texto, notaEnPantalla[n].x, notaEnPantalla[n].y);
                    if (notaEnPantalla[n].fila <= j) {
                      notaEnPantalla.shift();
                    }
                  }
                  ctx.closePath();
                  ctxLateral.closePath();
                }

                if (j === 1) {//Comenzar a reproducir el video al principio
                  video.play();
                }

                for (i = 1; i < (linea.length - 8); i = i + 4) {//Para cada uno de los joints
                  if (linea[i + 1] === "-" || linea[i + 1] === "-") {//Si no hay informacion sobre la posición
                    x = 0;
                    y = 0;
                    z = 0;
                  } else {
                    x = parseFloat(linea[i + 1].replace(",", ".")) * 300;
                    y = parseFloat(linea[i + 2].replace(",", ".")) * 300;
                    z = parseFloat(linea[i + 3].replace(",", ".")) * 300;
                    let joint = (i - 1) / 4;
                    for (let k = 0; k < hierarchy[joint].length; k++) {//Para cada una de las articulaciones hija
                      let jointHijo = hierarchy[joint][k];
                      let xHijo = parseFloat(linea[4 * jointHijo + 2].replace(",", ".")) * 300;
                      let yHijo = parseFloat(linea[4 * jointHijo + 3].replace(",", ".")) * 300;
                      let zHijo = parseFloat(linea[4 * jointHijo + 4].replace(",", ".")) * 300;
                      ctx.moveTo((canvas.width / 2) - x, (canvas.height / 2) - y);
                      ctx.lineTo((canvas.width / 2) - xHijo, (canvas.height / 2) - yHijo);//Pintar lineas
                      ctx.stroke();
                      ctxLateral.moveTo((canvasLateral.width / 2) - z, (canvasLateral.height / 2) - y);
                      ctxLateral.lineTo((canvasLateral.width / 2) - zHijo, (canvasLateral.height / 2) - yHijo);//Pintar lineas
                      ctxLateral.stroke();
                    }
                  }

                  if (linea[i] === "0") {//Si no es inferido pintar circulo verde
                    ctx.fillStyle = 'green';
                    ctxLateral.fillStyle = 'green';
                  } else {
                    ctx.fillStyle = 'red';
                    ctxLateral.fillStyle = 'red';
                  }

                  ctx.moveTo((canvas.width / 2) - x, (canvas.height / 2) - y);
                  ctx.arc((canvas.width / 2) - x, (canvas.height / 2) - y, 5, 0, 2 * Math.PI, false);//Pintar circulo
                  ctx.stroke();
                  ctx.fill();
                  ctxLateral.moveTo((canvasLateral.width / 2) - z, (canvasLateral.height / 2) - y);
                  ctxLateral.arc((canvas.width / 2) - z, (canvasLateral.height / 2) - y, 5, 0, 2 * Math.PI, false);//Pintar circulo
                  ctxLateral.stroke();
                  ctxLateral.fill();
                }
              } else if (video.currentTime === video.duration) {
                j = 0;
                video.currentTime = 0;
                video.pause();
                pausa = true;
                oeplayPauseBtn.innerHTML = ' <i class="material-icons vid-icon">play_circle_outline</i>';
                let minsTotal = Math.floor($scope.duracion / 60);
                let secsTotal = Math.floor($scope.duracion - minsTotal * 60);
                if (secsTotal < 10) {
                  secsTotal = "0" + secsTotal;
                }
                if (minsTotal < 10) {
                  minsTotal = "0" + minsTotal;
                }
                currentTimeView.innerHTML = '00' + ":" + '00' + "/" + minsTotal + ":" + secsTotal;
                reinicioReproduccion = true;
                oeseekBar.value = 0;
                clearInterval(myTimer);
              }
            }
          }

          function horasAMilisegundos(hora) {
            let a = hora.split(':'); // split it at the colons
            // minutes are worth 60 seconds. Hours are worth 60 minutes.
            let ms = ((+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2])) * 1000;
            return ms;
          }

          function closest(num, arr) {
            var mid;
            var lo = 0;
            var hi = arr.length - 1;
            while (hi - lo > 1) {
              mid = Math.floor((lo + hi) / 2);
              if (arr[mid] < num) {
                lo = mid;
              } else {
                hi = mid;
              }
            }
            if (num - arr[lo] <= arr[hi] - num) {
              return lo;
            }
            return hi;
          }
        });
      } else {
        $timeout(function () {
          $scope.visualizarVideo = false;
          $scope.textoCarga = "Cargando esqueleto";
          let canvas = $document[0].getElementById("canvas");
          let ctx = canvas.getContext('2d');
          let canvasLateral = $document[0].getElementById("canvasLateral");
          let ctxLateral = canvasLateral.getContext('2d');

          var oeplayPauseBtn = document.getElementById("play/pause");
          //current time holder
          var currentTimeView = document.getElementById("current-time");
          // time Slider
          var oeseekBar = document.getElementById("time-seek");

          //functionality
          //play-pause
          function playPause() {
            if (pausa === true) {
              if (reinicioReproduccion === true) {
                reinicioReproduccion = false;
                pausa = false;
                myTimer = setInterval(pintarEsqueleto, 35);
              }
              pausa = false;
              oeplayPauseBtn.innerHTML = '<i class="material-icons vid-icon">pause</i>';
            } else {
              pausa = true;
              oeplayPauseBtn.innerHTML = '<i class="material-icons vid-icon">play_circle_outline</i>';
            }
          }

          oeplayPauseBtn.addEventListener('click', playPause);


          oeplayPauseBtn.addEventListener("mouseover", function () {
            $(this).css('cursor', 'pointer');
          });

          oeplayPauseBtn.addEventListener("mouseout", function () {
            $(this).css('cursor', 'auto');
          });

          // update current time if seek bar for time changes
          oeseekBar.addEventListener('change', function () {
            var seekTo = ($scope.duracionEsqueleto) * (oeseekBar.value / 100);
            j = closest(seekTo * 1000, tiemposEsqueleto);
            oeplayPauseBtn.innerHTML = '<i class="material-icons vid-icon">pause</i>';
          }, false);

          // Pause the video when the slider handle is being dragged
          oeseekBar.addEventListener("mousedown", function () {
            pausa = true;
          });

          // Play the video when the slider handle is dropped
          oeseekBar.addEventListener("mouseup", function () {
            pausa = false;
          });

          canvas.addEventListener("click", function (evt) {
            var mousePos = getMousePos(canvas, evt);
            showPrompt(evt, mousePos);
          }, false);

          canvas.addEventListener("mouseover", function () {
            $(this).css('cursor', 'pointer');
          });

          canvas.addEventListener("mouseout", function () {
            $(this).css('cursor', 'auto');
          });
          canvasLateral.addEventListener("click", function (evt) {
            var mousePos = getMousePos(canvasLateral, evt);
            showPrompt(evt, mousePos);
          }, false);

          canvasLateral.addEventListener("mouseover", function () {
            $(this).css('cursor', 'pointer');
          });

          canvasLateral.addEventListener("mouseout", function () {
            $(this).css('cursor', 'auto');
          });

          //Get Mouse Position
          function getMousePos(canvas, evt) {
            var rect = canvas.getBoundingClientRect();
            return {
              x: evt.clientX - rect.left,
              y: evt.clientY - rect.top
            };
          }

          function showPrompt(ev, posRaton) {
            // Appending dialog to document.body to cover sidenav in docs app
            var confirm = $mdDialog.prompt()
              .title('Tomar anotación')
              .placeholder('Anotación')
              .ariaLabel('Anotación')
              .targetEvent(ev)
              .multiple(true)
              .ok('Guardar!')
              .cancel('Cancelar');

            pausa = true;

            $mdDialog.show(confirm).then(function (result) {
              if (result !== '' && result !== undefined) {
                let nota = {
                  x: CryptoJS.AES.encrypt(posRaton.x.toString(), getCookie('clave')).toString(),
                  y: CryptoJS.AES.encrypt(posRaton.y.toString(), getCookie('clave')).toString(),
                  segundo: CryptoJS.AES.encrypt(tiempoActual.toString(), getCookie('clave')).toString(),
                  texto: CryptoJS.AES.encrypt(result.toString(), getCookie('clave')).toString()
                };
                firebase.database().ref('grabaciones/' + getCookie('grupo')).child(grabacion.key).child('notasVideo').push(nota);
                nota = {x: posRaton.x, y: posRaton.y, segundo: tiempoActual.toString(), texto: result, fila: j + 100};
                if (grabacion.notasVideo === undefined) {//Si todavia no hay ninguna nota
                  grabacion['notasVideo'] = {result: nota};
                } else {
                  grabacion['notasVideo'][result] = nota;
                }
                notaEnPantalla.push(nota);
              }
              pausa = false;
            }, function () {
              pausa = false;
            });
          }

          pathReference.child($scope.grabacion).getDownloadURL().then(function (url) {
            fetch(url)
              .then(res => res.blob()) // Gets the response and returns it as a blob
              .then(blob => {
                var reader = new FileReader();
                reader.onload = function () {
                  Papa.parse(CryptoJS.AES.decrypt(reader.result, getCookie('clave')).toString(CryptoJS.enc.Utf8), {
                    complete: function (text) {
                      data = text;
                      for (let i = 1; i < data.data.length; i++) {
                        tiemposEsqueleto[i] = horasAMilisegundos(data.data[i][0]);
                      }
                      $scope.duracionEsqueleto = tiemposEsqueleto[tiemposEsqueleto.length - 2] / 1000;
                      $scope.loading = false;
                      $scope.$apply();
                      oeplayPauseBtn.innerHTML = '<i class="material-icons vid-icon">pause</i>';
                      myTimer = setInterval(pintarEsqueleto, 35);
                    }
                  });
                };
                reader.readAsText(blob);
              });
          });

          function pintarEsqueleto() {
            if (!pausa) {
              j++;
              let x,y,z;
              oeseekBar.value = (tiemposEsqueleto[j] / 1000) * (100 / $scope.duracionEsqueleto);

              let curMins = Math.floor((tiemposEsqueleto[j] / 1000) / 60);
              let curSecs = Math.floor((tiemposEsqueleto[j] / 1000) - curMins * 60);
              if (curSecs < 10) {
                curSecs = "0" + curSecs;
              }
              if (curMins < 10) {
                curMins = "0" + curMins;
              }
              let minsTotal = Math.floor($scope.duracionEsqueleto / 60);
              let secsTotal = Math.floor($scope.duracionEsqueleto - curMins * 60);
              if (secsTotal < 10) {
                secsTotal = "0" + secsTotal;
              }
              if (minsTotal < 10) {
                minsTotal = "0" + minsTotal;
              }
              currentTimeView.innerHTML = curMins + ":" + curSecs + "/" + minsTotal + ":" + secsTotal;

              if (j < (data.data.length - 2)) {//Para cada fila con datos
                let linea = data.data[j];
                tiempoActual = linea[0];
                for (let obj in grabacion.notasVideo) {
                  let nota = grabacion.notasVideo[obj];
                  if ((nota.segundo === tiempoActual) && !notaEnPantalla.includes(nota)) {
                    nota['fila'] = j + 100;
                    notaEnPantalla.push(nota);
                    break;
                  }
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.beginPath();
                ctxLateral.clearRect(0, 0, canvasLateral.width, canvasLateral.height);
                ctxLateral.beginPath();

                if (notaEnPantalla.length > 0) {
                  ctx.font = "22px Roboto";
                  ctx.fillStyle = "blue";
                  ctxLateral.font = "22px Roboto";
                  ctxLateral.fillStyle = "blue";
                  for (let n = 0; n < notaEnPantalla.length; n++) {
                    ctx.fillText(notaEnPantalla[n].texto, notaEnPantalla[n].x, notaEnPantalla[n].y);
                    ctxLateral.fillText(notaEnPantalla[n].texto, notaEnPantalla[n].x, notaEnPantalla[n].y);
                    if (notaEnPantalla[n].fila <= j) {
                      notaEnPantalla.shift();
                    }
                  }
                  ctx.closePath();
                  ctxLateral.closePath();
                }

                for (i = 1; i < (linea.length - 8); i = i + 4) {//Para cada uno de los joints
                  if (linea[i + 1] === "-" || linea[i + 1] === "-") {//Si no hay informacion sobre la posición
                    x = 0;
                    y = 0;
                    z = 0;
                  } else {
                    x = parseFloat(linea[i + 1].replace(",", ".")) * 300;
                    y = parseFloat(linea[i + 2].replace(",", ".")) * 300;
                    z = parseFloat(linea[i + 3].replace(",", ".")) * 300;
                    let joint = (i - 1) / 4;
                    for (let k = 0; k < hierarchy[joint].length; k++) {//Para cada una de las articulaciones hija
                      let jointHijo = hierarchy[joint][k];
                      let xHijo = parseFloat(linea[4 * jointHijo + 2].replace(",", ".")) * 300;
                      let yHijo = parseFloat(linea[4 * jointHijo + 3].replace(",", ".")) * 300;
                      let zHijo = parseFloat(linea[4 * jointHijo + 4].replace(",", ".")) * 300;
                      ctx.moveTo((canvas.width / 2) - x, (canvas.height / 2) - y);
                      ctx.lineTo((canvas.width / 2) - xHijo, (canvas.height / 2) - yHijo);//Pintar lineas
                      ctx.stroke();
                      ctxLateral.moveTo((canvasLateral.width / 2) - z, (canvasLateral.height / 2) - y);
                      ctxLateral.lineTo((canvasLateral.width / 2) - zHijo, (canvasLateral.height / 2) - yHijo);//Pintar lineas
                      ctxLateral.stroke();
                    }
                  }

                  if (linea[i] === "0") {//Si no es inferido pintar circulo verde
                    ctx.fillStyle = 'green';
                    ctxLateral.fillStyle = 'green';
                  } else {
                    ctx.fillStyle = 'red';
                    ctxLateral.fillStyle = 'red';
                  }

                  ctx.moveTo((canvas.width / 2) - x, (canvas.height / 2) - y);
                  ctx.arc((canvas.width / 2) - x, (canvas.height / 2) - y, 5, 0, 2 * Math.PI, false);//Pintar circulo
                  ctx.stroke();
                  ctx.fill();
                  ctxLateral.moveTo((canvasLateral.width / 2) - z, (canvasLateral.height / 2) - y);
                  ctxLateral.arc((canvasLateral.width / 2) - z, (canvasLateral.height / 2) - y, 5, 0, 2 * Math.PI, false);//Pintar circulo
                  ctxLateral.stroke();
                  ctxLateral.fill();
                }
              } else {
                j = 0;
                pausa = true;
                oeplayPauseBtn.innerHTML = ' <i class="material-icons vid-icon">play_circle_outline</i>';
                let minsTotal = Math.floor($scope.duracion / 60);
                let secsTotal = Math.floor($scope.duracion - minsTotal * 60);
                if (secsTotal < 10) {
                  secsTotal = "0" + secsTotal;
                }
                if (minsTotal < 10) {
                  minsTotal = "0" + minsTotal;
                }
                currentTimeView.innerHTML = '00' + ":" + '00' + "/" + minsTotal + ":" + secsTotal;
                reinicioReproduccion = true;
                oeseekBar.value = 0;
                clearInterval(myTimer);
              }
            }
          }

          function horasAMilisegundos(hora) {
            let a = hora.split(':'); // split it at the colons
            // minutes are worth 60 seconds. Hours are worth 60 minutes.
            let ms = ((+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2])) * 1000;
            return ms;
          }

          function closest(num, arr) {
            var mid;
            var lo = 0;
            var hi = arr.length - 1;
            while (hi - lo > 1) {
              mid = Math.floor((lo + hi) / 2);
              if (arr[mid] < num) {
                lo = mid;
              } else {
                hi = mid;
              }
            }
            if (num - arr[lo] <= arr[hi] - num) {
              return lo;
            }
            return hi;
          }
        });
      }


      $scope.close = function () {
        if (myTimer !== undefined) {
          clearInterval(myTimer);
        }
        if ($scope.hayVideo) {
          $document[0].getElementById("videoEsqueleto").pause();
        }
        $mdDialog.hide();
      }
    }
  };

  $scope.exportarCSV = function (grabacion) {
    firebase.storage().ref('grabaciones/' + getCookie('grupo')).child(grabacion).getDownloadURL().then(function (url) {
      fetch(url)
        .then(res => res.blob()) // Gets the response and returns it as a blob
        .then(blob => {
          let reader = new FileReader();
          reader.onload = function () {
            let file = CryptoJS.AES.decrypt(reader.result, getCookie('clave')).toString(CryptoJS.enc.Utf8);
            let element = document.createElement('a');
            element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(file));
            element.setAttribute('download', grabacion.split("-")[0] + ".csv");
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          };
          reader.readAsText(blob);
        });
    }).catch(function (error) {
      // Handle any errors
      console.log(error);
    });
  };

  $scope.exportarJSON = function (grabacion) {
    firebase.storage().ref('grabacionesJSON/').child(getCookie('grupo')).child(grabacion.split(".")[0] + ".json").getDownloadURL().then(function (url) {
      fetch(url)
        .then(res => res.blob()) // Gets the response and returns it as a blob
        .then(blob => {
          let reader = new FileReader();
          reader.onload = function () {
            let file = CryptoJS.AES.decrypt(reader.result, getCookie('clave')).toString(CryptoJS.enc.Utf8);
            let json = JSON.parse(file);
            let blob = new Blob([JSON.stringify(json, null, 4)], {type: "application/json"});
            let url = URL.createObjectURL(blob);
            let element = document.createElement('a');
            element.setAttribute('href', url);
            element.setAttribute('download', grabacion.split("-")[0] + ".json");
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          };
          reader.readAsText(blob);
        });


    }).catch(function (error) {
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
      $scope.$apply;
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
    console.log(birthDate, fecha);
    var age = fecha.getFullYear() - birthDate.getFullYear();
    var m = fecha.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && fecha.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  function addSourceToVideo(element, src) {
    var source = document.createElement('source');

    source.src = src;

    element.appendChild(source);
  }
}]).directive('apsEditFile', apsEditFile);

function apsEditFile() {
  var directive = {
    restrict: 'E',
    template: '<div><input id="fileInput" type="file" class="ng-hide" ng-model="files" aria-label="CSV" accept="{{formatos}}"><md-button id="uploadButton" class="md-raised md-primary" aria-label="attach_file"> Elegir fichero </md-button><md-input-container  md-no-float> <input required id="textInput" ng-model="fileName" name="fileName" type="text" placeholder="No file chosen" ng-readonly="true"><div ng-messages="formEditar.fileName.$error"><div ng-message="required">Campo requerido.</div></div></md-input-container></div>'
    // '<div ng-show="editaVideo"><input id="fileInput" type="file" class="ng-hide" ng-model="files" aria-label="CSV" accept=".mp4, .mkv, .webm, .wmv"><md-button id="uploadButton" class="md-raised md-primary" aria-label="attach_file"> Elegir fichero </md-button><md-input-container  md-no-float> <input required id="textInput" ng-model="fileName" name="fileName" type="text" placeholder="No file chosen" ng-readonly="true"><div ng-messages="formEditar.fileName.$error"><div ng-message="required">Campo requerido.</div></div></md-input-container></div>',
    ,link: apsEditFileLink
  };
  return directive;
}

function apsEditFileLink(scope, element, attrs) {
  var input = $(element[0].querySelector('#fileInput'));
  var button = $(element[0].querySelector('#uploadButton'));
  var textInput = $(element[0].querySelector('#textInput'));

  if (input.length && button.length && textInput.length) {
    console.log("dfa");
    button.click(function(e) {
      input.click();
    });
    textInput.click(function(e) {
      input.click();
    });
  }

  input.on('change', function(e) {
    var files = e.target.files;
    scope.files = files;
    if (files[0]) {
      scope.fileName = files[0].name;
    } else {
      scope.fileName = null;
    }
    scope.$apply();
  });
}
