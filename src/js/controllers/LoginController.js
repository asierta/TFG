app.controller('LoginController', function($scope) {
  $scope.username = "";
  $scope.password = "";
  $scope.iniciarSesion = function(){
    var user = firebase.auth().currentUser;
    if (user) {
      // User is signed in.
      document.getElementById("sesion").innerText = "Sesión iniciada";
    } else {
      // No user is signed in.
      document.getElementById("sesion").innerText = "Sesión no iniciada";
    }
    firebase.auth().signInWithEmailAndPassword($scope.username, $scope.password).then(function(){
      console.log("Sesión iniciada correctamente");
    }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorCode +" "+ errorMessage);
    });
  };
});
