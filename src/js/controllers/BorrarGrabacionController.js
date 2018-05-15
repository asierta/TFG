app.controller('BorrarGrabacionController', function ($scope, $timeout, $log) {
  let database = firebase.database();
  let storage = firebase.storage();
  let pathReference = storage.ref('grabaciones/');
  let grabacionesRef = database.ref('grabaciones');
  let grabacionesJSONRef = database.ref('grabacionesJSON');
  let self = this;

  // list of `state` value/display objects
  self.grabaciones = cargarGrabaciones();
  self.querySearch = querySearch;
  self.selectedItemChange = selectedItemChange;
  self.searchTextChange = searchTextChange;
  $scope.grabacionSeleccionada = null;
  $scope.algoSeleccionado = false;

  // ******************************
  // Internal methods
  // ******************************

  /**
   * Search for grabaciones... use $timeout to simulate
   * remote dataservice call.
   */
  function querySearch(query) {
    return query ? self.grabaciones.filter(createFilterFor(query)) : self.grabaciones;
  }

  function searchTextChange(text) {
    $log.info('Text changed to ' + text);
  }

  function selectedItemChange(item) {
    $scope.grabacionSeleccionada = item;
    $scope.algoSeleccionado = item !== undefined;
    $log.info('Item changed to ' + JSON.stringify(item));

  }

  /**
   * Create filter function for a query string
   */
  function createFilterFor(query) {
    let lowercaseQuery = angular.lowercase(query);

    return function filterFn(state) {
      return (state.value.indexOf(lowercaseQuery) === 0);
    };

  }

  function cargarGrabaciones() {
    let grabaciones = [];
    grabacionesRef.once('value', function (grabacion) {
      grabacion.forEach(function (grabacionHija) {
        let childData = grabacionHija.val();
        childData['key'] = grabacionHija.key;
        grabaciones.push({
          id: childData.key,
          fecha: childData.fechaGrabacion,
          grabacion: childData.grabacion,
          lugar: childData.lugar,
          paciente: childData.paciente,
          value: childData.id.toLowerCase(),
          display: childData.id
        })
      });
    });
    return grabaciones;
  }


  $scope.borrarGrabacion = function() {
    grabacionesRef.child($scope.grabacionSeleccionada.id).remove().then(snap => {
      grabacionesJSONRef.child($scope.grabacionSeleccionada.grabacion.split('.')[0]).remove().then(snap=>{
        showToast("Grabacion borrada correctamente");
        self.grabaciones = cargarGrabaciones();
        $scope.algoSeleccionado = false;
      });
    }).catch(err =>{
      showToast("Problema borrando usuario");
    });
  };

  $scope.exportarCSV = function () {
    // console.log("adf");
    pathReference.child($scope.grabacionSeleccionada.grabacion).getDownloadURL().then(function(url) {
      // console.log(url);
      // This can be downloaded directly:
      // let xhr = new XMLHttpRequest();
      // xhr.responseType = 'blob';
      // xhr.onload = function(event) {
      //   let blob = xhr.response;
      // };
      // xhr.open('GET', url);
      // xhr.send();
      let a = document.createElement("a");
      // let file = new Blob([content], {type: contentType});
      a.href = url;
      a.download = $scope.grabacionSeleccionada.grabacion;
      a.click();

    }).catch(function(error) {
      // Handle any errors
      console.log(error);
    });
  }

});


