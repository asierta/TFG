app.controller('contactController', function($scope) {
  var pacientes;
  $scope.pacientes = "";
  $scope.crearPaciente = function() {
    firebase.database().ref('paciente/' + 6).set({
      apellido: "Perez",
      nombre: "Pedro"
    }).then( function(){
      console.log("OK");
      }, function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode + " " + errorMessage);
      });
  };

  $scope.verPacientes = function(){
    if (pacientes != null){pacientes.off();}
    console.log("verPacientes");
    firebase.database().ref('/paciente/').once('value').then(function(snapshot){
      $scope.$apply(function(){
        $scope.pacientes = snapshot.val();
      });
    })
  };

  $scope.verCambiosPacientes = function(){
  pacientes = firebase.database().ref('/paciente/');
  pacientes.on('value', function(snapshot){
    $scope.$apply(function(){
      $scope.pacientes = snapshot.val();
    });
  });
  };
});
