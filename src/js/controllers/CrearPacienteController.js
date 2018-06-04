app.controller('CrearPacienteController', function ($scope, $compile, $timeout, $mdDialog, $log, $mdToast) {

  $scope.paciente = {
    nombre: '',
    fecha: new Date(),
    inicioEnfermedad: (new Date()).getFullYear(),
    clasificacion: '',
    altura: '',
    peso: '',
    sexo: '',
    grabacion: '',
    atributosExtraNombre: [],
    atributosExtraValor: []
  };
  $scope.grabaciones = cargarGrabaciones();
  $scope.grabacion = null;
  $scope.searchTerm = '';
  $scope.nCampoExtra = 0;
  $scope.numeroAtributos = [];

  $scope.crearPaciente = function () {
    let rootRef = firebase.database().ref('pacientes/' + getCookie('grupo'));
    let newStoreRef = rootRef.push();
    let fechaString = Date.parse($scope.paciente.fecha.toString());
    let fecha = new Date(fechaString);
    let fechaFormateada = moment(fecha).format('DD/MM/YYYY');
    let atributosExtraRef = newStoreRef.child("extra");
    let grabacionesRef = newStoreRef.child("grabaciones");
    let atributosExtra = {};
    let grabacion = {};
    let atributosObligatorios = {
      "id": CryptoJS.AES.encrypt($scope.paciente.nombre, getCookie('clave')).toString(),
      "fechaNacimiento": CryptoJS.AES.encrypt(fechaFormateada, getCookie('clave')).toString(),
      "sexo": CryptoJS.AES.encrypt($scope.paciente.sexo, getCookie('clave')).toString(),
      "inicioEnfermedad": CryptoJS.AES.encrypt($scope.paciente.inicioEnfermedad.toString(), getCookie('clave')).toString(),
      "clasificacion":  CryptoJS.AES.encrypt($scope.paciente.clasificacion, getCookie('clave')).toString()
    };

    for (let i = 0; i < $scope.nCampoExtra; i++) {//Adjuntamos los campos extra añadidos
      if ($scope.selectedItem[i] !== null && $scope.atributosExtraValor[i] !== "") {
        atributosExtra[$scope.selectedItem[i].display] = CryptoJS.AES.encrypt($scope.atributosExtraValor[i].toString(), getCookie('clave')).toString();
      }
    }
    atributosExtraRef.push(atributosExtra);

    if ($scope.paciente.altura !== '' && $scope.paciente.altura !== null) {
      atributosObligatorios["altura"] = CryptoJS.AES.encrypt($scope.paciente.altura.toString(), getCookie('clave')).toString();
    }

    if ($scope.paciente.peso !== '' && $scope.paciente.peso !== null) {
      console.log($scope.paciente.peso);
      atributosObligatorios["peso"] = CryptoJS.AES.encrypt($scope.paciente.peso.toString(), getCookie('clave')).toString();
    }

    if ($scope.paciente.grabacion !== '') {
      grabacion[$scope.paciente.grabacion.key] = true;
      grabacionesRef.push(grabacion);
      let fecha = $scope.paciente.grabacion.fechaGrabacion.value.split("/");
      let time = new Date(fecha[2] + "-" + fecha[1] + "-" + fecha[0]);
      firebase.database().ref('grabaciones/').child($scope.paciente.grabacion.key).update({
        'paciente': CryptoJS.AES.encrypt($scope.paciente.nombre, getCookie('clave')).toString(),
        'pacienteKey': CryptoJS.AES.encrypt(newStoreRef.key, getCookie('clave')).toString(),
        'edadPaciente': CryptoJS.AES.encrypt(calcularEdad($scope.paciente.fecha).toString(), getCookie('clave')).toString(),
        'edadGrabacion': CryptoJS.AES.encrypt(calcularEdadEnFecha($scope.paciente.fecha, time).toString(), getCookie('clave')).toString()
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
    let grabacionesRef = database.ref('grabaciones/' + getCookie('grupo'));
    $scope.promise = grabacionesRef.once('value', function (grabacion) {
      grabacion.forEach(function (grabacionHija) {
        let childData = grabacionHija.val();
        if ((childData.paciente === undefined || childData.paciente === "")) {
          for (let clave in childData){
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
  $scope.atributosExtraNombre = [];
  $scope.atributosExtraValor = [];
  $scope.selectedItem = [];
  $scope.searchText = [];
  $scope.searchTerm = '';
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

  //Cambio de texto en buscador
  function searchTextChange(text) {
    // formPaciente.campoExtra.missing = true;
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

  function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
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


