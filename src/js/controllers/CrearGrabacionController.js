app.controller('CrearGrabacionController', function ($scope, $compile, $window, $timeout, $mdDialog, $mdToast) {
  $scope.grabacion = {
    id: '',
    fecha: new Date(),
    lugar: '',
    paciente: '',
    atributosExtraNombre: [],
    atributosExtraValor: []
  };

  $scope.nCampoExtra = 0;
  $scope.files = "";
  $scope.fileName = "";
  $scope.pacientes = cargarPacientes();
  $scope.paciente = null;
  $scope.searchTerm = '';


  $scope.crearGrabacion = function () {
    let rootRef = firebase.database().ref('grabaciones/' + getCookie('grupo'));
    let newStoreRef = rootRef.push();
    let atributosExtraRef = newStoreRef.child("extra");
    let atributosExtra = {};
    let fechaString = Date.parse($scope.grabacion.fecha.toString());
    let fecha = new Date(fechaString);
    let fechaFormateada = moment(fecha).format('DD/MM/YYYY');

    let atributosObligatorios = {
      "id": CryptoJS.AES.encrypt($scope.grabacion.id, getCookie('clave')).toString(),
      "lugar": CryptoJS.AES.encrypt($scope.grabacion.lugar, getCookie('clave')).toString(),
      "fechaGrabacion": CryptoJS.AES.encrypt(fechaFormateada, getCookie('clave')).toString()
    };

    for (let i = 0; i < $scope.nCampoExtra; i++) {
      if ($scope.selectedItem[i] !== null && $scope.atributosExtraValor[i] !== "") {
        atributosExtra[$scope.selectedItem[i].display] = CryptoJS.AES.encrypt($scope.atributosExtraValor[i].toString(), getCookie('clave')).toString();
      }
    }
    atributosExtraRef.push(atributosExtra);

    if ($scope.files[0]) {//Si se ha seleccionado un fichero
      let reader = new FileReader();
      let fileId = $scope.files[0].name.split(".")[0] + "-" + guid() + ".csv";
      // almacenarFicheroGrabacion($scope.files[0], fileId);
      reader.onload = function () {
        let file = reader.result;
        almacenarFicheroGrabacion(file, fileId);
        subirFicheroConvertidoJSON(file, fileId);
      };
      atributosObligatorios['grabacion'] = fileId;
      reader.readAsText($scope.files[0]);
    }

    if ($scope.videoFiles !== undefined && $scope.videoFiles[0]) {//Si se ha seleccionado un fichero de video
      let videoFile = $scope.videoFiles[0];
      let videoFileId = videoFile.name.split(".")[0] + "-" + guid() + "." + videoFile.name.split(".")[1];
      almacenarFicheroGrabacionVideo($scope.videoFiles[0], videoFileId);
      atributosObligatorios['video'] = videoFileId;
    }


    if ($scope.grabacion.paciente) {//Si se ha asignado la grabacion a un paciente
      let fechaNacimientoPartida = $scope.grabacion.paciente.fechaNacimiento.split("/");
      let fechaNacimiento = new Date(fechaNacimientoPartida[2], fechaNacimientoPartida[1] - 1, fechaNacimientoPartida[0]);

      atributosObligatorios['pacienteKey'] = CryptoJS.AES.encrypt($scope.grabacion.paciente.key, getCookie('clave')).toString();
      atributosObligatorios['paciente'] = CryptoJS.AES.encrypt($scope.grabacion.paciente.id, getCookie('clave')).toString();
      atributosObligatorios['edadPaciente'] = CryptoJS.AES.encrypt(calcularEdad(fechaNacimiento).toString(), getCookie('clave')).toString();
      atributosObligatorios['edadGrabacion'] = CryptoJS.AES.encrypt(calcularEdadEnFecha(fechaNacimiento, $scope.grabacion.fecha).toString(), getCookie('clave')).toString();

      firebase.database().ref('pacientes/').child(getCookie('grupo')).child($scope.grabacion.paciente.key).child('grabaciones').child(newStoreRef.key).set(true);
    } else {
      atributosObligatorios['pacienteKey'] = '';
      atributosObligatorios['paciente'] = '';
    }

    atributosObligatorios["extra"] = atributosExtra;
    newStoreRef.set(atributosObligatorios).then(fun => {
      showToast('Grabación creada correctamente');
      $scope.close(true);
    }).catch(er => {
      console.log(er);
      showToast('Error creando la grabación');
    })
  };

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
        console.log("fichero video subido");
      });
    };
    reader.readAsDataURL(file);
  }

  function almacenarFicheroGrabacion(file, id) {
    let storageRef = firebase.storage().ref('grabaciones/' + getCookie('grupo') + "/" + id);
    let metadata = {
      contentType: 'text/csv',
      name: file.name
    };
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
    firebase.storage().ref('grabacionesJSON/' + getCookie('grupo') + "/" +  fileId.split(".")[0] + ".json").putString(CryptoJS.AES.encrypt(file, getCookie('clave')).toString());
  }


  //Limpiar buscador pacientes
  $scope.limpiarBuscador = function () {
    $scope.searchTerm = '';
  };

  //Cargar los pacientes para mostrar en Select
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

//Navegar por los elementos del select con las flechas
  window.mdSelectOnKeyDownOverride = function (event) {
    event.stopPropagation();
  };

  // ----------------Gestión campos extra---------------//
  $scope.simulateQuery = false;
  $scope.isDisabled = false;
  $scope.extraCreado = false;
  $scope.atributosExtraNombre = [];
  $scope.atributosExtraValor = [];
  $scope.selectedItem = [];
  $scope.searchText = [];
  $scope.searchTerm = '';
  $scope.numeroAtributos = [];
  $scope.nombreAtributosExtra = loadAll();
  $scope.querySearch = querySearch;
  $scope.selectedItemChange = selectedItemChange;
  $scope.searchTextChange = searchTextChange;
  $scope.crearCampoExtra = crearCampoExtra;


  //Crear campo extra al final
  $scope.crearCampo = function () {
    $scope.atributosExtraValor[$scope.nCampoExtra]='';
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

  function querySearch(query) {
    return query ? $scope.nombreAtributosExtra.filter(createFilterFor(query)) : $scope.nombreAtributosExtra;
  }

  //Cambio de texto en buscador
  function searchTextChange(text) {
    // formGrabacion.campoExtra.missing = true;
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


}).directive('apsUploadFile', apsUploadFile);

//Etiqueta nueva para subir archivos
function apsUploadFile() {
  return {
    restrict: 'E',
    // language=HTML
    template: '<input id="fileInput" type="file" class="ng-hide" ng-model="files" accept=".csv"> <md-button id="uploadButton" class="md-raised md-primary" aria-label="attach_file"> Elegir fichero </md-button><md-input-container  md-no-float><input required="" name="fileName" id="textInput" ng-model="fileName" type="text" placeholder="CSV no seleccionado" ng-readonly="true"> <div ng-messages="formGrabacion.fileName.$error"><div ng-message="required">Campo requerido.</div></div></md-input-container>' +
    '<input id="videoFileInput" type="file" class="ng-hide" ng-model="videoFiles" accept=".mp4, .mkv, .webm, .wmv"> <md-button id="uploadVideoButton" class="md-raised md-primary" aria-label="attach_file"> Elegir fichero </md-button><md-input-container  md-no-float><input name="videoFileName" id="videoTextInput" ng-model="videoFileName" type="text" placeholder="Video no seleccionado" ng-readonly="true"> <div ng-messages="formGrabacion.videoFileName.$error"><div ng-message="required">Campo requerido.</div></div></md-input-container>',
    link: apsUploadFileLink
  };
}

function apsUploadFileLink(scope, element) {
  let input = $(element[0].querySelector('#fileInput'));
  let videoInput = $(element[0].querySelector('#videoFileInput'));
  let button = $(element[0].querySelector('#uploadButton'));
  let videoButton = $(element[0].querySelector('#uploadVideoButton'));
  let textInput = $(element[0].querySelector('#textInput'));
  let textVideoInput = $(element[0].querySelector('#videoTextInput'));

  if (input.length && button.length && textInput.length) {
    button.click(function () {
      input.click();
    });
    textInput.click(function () {
      input.click();
    });
  }

  if (videoInput.length && videoButton.length && textVideoInput.length) {
    videoButton.click(function () {
      videoInput.click();
    });
    textVideoInput.click(function () {
      videoInput.click();
    });
  }

  //Cuando se selecciona un fichero se guarda en $scope.files y se actualiza el input con su nombre
  input.on('change', function (e) {
      let files = e.target.files;
      scope.files = files;
      if (files[0]) {
        scope.fileName = files[0].name;
        if (files[0].name.split(".")[1].localeCompare("csv") !== 0) {
          console.log("No es CSV")
        }
      }
      scope.$apply();
    }
  );

  videoInput.on('change', function (e) {
      let files = e.target.files;
      scope.videoFiles = files;
      if (files[0]) {
        scope.videoFileName = files[0].name;
        if (files[0].name.split(".")[1].localeCompare("csv") === 0) {
          // almacenarFicheroGrabacionVideo(files[0]);
          console.log("No es video");
        }
      }
      scope.$apply();
    }
  );


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

  function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
}


